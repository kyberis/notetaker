import { Resend } from "resend";

import { log } from "@/lib/log";

const FALLBACK_FROM = "Will <noreply@will.trefolio.com>";

let cachedClient: Resend | null = null;

function getClient(): Resend | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

export type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
};

/**
 * Send an email via Resend. When the API key is missing (dev / self-host
 * without Resend) we log the message instead and return `{ ok: true,
 * delivered: false }` so callers don't block sign-up flows.
 */
export async function sendMail(payload: MailPayload): Promise<{ ok: boolean; delivered: boolean; id?: string }> {
  const client = getClient();
  const from = payload.from ?? process.env.RESEND_FROM_ADDRESS ?? FALLBACK_FROM;

  if (!client) {
    log.warn("mail_no_resend_key_logging_only", {
      to: payload.to,
      subject: payload.subject,
      preview: payload.text.slice(0, 200),
    });
    return { ok: true, delivered: false };
  }

  try {
    const res = await client.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
    });
    if (res.error) {
      log.warn("mail_resend_error", { to: payload.to, error: res.error.message });
      return { ok: false, delivered: false };
    }
    return { ok: true, delivered: true, id: res.data?.id };
  } catch (err) {
    log.warn("mail_resend_threw", {
      to: payload.to,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, delivered: false };
  }
}
