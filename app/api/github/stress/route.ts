import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFileContent, updateFile, createStressMetadata, StressMetadata } from "@/lib/github";
import { introduceAIStress, AIStressResult } from "@/lib/ai-stress";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logTokenUsage, TokenUsageData } from "@/lib/token-usage";
import { STRESS_LEVEL_COSTS } from "@/lib/stress-costs";
import { sendBugReportEmail, APP_URL } from "@/lib/email";

// Maximum file size in lines to process (keeps token usage reasonable)
const MAX_FILE_LINES_SINGLE = 5000; // If only 1 file, allow up to 5000 lines
const MAX_FILE_LINES_MULTIPLE = 2000; // If multiple files, limit to 2000 lines per file

/**
 * POST /api/github/stress
 * 
 * Uses AI to bugger up files that were modified in a commit with subtle breaking changes.
 * Requires owner, repo, branch, and files (array of file paths) in the request body.
 * 
 * Randomly selects ONE file from the provided files and applies all bugs to that single file.
 * Files exceeding the line limit are skipped to keep token usage reasonable.
 * Selected file can be up to 5000 lines.
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
    const { owner, repo, branch, files, context, difficulty, originalCommitSha, customFilesCount, customBugCount } = body;

    if (!owner || !repo || !branch || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branch, files" },
        { status: 400 }
      );
    }

    // Validate context length if provided
    const stressContext = typeof context === "string" ? context.slice(0, 200) : undefined;

    // Look up user early for token usage tracking and coin validation
    const user = session.user?.email
      ? await prisma.user.findUnique({ where: { email: session.user.email } })
      : null;
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Validate stress level
    const validLevels = ["low", "medium", "high", "custom"] as const;
    const stressLevel: "low" | "medium" | "high" | "custom" = validLevels.includes(difficulty) ? difficulty : "medium";

    // Determine effective stress level for calculations (custom maps to high)
    const effectiveStressLevel: "low" | "medium" | "high" = stressLevel === "custom" ? "high" : stressLevel;

    // Check if user has enough coins
    const coinCost = STRESS_LEVEL_COSTS[effectiveStressLevel];
    console.log(`[Coin Check] stressLevel: ${stressLevel}, effectiveStressLevel: ${effectiveStressLevel}, coinCost: ${coinCost}, STRESS_LEVEL_COSTS:`, STRESS_LEVEL_COSTS);
    
    if (!coinCost || user.coins < coinCost) {
      if (!coinCost) {
        return NextResponse.json(
          { error: `Invalid coin cost calculation for stress level: ${effectiveStressLevel}` },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Not enough coins. Need ${coinCost} coins, have ${user.coins}` },
        { status: 400 }
      );
    }

    // Calculate total bug count based on stress level (TOTAL across all files, not per file)
    let totalBugCount: number;
    if (stressLevel === "custom") {
      // Use custom bug count if provided, otherwise default to 1
      totalBugCount = typeof customBugCount === "number" && customBugCount > 0 ? customBugCount : 1;
    } else {
      // Fixed bug counts: Low: 2, Medium: 4, High: 6
      const STRESS_CONFIGS = {
        low: 2,
        medium: 4,
        high: 6,
      };
      totalBugCount = STRESS_CONFIGS[stressLevel];
    }

    // Determine how many files to process based on stress level
    let filesToProcess: number;
    if (stressLevel === "custom") {
      filesToProcess = typeof customFilesCount === "number" && customFilesCount > 0
        ? Math.min(customFilesCount, files.length)
        : 1;
    } else {
      // Low: 1 file, Medium: 2 files, High: 3 files
      const filesByLevel = {
        low: 1,
        medium: 2,
        high: 3,
      };
      filesToProcess = Math.min(filesByLevel[stressLevel], files.length);
    }

    const results: { file: string; success: boolean; changes?: string[]; symptoms?: string[]; error?: string }[] = [];
    const allSymptoms: string[] = [];
    
    // Collect token usage from all AI calls for logging after Bugger is created
    const allUsageData: { usage: TokenUsageData; provider: string; model: string }[] = [];

    // Supported file extensions for buggering
    const SUPPORTED_EXTENSIONS = [
      // JavaScript/TypeScript
      "ts", "tsx", "js", "jsx", "mjs", "cjs",
      // Web
      "html", "htm", "css", "scss", "sass", "less",
      // Frameworks
      "vue", "svelte", "astro",
      // Backend
      "py", "java", "go", "rs", "c", "cpp", "h", "cs", "rb", "php",
      // Config/Data (can have bugs too)
      "json", "yaml", "yml",
    ];
    
    // Determine line limit based on number of files to process
    const maxFileLines = filesToProcess === 1 ? MAX_FILE_LINES_SINGLE : MAX_FILE_LINES_MULTIPLE;

    // First, collect all valid files that we can process (fetch content and check size)
    interface ProcessableFile {
      filePath: string;
      content: string;
      sha: string;
    }
    const processableFiles: ProcessableFile[] = [];

    for (const filePath of files) {
      try {
        // Skip non-code files
        const ext = filePath.split(".").pop()?.toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext || "")) {
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
        if (lineCount > maxFileLines) {
          results.push({ 
            file: filePath, 
            success: false, 
            error: `Skipped: file too large (${lineCount} lines, max ${maxFileLines})` 
          });
          continue;
        }

        processableFiles.push({
          filePath,
          content: decodedContent,
          sha: fileContent.sha,
        });
      } catch (error) {
        results.push({
          file: filePath,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Select files to stress
    if (processableFiles.length === 0) {
      return NextResponse.json({
        message: "No processable files found",
        results,
        symptoms: [],
      });
    }

    // Select files to process (up to filesToProcess)
    const selectedFiles: ProcessableFile[] = [];
    const shuffledFiles = [...processableFiles].sort(() => Math.random() - 0.5); // Shuffle for randomness
    for (let i = 0; i < Math.min(filesToProcess, shuffledFiles.length); i++) {
      selectedFiles.push(shuffledFiles[i]);
    }

    // Mark unselected files as skipped
    for (const file of processableFiles) {
      if (!selectedFiles.includes(file)) {
        results.push({ 
          file: file.filePath, 
          success: false, 
          error: "Not selected for buggering" 
        });
      }
    }

    // Distribute bugs across selected files
    // For simplicity, distribute bugs evenly (or as evenly as possible)
    const bugsPerFile = Math.floor(totalBugCount / selectedFiles.length);
    const remainingBugs = totalBugCount % selectedFiles.length;
    const bugDistribution: number[] = selectedFiles.map((_, index) => 
      bugsPerFile + (index < remainingBugs ? 1 : 0)
    );

    // Apply stress to each selected file
    for (let i = 0; i < selectedFiles.length; i++) {
      const selectedFile = selectedFiles[i];
      const bugsForThisFile = bugDistribution[i];

      try {
        const { filePath, content: decodedContent, sha } = selectedFile;
        
        // Use AI to introduce subtle stress with bugs for this file
        const stressResult: AIStressResult = await introduceAIStress(
          decodedContent, 
          filePath, 
          stressContext, 
          stressLevel === "custom" ? "high" : stressLevel, // Use high subtlety for custom mode
          bugsForThisFile
        );
        
        const { content: modifiedContent, changes, symptoms, usage, provider, model } = stressResult;
        
        // Collect usage data for later logging (after Bugger is created)
        if (usage) {
          allUsageData.push({ usage, provider, model });
        }

        // Only update if changes were made
        if (changes.length > 0 && modifiedContent !== decodedContent) {
          await updateFile(
            session.accessToken,
            owner,
            repo,
            filePath,
            modifiedContent,
            `🔥 ${filePath} is buggered up`,
            sha,
            branch
          );

          results.push({ file: filePath, success: true, changes, symptoms });
          allSymptoms.push(...symptoms);
        } else {
          // Provide detailed error message for debugging
          const errorDetails: string[] = [];
          if (changes.length === 0) {
            errorDetails.push("AI returned 0 changes");
          }
          if (modifiedContent === decodedContent) {
            errorDetails.push("AI returned unchanged content");
          }
          console.error(`Stress failed for ${filePath}: ${errorDetails.join(", ")}`);
          results.push({ 
            file: filePath, 
            success: false, 
            error: `No changes made (${errorDetails.join(", ")}). This may indicate an AI configuration issue.` 
          });
        }
      } catch (error) {
        results.push({
          file: selectedFile.filePath,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedResults = results.filter((r) => !r.success && r.error);
    const attemptedFilesCount = selectedFiles.length;

    // Log failures for debugging
    if (failedResults.length > 0) {
      console.error("Failed stress results:", failedResults.map(r => ({ file: r.file, error: r.error })));
    }

    // Deduplicate symptoms
    const uniqueSymptoms = [...new Set(allSymptoms)];

    // Require at least one successful file to proceed
    // If all attempted files fail, don't create bugger or deduct coins
    let buggerId: string | null = null;
    
    if (successCount === 0 && attemptedFilesCount > 0) {
      // All files failed - return error without deducting coins
      return NextResponse.json({
        error: "Failed to bugger any files. AI returned unchanged content for all attempted files. This may indicate an issue with the file types or AI configuration.",
        message: "No files were successfully buggered",
        results,
        symptoms: [],
      }, { status: 500 });
    }
    
    if (successCount > 0) {
      const successfulResults = results.filter((r) => r.success);
      const allChanges = successfulResults.flatMap((r) => r.changes || []);
      const filesBuggered = successfulResults.map((r) => r.file);

      // Save Bugger to database first (so we have the ID for metadata)
      try {
        // Format file changes for the UI (includes per-file change details)
        const fileChanges = successfulResults.map((r) => ({
          file: r.file,
          success: true,
          changes: r.changes || [],
        }));

        // Use a transaction to ensure both bugger creation and coin deduction happen atomically
        const bugger = await prisma.$transaction(async (tx) => {
          // Create the bugger
          const newBugger = await tx.bugger.create({
            data: {
              userId: user.id,
              owner,
              repo,
              branchName: branch,
              stressLevel: effectiveStressLevel,
              bugCount: totalBugCount,
              originalCommitSha: originalCommitSha || "",
              symptoms: uniqueSymptoms,
              changes: allChanges,
              filesBuggered,
              fileChanges: fileChanges as unknown as Prisma.InputJsonValue, // Detailed per-file changes for notifications UI
              noteRead: false,
              changesRead: false,
            },
          });

          // Deduct coins from the user
          await tx.user.update({
            where: { id: user.id },
            data: { coins: { decrement: coinCost } },
          });

          return newBugger;
        });

        buggerId = bugger.id;
        
        // Now log token usage with buggerId and full context
        for (const { usage, provider, model } of allUsageData) {
          await logTokenUsage({
            userId: user.id,
            provider,
            model,
            usage,
            operation: "stress",
            buggerId: bugger.id,
            stressLevel: effectiveStressLevel,
            repoOwner: owner,
            repoName: repo,
          });
        }
      } catch (dbError) {
        // Log but don't fail the request if database save fails
        console.error("Failed to save bugger to database:", dbError);
      }
      
      // Create metadata with buggerId included
      const metadata: StressMetadata = {
        buggerId: buggerId || undefined,
        stressLevel: effectiveStressLevel,
        bugCount: totalBugCount,
        createdAt: new Date().toISOString(),
        symptoms: uniqueSymptoms,
        filesBuggered,
        changes: allChanges,
        originalCommitSha: originalCommitSha || "",
        owner,
        repo,
        branch,
      };

      // Save metadata to .buggr.json file in the branch
      try {
        await createStressMetadata(session.accessToken, metadata);
      } catch (metadataError) {
        // Log but don't fail the request if metadata creation fails
        console.error("Failed to create stress metadata:", metadataError);
      }

      // Send bug report email to the user (don't block response)
      if (user.email && uniqueSymptoms.length > 0) {
        const dashboardUrl = `${APP_URL}/dashboard?repo=${owner}/${repo}&branch=${branch}`;

        sendBugReportEmail({
          to: user.email,
          repoName: `${owner}/${repo}`,
          branchName: branch,
          symptoms: uniqueSymptoms,
          stressLevel: effectiveStressLevel,
          dashboardUrl,
        }).then((result) => {
          if (result.success) {
            console.log(`[Stress] Bug report email sent to ${user.email}`);
          } else {
            console.warn(`[Stress] Failed to send bug report email: ${result.error}`);
          }
        }).catch((err) => {
          console.error("[Stress] Error sending bug report email:", err);
        });
      }
    }

    // Build response message with warning if some files failed
    let message = `${successCount} of ${files.length} files have been buggered up`;
    if (failedResults.length > 0 && successCount > 0) {
      message += `. Warning: ${failedResults.length} file(s) could not be buggered (AI returned unchanged content)`;
    }

    return NextResponse.json({
      message,
      results,
      symptoms: uniqueSymptoms,
      buggerId, // Return the buggerId so the client can use it later
      warning: failedResults.length > 0 ? `${failedResults.length} file(s) failed to be buggered` : undefined,
    });
  } catch (error) {
    console.error("Error buggering up code:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to bugger up code" },
      { status: 500 }
    );
  }
}

