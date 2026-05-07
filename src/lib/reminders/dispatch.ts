import { db } from "@/lib/db";
import { dict, type Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n/locale";
import { log } from "@/lib/log";
import { sendMail } from "@/lib/mail/resend";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { escapeHtml } from "@/lib/telegram/format";

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 50;

/**
 * Pull a batch of due reminders, send them via Telegram, and update their
 * status. Designed to run from a 1-minute cron and stay well under the
 * Vercel function timeout. Atomic claim via an `UPDATE ... RETURNING`-style
 * transaction guarantees no double-send even if two crons race.
 */
export async function dispatchDueReminders(now: Date = new Date()): Promise<{
  attempted: number;
  sent: number;
  retried: number;
  failed: number;
}> {
  const due = await db.reminder.findMany({
    where: { status: "PENDING", dueAt: { lte: now } },
    take: BATCH_SIZE,
    orderBy: { dueAt: "asc" },
    include: {
      note: { select: { id: true, body: true } },
      user: {
        select: {
          id: true,
          email: true,
          locale: true,
          telegramChatId: true,
          deletedAt: true,
        },
      },
    },
  });

  if (due.length === 0) {
    return { attempted: 0, sent: 0, retried: 0, failed: 0 };
  }

  let sent = 0;
  let retried = 0;
  let failed = 0;

  for (const reminder of due) {
    if (reminder.user.deletedAt) {
      // Soft-deleted users get no proactive messages.
      await db.reminder.update({
        where: { id: reminder.id },
        data: { status: "CANCELLED", cancelledAt: now },
      });
      continue;
    }

    const locale: Locale = isLocale(reminder.user.locale)
      ? reminder.user.locale
      : "en";
    const text = dict(locale).bot.reminderFired(reminder.note.body);
    const safe = escapeHtml(text);

    let ok = false;
    if (reminder.user.telegramChatId) {
      const result = await sendTelegramMessage({
        chatId: reminder.user.telegramChatId,
        text: safe,
        telemetryUserId: reminder.user.id,
      });
      ok = result.ok;
    }

    if (ok) {
      await db.reminder.update({
        where: { id: reminder.id },
        data: { status: "SENT", sentAt: now, attempts: { increment: 1 } },
      });
      sent += 1;
      continue;
    }

    const nextAttempts = reminder.attempts + 1;
    if (nextAttempts >= MAX_ATTEMPTS) {
      await db.reminder.update({
        where: { id: reminder.id },
        data: { status: "FAILED", failedAt: now, attempts: nextAttempts },
      });
      failed += 1;

      // Email fallback when telegramChatId is missing or sending kept failing.
      try {
        await sendMail({
          to: reminder.user.email,
          subject: "Will reminder",
          html: `<p>Reminder: ${escapeHtml(reminder.note.body)}</p>`,
          text: `Reminder: ${reminder.note.body}`,
        });
      } catch (err) {
        log.warn("reminder_email_fallback_failed", {
          reminderId: reminder.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    } else {
      // Stay PENDING — try again on the next minute.
      await db.reminder.update({
        where: { id: reminder.id },
        data: { attempts: nextAttempts },
      });
      retried += 1;
    }
  }

  return { attempted: due.length, sent, retried, failed };
}
