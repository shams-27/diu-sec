import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/backend/shared/db";
import { isDiuEmail } from "@/backend/shared/validators";
import type { Role } from "@/backend/shared/rbac";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      // Google reuses an existing session unless the account chooser is forced.
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
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
