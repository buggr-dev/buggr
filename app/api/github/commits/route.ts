import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchBranchCommits } from "@/lib/github";

/**
 * GET /api/github/commits
 * 
 * Fetches the 10 most recent commits for a specific branch.
 * Requires owner, repo, and branch query parameters.
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const branch = searchParams.get("branch");

  if (!owner || !repo || !branch) {
    return NextResponse.json(
      { error: "Missing owner, repo, or branch parameter" },
      { status: 400 }
    );
  }

  try {
    const commits = await fetchBranchCommits(session.accessToken, owner, repo, branch, 10);
    return NextResponse.json(commits);
  } catch (error) {
    console.error("Error fetching commits:", error);
    return NextResponse.json(
      { error: "Failed to fetch commits" },
      { status: 500 }
    );
  }
}

