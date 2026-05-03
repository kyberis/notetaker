"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto max-w-xl py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong.</h1>
      <p className="mt-2 text-muted-foreground">
        {error.digest ? `Reference: ${error.digest}` : null}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}
