import type { Metadata } from "next";

import { IdpUnifiedBridge } from "@/components/auth/idp-unified-bridge";
import { isWillIdpOAuthConfigured } from "@/lib/idp-base";
import { resolveWillUiLocalesForIdpAuthorize } from "@/lib/i18n/idp-ui-locales";

export const metadata: Metadata = { title: "Create account" };

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const uiLocales = await resolveWillUiLocalesForIdpAuthorize();

  if (!isWillIdpOAuthConfigured()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This deployment has no IdP OAuth client configured. Set IDP_BASE_URL, IDP_CLIENT_ID,
          and IDP_CLIENT_SECRET, or use the hosted Will app.
        </p>
      </div>
    );
  }

  return (
    <IdpUnifiedBridge
      mode="signup"
      callbackUrl={params.callbackUrl}
      uiLocales={uiLocales}
      error={params.error}
    />
  );
}
