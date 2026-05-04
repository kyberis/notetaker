# with-api-error-handling

## Problem

Every route handler needs to translate three classes of errors into
HTTP responses with consistent shape:

1. **Validation errors** from Zod (request body / query parsing).
2. **Domain errors** ("user not found", "tag already exists",
   "rate-limited", "this account is disabled").
3. **Unhandled errors** (an SDK call threw, the database is down, a
   bug).

Without a wrapper, every handler ends up writing the same boilerplate
`try / catch / map errors / build a `NextResponse` differently. Worse,
clients (the bot webhook, the web app, future MCP clients) get to play
"guess the error shape" — sometimes a string, sometimes an object,
sometimes a 500 with HTML.

## Decision

Every API route body is wrapped in `withApi()`. Errors are thrown, never
returned. The wrapper maps:

| Thrown | HTTP response |
|--------|---------------|
| `ApiError(status, code, message, details)` | `{ status, body: { error: code, message, details } }` |
| `ZodError` | `400 { error: "validation_error", message: "Invalid input.", details: <flatten> }` |
| Anything else | `500 { error: "internal_error", message: "Something went wrong." }`, full error logged at `error` level |

The implementation is in [`src/lib/http.ts`](../../src/lib/http.ts) —
about 80 lines, no surprises.

## Why this and not X

**Why not just `try / catch` per handler?** Every handler ends up
duplicating the same nine lines. The error shape drifts.
Cross-cutting concerns (logging unhandled errors with structured fields,
giving Telegram-bot retries a stable shape) get reimplemented N times.

**Why not Next.js error boundaries / `error.tsx`?** Those work for UI
trees, not for `route.ts` API handlers. The wrapper is for the
JSON-returning surface, not the React surface.

**Why not a global Express-style middleware?** Next.js App Router
doesn't give us a clean middleware hook for `route.ts` body errors —
proxy.ts runs before the handler resolves. A pure functional wrapper is
the simplest thing that works.

**Why throw factory errors instead of `throw new ApiError(...)` everywhere?**
The `errors.*` factories
([`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `tooMany`, `serviceUnavailable`](../../src/lib/http.ts))
read like English: `throw errors.notFound("Note not found")`. Less ceremony,
more intent.

## How to follow it

Every API handler looks like this:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { errors, withApi } from "@/lib/http";

const Body = z.object({ id: z.string() });

export async function POST(req: Request) {
  return withApi(async () => {
    const { id } = Body.parse(await req.json());
    const note = await db.note.findUnique({ where: { id } });
    if (!note) throw errors.notFound("Note not found");
    return NextResponse.json({ ok: true });
  });
}
```

Things to copy:

- Always wrap the **whole** body in `withApi`. The wrapper returns
  either the handler's return value or a `NextResponse` it builds for
  you.
- Validate at the boundary with Zod. `Schema.parse(...)` throws a
  `ZodError` which the wrapper translates to `400 { error:
  "validation_error", details }`.
- Throw `errors.<kind>(message)` for known business errors. New kinds:
  add a factory in [`src/lib/http.ts`](../../src/lib/http.ts), don't
  inline a custom shape.
- Never wrap in your own `try / catch` and return a `NextResponse.json`
  manually. The wrapper exists exactly so you don't.

## How to enforce it

- Code review: any `try / catch` inside a `route.ts` body that returns a
  `NextResponse` is a smell. Replace with `errors.*` throws.
- Tests for new handlers should exercise at least one error path
  (validation + one domain error) and assert the JSON envelope shape.
- A future `eslint` rule could flag `try { ... } catch { ... return
  NextResponse.json` patterns. Not built today; review catches it.

## Open questions

- We don't have a structured error code registry. Codes today are
  loose strings (`"not_found"`, `"validation_error"`). If clients (bot,
  MCP) start branching on them, formalise into a TypeScript union.
- The 500 envelope today exposes `"Something went wrong."` — generic
  on purpose. If we add a request id / correlation id, surface it here
  so users / support can quote it.
