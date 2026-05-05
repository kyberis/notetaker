import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import IdpSignupRedirect from "@/components/auth/idp-signup-redirect";
import { shouldSendUsersToUnifiedIdp } from "@/lib/idp-base";

export const metadata: Metadata = { title: "Create account" };

type SearchParams = Promise<{ callbackUrl?: string }>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  if (shouldSendUsersToUnifiedIdp()) {
    return <IdpSignupRedirect callbackUrl={params.callbackUrl} />;
  }

  const useGoogle =
    Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);
  return (
    <div>
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Free. Open source. Two minutes.
      </p>
      <div className="mt-6">
        <RegisterForm showGoogle={useGoogle} />
      </div>
    </div>
  );
}
