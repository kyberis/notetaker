// Registers / refreshes the Telegram webhook URL.
//
// Usage:
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_URL=... TELEGRAM_WEBHOOK_SECRET=... \
//     npm run telegram:webhook

import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.TELEGRAM_WEBHOOK_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");
if (!url) throw new Error("Missing TELEGRAM_WEBHOOK_URL");
if (!secret) throw new Error("Missing TELEGRAM_WEBHOOK_SECRET");

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    url,
    secret_token: secret,
    allowed_updates: ["message", "edited_message"],
    drop_pending_updates: true,
  }),
});
const json = await res.json();
console.log(JSON.stringify(json, null, 2));
if (!json.ok) process.exit(1);
