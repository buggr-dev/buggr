import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { forkRepository } from "@/lib/github";

/**
 * POST /api/github/fork
 * 
 * Forks a repository into the authenticated user's account.
 * Requires owner and repo in the request body.
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
    const { owner, repo } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo in request body" },
        { status: 400 }
      );
    }

    const forkedRepo = await forkRepository(session.accessToken, owner, repo);
    
    return NextResponse.json({
      success: true,
      repo: forkedRepo,
    });
  } catch (error) {
    console.error("Error forking repository:", error);
    
    // Check if it's an "already exists" error
    const errorMessage = error instanceof Error ? error.message : "Failed to fork repository";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

