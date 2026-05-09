import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/lib/db";
import { getIdpBaseUrl, shouldSendUsersToUnifiedIdp } from "@/lib/idp-base";
import { syncEntitlementsFromIdpForUser } from "@/lib/idp/sync-entitlements";
import { log } from "@/lib/log";

import { verifyPassword } from "./password";

const useGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/**
 * Comma-separated allow-list of emails that should be promoted to admin on
 * sign-in. Idempotent: if the user is already admin we don't touch the row.
 * Trim + lowercase happens once at module load.
 */
const ADMIN_EMAILS: ReadonlySet<string> = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}

export const authOptions = {
  // Behind Caddy/Vercel, use X-Forwarded-Host so OAuth redirect_uri matches the browser URL.
  trustHost: true,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email + password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          log.info("will.credentials_signin_missing_fields", {
            hasEmail: Boolean(credentials?.email),
            hasPassword: Boolean(credentials?.password),
          });
          return null;
        }
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            isActive: true,
            emailVerified: true,
            deletedAt: true,
          },
        });
        if (!user || !user.passwordHash) {
          log.info("will.credentials_signin_unknown_or_no_password", {
            emailDomainHint: credentials.email.includes("@")
              ? credentials.email.slice(credentials.email.indexOf("@") + 1).toLowerCase()
              : undefined,
          });
          return null;
        }
        if (!user.isActive) {
          log.info("will.credentials_signin_inactive_user", {
            emailDomainHint: credentials.email.includes("@")
              ? credentials.email.slice(credentials.email.indexOf("@") + 1).toLowerCase()
              : undefined,
          });
          return null;
        }
        if (user.deletedAt) {
          // Soft-deleted account: signing in should restore it.
          await db.user.update({
            where: { id: user.id },
            data: { deletedAt: null, deletionRemindersSent: 0 },
          });
        }
        const ok = await verifyPassword(credentials.password, user.passwordHash);
        if (!ok) {
          log.info("will.credentials_signin_bad_password", {
            emailDomainHint: credentials.email.includes("@")
              ? credentials.email.slice(credentials.email.indexOf("@") + 1).toLowerCase()
              : undefined,
          });
          return null;
        }
        log.info("will.credentials_signin_ok", {
          emailDomainHint: user.email.includes("@")
            ? user.email.slice(user.email.indexOf("@") + 1).toLowerCase()
            : undefined,
          userIdTail: user.id.length > 10 ? `…${user.id.slice(-8)}` : "***",
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    ...(useGoogle
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: { params: { prompt: "consent", access_type: "offline" } },
          }),
        ]
      : []),
    ...(getIdpBaseUrl() &&
    process.env.IDP_CLIENT_ID &&
    process.env.IDP_CLIENT_SECRET
        ? [
          {
            id: "trefolio-id",
            name: "Trefolio Account",
            type: "oauth" as const,
            /**
             * Required when the user already has a Will row (e.g. legacy Google
             * or email/password) and signs in through user.trefolio.com for the
             * first time — NextAuth must link `trefolio-id` to that user by
             * email instead of throwing AccountNotLinkedError.
             */
            allowDangerousEmailAccountLinking: true,
            wellKnown: `${getIdpBaseUrl()}/.well-known/openid-configuration`,
            authorization: {
              params: {
                scope: "openid email profile entitlements",
                app_hint: "will",
              },
            },
            clientId: process.env.IDP_CLIENT_ID,
            clientSecret: process.env.IDP_CLIENT_SECRET,
            idToken: true,
            checks: ["pkce", "state"] as Array<"pkce" | "state">,
            profile(profile: Record<string, unknown>) {
              const email =
                typeof profile.email === "string"
                  ? profile.email.toLowerCase()
                  : "";
              return {
                id:
                  typeof profile.sub === "string" ? profile.sub : email,
                name:
                  typeof profile.name === "string" ? profile.name : null,
                email,
                image: null,
              };
            },
          },
        ]
      : []),
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // Google: only allow if Google says the email is verified.
      if (account?.provider === "google") {
        const verified = (profile as { email_verified?: boolean } | undefined)?.email_verified;
        if (verified !== true) {
          log.warn("google_signin_unverified_email_blocked", {
            emailDomain: user.email?.includes("@")
              ? user.email.slice(user.email.indexOf("@") + 1).toLowerCase()
              : undefined,
          });
          return false;
        }
      }
      if (user.email) {
        const existing = await db.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, isActive: true, deletedAt: true, isAdmin: true },
        });
        if (existing && !existing.isActive) {
          log.info("will.signin_blocked_inactive_user_lookup", {
            provider: account?.provider,
            emailDomainHint: user.email.includes("@")
              ? user.email.slice(user.email.indexOf("@") + 1).toLowerCase()
              : undefined,
          });
          return false;
        }
        if (existing?.deletedAt) {
          await db.user.update({
            where: { id: existing.id },
            data: { deletedAt: null, deletionRemindersSent: 0 },
          });
        }
        // Env-driven admin bootstrap. Only flips the flag on, never off, so
        // demoting an admin requires a manual UPDATE — by design.
        if (existing && !existing.isAdmin && isAdminEmail(user.email)) {
          await db.user.update({
            where: { id: existing.id },
            data: { isAdmin: true },
          });
          log.info("admin_promoted_via_env", { userId: existing.id });
        }
      }
      if (account?.provider === "trefolio-id") {
        const p = profile as
          | {
              email?: string;
              name?: string;
              entitlements?: { will_daily_limit?: number };
            }
          | undefined;
        const email = p?.email?.toLowerCase() ?? user.email?.toLowerCase();
        log.info("will.idp_oauth_signin_attempt", {
          emailDomainHint: email?.includes("@") ? email.slice(email.indexOf("@") + 1) : undefined,
        });
        if (!email) {
          log.info("will.idp_oauth_signin_blocked_no_email", {});
          return false;
        }
        const existing = await db.user.findUnique({
          where: { email },
          select: { id: true, isActive: true },
        });
        if (existing && !existing.isActive) {
          log.info("will.idp_oauth_signin_blocked_inactive_user", {
            emailDomainHint: email.includes("@") ? email.slice(email.indexOf("@") + 1) : undefined,
          });
          return false;
        }
        log.info("will.idp_oauth_signin_allowed", {
          emailDomainHint: email.includes("@") ? email.slice(email.indexOf("@") + 1) : undefined,
        });
      }
      return true;
    },
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        let uid = user.id as string | undefined;
        if (!uid && user.email) {
          const row = await db.user.findUnique({
            where: { email: user.email.toLowerCase() },
            select: { id: true },
          });
          uid = row?.id;
        }
        if (uid) {
          token.uid = uid;
          token.sub = uid;
        }
      }
      if (trigger === "update" || (!token.locale && (token.uid ?? token.sub))) {
        const rowId = String(token.uid ?? token.sub ?? "");
        const fresh = await db.user.findUnique({
          where: { id: rowId },
          select: { isAdmin: true, locale: true },
        });
        if (fresh) {
          token.isAdmin = fresh.isAdmin;
          token.locale = fresh.locale;
        }
      }

      const ENT_SYNC_MS = 60_000;
      const syncTok = token as { idpEntitlementSyncAt?: number };
      const now = Date.now();
      const uid = String(token.uid ?? token.sub ?? "");
      if (
        shouldSendUsersToUnifiedIdp() &&
        uid &&
        (!syncTok.idpEntitlementSyncAt ||
          now - syncTok.idpEntitlementSyncAt > ENT_SYNC_MS)
      ) {
        syncTok.idpEntitlementSyncAt = now;
        void syncEntitlementsFromIdpForUser(uid).catch(() => {});
      }
      return token;
    },
    session: async ({ session, token }) => {
      const id = token.uid ?? token.sub;
      if (session.user && id) {
        (session.user as { id?: string }).id = String(id);
        (session.user as { isAdmin?: boolean }).isAdmin = Boolean(token.isAdmin);
        (session.user as { locale?: string }).locale = String(token.locale ?? "en");
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      const { user, account, profile } = message;
      if (account?.provider !== "trefolio-id" || !user?.email) return;
      const p = profile as
        | {
            entitlements?: { will_daily_limit?: number };
            name?: string;
          }
        | undefined;
      const email = user.email.toLowerCase();
      const dailyLimit = Number(p?.entitlements?.will_daily_limit) || 30;
      await db.user.updateMany({
        where: { email },
        data: {
          dailyAgentMessageLimit: dailyLimit,
          ...(p?.name ? { name: p.name } : {}),
        },
      });
    },
  },
} as NextAuthOptions;
