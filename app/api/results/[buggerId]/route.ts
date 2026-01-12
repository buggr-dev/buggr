import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * GET /api/results/[buggerId]
 * 
 * Fetches a Result by its associated Bugger ID.
 * Returns null if no result exists yet (user hasn't completed the challenge).
 * 
 * @param buggerId - The Bugger ID to fetch the result for
 * @returns The Result record with its associated Bugger, or null
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buggerId: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { buggerId } = await params;

    if (!buggerId) {
      return NextResponse.json(
        { error: "Missing buggerId parameter" },
        { status: 400 }
      );
    }

    // Fetch the bugger with its result
    const bugger = await prisma.bugger.findUnique({
      where: { id: buggerId },
      include: { result: true },
    });

    if (!bugger) {
      return NextResponse.json(
        { error: "Bugger not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (bugger.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - this bugger belongs to another user" },
        { status: 403 }
      );
    }

    // Return the result (may be null if not completed yet)
    return NextResponse.json({
      result: bugger.result,
      bugger: {
        id: bugger.id,
        owner: bugger.owner,
        repo: bugger.repo,
        branchName: bugger.branchName,
        stressLevel: bugger.stressLevel,
        bugCount: bugger.bugCount,
        createdAt: bugger.createdAt,
      },
    });
  } catch (error) {
    console.error("[Results] Error fetching result:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch result" },
      { status: 500 }
    );
  }
}

