import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchCommitDetails, StressMetadata } from "@/lib/github";
import { generateText, LanguageModel } from "ai";
import { prisma } from "@/lib/prisma";
import { logTokenUsage } from "@/lib/token-usage";

/**
 * Feedback item returned by the analysis.
 */
export interface AnalysisFeedback {
  type: "success" | "warning" | "info" | "hint" | "tip";
  title: string;
  message: string;
  file?: string;
  /** Optional improvement suggestion for "tip" type feedback */
  improvement?: string;
}

/**
 * Response from the analyze endpoint.
 */
export interface AnalyzeResponse {
  feedback: AnalysisFeedback[];
  summary: string;
  isPerfect: boolean;

  /** AI-determined grade based on time + code quality (A, B, C, D, F) */
  grade: string;
}

/** Supported AI providers */
type AIProvider = "anthropic" | "ollama" | "openai-compatible";

/**
 * Custom error class for AI analysis failures.
 */
class AIAnalysisError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AIAnalysisError";
  }
}

/**
 * Resolves the AI provider to use based on environment variables.
 * Priority: AI_PROVIDER env var > auto-detect based on available keys > anthropic
 * 
 * @returns The configured AI provider
 */
function resolveAIProvider(): AIProvider {
  const explicitProvider = process.env.AI_PROVIDER?.toLowerCase();
  
  if (explicitProvider === "ollama") return "ollama";
  if (explicitProvider === "openai-compatible") return "openai-compatible";
  if (explicitProvider === "anthropic") return "anthropic";
  
  // Auto-detect based on available configuration
  if (process.env.AI_PROVIDER === "ollama" || (process.env.AI_MODEL && process.env.AI_PROVIDER !== "anthropic" && !process.env.ANTHROPIC_API_KEY)) return "ollama";
  if (process.env.OPENAI_COMPATIBLE_BASE_URL) return "openai-compatible";
  
  // Default to Anthropic
  return "anthropic";
}

/**
 * Creates the appropriate language model based on the configured provider.
 * Supports Anthropic (default), Ollama, and OpenAI-compatible local servers.
 * 
 * @returns Language model instance for the configured provider
 * @throws AIAnalysisError if the provider dependencies are not available
 */
async function createLanguageModel(): Promise<LanguageModel> {
  const provider = resolveAIProvider();
  console.log("[Analyze] Using AI provider:", provider);
  
  switch (provider) {
    case "ollama": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createOpenAICompatible: any;
      try {
        const compatModule = await import("@ai-sdk/openai-compatible");
        createOpenAICompatible = compatModule.createOpenAICompatible;
      } catch (error) {
        throw new AIAnalysisError(
          "OpenAI Compatible SDK not available for Ollama. Please ensure @ai-sdk/openai-compatible is installed.",
          error
        );
      }
      
      const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
      const model = process.env.AI_MODEL || "llama3";
      
      const ollama = createOpenAICompatible({
        name: "ollama",
        baseURL,
        headers: {
          Authorization: "Bearer ollama",
        },
      });
      
      return ollama.chatModel(model);
    }
    
    case "openai-compatible": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createOpenAICompatible: any;
      try {
        const compatModule = await import("@ai-sdk/openai-compatible");
        createOpenAICompatible = compatModule.createOpenAICompatible;
      } catch (error) {
        throw new AIAnalysisError(
          "OpenAI Compatible SDK not available. Please ensure @ai-sdk/openai-compatible is installed.",
          error
        );
      }
      
      const baseURL = process.env.OPENAI_COMPATIBLE_BASE_URL;
      if (!baseURL) {
        throw new AIAnalysisError(
          "OPENAI_COMPATIBLE_BASE_URL environment variable is required for openai-compatible provider."
        );
      }
      
      const model = process.env.OPENAI_COMPATIBLE_MODEL || "default";
      const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY || "not-needed";
      
      const openaiCompatible = createOpenAICompatible({
        name: "openai-compatible",
        baseURL,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      
      return openaiCompatible.chatModel(model);
    }
    
    case "anthropic":
    default: {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new AIAnalysisError(
          "ANTHROPIC_API_KEY environment variable is not set."
        );
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let anthropic: any;
      try {
        const anthropicModule = await import("@ai-sdk/anthropic");
        anthropic = anthropicModule.anthropic;
      } catch (error) {
        throw new AIAnalysisError(
          "AI SDK not available. Please ensure @ai-sdk/anthropic is installed.",
          error
        );
      }
      
      return anthropic(process.env.AI_MODEL || "claude-sonnet-4-20250514");
    }
  }
}

/**
 * Extracts user reasoning from a reasoning.txt file patch.
 * Looks for added lines (starting with +) to get the user's comments.
 * 
 * @param patch - The diff patch for reasoning.txt
 * @returns The user's reasoning text, or null if not found
 */
function extractUserReasoning(patch: string): string | null {
  if (!patch) return null;
  
  // Extract added lines (lines starting with + but not +++)
  const addedLines = patch
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.substring(1)) // Remove the + prefix
    .join("\n")
    .trim();
  
  return addedLines.length > 0 ? addedLines : null;
}

/**
 * Uses AI to analyze the user's code fix and provide detailed feedback.
 * 
 * @param patches - Array of file patches (diffs) from the commit
 * @param metadata - Optional buggr metadata describing what bugs were introduced
 * @param userReasoning - Optional user-provided reasoning from reasoning.txt
 * @param timeMs - Time taken to complete the challenge in milliseconds
 * @param userId - Optional user ID for token usage tracking
 * @param buggerId - Optional bugger ID for correlating token usage
 * @param repoOwner - Repository owner for token usage tracking
 * @param repoName - Repository name for token usage tracking
 * @returns Analysis response with feedback, summary, isPerfect flag, and grade
 */
async function analyzeWithAI(
  patches: { filename: string; patch: string; status: string }[],
  metadata: StressMetadata | null,
  userReasoning: string | null,
  timeMs: number,
  userId?: string,
  buggerId?: string,
  repoOwner?: string,
  repoName?: string
): Promise<AnalyzeResponse> {
  const aiProvider = resolveAIProvider();
  const model = await createLanguageModel();
  const modelName = process.env.AI_MODEL || (aiProvider === "anthropic" ? "claude-sonnet-4-20250514" : "unknown");
  
  // Format the patches for the prompt (excluding reasoning.txt from code review)
  const codePatchesText = patches
    .filter((p) => !p.filename.toLowerCase().includes("reasoning.txt"))
    .map((p) => `FILE: ${p.filename} (${p.status})\n\`\`\`diff\n${p.patch || "No changes"}\n\`\`\``)
    .join("\n\n");
  
  // Calculate time in minutes for the prompt
  const timeMinutes = Math.round(timeMs / (1000 * 60));
  const timeFormatted = timeMinutes >= 60 
    ? `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m` 
    : `${timeMinutes}m`;

  // Time thresholds for grading guidance
  const timeThresholds = {
    low: { maxA: 5, maxB: 10, maxC: 15 },
    medium: { maxA: 7, maxB: 11, maxC: 15 },
    high: { maxA: 10, maxB: 15, maxC: 20 },
  };
  const difficulty = (metadata?.stressLevel as "low" | "medium" | "high") || "medium";
  const thresholds = timeThresholds[difficulty];

  // Build context about the bugs that were introduced
  let bugContext = "";
  if (metadata) {
    bugContext = `
## CONTEXT: What bugs were introduced

The user was debugging a "${metadata.stressLevel}" difficulty challenge with ${metadata.bugCount} bug(s).
**Time taken: ${timeFormatted} (${timeMinutes} minutes)**

### Time Guidelines for ${difficulty} difficulty:
- A grade: 0-${thresholds.maxA} minutes with excellent code
- B grade: ${thresholds.maxA}-${thresholds.maxB} minutes with good code
- C grade: ${thresholds.maxB}-${thresholds.maxC} minutes OR has issues
- D grade: ${thresholds.maxC}+ minutes OR significant issues
- F grade: Bugs not resolved or no explanation for why they couldn't be resolved

### Files that were bugged:
${metadata.filesBuggered.map((f) => `- ${f}`).join("\n")}

### Technical changes that were made (the bugs):
${metadata.changes.map((c, i) => `${i + 1}. ${c}`).join("\n")}

### Symptoms the bugs caused:
${metadata.symptoms.map((s, i) => `${i + 1}. ${s}`).join("\n")}

NOTE: Sometimes the AI-generated bugs don't actually cause the described symptoms, or the user found different issues. Consider the user's reasoning if provided.
`;
  } else {
    bugContext = `
## CONTEXT

**Time taken: ${timeFormatted} (${timeMinutes} minutes)**

No bug metadata available. Evaluate based on code quality and reasoning.
`;
  }

  // Build user reasoning section if provided
  let userReasoningContext = "";
  if (userReasoning) {
    userReasoningContext = `
## USER'S REASONING & NOTES

The user has provided their own reasoning about this debugging session. READ THIS CAREFULLY and acknowledge their points:

"""
${userReasoning}
"""

IMPORTANT: 
- If the user says the described bugs didn't actually cause issues, acknowledge this and adjust your feedback accordingly.
- If the user found different problems than expected, validate their findings.
- If the user asks questions, answer them helpfully.
- If the user provides explanations for their approach, acknowledge and respond to them.
- Be conversational and directly address what they wrote.
`;
  }
  
  const prompt = `You are an expert code reviewer analyzing a user's debugging fix. Your job is to:
1. Evaluate if they correctly fixed the bugs
2. Point out any issues with their fix (leftover code, incomplete fixes, etc.)
3. Provide helpful tips on better approaches when applicable
4. If the user provided reasoning, acknowledge and respond to their points directly
5. **ASSIGN A GRADE (A, B, C, D, or F) based on time + code quality**

${bugContext}
${userReasoningContext}

## THE USER'S FIX (diff format: + = added lines, - = removed lines)

${codePatchesText}

## YOUR ANALYSIS

Analyze the code changes and provide feedback. Be helpful and educational, not harsh.

IMPORTANT GUIDELINES:
- If the fix looks good, say so! Don't invent problems.
- If they left unnecessary code (like a function that now does nothing), point it out.
- If their fix works but there's a cleaner/better way, explain it as a "tip" with the improvement.
- Check if they addressed all the bugged files (if metadata provided).
- Look for common issues: pass-through functions, commented-out code, debug statements left in.
- If the user provided reasoning, ALWAYS acknowledge it in your feedback and respond thoughtfully.
- If the user says the expected bugs weren't actually breaking, validate this and praise their investigative work.
- Be conversational when responding to user notes - treat it like a code review dialogue.

## GRADING CRITERIA (VERY IMPORTANT):
- **A**: Fast time (within time guidelines) AND excellent code quality - all bugs fixed correctly with clean, proper solution
- **B**: Good time AND good code quality - bugs fixed but minor issues or slightly over time with excellent code
- **C**: Bugs mostly fixed but has room for improvement (warnings/hints) OR bugs not accurately identified in reasoning.txt
- **D**: Over time with issues OR significant code problems
- **F**: Bugs NOT resolved AND no explanation in reasoning.txt for why they couldn't be resolved. This is a failing grade.

The grade is a COMBINATION of time and code accuracy. Even with fast time, if code has issues, it cannot be an A.

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "feedback": [
    {
      "type": "success|warning|info|hint|tip",
      "title": "Short title",
      "message": "Detailed explanation",
      "file": "optional/filename.ts",
      "improvement": "optional - only for 'tip' type - explain the better approach"
    }
  ],
  "summary": "One sentence overall assessment",
  "isPerfect": true/false,
  "grade": "A|B|C|D|F"
}

FEEDBACK TYPES:
- "success": Things the user did well (e.g., "Correctly fixed the comparison operator")
- "warning": Issues that should be fixed (e.g., "Left a pass-through function that does nothing")
- "info": Neutral observations or responses to user reasoning (e.g., "Good observation about the bug behavior")
- "hint": Suggestions that aren't critical (e.g., "Consider removing commented-out code")
- "tip": "This works, but here's a better way" suggestions with the "improvement" field explaining why

IMPORTANT:
- Be concise but helpful
- Provide 2-6 feedback items (don't overwhelm the user)
- isPerfect should be true only if there are no warnings or hints AND grade is A
- Always include at least one piece of feedback
- For tips, the "message" should acknowledge what works, and "improvement" should explain the better approach
- If user provided reasoning, include at least one feedback item that directly responds to what they wrote
- If user notes that expected symptoms didn't occur, acknowledge this - AI bug generation isn't perfect!
- **ALWAYS include a grade field with A, B, C, D, or F**`;

  try {
    console.log("[Analyze] Sending to AI for analysis...");
    const startTime = Date.now();
    
    const { text, usage } = await generateText({
      model,
      prompt,
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Analyze] AI response received in ${duration}ms`);
    console.log(`[Analyze] Token usage:`, usage);

    // Log token usage if userId provided (AI SDK v6 uses inputTokens/outputTokens)
    if (userId && usage) {
      await logTokenUsage({
        userId,
        provider: aiProvider,
        model: modelName,
        usage: {
          inputTokens: usage.inputTokens || 0,
          outputTokens: usage.outputTokens || 0,
          totalTokens: usage.totalTokens || 0,
        },
        operation: "analyze",
        buggerId,
        repoOwner,
        repoName,
      });
    }
    
    if (!text || text.trim().length < 20) {
      throw new AIAnalysisError("AI returned empty or insufficient response");
    }
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Analyze] No JSON found in response:", text.substring(0, 500));
      throw new AIAnalysisError("Failed to parse AI response - no JSON found");
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as AnalyzeResponse;
    
    // Validate the response structure
    if (!parsed.feedback || !Array.isArray(parsed.feedback)) {
      throw new AIAnalysisError("Invalid AI response - missing feedback array");
    }
    
    if (typeof parsed.summary !== "string") {
      parsed.summary = "Analysis complete.";
    }
    
    if (typeof parsed.isPerfect !== "boolean") {
      parsed.isPerfect = !parsed.feedback.some(
        (f) => f.type === "warning" || f.type === "hint"
      );
    }
    
    // Validate grade - default to C if not provided or invalid
    const validGrades = ["A", "B", "C", "D", "F"];
    if (typeof parsed.grade !== "string" || !validGrades.includes(parsed.grade.toUpperCase())) {
      // Fallback: determine grade based on isPerfect and warnings
      const hasWarnings = parsed.feedback.some((f) => f.type === "warning");
      const hasHints = parsed.feedback.some((f) => f.type === "hint");
      
      if (parsed.isPerfect && !hasWarnings && !hasHints) {
        parsed.grade = "B"; // Default to B since we can't verify time without AI
      } else if (hasWarnings) {
        parsed.grade = "C";
      } else {
        parsed.grade = "C";
      }
    } else {
      parsed.grade = parsed.grade.toUpperCase();
    }
    
    console.log(`[Analyze] Parsed ${parsed.feedback.length} feedback items, grade: ${parsed.grade}`);
    return parsed;
    
  } catch (error) {
    if (error instanceof AIAnalysisError) {
      throw error;
    }
    console.error("[Analyze] AI analysis error:", error);
    throw new AIAnalysisError(
      `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      error
    );
  }
}

/**
 * POST /api/github/analyze
 * 
 * Analyzes the code changes in a commit using AI and provides feedback.
 * Uses the buggr metadata to provide contextual feedback about the fix.
 * The AI determines the grade based on time taken and code quality.
 * 
 * @param owner - Repository owner
 * @param repo - Repository name  
 * @param sha - Commit SHA to analyze
 * @param timeMs - Time taken to complete the challenge in milliseconds
 * @param stressMetadata - Optional buggr metadata for contextual analysis
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
    const { owner, repo, sha, timeMs, stressMetadata } = body as {
      owner: string;
      repo: string;
      sha: string;
      timeMs: number;
      stressMetadata?: StressMetadata;
    };

    if (!owner || !repo || !sha) {
      return NextResponse.json(
        { error: "Missing owner, repo, or sha parameter" },
        { status: 400 }
      );
    }

    // Validate timeMs - default to 0 if not provided (AI will still evaluate code quality)
    const validatedTimeMs = typeof timeMs === "number" && timeMs > 0 ? timeMs : 0;

    // Look up user for token usage tracking
    const user = session.user?.email
      ? await prisma.user.findUnique({ where: { email: session.user.email } })
      : null;

    // Fetch the commit details including the diff
    const commitDetails = await fetchCommitDetails(session.accessToken, owner, repo, sha);
    
    // Extract patches from the commit files
    const patches = commitDetails.files.map((file) => ({
      filename: file.filename,
      patch: file.patch || "",
      status: file.status,
    }));
    
    // Check for reasoning.txt file and extract user's notes
    const reasoningFile = patches.find(
      (p) => p.filename.toLowerCase() === "reasoning.txt" || 
             p.filename.toLowerCase().endsWith("/reasoning.txt")
    );
    const userReasoning = reasoningFile ? extractUserReasoning(reasoningFile.patch) : null;
    
    if (userReasoning) {
      console.log("[Analyze] Found user reasoning:", userReasoning.substring(0, 200) + "...");
    }
    
    // Use AI to analyze the code
    const analysisResult = await analyzeWithAI(
      patches, 
      stressMetadata || null, 
      userReasoning,
      validatedTimeMs,
      user?.id,
      stressMetadata?.buggerId,
      owner,
      repo
    );

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("[Analyze] Error:", error);
    
    // Return a user-friendly error
    const errorMessage = error instanceof AIAnalysisError
      ? error.message
      : "Failed to analyze code. Please try again.";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
