# telegram-deep-link-tokens

## Problem

A web user signs up at `will.trefolio.com`, then needs to link their
Telegram account so the bot recognises their messages. The "link" must:

- Survive the Telegram client → bot round-trip (`https://t.me/<bot>?start=<code>`).
- Be unguessable enough that a stranger can't claim someone else's
  account.
- Expire reasonably so an abandoned linking session doesn't leave a
  forever-valid token in the wild.
- Be **64 characters or fewer** — Telegram caps the `start` query
  parameter on `t.me/<bot>?start=<code>` and only allows
  `A-Z a-z 0-9 _ -`. This rules out long signed JWTs.

## Decision

We persist a **16-char URL-safe random code** on the `User` row
(`User.telegramLinkCode`) with an expiry timestamp
(`User.telegramLinkCodeExpires`). The web settings page builds
`https://t.me/<bot>?start=<code>` and shows it as a deep link. When the
bot receives `/start <code>`, it looks up the user by
`telegramLinkCode`, validates the expiry, and stamps
`telegramUserId` + `telegramChatId` + `telegramVerifiedAt` on the row,
then clears the code.

Concrete numbers:

- Code length: 16 chars (`crypto.randomBytes(12).toString("base64url").slice(0, 16)`).
  Entropy ≈ 96 bits, well above the threshold for "unguessable in any
  reasonable timeframe".
- Telegram cap: 64 chars. We're well under.
- TTL: **15 minutes** (`TELEGRAM_LINK_TTL_MINUTES`). Long enough for a
  user to switch from desktop to phone; short enough that an abandoned
  session is harmless.
- Storage: indexed unique column on `User`. No separate table.

Both constants and helpers live in
[`src/lib/telegram/link.ts`](../../src/lib/telegram/link.ts):

- `generateTelegramLinkCode()` — random URL-safe code.
- `buildTelegramDeepLink(code)` — composes the `https://t.me/...?start=<code>`
  URL using `TELEGRAM_BOT_USERNAME` env.

The bot webhook consumes the code in `resolveUser()`
([`src/app/api/webhooks/telegram/route.ts`](../../src/app/api/webhooks/telegram/route.ts)).

## Why this and not X

**Why not signed JWTs?** Telegram's 64-char cap is the wall. A minimal
JWT with `{ sub: <userId>, exp: <unix> }` is already ~120 chars after
HMAC-SHA256 signing. Even compressed JWTs blow past the cap. Stateless
isn't possible here.

**Why not a UUID?** A UUIDv4 is 36 chars; technically fine, but UUIDs
look "addressable" — users may copy them around or paste them into
unsafe places. A short random URL-safe blob is more obviously a token.

**Why a column on `User` instead of a separate `LinkToken` table?**
Will only links one Telegram account per user, ever. The cleanup is
"clear two columns" — no garbage collector, no orphan rows. A separate
table would be over-engineered for the cardinality.

**Why don't we HMAC-sign the code?** The code never leaves our
database. Lookup is by exact match on the column. A signature would
add no security on top of "is this code in the table".

## How to follow it

When **building the link button on the settings page**:

```ts
import { buildTelegramDeepLink, generateTelegramLinkCode, TELEGRAM_LINK_TTL_MINUTES } from "@/lib/telegram/link";

// On user demand (button click), inside an authenticated handler:
const code = generateTelegramLinkCode();
await db.user.update({
  where: { id: userId },
  data: {
    telegramLinkCode: code,
    telegramLinkCodeExpires: new Date(Date.now() + TELEGRAM_LINK_TTL_MINUTES * 60_000),
  },
});
const url = buildTelegramDeepLink(code);
return { url };
```

When **handling `/start <code>`** (already done in the webhook): match
the regex `^\/start(?:@\S+)?\s+([A-Za-z0-9_-]{1,64})/`, look up by
`telegramLinkCode`, check `telegramLinkCodeExpires`, then stamp the
identity columns.

## How to enforce it

- Tests in [`src/lib/telegram/link.test.ts`](../../src/lib/telegram/link.test.ts)
  cover code length, charset, and the deep-link URL shape.
- The `prisma/schema.prisma` constraint
  `telegramLinkCode String? @unique` prevents two users sharing the
  same code (even by collision).
- Code review: any new path that stamps `telegramUserId` must also
  clear `telegramLinkCode` and `telegramLinkCodeExpires` to avoid
  re-use.

## Open questions

- We don't currently rotate `telegramLinkCode` on a TTL — it sits on
  the row until used. The TTL only controls "is it still accepted on
  /start". Consider a daily cron that nulls expired codes if we ever
  want to reduce row noise.
- If we add a "re-link" UX (user wants to swap Telegram accounts),
  we'd need to allow stamping over a non-null `telegramUserId`. Today
  we always require an unlinked user.
