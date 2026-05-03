import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";
import { requireSession } from "@/lib/auth/session";

import { AcceptTermsForm } from "@/components/auth/accept-terms-form";

export default async function AcceptTermsPage() {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { acceptedTermsVersion: true, acceptedTermsAt: true },
  });
  if (user?.acceptedTermsVersion === CURRENT_TERMS_VERSION) redirect("/app");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Accept the terms</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We've updated our terms (v{CURRENT_TERMS_VERSION}). Take a moment to
        review and accept.
      </p>
      <AcceptTermsForm />
    </div>
  );
}
