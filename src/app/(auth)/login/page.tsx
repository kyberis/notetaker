import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import IdpAutoRedirect from "@/components/auth/idp-auto-redirect";
import { shouldSendUsersToUnifiedIdp } from "@/lib/idp-base";

export const metadata: Metadata = { title: "Sign in" };

type SearchParams = Promise<{
  verified?: string;
  callbackUrl?: string;
  error?: string;
}>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  if (shouldSendUsersToUnifiedIdp() && !params.error) {
    return <IdpAutoRedirect callbackUrl={params.callbackUrl} />;
  }
  const useGoogle =
    Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);
  return (
    <div>
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back.</p>
      {params.verified ? (
        <p className="mt-4 rounded-md border p-3 text-sm">
          Email verified. You can sign in now.
        </p>
      ) : null}
      <div className="mt-6">
        <LoginForm
          showGoogle={useGoogle}
          callbackUrl={params.callbackUrl}
          error={params.error}
        />
      </div>
    </div>
  );
}
