import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import IdpSignupRedirect from "@/components/auth/idp-signup-redirect";
import { getIdpBaseUrl } from "@/lib/idp-base";

export const metadata: Metadata = { title: "Create account" };

type SearchParams = Promise<{ callbackUrl?: string }>;

function shouldRedirectRegisterToIdp() {
  const idpEnabled =
    Boolean(getIdpBaseUrl()) &&
    Boolean(process.env.IDP_CLIENT_ID) &&
    Boolean(process.env.IDP_CLIENT_SECRET);
  const legacyOff = process.env.USE_LEGACY_AUTH === "false";
  return idpEnabled && legacyOff;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  if (shouldRedirectRegisterToIdp()) {
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
