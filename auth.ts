import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/** GitHub profile shape from OAuth response */
interface GitHubProfile {
  login: string;
  html_url: string;
}

/**
 * NextAuth.js configuration with GitHub OAuth provider and Prisma adapter.
 * 
 * Required environment variables:
 * - AUTH_GITHUB_ID: GitHub OAuth App Client ID
 * - AUTH_GITHUB_SECRET: GitHub OAuth App Client Secret
 * - AUTH_SECRET: Random secret for signing tokens (generate with `npx auth secret`)
 * - DATABASE_URL: Neon PostgreSQL connection string
 * 
 * @see https://authjs.dev/getting-started/installation
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      authorization: {
        params: {
          // Request repo scope to access repository data including branches
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    /**
     * Stores the GitHub access token in the JWT for API calls.
     * Also updates the user's git provider data on first sign-in.
     */
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        
        // Update user with git provider data on sign-in
        const gitProfile = profile as GitHubProfile;
        if (token.sub) {
          await prisma.user.update({
            where: { id: token.sub },
            data: {
              gitProvider: account.provider,
              gitUsername: gitProfile.login,
              gitProfileUrl: gitProfile.html_url,
            },
          });
        }
      }
      return token;
    },
    /**
     * Exposes the access token to the client session.
     */
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  // Use JWT strategy to keep access token available in callbacks
  session: {
    strategy: "jwt",
  },
});
