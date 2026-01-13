import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

/** GitHub profile shape from OAuth response */
interface GitHubProfile {
  login: string;
  html_url: string;
}

/** Coins awarded to inviter when an invited user signs up */
const SIGNUP_BONUS_COINS = 30;

/** Default starting coins for new users */
const STARTING_COINS = 10;

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
  events: {
    /**
     * Called when a new user is created.
     * Checks if they were invited and awards bonus coins to ALL inviters.
     */
    async createUser({ user }) {
      if (!user.email || !user.id) return;

      try {
        // Find ALL pending invitations for this email (multiple people may have invited them)
        const invitations = await prisma.invitation.findMany({
          where: {
            email: user.email,
            status: "pending",
          },
        });

        if (invitations.length > 0) {
          // Update all invitations and award coins to each inviter in a transaction
          await prisma.$transaction(async (tx) => {
            for (const invitation of invitations) {
              // Mark invitation as accepted
              await tx.invitation.update({
                where: { id: invitation.id },
                data: {
                  status: "accepted",
                  acceptedAt: new Date(),
                  acceptedByUserId: user.id,
                  signupBonusAwarded: true,
                },
              });

              // Award signup bonus to this inviter
              await tx.user.update({
                where: { id: invitation.inviterId },
                data: {
                  coins: { increment: SIGNUP_BONUS_COINS },
                },
              });
            }

            // Store the first invitation code on the new user for reference
            await tx.user.update({
              where: { id: user.id },
              data: {
                invitedByCode: invitations[0].code,
              },
            });
          });

          console.log(`[Auth] User ${user.email} signed up. ${invitations.length} inviter(s) awarded ${SIGNUP_BONUS_COINS} coins each.`);
        }

        // Send welcome email to the new user
        if (user.email) {
          const userName = user.name || user.email.split("@")[0];
          sendWelcomeEmail({
            to: user.email,
            userName,
            startingCoins: STARTING_COINS,
          }).then((result) => {
            if (result.success) {
              console.log(`[Auth] Welcome email sent to ${user.email}`);
            } else {
              console.warn(`[Auth] Failed to send welcome email: ${result.error}`);
            }
          }).catch((err) => {
            console.error("[Auth] Error sending welcome email:", err);
          });
        }
      } catch (error) {
        // Don't block user creation if invitation processing fails
        console.error("[Auth] Error processing invitation on signup:", error);
      }
    },
  },
});
