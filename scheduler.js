import Queue from 'bull';
import { placeReminderCall } from './caller.js';
import { sendWhatsApp } from './whatsapp.js';

// In-memory store for demo (replace with DB in production)
export const remindersStore = new Map();

const reminderQueue = new Queue('soulmate-reminders', {
  redis: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

/**
 * Schedule a reminder call at the given ISO time.
 */
export async function scheduleReminder({ phone, task, isoTime, timeLabel, name }) {
  const fireAt = new Date(isoTime).getTime();
  const delay = fireAt - Date.now();

  // Allow small timing differences; fire in 10s minimum
  const actualDelay = Math.max(delay, 10000);
  if (delay < -120000) {
    throw new Error('Reminder time must be in the future. Pick a time at least 2 minutes from now.');
  }

  const job = await reminderQueue.add(
    { phone, task, timeLabel, name },
    { delay: actualDelay }
  );

  // Store for dashboard display
  const record = {
    id: job.id,
    phone,
    task,
    isoTime,
    timeLabel,
    name: name || 'friend',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };
  remindersStore.set(String(job.id), record);

  return job.id;
}

/**
 * Cancel a scheduled reminder.
 */
export async function cancelReminder(jobId) {
  try {
    const job = await reminderQueue.getJob(jobId);
    if (job) await job.remove();
    if (remindersStore.has(String(jobId))) {
      const r = remindersStore.get(String(jobId));
      r.status = 'cancelled';
      remindersStore.set(String(jobId), r);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all reminders (for dashboard).
 */
export function getAllReminders() {
  return Array.from(remindersStore.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

// ── Worker: process jobs when they fire ─────────────────────────────────────
reminderQueue.process(async (job) => {
  const { phone, task, timeLabel, name } = job.data;
  console.log(`[Scheduler] Firing reminder #${job.id} → ${phone}: ${task}`);

  // Update status
  if (remindersStore.has(String(job.id))) {
    remindersStore.get(String(job.id)).status = 'calling';
  }

  await placeReminderCall({ phone, task, name, timeLabel });

  // Update status
  if (remindersStore.has(String(job.id))) {
    remindersStore.get(String(job.id)).status = 'called';
  }
});

reminderQueue.on('completed', (job) => {
  console.log(`[Scheduler] Job #${job.id} completed`);
});

reminderQueue.on('failed', async (job, err) => {
  console.error(`[Scheduler] Job #${job.id} failed:`, err.message);
  if (remindersStore.has(String(job.id))) {
    const r = remindersStore.get(String(job.id));
    r.status = 'failed';

    // Notify user on WhatsApp if call fails
    try {
      await sendWhatsApp(
        job.data.phone,
        `Hi! I tried to call you for "${job.data.task}" but couldn't reach you. Hope you saw this! 💙`
      );
    } catch {}
  }
});

export default reminderQueue;
