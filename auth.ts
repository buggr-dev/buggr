import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

/**
 * NextAuth.js configuration with GitHub OAuth provider.
 * 
 * Required environment variables:
 * - AUTH_GITHUB_ID: GitHub OAuth App Client ID
 * - AUTH_GITHUB_SECRET: GitHub OAuth App Client Secret
 * - AUTH_SECRET: Random secret for signing tokens (generate with `npx auth secret`)
 * 
 * @see https://authjs.dev/getting-started/installation
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
});

