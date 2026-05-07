import crypto from "node:crypto";

import { db } from "@/lib/db";
import { log } from "@/lib/log";
import { chunkForTelegram } from "./format";

const API_BASE = "https://api.telegram.org";

function getToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");
  return token;
}

export type InlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

type SendMessageOptions = {
  chatId: number | bigint;
  text: string;
  parseMode?: "HTML" | "MarkdownV2";
  replyToMessageId?: number;
  inlineKeyboard?: InlineKeyboardButton[][];
  disableWebPagePreview?: boolean;
  /** When set, increment this user's delivery counters (best-effort, fire-and-forget). */
  telemetryUserId?: string;
};

async function recordTelegramDeliveryTelemetry(
  userId: string,
  ok: boolean,
): Promise<void> {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        telegramDeliveryAttempts: { increment: 1 },
        ...(ok ? {} : { telegramDeliveryFailures: { increment: 1 } }),
      },
    });
  } catch {
    // user missing / race — ignore
  }
}

/**
 * Send a Telegram message. Long bodies are split into ≤4000-char chunks so
 * Telegram never rejects with 400 "MESSAGE_TOO_LONG". On failure we log and
 * swallow — callers should not crash a webhook because the user blocked us.
 */
export async function sendTelegramMessage(opts: SendMessageOptions): Promise<{ ok: boolean }> {
  let token: string;
  try {
    token = getToken();
  } catch {
    if (opts.telemetryUserId) {
      void recordTelegramDeliveryTelemetry(opts.telemetryUserId, false);
    }
    return { ok: false };
  }

  const chunks = chunkForTelegram(opts.text);
  const chatId = typeof opts.chatId === "bigint" ? opts.chatId.toString() : opts.chatId;

  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: chunks[i],
      parse_mode: opts.parseMode ?? "HTML",
      disable_web_page_preview: opts.disableWebPagePreview ?? true,
    };
    if (i === 0 && opts.replyToMessageId) body.reply_to_message_id = opts.replyToMessageId;
    if (isLast && opts.inlineKeyboard) {
      body.reply_markup = { inline_keyboard: opts.inlineKeyboard };
    }
    try {
      const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        log.warn("telegram_send_failed", { status: res.status, body: text.slice(0, 200) });
        if (opts.telemetryUserId) {
          void recordTelegramDeliveryTelemetry(opts.telemetryUserId, false);
        }
        return { ok: false };
      }
    } catch (err) {
      log.warn("telegram_send_threw", { error: err instanceof Error ? err.message : String(err) });
      if (opts.telemetryUserId) {
        void recordTelegramDeliveryTelemetry(opts.telemetryUserId, false);
      }
      return { ok: false };
    }
  }
  if (opts.telemetryUserId) {
    void recordTelegramDeliveryTelemetry(opts.telemetryUserId, true);
  }
  return { ok: true };
}

export async function sendChatAction(chatId: number | bigint, action: "typing" | "upload_voice" | "record_voice" | "upload_photo" | "upload_document"): Promise<void> {
  let token: string;
  try {
    token = getToken();
  } catch {
    return;
  }
  try {
    await fetch(`${API_BASE}/bot${token}/sendChatAction`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: typeof chatId === "bigint" ? chatId.toString() : chatId,
        action,
      }),
    });
  } catch {
    // best effort
  }
}

/**
 * Send a single short status message and return the Telegram `message_id` so
 * the caller can edit it as work progresses (e.g. show which tool the agent
 * is running). HTML parse mode by default. Returns `null` on failure so
 * callers can degrade silently to a typing indicator only.
 */
export async function sendTelegramStatusMessage(opts: {
  chatId: number | bigint;
  text: string;
}): Promise<{ messageId: number } | null> {
  let token: string;
  try {
    token = getToken();
  } catch {
    return null;
  }
  const chatId = typeof opts.chatId === "bigint" ? opts.chatId.toString() : opts.chatId;
  try {
    const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: opts.text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; result?: { message_id?: number } };
    if (!data.ok || typeof data.result?.message_id !== "number") return null;
    return { messageId: data.result.message_id };
  } catch (err) {
    log.warn("telegram_status_send_threw", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Edit a previously sent message's text. Best-effort: silently swallows the
 * common "message is not modified" error and any transport failures, since
 * progress messages are a UX nicety, not a correctness requirement.
 */
export async function editTelegramMessage(opts: {
  chatId: number | bigint;
  messageId: number;
  text: string;
}): Promise<{ ok: boolean }> {
  let token: string;
  try {
    token = getToken();
  } catch {
    return { ok: false };
  }
  const chatId = typeof opts.chatId === "bigint" ? opts.chatId.toString() : opts.chatId;
  try {
    const res = await fetch(`${API_BASE}/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: opts.messageId,
        text: opts.text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

/**
 * Delete a Telegram message. Best-effort; failures (already deleted, too old,
 * permissions, network) are swallowed.
 */
export async function deleteTelegramMessage(opts: {
  chatId: number | bigint;
  messageId: number;
}): Promise<void> {
  let token: string;
  try {
    token = getToken();
  } catch {
    return;
  }
  const chatId = typeof opts.chatId === "bigint" ? opts.chatId.toString() : opts.chatId;
  try {
    await fetch(`${API_BASE}/bot${token}/deleteMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: opts.messageId }),
    });
  } catch {
    // best-effort
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  let token: string;
  try {
    token = getToken();
  } catch {
    return;
  }
  try {
    await fetch(`${API_BASE}/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch {
    // best effort
  }
}

export async function sendVoiceFromUrl(opts: { chatId: number | bigint; url: string; caption?: string }): Promise<{ ok: boolean }> {
  let token: string;
  try {
    token = getToken();
  } catch {
    return { ok: false };
  }
  try {
    const res = await fetch(`${API_BASE}/bot${token}/sendVoice`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: typeof opts.chatId === "bigint" ? opts.chatId.toString() : opts.chatId,
        voice: opts.url,
        caption: opts.caption,
      }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

/**
 * Verifies the webhook secret token Telegram includes on every call. Returns
 * `true` when the request is authentic, `false` otherwise. The secret is
 * compared in constant time.
 */
export function verifyTelegramWebhookRequest(headers: Headers): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return false;
  const got = headers.get("x-telegram-bot-api-secret-token");
  if (!got) return false;
  if (got.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(got, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  } catch {
    return false;
  }
}

export async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  let token: string;
  try {
    token = getToken();
  } catch {
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; result?: { file_path?: string } };
    if (!data.ok || !data.result?.file_path) return null;
    return `${API_BASE}/file/bot${token}/${data.result.file_path}`;
  } catch {
    return null;
  }
}

export async function downloadTelegramFile(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf;
  } catch {
    return null;
  }
}
