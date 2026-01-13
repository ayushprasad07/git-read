import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/model/User";
import type { GitHubProfile } from "@/types/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.Github_Oauth_Client_Id!,
      clientSecret: process.env.Github_Oauth_Client_Secret!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, profile }) {
      if (!profile) return false;

      const githubProfile = profile as GitHubProfile;

      await dbConnect();

      await User.findOneAndUpdate(
        { githubUserId: githubProfile.id.toString() },
        {
          githubUserId: githubProfile.id.toString(),
          githubUserName: githubProfile.login,
          githubUserAvatar: githubProfile.avatar_url,
          email: user.email,
        },
        { upsert: true }
      );

      return true;
    },

    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
