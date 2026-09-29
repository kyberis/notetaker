import { db } from "@/lib/db";
import { isRegistrationApproved } from "@/lib/registration-approval";

/**
 * Map IdP `sub` to Will `User.id` via NextAuth `Account` (trefolio-id) or direct id match.
 */
export async function resolveWillUserIdFromIdpSub(idpSub: string): Promise<string | null> {
  const byId = await db.user.findFirst({
    where: { id: idpSub, isActive: true, deletedAt: null },
    select: { id: true, registrationApprovedAt: true },
  });
  if (byId && isRegistrationApproved(byId)) return byId.id;

  const acc = await db.account.findFirst({
    where: { provider: "trefolio-id", providerAccountId: idpSub },
    select: {
      userId: true,
      user: { select: { isActive: true, deletedAt: true, registrationApprovedAt: true } },
    },
  });
  if (!acc?.user?.isActive || acc.user.deletedAt) return null;
  if (!isRegistrationApproved(acc.user)) return null;
  return acc.userId;
}
