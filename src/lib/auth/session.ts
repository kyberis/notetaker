import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { errors } from "@/lib/http";
import { db } from "@/lib/db";

import { authOptions } from "./index";

export type AppSession = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    isAdmin?: boolean;
    locale?: string;
  };
};

/**
 * Server-side session getter. Throws a typed 401 if no session — for use
 * inside `withApi()` route handlers.
 */
export async function requireSession(): Promise<AppSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw errors.unauthorized();
  const u = session.user as AppSession["user"];
  if (!u.id) throw errors.unauthorized();
  return { user: u };
}

/** Returns null instead of throwing — for components that allow logged-out. */
export async function getOptionalSession(): Promise<AppSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const u = session.user as AppSession["user"];
  if (!u.id) return null;
  return { user: u };
}

/** Page-level guard: redirect to /login when missing, /accept-terms if pending. */
export async function pageRequireAuth(): Promise<{ user: AppSession["user"]; locale: string; needsTerms: boolean }> {
  const session = await getOptionalSession();
  if (!session) redirect("/login");
  const fresh = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      acceptedTermsAt: true,
      acceptedTermsVersion: true,
      locale: true,
      deletedAt: true,
      isAdmin: true,
    },
  });
  if (!fresh) redirect("/login");
  if (fresh.deletedAt) redirect("/account/restore");
  return {
    user: { ...session.user, isAdmin: fresh.isAdmin },
    locale: fresh.locale,
    needsTerms: !fresh.acceptedTermsAt,
  };
}

/**
 * API-route guard for admin-only endpoints. Throws 401 / 403 the same way as
 * `requireSession`. Reads `isAdmin` from the DB rather than the JWT so a
 * stale token can't keep a demoted admin alive past the next request.
 */
export async function requireAdmin(): Promise<AppSession> {
  const session = await requireSession();
  const fresh = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, deletedAt: true },
  });
  if (!fresh || fresh.deletedAt) throw errors.unauthorized();
  if (!fresh.isAdmin) throw errors.forbidden("Admin only.");
  return { user: { ...session.user, isAdmin: true } };
}

/**
 * Page-level admin guard. Composes `pageRequireAuth` and 404s non-admins
 * (we 404 instead of 403 so the existence of the admin surface isn't even
 * advertised).
 */
export async function pageRequireAdmin(): Promise<{ user: AppSession["user"]; locale: string }> {
  const ctx = await pageRequireAuth();
  if (ctx.needsTerms) redirect("/accept-terms");
  if (!ctx.user.isAdmin) {
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return { user: ctx.user, locale: ctx.locale };
}
