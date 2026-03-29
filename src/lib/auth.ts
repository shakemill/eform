import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/email";
import { mailFromAddress, smtpConfigured } from "@/lib/mailer";
import { UserRole, type UserRole as UserRoleType } from "@prisma/client";

function bankerAllowlist(): Set<string> {
  const raw =
    process.env.BANQUIER_EMAILS ??
    process.env.SEED_BANQUIER_EMAIL ??
    "banquier@demo.local";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * NextAuth configuration: Prisma adapter + magic link (SMTP or Resend).
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
  providers: [
    EmailProvider({
      from: smtpConfigured()
        ? mailFromAddress()
        : (process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"),
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        await sendMagicLinkEmail({
          to: identifier,
          url,
          from: provider.from as string,
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      if (bankerAllowlist().has(email)) {
        await prisma.user.updateMany({
          where: { email },
          data: { role: UserRole.BANQUIER },
        });
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        const u = await prisma.user.findUnique({
          where: { id: user.id },
        });
        session.user.id = user.id;
        session.user.role = (u?.role as UserRoleType) ?? "CLIENT";
      }
      return session;
    },
  },
};
