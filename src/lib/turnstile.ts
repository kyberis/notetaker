import { log } from "@/lib/log";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function isDisabled(): boolean {
  return process.env.TURNSTILE_DISABLED === "1";
}

/**
 * Verify a Turnstile token. Returns true when the captcha is satisfied or
 * when Turnstile is not configured (so dev / staging works without a key).
 * Returns false only on explicit verification failure.
 */
export async function verifyTurnstile(token: string | null | undefined, remoteIp?: string): Promise<boolean> {
  if (isDisabled()) return true;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      log.warn("turnstile_secret_missing_in_production");
    }
    return true;
  }
  if (!token) return false;
  try {
    const body = new URLSearchParams();
    body.append("secret", secret);
    body.append("response", token);
    if (remoteIp) body.append("remoteip", remoteIp);
    const res = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body });
    const json = (await res.json()) as { success?: boolean };
    return Boolean(json.success);
  } catch (err) {
    log.warn("turnstile_verify_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
