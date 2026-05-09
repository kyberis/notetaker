---
name: integration-trefolio-accounts
description: >-
  Explains how Will (notetaker) integrates with user.trefolio.com via NextAuth OAuth
  provider trefolio-id, IdP bridge on /login and /register, entitlements sync, and env vars.
  Use when editing src/lib/auth, IDP_* env, /register, or quota claims from the IdP.
---

# Will ↔ trefolio-accounts (IdP)

Will is an **OIDC relying party** implemented as a NextAuth **`trefolio-id`** OAuth provider pointing at `user.trefolio.com` discovery (`/.well-known/openid-configuration`).

## Knowledge base (monorepo checkout)

Specs live in the **parent trefolio monorepo** (`stocktracker/external/notetaker`):

| Path from monorepo root | Purpose |
|-------------------------|---------|
| `knowledge/design-docs/unified-accounts-and-billing.md` | Shared identity + billing model |
| `knowledge/design-docs/will-idp-integration.md` | Will-specific IdP migration checklist |
| `knowledge/design-docs/notetaker-will-integration.md` | How trefolio relates to Will |
| `knowledge/runbooks/unified-accounts-cutover.md` | Operations |

From this skill file directory, approximate path: `../../../../../knowledge/design-docs/...` (ascend to `stocktracker/`).

## Code map (this repo)

| Area | Role |
|------|------|
| [`src/lib/auth/index.ts`](../../../src/lib/auth/index.ts) | NextAuth: `trefolio-id` with `app_hint: will`; `events.signIn` applies `entitlements.will_daily_limit` |
| [`src/lib/idp-base.ts`](../../../src/lib/idp-base.ts) | `isWillIdpOAuthConfigured()` (IdP OAuth client); `getIdpBaseUrl()` |
| [`src/app/(auth)/login/page.tsx`](../../../src/app/(auth)/login/page.tsx) | `IdpUnifiedBridge` when IdP configured; static copy when not |
| [`src/app/(auth)/register/page.tsx`](../../../src/app/(auth)/register/page.tsx) | Same |
| [`src/components/auth/idp-unified-bridge.tsx`](../../../src/components/auth/idp-unified-bridge.tsx) | Countdown + `signIn("trefolio-id", …)` |
| [`src/app/api/auth/idp-signout/route.ts`](../../../src/app/api/auth/idp-signout/route.ts) | Logout coordination |

## Environment

- `IDP_BASE_URL`, `IDP_CLIENT_ID` (typically `will`), `IDP_CLIENT_SECRET`
- **`isWillIdpOAuthConfigured()`** — when `IDP_BASE_URL`, `IDP_CLIENT_ID`, and `IDP_CLIENT_SECRET` are set, `/login` and `/register` use the bridge into the unified IdP; NextAuth exposes the **`trefolio-id`** provider only in that mode.

With Caddy, keep **`NEXTAUTH_URL=https://will.trefolio-dev.com`** and usually **`IDP_BASE_URL=http://localhost:3300`**. Configure **`external/accounts`** with **`IDP_ISSUER`** / **`IDP_SERVER_ORIGIN`** so OIDC discovery does not advertise `localhost` for authorize ([`dev/README.md`](../../../../../dev/README.md)).

## Local dev

Parent monorepo [`dev/README.md`](../../../../../dev/README.md): port **3200** (Will), **3300** (accounts).

## Standalone clone (no monorepo)

Use **`~/.cursor/skills/integration-trefolio-accounts/SKILL.md`** when this repo is opened without stocktracker; pull `knowledge/design-docs/will-idp-integration.md` from a monorepo checkout or your team’s source of truth.

## Related skills

- IdP: `external/accounts/.cursor/skills/integration-trefolio-accounts/SKILL.md`
- Trefolio client: monorepo `.cursor/skills/integration-trefolio-accounts/SKILL.md`
- Clara (parallel integration): `external/etracker/.cursor/skills/integration-trefolio-accounts/SKILL.md`
