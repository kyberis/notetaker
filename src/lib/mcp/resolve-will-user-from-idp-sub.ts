import { db } from "@/lib/db";

/**
 * Map IdP `sub` to Will `User.id` via NextAuth `Account` (trefolio-id) or direct id match.
 */
export async function resolveWillUserIdFromIdpSub(idpSub: string): Promise<string | null> {
  const byId = await db.user.findFirst({
    where: { id: idpSub, isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (byId) return byId.id;

  const acc = await db.account.findFirst({
    where: { provider: "trefolio-id", providerAccountId: idpSub },
    select: {
      userId: true,
      user: { select: { isActive: true, deletedAt: true } },
    },
  });
  if (!acc?.user?.isActive || acc.user.deletedAt) return null;
  return acc.userId;
}
