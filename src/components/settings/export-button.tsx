"use client";

export function ExportAccountButton() {
  return (
    <a
      href="/api/account/export"
      className="inline-block rounded-md border px-3 py-2"
    >
      Download JSON export
    </a>
  );
}
