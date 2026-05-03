import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Check your inbox</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a confirmation link. Click it to activate your account, then
        come back and sign in.
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        Didn't get the email? Check spam, or write to us via /contact.
      </p>
    </div>
  );
}
