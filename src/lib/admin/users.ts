import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { errors } from "@/lib/http";
import { log } from "@/lib/log";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  isActive: boolean;
  locale: string;
  createdAt: Date;
  lastSeenAt: Date | null;
  deletedAt: Date | null;
  acceptedTermsAt: Date | null;
  /** Numeric Telegram id as a string (BigInt isn't JSON-serialisable). */
  telegramUserId: string | null;
  telegramUsername: string | null;
  telegramChatId: string | null;
  telegramVerifiedAt: Date | null;
  ttsEnabled: boolean;
  notesCount: number;
  remindersPending: number;
};

export type AdminUserListOptions = {
  /** Free-text search on email / name (case-insensitive `contains`). */
  q?: string;
  /** Only users with a verified Telegram link. */
  telegramOnly?: boolean;
  /** Include soft-deleted accounts (off by default). */
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
};

/**
 * List users for the admin console. Returns the row + per-user counters
 * (notes, pending reminders) in a single round-trip via `_count`.
 *
 * BigInt fields (`telegramUserId`, `telegramChatId`) are stringified so the
 * row is safely serialisable to a Server Component / JSON response.
 */
export async function listAdminUsers(
  opts: AdminUserListOptions = {},
): Promise<{ users: AdminUserRow[]; total: number }> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);

  const where: Prisma.UserWhereInput = {
    ...(opts.includeDeleted ? {} : { deletedAt: null }),
    ...(opts.telegramOnly ? { telegramVerifiedAt: { not: null } } : {}),
    ...(opts.q
      ? {
          OR: [
            { email: { contains: opts.q, mode: "insensitive" } },
            { name: { contains: opts.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      skip: offset,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isActive: true,
        locale: true,
        createdAt: true,
        lastSeenAt: true,
        deletedAt: true,
        acceptedTermsAt: true,
        telegramUserId: true,
        telegramUsername: true,
        telegramChatId: true,
        telegramVerifiedAt: true,
        ttsEnabled: true,
        _count: {
          select: {
            notes: true,
            reminders: { where: { status: "PENDING" } },
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  const users: AdminUserRow[] = rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    isAdmin: u.isAdmin,
    isActive: u.isActive,
    locale: u.locale,
    createdAt: u.createdAt,
    lastSeenAt: u.lastSeenAt,
    deletedAt: u.deletedAt,
    acceptedTermsAt: u.acceptedTermsAt,
    telegramUserId: u.telegramUserId?.toString() ?? null,
    telegramUsername: u.telegramUsername,
    telegramChatId: u.telegramChatId?.toString() ?? null,
    telegramVerifiedAt: u.telegramVerifiedAt,
    ttsEnabled: u.ttsEnabled,
    notesCount: u._count.notes,
    remindersPending: u._count.reminders,
  }));

  return { users, total };
}

export type AdminMetrics = {
  totalUsers: number;
  activeUsers: number;
  telegramLinkedUsers: number;
  totalNotes: number;
  remindersPending: number;
};

/**
 * Enable or disable a user account. Disabled users:
 *   - cannot sign in (`authorize` + `signIn` callbacks block them),
 *   - are kicked out of the dashboard on the next request via `pageRequireAuth`,
 *   - have their Telegram webhook payloads silently dropped.
 *
 * Soft-delete (`deletedAt`) is a stronger, GDPR-aware state and is not changed
 * here. An admin cannot disable themselves — that's how admins lose recovery
 * paths to bricked consoles.
 */
export async function setUserActive(opts: {
  actorId: string;
  targetId: string;
  isActive: boolean;
}): Promise<{ id: string; isActive: boolean }> {
  if (opts.actorId === opts.targetId) {
    throw errors.badRequest("Admins cannot disable their own account.");
  }

  const target = await db.user.findUnique({
    where: { id: opts.targetId },
    select: { id: true, isActive: true, deletedAt: true },
  });
  if (!target) throw errors.notFound("User not found.");
  if (target.deletedAt) {
    throw errors.conflict("User is soft-deleted; cannot toggle active state.");
  }

  if (target.isActive === opts.isActive) {
    return { id: target.id, isActive: target.isActive };
  }

  const updated = await db.user.update({
    where: { id: opts.targetId },
    data: { isActive: opts.isActive },
    select: { id: true, isActive: true },
  });

  log.info("admin_user_active_toggled", {
    actorId: opts.actorId,
    targetId: updated.id,
    isActive: updated.isActive,
  });

  return updated;
}

/** Aggregate counters for the admin landing card row. */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [totalUsers, activeUsers, telegramLinked, totalNotes, remindersPending] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { deletedAt: null, isActive: true } }),
      db.user.count({
        where: { telegramVerifiedAt: { not: null }, deletedAt: null },
      }),
      db.note.count(),
      db.reminder.count({ where: { status: "PENDING" } }),
    ]);

  return {
    totalUsers,
    activeUsers,
    telegramLinkedUsers: telegramLinked,
    totalNotes,
    remindersPending,
  };
}
