import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/lib/db";
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

export const authOptions: NextAuthOptions = {
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
        if (!credentials?.email || !credentials?.password) return null;
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
        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;
        if (user.deletedAt) {
          // Soft-deleted account: signing in should restore it.
          await db.user.update({
            where: { id: user.id },
            data: { deletedAt: null, deletionRemindersSent: 0 },
          });
        }
        const ok = await verifyPassword(credentials.password, user.passwordHash);
        if (!ok) return null;
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
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // Google: only allow if Google says the email is verified.
      if (account?.provider === "google") {
        const verified = (profile as { email_verified?: boolean } | undefined)?.email_verified;
        if (verified !== true) {
          log.warn("google_signin_unverified_email_blocked", { email: user.email });
          return false;
        }
      }
      if (user.email) {
        const existing = await db.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, isActive: true, deletedAt: true, isAdmin: true },
        });
        if (existing && !existing.isActive) return false;
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
      return true;
    },
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.uid = user.id as string;
      }
      if (trigger === "update" || (!token.locale && token.uid)) {
        const fresh = await db.user.findUnique({
          where: { id: String(token.uid) },
          select: { isAdmin: true, locale: true },
        });
        if (fresh) {
          token.isAdmin = fresh.isAdmin;
          token.locale = fresh.locale;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token.uid) {
        (session.user as { id?: string }).id = String(token.uid);
        (session.user as { isAdmin?: boolean }).isAdmin = Boolean(token.isAdmin);
        (session.user as { locale?: string }).locale = String(token.locale ?? "en");
      }
      return session;
    },
  },
};
