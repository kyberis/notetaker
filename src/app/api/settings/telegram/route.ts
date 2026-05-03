import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { errors, withApi } from "@/lib/http";
import {
  TELEGRAM_LINK_TTL_MINUTES,
  buildTelegramDeepLink,
  generateTelegramLinkCode,
} from "@/lib/telegram/link";

export async function POST() {
  return withApi(async () => {
    const session = await requireSession();
    if (!process.env.TELEGRAM_BOT_USERNAME) {
      throw errors.serviceUnavailable("Telegram is not configured on this deployment.");
    }
    const code = generateTelegramLinkCode();
    const expires = new Date(Date.now() + TELEGRAM_LINK_TTL_MINUTES * 60 * 1000);
    await db.user.update({
      where: { id: session.user.id },
      data: {
        telegramLinkCode: code,
        telegramLinkCodeExpires: expires,
      },
    });
    const url = buildTelegramDeepLink(code);
    return NextResponse.json({ url, expiresAt: expires.toISOString(), ttlMinutes: TELEGRAM_LINK_TTL_MINUTES });
  });
}

export async function DELETE() {
  return withApi(async () => {
    const session = await requireSession();
    await db.user.update({
      where: { id: session.user.id },
      data: {
        telegramUserId: null,
        telegramChatId: null,
        telegramUsername: null,
        telegramVerifiedAt: null,
        telegramLinkCode: null,
        telegramLinkCodeExpires: null,
      },
    });
    return NextResponse.json({ ok: true });
  });
}
