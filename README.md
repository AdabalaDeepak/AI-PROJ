# 🤗 Soulmate — AI Reminder Friend

> Not another reminder app. A caring AI friend that lives in WhatsApp and calls you right on time.

## How it works

1. User texts your WhatsApp number: *"Remind me to take meds at 9pm"*
2. Soulmate (Claude AI) parses the intent → extracts task + time
3. Bull + Redis schedules a job at the exact time
4. Twilio places a real voice call to the user
5. User gets a personal, warm reminder call

\---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Make sure Redis is running
redis-server   # or use Docker: docker run -p 6379:6379 redis

# 4. Start the server
npm start

# 5. Open dashboard
open http://localhost:3000
```

\---

## Environment variables

|Variable|Where to get it|
|-|-|
|`WA\\\_VERIFY\\\_TOKEN`|Any secret string you choose|
|`WA\\\_TOKEN`|Meta Developer Console → WhatsApp → API Setup|
|`WA\\\_PHONE\\\_ID`|Meta Developer Console → WhatsApp → Phone Numbers|
|`TWILIO\\\_SID`|console.twilio.com → Account Info|
|`TWILIO\\\_TOKEN`|console.twilio.com → Account Info|
|`TWILIO\\\_NUMBER`|Buy a number at console.twilio.com|
|`ANTHROPIC\\\_API\\\_KEY`|console.anthropic.com|
|`BASE\\\_URL`|Your public HTTPS URL (use ngrok for local dev)|

\---

## WhatsApp webhook setup

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create App → Business → WhatsApp
3. Under WhatsApp → Configuration, set:

   * **Webhook URL**: `https://yourdomain.com/webhook`
   * **Verify token**: matches your `WA\\\_VERIFY\\\_TOKEN`
4. Subscribe to: `messages`

\---

## Twilio setup

1. Sign up at [twilio.com](https://twilio.com)
2. Buy a phone number with **Voice** capability
3. Copy Account SID + Auth Token to `.env`
4. Trial accounts: verify each recipient number at console.twilio.com/phone-numbers/verified

\---

## Local development with ngrok

```bash
# Terminal 1: start server
npm start

# Terminal 2: expose locally
ngrok http 3000

# Use the ngrok HTTPS URL as BASE\\\_URL and WhatsApp webhook URL
```

\---

## API endpoints

|Method|Path|Description|
|-|-|-|
|GET|`/webhook`|WhatsApp webhook verification|
|POST|`/webhook`|Incoming WhatsApp messages|
|POST|`/twilio/status`|Twilio call status callbacks|
|GET|`/api/reminders`|List all reminders|
|POST|`/api/reminders`|Create a reminder|
|DELETE|`/api/reminders/:id`|Cancel a reminder|
|POST|`/api/test-call`|Place a test Twilio call immediately|
|GET|`/api/health`|Check all API keys|

\---

## Deploying to Railway (recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Add Redis plugin in Railway dashboard
# Set all .env variables in Railway → Variables
```

\---

## Voice customization

Edit `src/caller.js` to change the Twilio voice:

|Voice|Accent|
|-|-|
|`Polly.Kajal`|Indian English (default)|
|`Polly.Aditi`|Hindi|
|`Polly.Joanna`|US English (female)|
|`Polly.Matthew`|US English (male)|
|`Polly.Amy`|British English|
|`Polly.Brian`|British English (male)|

\---

## Tech stack

* **Backend**: Node.js + Express
* **AI**: Claude (Anthropic) for intent parsing
* **Voice calls**: Twilio + Amazon Polly TTS
* **Messaging**: WhatsApp Business API (Meta)
* **Queue**: Bull + Redis
* **Frontend**: Vanilla HTML/CSS/JS dashboard

