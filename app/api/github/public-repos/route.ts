import { NextRequest, NextResponse } from "next/server";
import { fetchPublicRepos } from "@/lib/github";

// The GitHub username/org to fetch public repos from
const BUGGR_GITHUB_USERNAME = "brenoneill";

/**
 * GET /api/github/public-repos
 * 
 * Fetches public repositories from the Buggr GitHub account.
 * Does not require authentication.
 */
export async function GET(request: NextRequest) {
  // Allow override via query param for flexibility
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username") || BUGGR_GITHUB_USERNAME;

  try {
    const repos = await fetchPublicRepos(username);
    
    // Filter to only include repos that are suitable for demo purposes
    const filteredRepos = repos
      .filter((repo) => !repo.private)
      .slice(0, 5); // Limit to 5 repos

    return NextResponse.json(filteredRepos);
  } catch (error) {
    console.error("Error fetching public repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch public repos" },
      { status: 500 }
    );
  }
}

