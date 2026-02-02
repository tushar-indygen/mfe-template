import type { NextAuthConfig, Session } from "next-auth"

export const authOptions: NextAuthConfig = {
  trustHost: true,
  providers: [], // No providers needed, relying solely on host (crm-base) for auth
  callbacks: {
    async jwt({ token, user }) {
      // For microfrontends, we primarily consume the session from the host.
      // However, we still need to match the host's user structure if we decode the token locally.
      if (user) {
        token.user = user
      }
      return token
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as Session["user"]
      }
      session.error = token.error as string | undefined
      session.access_token = token.access_token as string | undefined
      return session
    },
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token", // Shared with host
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
}
