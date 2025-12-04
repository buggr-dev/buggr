import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFileContent, updateFile } from "@/lib/github";
import { introduceAIChaos } from "@/lib/ai-chaos";

/**
 * POST /api/github/chaos
 * 
 * Uses AI to introduce subtle breaking changes to files that were modified in a commit.
 * Requires owner, repo, branch, and files (array of file paths) in the request body.
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
    const { owner, repo, branch, files } = body;

    if (!owner || !repo || !branch || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branch, files" },
        { status: 400 }
      );
    }

    const results: { file: string; success: boolean; changes?: string[]; error?: string }[] = [];

    // Process each file
    for (const filePath of files) {
      try {
        // Skip non-code files
        const ext = filePath.split(".").pop()?.toLowerCase();
        if (!["ts", "tsx", "js", "jsx", "py", "java", "go", "rs", "c", "cpp", "h", "cs"].includes(ext || "")) {
          results.push({ file: filePath, success: false, error: "Skipped non-code file" });
          continue;
        }

        // Fetch the current file content
        const fileContent = await fetchFileContent(
          session.accessToken,
          owner,
          repo,
          filePath,
          branch
        );

        // Decode the content (it's base64 encoded)
        const decodedContent = Buffer.from(fileContent.content, "base64").toString("utf-8");

        // Use AI to introduce subtle chaos
        const { content: modifiedContent, changes } = await introduceAIChaos(decodedContent, filePath);

        // Only update if changes were made
        if (changes.length > 0 && modifiedContent !== decodedContent) {
          await updateFile(
            session.accessToken,
            owner,
            repo,
            filePath,
            modifiedContent,
            `🔥 Chaos introduced in ${filePath}`,
            fileContent.sha,
            branch
          );

          results.push({ file: filePath, success: true, changes });
        } else {
          results.push({ file: filePath, success: false, error: "No changes made" });
        }
      } catch (error) {
        results.push({
          file: filePath,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      message: `Chaos introduced to ${successCount} of ${files.length} files`,
      results,
    });
  } catch (error) {
    console.error("Error introducing chaos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to introduce chaos" },
      { status: 500 }
    );
  }
}
