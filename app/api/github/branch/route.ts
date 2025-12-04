import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createBranch } from "@/lib/github";

/**
 * POST /api/github/branch
 * 
 * Creates a new branch from a specific commit.
 * Requires owner, repo, branchName, and sha in the request body.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { owner, repo, branchName, sha } = body;

    if (!owner || !repo || !branchName || !sha) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branchName, sha" },
        { status: 400 }
      );
    }

    // Validate branch name (basic validation)
    if (!/^[a-zA-Z0-9._\-/]+$/.test(branchName)) {
      return NextResponse.json(
        { error: "Invalid branch name. Use only letters, numbers, dots, dashes, underscores, and slashes." },
        { status: 400 }
      );
    }

    const result = await createBranch(session.accessToken, owner, repo, branchName, sha);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create branch" },
      { status: 500 }
    );
  }
}

