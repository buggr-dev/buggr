import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * Request body for creating a Bugger (when code is buggered up).
 */
interface CreateBuggerRequest {
  // Repository info
  owner: string;
  repo: string;
  branchName: string;

  // Challenge configuration
  stressLevel: "low" | "medium" | "high";
  bugCount: number;

  // Commit reference
  originalCommitSha: string;

  // Bug Report - what the user sees as symptoms
  symptoms: string[];

  // Branch Changes - technical descriptions of bugs introduced
  changes: string[];

  // Files that were buggered
  filesBuggered: string[];
}

/**
 * POST /api/buggers
 * 
 * Creates a new Bugger record when code is buggered up.
 * Called from the stress endpoint after bugs are successfully introduced.
 * 
 * @returns The created Bugger record with its ID
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body: CreateBuggerRequest = await request.json();

    // Validate required fields
    const requiredFields = [
      "owner", "repo", "branchName", "stressLevel", 
      "bugCount", "originalCommitSha"
    ];
    
    for (const field of requiredFields) {
      if (body[field as keyof CreateBuggerRequest] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create the Bugger record
    const bugger = await prisma.bugger.create({
      data: {
        userId: user.id,
        owner: body.owner,
        repo: body.repo,
        branchName: body.branchName,
        stressLevel: body.stressLevel,
        bugCount: body.bugCount,
        originalCommitSha: body.originalCommitSha,
        symptoms: body.symptoms || [],
        changes: body.changes || [],
        filesBuggered: body.filesBuggered || [],
      },
    });

    return NextResponse.json({
      success: true,
      buggerId: bugger.id,
      bugger,
    });
  } catch (error) {
    console.error("[Buggers] Error creating bugger:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create bugger" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/buggers
 * 
 * Fetches Bugger records for the current user.
 * Supports pagination via `limit` and `offset` query params.
 * Optionally filter by `completed` (true/false) to get only completed or pending.
 * 
 * @returns Array of Bugger records with their Results (if completed)
 */
export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const completed = searchParams.get("completed"); // "true", "false", or null (all)

    // Build where clause
    const where: { userId: string; result?: { isNot: null } | null } = { 
      userId: user.id 
    };
    
    if (completed === "true") {
      where.result = { isNot: null };
    } else if (completed === "false") {
      where.result = null;
    }

    // Fetch buggers for this user with their results
    const buggers = await prisma.bugger.findMany({
      where,
      include: {
        result: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.bugger.count({ where });

    return NextResponse.json({
      buggers,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[Buggers] Error fetching buggers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch buggers" },
      { status: 500 }
    );
  }
}

