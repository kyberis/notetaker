import { db } from "@/lib/db";
import { resolveWillUserIdFromIdpSub } from "@/lib/mcp/resolve-will-user-from-idp-sub";

import type { OfficeUserLookup } from "./idp-service-auth";

export type ResolvedOfficeUser = {
  id: string;
  email: string;
};

/**
 * Resolve the Will user Warren is coordinating for. Prefer IdP `sub` via
 * NextAuth Account (`trefolio-id`), fall back to email.
 */
export async function resolveOfficeUser(lookup: OfficeUserLookup): Promise<ResolvedOfficeUser | null> {
  const sub = lookup.sub?.trim();
  const email = lookup.email?.trim().toLowerCase();

  if (sub) {
    const userId = await resolveWillUserIdFromIdpSub(sub);
    if (userId) {
      const user = await db.user.findFirst({
        where: { id: userId, isActive: true, deletedAt: null },
        select: { id: true, email: true },
      });
      if (user) return user;
    }
  }

  if (email) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, isActive: true, deletedAt: true },
    });
    if (user?.isActive && !user.deletedAt) {
      return { id: user.id, email: user.email };
    }
  }

  return null;
}
