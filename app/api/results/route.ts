import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import type { AnalysisFeedback } from "@/app/api/github/analyze/route";

/**
 * Request body for saving a Result (when user completes and analyzes).
 */
interface SaveResultRequest {
  // Link to the Bugger challenge
  buggerId: string;

  // Scoring
  grade: string;
  timeMs: number;

  // Commit references for the fix
  startCommitSha: string;
  completeCommitSha: string;

  // AI Analysis / Recommendations
  analysisSummary?: string;
  analysisIsPerfect?: boolean;
  analysisFeedback?: AnalysisFeedback[];
}

/**
 * POST /api/results
 * 
 * Saves a Result when user completes and analyzes their fix.
 * Links to the Bugger challenge that was created earlier.
 * 
 * @returns The created Result record
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body: SaveResultRequest = await request.json();

    // Validate required fields
    const requiredFields = [
      "buggerId", "grade", "timeMs", "startCommitSha", "completeCommitSha"
    ];
    
    for (const field of requiredFields) {
      if (body[field as keyof SaveResultRequest] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Verify the Bugger exists and belongs to this user
    const bugger = await prisma.bugger.findUnique({
      where: { id: body.buggerId },
      include: { result: true },
    });

    if (!bugger) {
      return NextResponse.json(
        { error: "Bugger not found" },
        { status: 404 }
      );
    }

    if (bugger.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - this bugger belongs to another user" },
        { status: 403 }
      );
    }

    // Check if a result already exists
    if (bugger.result) {
      return NextResponse.json(
        { error: "Result already exists for this bugger" },
        { status: 409 }
      );
    }

    // Create the Result record and update the Bugger's grade in a transaction
    const [result] = await prisma.$transaction([
      prisma.result.create({
        data: {
          buggerId: body.buggerId,
          grade: body.grade,
          timeMs: body.timeMs,
          startCommitSha: body.startCommitSha,
          completeCommitSha: body.completeCommitSha,
          analysisSummary: body.analysisSummary,
          analysisIsPerfect: body.analysisIsPerfect ?? false,
          // Cast to Prisma.InputJsonValue for JSON field compatibility
          ...(body.analysisFeedback && { 
            analysisFeedback: body.analysisFeedback as unknown as Prisma.InputJsonValue 
          }),
        },
      }),
      // Also update the grade on the Bugger for easier access
      prisma.bugger.update({
        where: { id: body.buggerId },
        data: { grade: body.grade },
      }),
    ]);

    return NextResponse.json({
      success: true,
      resultId: result.id,
      result,
    });
  } catch (error) {
    console.error("[Results] Error saving result:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save result" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/results
 * 
 * Fetches Results for the current user (via their Buggers).
 * Supports pagination via `limit` and `offset` query params.
 * 
 * @returns Array of Result records with their associated Bugger data
 */
export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Fetch results for this user's buggers
    const results = await prisma.result.findMany({
      where: {
        bugger: {
          userId: user.id,
        },
      },
      include: {
        bugger: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.result.count({
      where: {
        bugger: {
          userId: user.id,
        },
      },
    });

    return NextResponse.json({
      results,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[Results] Error fetching results:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch results" },
      { status: 500 }
    );
  }
}
