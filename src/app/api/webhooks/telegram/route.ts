import { NextResponse } from "next/server";
import { type ModelMessage } from "ai";

import { consumeAgentQuota, recordAgentTokens } from "@/lib/agent-quota";
import { extractFromImage, extractFromPdf } from "@/lib/ai/extract";
import { runNoteAgent } from "@/lib/ai/run-note-agent";
import { textToSpeech } from "@/lib/ai/text-to-speech";
import { transcribeAudio } from "@/lib/ai/transcribe";
import { db } from "@/lib/db";
import { dict, type Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n/locale";
import { log } from "@/lib/log";
import { buildRateLimiter, enforceLimit } from "@/lib/rate-limit";
import {
  deleteTelegramMessage,
  downloadTelegramFile,
  editTelegramMessage,
  getTelegramFileUrl,
  sendChatAction,
  sendTelegramMessage,
  sendTelegramStatusMessage,
  sendVoiceFromUrl,
  verifyTelegramWebhookRequest,
} from "@/lib/telegram/client";
import {
  formatAgentMarkdownForTelegramHtml,
  stripAgentMarkdown,
} from "@/lib/telegram/format";
import {
  initialThinkingLabel,
  toolProgressLabel,
} from "@/lib/ai/tool-progress";

import { uploadTtsToBlob } from "@/lib/blob/tts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TgChat = { id: number; type: "private" | "group" | "supergroup" | "channel"; title?: string };
type TgUser = {
  id: number;
  is_bot: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};
type TgVoice = { file_id: string; file_unique_id: string; duration: number; mime_type?: string };
type TgPhoto = { file_id: string; file_unique_id: string; width: number; height: number; file_size?: number };
type TgDocument = { file_id: string; file_unique_id: string; file_name?: string; mime_type?: string; file_size?: number };
type TgMessage = {
  message_id: number;
  date: number;
  chat: TgChat;
  from?: TgUser;
  text?: string;
  caption?: string;
  voice?: TgVoice;
  photo?: TgPhoto[];
  document?: TgDocument;
};
type TgUpdate = { update_id: number; message?: TgMessage; edited_message?: TgMessage };

const HISTORY_WINDOW = 6;
const MAX_VOICE_SECONDS = 600;
const webhookLimiter = buildRateLimiter({ prefix: "tg-webhook", limit: 10, windowSeconds: 60 });

export async function POST(req: Request) {
  // 1) Authenticate the call (constant-time comparison).
  if (!verifyTelegramWebhookRequest(req.headers)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 2) Parse the update.
  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const message = update.message ?? update.edited_message;
  if (!message?.from) return NextResponse.json({ ok: true });
  if (message.from.is_bot) return NextResponse.json({ ok: true });

  // We only handle 1:1 private chats in v1.
  if (message.chat.type !== "private") {
    await sendTelegramMessage({
      chatId: message.chat.id,
      text: "I only work in private 1:1 chats for now. DM me directly.",
    });
    return NextResponse.json({ ok: true });
  }

  // 3) Per-Telegram-user rate limit (independent from per-account quota).
  const limit = await enforceLimit({
    limiter: webhookLimiter,
    identifier: `tg:${message.from.id}`,
    context: "telegram_webhook",
  });
  if (!limit.ok) {
    return NextResponse.json({ ok: true });
  }

  // 4) Resolve user — either by previously-linked telegramUserId or by
  //    /start <code> on first contact. Anything else gets a "not linked" reply.
  const user = await resolveUser(message);
  if (!user) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      text: dict("en").bot.notLinked,
    });
    return NextResponse.json({ ok: true });
  }
  if (user.deletedAt) {
    return NextResponse.json({ ok: true });
  }
  // Account disabled by an admin: silently acknowledge so Telegram stops
  // retrying, but neither save the message nor invoke the agent.
  if (!user.isActive) {
    log.info("telegram_message_dropped_disabled_user", { userId: user.id });
    return NextResponse.json({ ok: true });
  }

  const locale: Locale = isLocale(user.locale) ? user.locale : "en";
  const D = dict(locale);

  // 5) Quota check.
  const quota = await consumeAgentQuota(user.id);
  if (!quota.ok) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      text: D.bot.quotaExceeded(quota.limit),
    });
    return NextResponse.json({ ok: true });
  }

  // 6) Materialise the user's content into plain text + the right source.
  await sendChatAction(message.chat.id, "typing");
  const materialised = await materialise(message, locale);
  if (!materialised) {
    await sendTelegramMessage({ chatId: message.chat.id, text: D.bot.error });
    return NextResponse.json({ ok: true });
  }

  // /start <code> is consumed by resolveUser above, so by this point
  // the user is linked. Echo welcome on the very first message.
  if (materialised.text.startsWith("/start")) {
    await sendTelegramMessage({ chatId: message.chat.id, text: D.bot.linked });
    return NextResponse.json({ ok: true });
  }

  // 7) Build short conversation history from previous turns.
  const messages = await loadHistory(user.id, materialised.text);

  // 7b) Send a single "status" message we can edit in place as the agent
  // runs. Gives the user a sense of progress instead of a silent typing dot.
  // If sending fails (transient network), we fall back to the typing
  // indicator only — the agent still runs to completion.
  const status = await sendTelegramStatusMessage({
    chatId: message.chat.id,
    text: initialThinkingLabel(locale),
  });
  let lastStatusText = initialThinkingLabel(locale);

  // 8) Run the agent.
  let reply: { text: string; inputTokens?: number; outputTokens?: number };
  try {
    reply = await runNoteAgent({
      userId: user.id,
      locale,
      source: materialised.source,
      messages,
      onStep: status
        ? async ({ toolNames }) => {
            if (toolNames.length === 0) return;
            // Show the most recent tool's friendly label. If the same tool
            // ran twice in a row Telegram returns "message is not modified",
            // which the helper swallows.
            const next = toolProgressLabel(toolNames[toolNames.length - 1]!, locale);
            if (next === lastStatusText) return;
            lastStatusText = next;
            await editTelegramMessage({
              chatId: message.chat.id,
              messageId: status.messageId,
              text: next,
            });
          }
        : undefined,
    });
  } catch (err) {
    log.error("telegram_agent_failed", {
      userId: user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    if (status) {
      await deleteTelegramMessage({
        chatId: message.chat.id,
        messageId: status.messageId,
      });
    }
    await sendTelegramMessage({ chatId: message.chat.id, text: D.bot.error });
    return NextResponse.json({ ok: true });
  }

  await recordAgentTokens(user.id, { input: reply.inputTokens, output: reply.outputTokens });

  // 9) Replace the status message with the final reply. Delete-then-send
  // (vs editing the status into the reply) keeps inline keyboards / voice
  // uploads working uniformly later if we add them.
  if (status) {
    await deleteTelegramMessage({
      chatId: message.chat.id,
      messageId: status.messageId,
    });
  }
  // (markdown → Telegram HTML so **bold** / _italic_ / `code` render
  // properly instead of leaking asterisks). Optional TTS audio uses the
  // raw text — TTS providers shouldn't read the markup aloud.
  const safeReply = formatAgentMarkdownForTelegramHtml(reply.text);
  await sendTelegramMessage({ chatId: message.chat.id, text: safeReply });

  if (user.ttsEnabled) {
    try {
      // Markdown markers (**, *, `) read terribly when spoken; feed plain
      // prose to the TTS engine instead.
      const audio = await textToSpeech(stripAgentMarkdown(reply.text));
      if (audio) {
        const url = await uploadTtsToBlob(audio, `tts/${user.id}/${Date.now()}.opus`);
        if (url) await sendVoiceFromUrl({ chatId: message.chat.id, url });
      }
    } catch (err) {
      log.warn("tts_pipeline_failed", { error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ ok: true });
}

type ResolvedUser = {
  id: string;
  locale: string;
  ttsEnabled: boolean;
  deletedAt: Date | null;
  isActive: boolean;
};

async function resolveUser(message: TgMessage): Promise<ResolvedUser | null> {
  const tgUserId = BigInt(message.from!.id);

  const existing = await db.user.findUnique({
    where: { telegramUserId: tgUserId },
    select: {
      id: true,
      locale: true,
      ttsEnabled: true,
      deletedAt: true,
      isActive: true,
    },
  });
  if (existing) return existing;

  // First-contact: try to consume a /start <code> deep link.
  const text = message.text ?? "";
  const startMatch = text.match(/^\/start(?:@\S+)?\s+([A-Za-z0-9_-]{1,64})/);
  if (!startMatch) return null;
  const code = startMatch[1];

  const candidate = await db.user.findUnique({
    where: { telegramLinkCode: code },
    select: {
      id: true,
      telegramLinkCodeExpires: true,
      locale: true,
      ttsEnabled: true,
      deletedAt: true,
      isActive: true,
    },
  });
  if (!candidate) {
    await sendTelegramMessage({ chatId: message.chat.id, text: dict("en").bot.notLinked });
    return null;
  }
  if (
    candidate.telegramLinkCodeExpires &&
    candidate.telegramLinkCodeExpires.getTime() < Date.now()
  ) {
    await sendTelegramMessage({ chatId: message.chat.id, text: dict("en").bot.linkExpired });
    return null;
  }

  await db.user.update({
    where: { id: candidate.id },
    data: {
      telegramUserId: tgUserId,
      telegramChatId: BigInt(message.chat.id),
      telegramUsername: message.from?.username ?? null,
      telegramVerifiedAt: new Date(),
      telegramLinkCode: null,
      telegramLinkCodeExpires: null,
    },
  });
  return {
    id: candidate.id,
    locale: candidate.locale,
    ttsEnabled: candidate.ttsEnabled,
    deletedAt: candidate.deletedAt,
    isActive: candidate.isActive,
  };
}

async function materialise(
  message: TgMessage,
  locale: Locale,
): Promise<{ text: string; source: "TELEGRAM_TEXT" | "TELEGRAM_VOICE" | "TELEGRAM_PHOTO" | "TELEGRAM_PDF" } | null> {
  const D = dict(locale);

  if (message.text) {
    return { text: message.text, source: "TELEGRAM_TEXT" };
  }

  if (message.voice) {
    if (message.voice.duration > MAX_VOICE_SECONDS) {
      await sendTelegramMessage({ chatId: message.chat.id, text: D.bot.voiceTooLong });
      return null;
    }
    const url = await getTelegramFileUrl(message.voice.file_id);
    if (!url) return null;
    const buf = await downloadTelegramFile(url);
    if (!buf) return null;
    const text = await transcribeAudio({ buffer: buf, languageHint: locale });
    if (!text) return null;
    return {
      text: message.caption ? `${text}\n\n(${message.caption})` : text,
      source: "TELEGRAM_VOICE",
    };
  }

  if (message.photo && message.photo.length > 0) {
    // Largest photo is last in the array.
    const largest = message.photo[message.photo.length - 1];
    const url = await getTelegramFileUrl(largest.file_id);
    if (!url) return null;
    const buf = await downloadTelegramFile(url);
    if (!buf) return null;
    const text = await extractFromImage({ buffer: buf, mimeType: "image/jpeg" });
    if (!text) {
      await sendTelegramMessage({ chatId: message.chat.id, text: D.bot.photoFailed });
      return null;
    }
    return {
      text: message.caption ? `${text}\n\n(${message.caption})` : text,
      source: "TELEGRAM_PHOTO",
    };
  }

  if (message.document?.mime_type === "application/pdf") {
    const url = await getTelegramFileUrl(message.document.file_id);
    if (!url) return null;
    const buf = await downloadTelegramFile(url);
    if (!buf) return null;
    const text = await extractFromPdf(buf);
    if (!text) {
      await sendTelegramMessage({ chatId: message.chat.id, text: D.bot.pdfFailed });
      return null;
    }
    return {
      text: message.caption ? `${text}\n\n(${message.caption})` : text,
      source: "TELEGRAM_PDF",
    };
  }

  return null;
}

async function loadHistory(userId: string, currentUserText: string): Promise<ModelMessage[]> {
  const recent = await db.note.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_WINDOW,
    select: { body: true, createdAt: true },
  });
  // We don't persist agent replies in v1; we feed the agent the recent
  // notes as compact summary lines so it can answer questions like
  // "what did I say earlier?" without breaking the budget on first DM.
  const turn: ModelMessage = { role: "user", content: currentUserText };
  if (recent.length === 0) return [turn];
  const summary: ModelMessage = {
    role: "system",
    content: `Recent notes (newest first, for context only): ${recent
      .map((n) => `- ${n.body.replace(/\s+/g, " ").slice(0, 200)}`)
      .join("\n")}`,
  };
  return [summary, turn];
}
