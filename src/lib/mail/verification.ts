import crypto from "node:crypto";

import { SignJWT, jwtVerify } from "jose";

import { db } from "@/lib/db";
import { errors } from "@/lib/http";
import { log } from "@/lib/log";

import { sendMail } from "./resend";

const TOKEN_AUDIENCE = "will:verify-email";
const TOKEN_TTL_HOURS = 24;

function getSecret(): Uint8Array {
  const secret = process.env.APP_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("Missing APP_SESSION_SECRET (or NEXTAUTH_SECRET fallback) for email verification");
  }
  return new TextEncoder().encode(secret);
}

function getAppBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

export async function signVerificationToken(userId: string): Promise<string> {
  const jti = crypto.randomUUID();
  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(jti)
    .setAudience(TOKEN_AUDIENCE)
    .setExpirationTime(`${TOKEN_TTL_HOURS}h`)
    .setIssuedAt()
    .sign(getSecret());
}

type VerifyResult =
  | { ok: true; userId: string; jti: string }
  | { ok: false; reason: "format" | "expired" | "consumed" | "signature" };

export async function verifyVerificationToken(token: string): Promise<VerifyResult> {
  let userId: string;
  let jti: string;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { audience: TOKEN_AUDIENCE });
    if (typeof payload.sub !== "string" || typeof payload.jti !== "string") {
      return { ok: false, reason: "format" };
    }
    userId = payload.sub;
    jti = payload.jti;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("exp")) return { ok: false, reason: "expired" };
    return { ok: false, reason: "signature" };
  }
  const used = await db.usedVerificationToken.findUnique({ where: { jti } });
  if (used) return { ok: false, reason: "consumed" };
  return { ok: true, userId, jti };
}

export async function markVerificationTokenConsumed(jti: string, userId: string) {
  try {
    await db.usedVerificationToken.create({ data: { jti, userId } });
  } catch (err) {
    // Race: someone consumed it concurrently. Treat as consumed.
    log.warn("verification_token_double_consume", {
      jti,
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw errors.conflict("Verification token already consumed.");
  }
}

export async function sendVerificationEmail(userId: string, email: string, locale = "en"): Promise<void> {
  const token = await signVerificationToken(userId);
  const base = getAppBaseUrl();
  const url = `${base}/verify-email?token=${encodeURIComponent(token)}`;

  const subject =
    locale === "es"
      ? "Confirmá tu correo en Will"
      : locale === "pt"
      ? "Confirme seu e-mail no Will"
      : locale === "ar"
      ? "تأكيد بريدك الإلكتروني في Will"
      : "Confirm your email at Will";

  const intro =
    locale === "es"
      ? "Tocá el botón para confirmar tu correo."
      : locale === "pt"
      ? "Clique no botão para confirmar seu e-mail."
      : locale === "ar"
      ? "انقر على الزر لتأكيد بريدك الإلكتروني."
      : "Tap the button below to confirm your email.";

  const cta =
    locale === "es"
      ? "Confirmar correo"
      : locale === "pt"
      ? "Confirmar e-mail"
      : locale === "ar"
      ? "تأكيد البريد الإلكتروني"
      : "Confirm email";

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#0f172a">
      <h1 style="font-size:20px;margin:0 0 12px">Will</h1>
      <p style="font-size:15px;line-height:1.5;margin:0 0 16px">${intro}</p>
      <p><a href="${url}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${cta}</a></p>
      <p style="font-size:12px;color:#64748b;margin-top:24px">If you didn't create this account, ignore this email — the link expires in ${TOKEN_TTL_HOURS}h.</p>
    </div>`;

  const text = `${intro}\n\n${url}\n\nThis link expires in ${TOKEN_TTL_HOURS} hours.`;

  await sendMail({ to: email, subject, html, text });
}
