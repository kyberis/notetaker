import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-xl py-24 text-center">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="mt-2 text-muted-foreground">This page doesn't exist.</p>
      <Link href="/" className="mt-6 inline-block underline">
        Go home
      </Link>
    </div>
  );
}
