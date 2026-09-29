import Link from "next/link";

export const metadata = {
  title: "Waiting for approval · Will",
  robots: { index: false, follow: false },
};

export default function PendingApprovalPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-semibold">Your account is waiting</h1>
      <p className="mt-3 text-sm opacity-80">
        We received your signup. An administrator has to enable the account
        before you can use Will. We will email you when it is ready.
      </p>
      <p className="mt-6">
        <Link href="/api/auth/signout">Sign out</Link>
      </p>
    </main>
  );
}
