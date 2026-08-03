import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    authorized({ auth: session, request }) {
      const isAuthenticated = Boolean(session?.user);
      const { pathname } = request.nextUrl;
      const isProtectedRoute =
        pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

      if (isProtectedRoute) {
        return isAuthenticated;
      }

      if (pathname === "/login" && isAuthenticated) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
