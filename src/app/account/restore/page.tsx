import Link from "next/link";

import { ACCOUNT_DELETION_GRACE_DAYS } from "@/lib/legal";

export default function RestorePage() {
  return (
    <div className="container mx-auto max-w-xl py-16 text-center">
      <h1 className="text-2xl font-semibold">Account marked for deletion</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We've stopped sending you reminders and Telegram messages. We will
        permanently delete your data {ACCOUNT_DELETION_GRACE_DAYS} days after
        the deletion request.
      </p>
      <p className="mt-3 text-sm">
        Changed your mind?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>{" "}
        to restore.
      </p>
    </div>
  );
}
