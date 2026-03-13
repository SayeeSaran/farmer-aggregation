import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnPlatform = nextUrl.pathname.startsWith("/(platform)") ||
        ["/dashboard", "/eligibility", "/pools", "/monitoring", "/reports", "/admin", "/farms"].some(
          (p) => nextUrl.pathname.startsWith(p)
        );
      const isOnAuth = ["/login", "/register"].includes(nextUrl.pathname);

      if (isOnAuth && isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
      if (isOnPlatform && !isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Dynamic import to avoid edge runtime issues
        const { prisma } = await import("./prisma");
        const bcrypt = await import("bcryptjs");

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, email: true, name: true, hashedPassword: true, role: true, image: true },
        });

        if (!user?.hashedPassword) return null;

        const passwordMatch = await bcrypt.default.compare(parsed.data.password, user.hashedPassword);
        if (!passwordMatch) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image };
      },
    }),
  ],
};
