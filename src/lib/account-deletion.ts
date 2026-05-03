import { db } from "@/lib/db";
import { ACCOUNT_DELETION_GRACE_DAYS } from "@/lib/legal";
import { log } from "@/lib/log";
import { sendMail } from "@/lib/mail/resend";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Soft-delete a user. Hard delete happens later in the daily purge cron.
 * Cancels all pending reminders so we don't ping a user who's leaving.
 */
export async function softDeleteUser(userId: string, now: Date = new Date()): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { deletedAt: now, deletionRemindersSent: 0 },
    });
    await tx.reminder.updateMany({
      where: { userId, status: "PENDING" },
      data: { status: "CANCELLED", cancelledAt: now },
    });
  });
}

/**
 * Hard-delete users whose grace period has expired. Returns the number of
 * accounts purged. Cascade deletes handle every dependent row.
 */
export async function purgeExpiredAccounts(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ACCOUNT_DELETION_GRACE_DAYS * DAY_MS);
  const candidates = await db.user.findMany({
    where: { deletedAt: { lte: cutoff } },
    select: { id: true, email: true },
  });
  for (const user of candidates) {
    try {
      await db.user.delete({ where: { id: user.id } });
    } catch (err) {
      log.warn("user_purge_failed", {
        userId: user.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return candidates.length;
}

/**
 * Send T-7 / T-1 reminder emails. Idempotent via a bitmask on the user row.
 * Returns counters so the cron can log a one-line summary.
 */
export async function sendDeletionReminders(now: Date = new Date()): Promise<{ t7: number; t1: number }> {
  const targets = await db.user.findMany({
    where: { deletedAt: { not: null } },
    select: {
      id: true,
      email: true,
      deletedAt: true,
      deletionRemindersSent: true,
      locale: true,
    },
  });
  let t7 = 0;
  let t1 = 0;
  for (const u of targets) {
    if (!u.deletedAt) continue;
    const remaining = Math.ceil(
      (u.deletedAt.getTime() + ACCOUNT_DELETION_GRACE_DAYS * DAY_MS - now.getTime()) / DAY_MS,
    );
    if (remaining === 7 && (u.deletionRemindersSent & 1) === 0) {
      await mailDeletionWarning(u.email, 7, u.locale);
      await db.user.update({
        where: { id: u.id },
        data: { deletionRemindersSent: u.deletionRemindersSent | 1 },
      });
      t7 += 1;
    }
    if (remaining === 1 && (u.deletionRemindersSent & 2) === 0) {
      await mailDeletionWarning(u.email, 1, u.locale);
      await db.user.update({
        where: { id: u.id },
        data: { deletionRemindersSent: u.deletionRemindersSent | 2 },
      });
      t1 += 1;
    }
  }
  return { t7, t1 };
}

async function mailDeletionWarning(email: string, daysLeft: number, locale: string): Promise<void> {
  const intro =
    locale === "es"
      ? `Faltan ${daysLeft} día(s) para que tu cuenta de Will se borre definitivamente. Si querés cancelar, simplemente volvé a iniciar sesión.`
      : locale === "pt"
      ? `Faltam ${daysLeft} dia(s) para sua conta no Will ser apagada definitivamente. Se quiser cancelar, basta entrar de novo.`
      : locale === "ar"
      ? `تبقّى ${daysLeft} يوماً قبل حذف حسابك في Will نهائياً. لإلغاء الحذف، سجّل الدخول مجدداً.`
      : `${daysLeft} day(s) until your Will account is deleted permanently. To cancel, just sign in again.`;
  await sendMail({
    to: email,
    subject: `Will: ${daysLeft} day(s) until account deletion`,
    html: `<p>${intro}</p>`,
    text: intro,
  });
}
