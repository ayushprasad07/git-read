import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.Github_Oauth_Client_Id!,
      clientSecret: process.env.Github_Oauth_Client_Secret!,
    }),
  ],

  session: {
    strategy: "jwt", // ✅ VALID in v4
  },

  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
