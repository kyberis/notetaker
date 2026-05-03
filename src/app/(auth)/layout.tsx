import Link from "next/link";

import { APP_NAME } from "@/lib/marketing-content";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            {APP_NAME}
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto max-w-md py-12">{children}</main>
    </div>
  );
}
