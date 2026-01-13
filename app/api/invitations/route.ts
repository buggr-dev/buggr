import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { sendInvitationEmail } from "@/lib/email";
import crypto from "crypto";

/** Coins awarded for sending first invitations (one-time bonus) */
const INVITE_BONUS_COINS = 30;

/** Coins awarded when an invited user signs up */
const SIGNUP_BONUS_COINS = 30;

/**
 * Response type for invitation data.
 */
export interface InvitationResponse {
  id: string;
  email: string;
  code: string;
  status: "pending" | "accepted";
  acceptedAt: string | null;
  createdAt: string;
}

/**
 * GET /api/invitations
 * 
 * Fetches all invitations sent by the current user.
 * 
 * @returns List of invitations with their status
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const invitations = await prisma.invitation.findMany({
      where: { inviterId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const response: InvitationResponse[] = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      code: inv.code,
      status: inv.status as "pending" | "accepted",
      acceptedAt: inv.acceptedAt?.toISOString() || null,
      createdAt: inv.createdAt.toISOString(),
    }));

    // Count successful signups
    const acceptedCount = invitations.filter((inv) => inv.status === "accepted").length;

    return NextResponse.json({
      invitations: response,
      hasUsedInviteBonus: user.hasUsedInviteBonus,
      acceptedCount,
      totalCoinsEarned: (user.hasUsedInviteBonus ? INVITE_BONUS_COINS : 0) + (acceptedCount * SIGNUP_BONUS_COINS),
    });
  } catch (err) {
    console.error("[Invitations] Error fetching invitations:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitations
 * 
 * Creates invitations for up to 5 email addresses.
 * Awards 30 coins to the user (one-time only).
 * 
 * @param request - Request body containing emails array
 * @returns Created invitations and updated coin balance
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { emails } = body;

    // Validate emails array
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one email address" },
        { status: 400 }
      );
    }

    // Validate email format and filter duplicates
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = [...new Set(emails)]
      .filter((email): email is string => typeof email === "string" && emailRegex.test(email));

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: "No valid email addresses provided" },
        { status: 400 }
      );
    }

    // Check if any emails are already invited by this user
    const existingInvitations = await prisma.invitation.findMany({
      where: {
        inviterId: user.id,
        email: { in: validEmails },
      },
    });

    const alreadyInvited = existingInvitations.map((inv) => inv.email);
    const newEmails = validEmails.filter((email) => !alreadyInvited.includes(email));

    if (newEmails.length === 0) {
      return NextResponse.json(
        { error: "All provided emails have already been invited" },
        { status: 400 }
      );
    }

    // Check if invited emails belong to existing users
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: newEmails } },
      select: { email: true },
    });
    const existingUserEmails = existingUsers.map((u) => u.email);
    
    // Filter out emails of existing users
    const emailsToInvite = newEmails.filter((email) => !existingUserEmails.includes(email));

    if (emailsToInvite.length === 0) {
      return NextResponse.json(
        { error: "All provided emails are already registered users" },
        { status: 400 }
      );
    }

    // Check if this is the user's first time inviting (for bonus)
    const isFirstInvite = !user.hasUsedInviteBonus;

    // Create invitations and award coins in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create invitations
      const invitations = await Promise.all(
        emailsToInvite.map((email) =>
          tx.invitation.create({
            data: {
              inviterId: user.id,
              email,
              code: generateInviteCode(),
              status: "pending",
            },
          })
        )
      );

      // Award invite bonus only on first invite batch
      let updatedUser = user;
      if (isFirstInvite) {
        updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            coins: { increment: INVITE_BONUS_COINS },
            hasUsedInviteBonus: true,
          },
        });
      }

      return { invitations, updatedUser, bonusAwarded: isFirstInvite };
    });

    const response: InvitationResponse[] = result.invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      code: inv.code,
      status: inv.status as "pending" | "accepted",
      acceptedAt: null,
      createdAt: inv.createdAt.toISOString(),
    }));

    // Send invitation emails (don't block response on email delivery)
    const inviterName = user.name || user.gitUsername || "Someone";
    const emailResults = await Promise.allSettled(
      result.invitations.map((inv) =>
        sendInvitationEmail(inv.email, inviterName, inv.code)
      )
    );

    // Count successful emails
    const emailsSent = emailResults.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const emailsFailed = emailResults.length - emailsSent;

    if (emailsFailed > 0) {
      console.warn(`[Invitations] ${emailsFailed} of ${emailResults.length} invitation emails failed to send`);
    }

    const message = result.bonusAwarded
      ? `Successfully invited ${emailsToInvite.length} user(s) and earned ${INVITE_BONUS_COINS} coins!`
      : `Successfully invited ${emailsToInvite.length} user(s)!`;

    return NextResponse.json({
      message,
      invitations: response,
      coinsAwarded: result.bonusAwarded ? INVITE_BONUS_COINS : 0,
      newBalance: result.updatedUser.coins,
      bonusAwarded: result.bonusAwarded,
      emailsSent,
      emailsFailed,
      skipped: {
        alreadyInvited,
        existingUsers: existingUserEmails,
      },
    });
  } catch (err) {
    console.error("[Invitations] Error creating invitations:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create invitations" },
      { status: 500 }
    );
  }
}

/**
 * Generates a unique 8-character invitation code.
 * 
 * @returns Uppercase alphanumeric code
 */
function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

// Export constants for use in other parts of the app
export { INVITE_BONUS_COINS, SIGNUP_BONUS_COINS };
