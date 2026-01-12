import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * User data returned from the API.
 */
export interface UserResponse {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  gitProvider: string | null;
  gitUsername: string | null;
  gitProfileUrl: string | null;
  coins: number;
  hasUsedInviteBonus: boolean;
  createdAt: string;
  // Stats
  stats: {
    totalBuggers: number;
    completedBuggers: number;
  };
}

/**
 * GET /api/user
 * 
 * Fetches the current authenticated user's profile and stats.
 * 
 * @returns The user's profile data with stats
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    // Get stats using efficient count queries
    const [totalBuggers, completedBuggers] = await Promise.all([
      prisma.bugger.count({ where: { userId: user.id } }),
      prisma.bugger.count({ where: { userId: user.id, result: { isNot: null } } }),
    ]);

    const response: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      gitProvider: user.gitProvider,
      gitUsername: user.gitUsername,
      gitProfileUrl: user.gitProfileUrl,
      coins: user.coins,
      hasUsedInviteBonus: user.hasUsedInviteBonus,
      createdAt: user.createdAt.toISOString(),
      stats: {
        totalBuggers,
        completedBuggers,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[User] Error fetching user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch user" },
      { status: 500 }
    );
  }
}

