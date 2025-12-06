import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFileContent, updateFile } from "@/lib/github";
import { introduceAIStress } from "@/lib/ai-stress";

// Maximum file size in lines to process (keeps token usage reasonable)
const MAX_FILE_LINES = 2000;

/**
 * POST /api/github/stress
 * 
 * Uses AI to introduce subtle breaking changes to files that were modified in a commit.
 * Requires owner, repo, branch, and files (array of file paths) in the request body.
 * 
 * Files exceeding MAX_FILE_LINES are skipped to keep token usage reasonable.
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
    const { owner, repo, branch, files, context, difficulty } = body;

    if (!owner || !repo || !branch || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branch, files" },
        { status: 400 }
      );
    }

    // Validate context length if provided
    const stressContext = typeof context === "string" ? context.slice(0, 200) : undefined;
    
    // Validate stress level
    const validLevels = ["low", "medium", "high"] as const;
    const stressLevel: "low" | "medium" | "high" = validLevels.includes(difficulty) ? difficulty : "medium";

    const results: { file: string; success: boolean; changes?: string[]; symptoms?: string[]; error?: string }[] = [];
    const allSymptoms: string[] = [];

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

        // Skip files that are too large (keeps token usage reasonable)
        const lineCount = decodedContent.split("\n").length;
        if (lineCount > MAX_FILE_LINES) {
          results.push({ 
            file: filePath, 
            success: false, 
            error: `Skipped: file too large (${lineCount} lines, max ${MAX_FILE_LINES})` 
          });
          continue;
        }

        // Use AI to introduce subtle stress
        const { content: modifiedContent, changes, symptoms } = await introduceAIStress(decodedContent, filePath, stressContext, stressLevel);

        // Only update if changes were made
        if (changes.length > 0 && modifiedContent !== decodedContent) {
          await updateFile(
            session.accessToken,
            owner,
            repo,
            filePath,
            modifiedContent,
            `🔥 ${filePath} is stressed out`,
            fileContent.sha,
            branch
          );

          results.push({ file: filePath, success: true, changes, symptoms });
          allSymptoms.push(...symptoms);
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

    // Deduplicate symptoms
    const uniqueSymptoms = [...new Set(allSymptoms)];

    return NextResponse.json({
      message: `${successCount} of ${files.length} files have been stressed out`,
      results,
      symptoms: uniqueSymptoms,
    });
  } catch (error) {
    console.error("Error introducing stress:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to introduce stress" },
      { status: 500 }
    );
  }
}

