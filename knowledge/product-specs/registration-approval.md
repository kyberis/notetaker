# registration-approval

> New accounts cannot use Will until an operator approves them.

## What it does

On trefolio.com the unified IdP (`user.trefolio.com`) is the security
boundary: unapproved users do not receive OIDC tokens, so they cannot
open Will, Clara, or the portfolio tracker.

When Will runs without IdP OAuth (self-host / legacy email + Google),
`User.registrationApprovedAt` stays null on signup. `pageRequireAuth`
sends them to `/pending-approval`. Telegram, MCP, reminders, and
authenticated APIs refuse pending rows.

`REGISTRATION_REQUIRES_APPROVAL=false` restores open signup.

## Where the code lives

| Layer | Path |
|-------|------|
| Helpers | `src/lib/registration-approval.ts` |
| DB | `User.registrationApprovedAt` in `prisma/schema.prisma` |
| UI | `src/app/(auth)/pending-approval/page.tsx`, admin users table |
| Auth | `src/lib/auth/index.ts`, `src/lib/auth/session.ts` |
| Telegram / MCP | `src/app/api/webhooks/telegram/route.ts`, `src/lib/mcp/resolve-will-user-from-idp-sub.ts` |

## Data model

- `User.registrationApprovedAt DateTime?` — null = pending.
- Existing rows are backfilled in `20260926010000_registration_approval`.

## Contracts

- `PATCH /api/admin/users/:id` `{ registrationApproved: true }`.

## Invariants

- Pending is not the same as `isActive = false`.
- IdP-on creates stamp `registrationApprovedAt` immediately because the
  IdP already approved the identity.

## Related

- Design doc: `knowledge/design-docs/unified-accounts-and-billing.md` (parent monorepo)
- Clara spec: `external/etracker/knowledge/product-specs/registration-approval.md`
