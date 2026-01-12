import { prisma } from "@/lib/prisma";

/**
 * Token usage data from AI SDK response.
 * Uses inputTokens/outputTokens to match AI SDK v6 naming.
 */
export interface TokenUsageData {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Parameters for logging token usage.
 */
export interface LogTokenUsageParams {
  userId: string;
  provider: string;
  model: string;
  usage: TokenUsageData;
  operation: "stress" | "analyze";
  buggerId?: string;
  /** Stress level - only for stress operations */
  stressLevel?: "low" | "medium" | "high";
  /** Repository owner/org */
  repoOwner?: string;
  /** Repository name */
  repoName?: string;
}

/**
 * Pricing per 1M tokens (in cents) for cost estimation.
 * Update these values as provider pricing changes.
 * 
 * @see https://www.anthropic.com/pricing
 * @see https://openai.com/pricing
 */
const PRICING_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  // Anthropic Claude models (cents per 1M tokens)
  "claude-sonnet-4-20250514": { input: 300, output: 1500 },
  "claude-3-5-sonnet-20241022": { input: 300, output: 1500 },
  "claude-3-opus-20240229": { input: 1500, output: 7500 },
  "claude-3-haiku-20240307": { input: 25, output: 125 },
  
  // Default fallback for unknown models
  "default": { input: 300, output: 1500 },
};

/**
 * Calculates estimated cost in cents based on token usage and model.
 * 
 * @param model - The AI model name
 * @param usage - Token usage data
 * @returns Estimated cost in cents (integer)
 */
function calculateCostCents(model: string, usage: TokenUsageData): number {
  const pricing = PRICING_PER_MILLION_TOKENS[model] || PRICING_PER_MILLION_TOKENS["default"];
  
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;
  
  // Round to nearest cent
  return Math.round(inputCost + outputCost);
}

/**
 * Logs AI token usage to the database for cost tracking and analytics.
 * 
 * This function is fire-and-forget - it logs errors but doesn't throw,
 * so it won't interrupt the main operation if logging fails.
 * 
 * @param params - Token usage parameters
 * @returns Promise that resolves when logging is complete
 * 
 * @example
 * await logTokenUsage({
 *   userId: user.id,
 *   provider: "anthropic",
 *   model: "claude-sonnet-4-20250514",
 *   usage: { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 },
 *   operation: "stress",
 *   buggerId: bugger.id,
 * });
 */
export async function logTokenUsage(params: LogTokenUsageParams): Promise<void> {
  const { userId, provider, model, usage, operation, buggerId, stressLevel, repoOwner, repoName } = params;

  // Skip logging for local models (ollama) - no cost to track
  if (provider === "ollama") {
    console.log(`[TokenUsage] Skipping log for local provider: ${provider}`);
    return;
  }

  // Validate usage data
  if (!usage || typeof usage.totalTokens !== "number") {
    console.warn("[TokenUsage] Invalid usage data, skipping log:", usage);
    return;
  }

  try {
    const estimatedCostCents = calculateCostCents(model, usage);

    await prisma.tokenUsage.create({
      data: {
        userId,
        provider,
        model,
        promptTokens: usage.inputTokens || 0,
        completionTokens: usage.outputTokens || 0,
        totalTokens: usage.totalTokens || 0,
        operation,
        buggerId,
        stressLevel,
        repoOwner,
        repoName,
        estimatedCostCents,
      },
    });

    console.log(
      `[TokenUsage] Logged: ${operation} | ${usage.totalTokens} tokens | ~$${(estimatedCostCents / 100).toFixed(4)} | user=${userId.slice(0, 8)}...`
    );
  } catch (error) {
    // Log but don't throw - we don't want token logging to break the main operation
    console.error("[TokenUsage] Failed to log token usage:", error);
  }
}

/**
 * Gets token usage summary for a user within a date range.
 * 
 * @param userId - The user ID to query
 * @param startDate - Start of date range (optional, defaults to 30 days ago)
 * @param endDate - End of date range (optional, defaults to now)
 * @returns Summary of token usage
 */
export async function getUserTokenUsageSummary(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalTokens: number;
  totalCostCents: number;
  byOperation: Record<string, { tokens: number; costCents: number; count: number }>;
  byModel: Record<string, { tokens: number; costCents: number; count: number }>;
}> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const usages = await prisma.tokenUsage.findMany({
    where: {
      userId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  const summary = {
    totalTokens: 0,
    totalCostCents: 0,
    byOperation: {} as Record<string, { tokens: number; costCents: number; count: number }>,
    byModel: {} as Record<string, { tokens: number; costCents: number; count: number }>,
  };

  for (const usage of usages) {
    summary.totalTokens += usage.totalTokens;
    summary.totalCostCents += usage.estimatedCostCents || 0;

    // Aggregate by operation
    if (!summary.byOperation[usage.operation]) {
      summary.byOperation[usage.operation] = { tokens: 0, costCents: 0, count: 0 };
    }
    summary.byOperation[usage.operation].tokens += usage.totalTokens;
    summary.byOperation[usage.operation].costCents += usage.estimatedCostCents || 0;
    summary.byOperation[usage.operation].count += 1;

    // Aggregate by model
    if (!summary.byModel[usage.model]) {
      summary.byModel[usage.model] = { tokens: 0, costCents: 0, count: 0 };
    }
    summary.byModel[usage.model].tokens += usage.totalTokens;
    summary.byModel[usage.model].costCents += usage.estimatedCostCents || 0;
    summary.byModel[usage.model].count += 1;
  }

  return summary;
}
