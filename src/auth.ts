import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { isDiuEmail } from "@/lib/validators";
import type { Role } from "@/lib/rbac";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ profile }) {
      return !!profile && profile.email_verified === true && isDiuEmail(profile.email);
    },
    async jwt({ token, user }) {
      const rawEmail = user?.email ?? token.email;
      const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
      const row = email ? await db.user.findUnique({ where: { email } }) : null;
      token.id = row?.id ?? null;
      token.role = row?.role ?? null;
      token.wingId = row?.wingId ?? null;
      return token;
    },
    session({ session, token }) {
      const extra = token as typeof token & {
        id?: string | null;
        role?: Role | null;
        wingId?: string | null;
      };
      session.user.id = extra.id ?? "";
      session.user.role = extra.role ?? null;
      session.user.wingId = extra.wingId ?? null;
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user?.role;
    },
  },
});
