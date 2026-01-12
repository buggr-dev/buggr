import { generateText, LanguageModel } from "ai";
import { BugType, BUG_TYPES } from "./bug-types";
import { TokenUsageData } from "./token-usage";

/** Stress level configuration */
type StressLevel = "low" | "medium" | "high";

/** Supported AI providers */
type AIProvider = "anthropic" | "ollama" | "openai-compatible";

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
 * @throws AIStressError if the provider dependencies are not available
 */
async function createLanguageModel(): Promise<LanguageModel> {
  const provider = resolveAIProvider();
  console.log("Using AI provider:", provider);
  switch (provider) {
    case "ollama": {
      // Ollama uses @ai-sdk/openai-compatible for proper AI SDK 5 support
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createOpenAICompatible: any;
      try {
        const compatModule = await import("@ai-sdk/openai-compatible");
        createOpenAICompatible = compatModule.createOpenAICompatible;
      } catch (error) {
        throw new AIStressError(
          "OpenAI Compatible SDK not available for Ollama. Please ensure @ai-sdk/openai-compatible is installed.",
          error
        );
      }
      
      const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
      const model = process.env.AI_MODEL || "llama3";
      
      console.log(`Ollama config: baseURL=${baseURL}, model=${model}`);
      
      // Verify Ollama is reachable before creating the model
      try {
        const healthCheck = await fetch(`${baseURL.replace('/v1', '')}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        if (!healthCheck.ok) {
          console.warn(`Ollama health check returned status ${healthCheck.status}`);
        } else {
          const data = await healthCheck.json();
          const availableModels = data.models?.map((m: { name: string }) => m.name) || [];
          console.log(`Ollama available models: ${availableModels.join(', ') || 'none'}`);
          
          // Check if requested model is available
          const modelBase = model.split(':')[0];
          const hasModel = availableModels.some((m: string) => m.startsWith(modelBase));
          if (!hasModel) {
            console.warn(`WARNING: Model "${model}" may not be available. Available: ${availableModels.join(', ')}`);
            console.warn(`Run 'ollama pull ${model}' to download the model first.`);
          }
        }
      } catch (healthError) {
        console.warn(`Could not reach Ollama at ${baseURL}:`, healthError instanceof Error ? healthError.message : healthError);
        console.warn(`Make sure Ollama is running with 'ollama serve' or the Ollama app is open.`);
      }
      
      const ollama = createOpenAICompatible({
        name: "ollama",
        baseURL,
        headers: {
          Authorization: "Bearer ollama", // Ollama doesn't need a real key
        },
      });
      
      return ollama.chatModel(model);
    }
    
    case "openai-compatible": {
      // Generic OpenAI-compatible servers (LM Studio, LocalAI, vLLM, etc.)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createOpenAICompatible: any;
      try {
        const compatModule = await import("@ai-sdk/openai-compatible");
        createOpenAICompatible = compatModule.createOpenAICompatible;
      } catch (error) {
        throw new AIStressError(
          "OpenAI Compatible SDK not available. Please ensure @ai-sdk/openai-compatible is installed.",
          error
        );
      }
      
      const baseURL = process.env.OPENAI_COMPATIBLE_BASE_URL;
      if (!baseURL) {
        throw new AIStressError(
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
      // Validate API key is set before attempting to use Anthropic
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.error("ANTHROPIC_API_KEY environment variable is not set.");
        console.error("Available env vars with 'ANTHROP' or 'API':", 
          Object.keys(process.env).filter(k => 
            k.toLowerCase().includes('anthrop') || k.toLowerCase().includes('api_key')
          )
        );
        throw new AIStressError(
          "ANTHROPIC_API_KEY environment variable is not set. " +
          "Please add it to your .env.local file. " +
          "Check for typos - the variable must be named exactly 'ANTHROPIC_API_KEY'."
        );
      }
      
      // Check for common key format issues
      if (apiKey.length < 20) {
        throw new AIStressError(
          "ANTHROPIC_API_KEY appears to be invalid (too short). " +
          "Please check your API key is correctly copied from the Anthropic console."
        );
      }
      
      console.log(`Anthropic API key found (${apiKey.length} chars, starts with: ${apiKey.substring(0, 7)}...)`);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let anthropic: any;
      try {
        const anthropicModule = await import("@ai-sdk/anthropic");
        anthropic = anthropicModule.anthropic;
      } catch (error) {
        throw new AIStressError(
          "AI SDK not available. Please ensure @ai-sdk/anthropic is installed.",
          error
        );
      }
      
      return anthropic(process.env.AI_MODEL || "claude-sonnet-4-20250514");
    }
  }
}

interface StressConfig {
  bugCount: number;
  subtlety: string;
  description: string;
}

const STRESS_CONFIGS: Record<StressLevel, StressConfig> = {
  low: {
    bugCount: 2,
    subtlety: "relatively obvious",
    description: "The bugs should be somewhat noticeable - things like obvious operator mistakes, clear logic inversions, or simple typos in variable names. A junior developer should be able to spot them with careful review. Keep the code structure simple and don't add extra abstraction layers.",
  },
  medium: {
    bugCount: 4,
    subtlety: "subtle but findable",
    description: "The bugs should require careful code review to find - off-by-one errors, missing awaits that cause Promise objects to be used as values, edge case failures. A mid-level developer should need to trace through the logic to find them. You SHOULD add 1-2 'data layer' helper functions that data passes through before being used - mimicking technical debt where someone added abstraction layers 'for future flexibility'. The bug can be hidden in these intermediate functions. All bugs must be deterministic and reproducible.",
  },
  high: {
    bugCount: 6,
    subtlety: "deviously subtle",
    description: "The bugs should be very hard to find but ALWAYS reproducible - subtle state mutations, edge cases with specific inputs, cascading errors where one bug masks another. Even senior developers should need debugging tools and careful analysis. You MUST add multiple 'data layer' functions that pipe data through 2-4 transformation steps before it reaches its destination - realistic 'legacy code' technical debt where data flows through normalizers, formatters, validators, mappers, etc. Hide bugs deep in these pipelines where a developer must trace the entire data flow to find them. This should mimic real legacy codebases with accumulated abstractions. IMPORTANT: All bugs must be 100% deterministic - no race conditions or timing-dependent issues.",
  },
};


/**
 * Detects the framework/library used in the code based on content and filename.
 * 
 * @param content - File content to analyze
 * @param filename - Filename to check for framework-specific patterns
 * @returns Detected framework(s) as an array (e.g., ["react", "nextjs"])
 */
function detectFramework(content: string, filename: string): string[] {
  const frameworks: string[] = [];
  const lowerContent = content.toLowerCase();
  const lowerFilename = filename.toLowerCase();

  // React detection
  if (
    lowerContent.includes("useState") ||
    lowerContent.includes("useEffect") ||
    lowerContent.includes("useCallback") ||
    lowerContent.includes("useMemo") ||
    lowerContent.includes("useRef") ||
    lowerContent.includes("react.") ||
    lowerContent.includes("from 'react'") ||
    lowerContent.includes('from "react"') ||
    lowerFilename.endsWith(".jsx") ||
    lowerFilename.endsWith(".tsx")
  ) {
    frameworks.push("react");
  }

  // Next.js detection
  if (
    lowerContent.includes("next/") ||
    lowerContent.includes("useRouter") ||
    lowerContent.includes("usePathname") ||
    lowerContent.includes("useSearchParams") ||
    lowerContent.includes("getServerSideProps") ||
    lowerContent.includes("getStaticProps") ||
    lowerContent.includes("metadata") ||
    lowerContent.includes("generateMetadata") ||
    lowerFilename.includes("page.tsx") ||
    lowerFilename.includes("layout.tsx") ||
    lowerFilename.includes("route.ts")
  ) {
    frameworks.push("nextjs");
  }

  return frameworks;
}

/**
 * Selects random bug types ensuring variety across categories.
 * Uses Fisher-Yates shuffle for true randomness.
 * 
 * Any bug type can be selected regardless of stress level - difficulty comes from
 * the number of bugs and how they're implemented (abstraction layers, helper functions, etc.).
 * Framework-specific bugs are prioritized when the framework is detected.
 * 
 * @param count - Number of bug types to select
 * @param content - File content for framework detection
 * @param filename - Filename for framework detection
 * @param _stressLevel - Stress level (unused, kept for API compatibility)
 * @returns Array of randomly selected bug types
 */
function selectRandomBugTypes(count: number, content: string, filename: string, _stressLevel: StressLevel): BugType[] {
  // Detect framework
  const detectedFrameworks = detectFramework(content, filename);
  
  // Separate framework-specific bugs from general bugs
  const frameworkBugs = BUG_TYPES.filter(bug => 
    bug.framework && detectedFrameworks.includes(bug.framework)
  );
  const generalBugs = BUG_TYPES.filter(bug => !bug.framework);
  
  // Shuffle both lists
  const shuffleArray = <T>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  const shuffledFrameworkBugs = shuffleArray(frameworkBugs);
  const shuffledGeneralBugs = shuffleArray(generalBugs);
  
  // If framework detected and we have framework bugs, do 50/50 split
  const shouldDoBalancedSplit = detectedFrameworks.length > 0 && frameworkBugs.length > 0;
  
  if (shouldDoBalancedSplit) {
    // Calculate 50/50 split (round framework bugs up if odd)
    const frameworkCount = Math.ceil(count / 2);
    const generalCount = count - frameworkCount;
    
    const selected: BugType[] = [];
    const usedCategories = new Set<string>();
    
    // Helper function to select bugs ensuring category variety
    const selectWithVariety = (
      bugPool: BugType[],
      targetCount: number,
      usedCategoriesSet: Set<string>
    ): BugType[] => {
      const selectedBugs: BugType[] = [];
      
      // First pass: pick one from each category
      for (const bug of bugPool) {
        if (selectedBugs.length >= targetCount) break;
        if (!usedCategoriesSet.has(bug.category)) {
          selectedBugs.push(bug);
          usedCategoriesSet.add(bug.category);
        }
      }
      
      // Second pass: if we still need more, allow category repeats
      for (const bug of bugPool) {
        if (selectedBugs.length >= targetCount) break;
        if (!selectedBugs.includes(bug)) {
          selectedBugs.push(bug);
        }
      }
      
      return selectedBugs;
    };
    
    // Select framework bugs (up to available count)
    const availableFrameworkCount = Math.min(frameworkCount, shuffledFrameworkBugs.length);
    const selectedFrameworkBugs = selectWithVariety(
      shuffledFrameworkBugs,
      availableFrameworkCount,
      usedCategories
    );
    selected.push(...selectedFrameworkBugs);
    
    // Select general bugs (fill remaining slots)
    const remainingCount = count - selected.length;
    if (remainingCount > 0) {
      const selectedGeneralBugs = selectWithVariety(
        shuffledGeneralBugs,
        remainingCount,
        usedCategories
      );
      selected.push(...selectedGeneralBugs);
    }
    
    return selected;
  }
  
  // No framework detected or no framework bugs available - use all bugs
  const allBugs = [...shuffledFrameworkBugs, ...shuffledGeneralBugs];
  const selected: BugType[] = [];
  const usedCategories = new Set<string>();

  // First pass: pick one from each category
  for (const bug of allBugs) {
    if (selected.length >= count) break;
    if (!usedCategories.has(bug.category)) {
      selected.push(bug);
      usedCategories.add(bug.category);
    }
  }

  // Second pass: if we still need more, allow category repeats
  for (const bug of allBugs) {
    if (selected.length >= count) break;
    if (!selected.includes(bug)) {
      selected.push(bug);
    }
  }

  return selected;
}

/**
 * Formats selected bug types into a prompt instruction for the AI.
 * 
 * @param bugTypes - The bug types to format
 * @returns Formatted string describing the bugs to introduce
 */
function formatBugInstructions(bugTypes: BugType[]): string {
  return bugTypes.map((bug, index) => {
    const examples = bug.examples.map(ex => `    - ${ex}`).join("\n");
    return `BUG ${index + 1}: ${bug.name} (${bug.category})
  Description: ${bug.description}
  Examples:
${examples}
  Expected symptom: "${bug.sampleSymptom}"
  IMPORTANT: This bug MUST be a CLEAR, VISIBLE breaking change that happens 100% of the time. The symptom must be immediately noticeable to a user.`;
  }).join("\n\n");
}

/**
 * Custom error class for AI bug generation failures.
 */
export class AIStressError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AIStressError";
  }
}

/**
 * Result from AI stress generation including token usage for cost tracking.
 */
export interface AIStressResult {
  content: string;
  changes: string[];
  symptoms: string[];
  /** Token usage data for cost tracking (null if not available) */
  usage: TokenUsageData | null;
  /** AI provider used */
  provider: string;
  /** AI model used */
  model: string;
}

/**
 * Uses AI to bugger up code with subtle but nasty breaking changes.
 * The changes should be realistic bugs that require debugging skills to find and fix.
 * 
 * Requires ANTHROPIC_API_KEY environment variable to be set.
 * 
 * @param content - Original file content
 * @param filename - Name of the file
 * @param context - Optional context about what specific areas to focus bugs on (max 200 chars)
 * @param stressLevel - Bug level: "low", "medium", or "high"
 * @param targetBugCount - Optional specific number of bugs to introduce (overrides bug level bug count)
 * @returns Modified content with AI-generated breaking changes, descriptions, symptoms, and usage data
 * @throws AIStressError if AI is unavailable or fails to generate bugs
 */
export async function introduceAIStress(
  content: string,
  filename: string,
  context?: string,
  stressLevel: StressLevel = "medium",
  targetBugCount?: number
): Promise<AIStressResult> {
  // Create the language model based on configured provider
  const aiProvider = resolveAIProvider();
  const model = await createLanguageModel();
  const modelName = process.env.AI_MODEL || (aiProvider === "anthropic" ? "claude-sonnet-4-20250514" : "unknown");

  const config = STRESS_CONFIGS[stressLevel];

  // Calculate bug count
  const bugCount = targetBugCount !== undefined 
    ? targetBugCount 
    : config.bugCount;
  
  // RANDOMIZE: Select specific bug types before calling AI
  const selectedBugs = selectRandomBugTypes(bugCount, content, filename, stressLevel);
  const bugInstructions = formatBugInstructions(selectedBugs);
  
  // Detect framework for prompt enhancement
  const detectedFrameworks = detectFramework(content, filename);
  const frameworkInstruction = detectedFrameworks.length > 0
    ? `\n\nFRAMEWORK DETECTED: ${detectedFrameworks.join(", ").toUpperCase()}\nWhen introducing bugs, prioritize framework-specific issues like hooks, component lifecycle, prop drilling, JSX rendering, etc. Make sure framework-specific bugs are realistic and follow framework patterns.`
    : "";
  
  // Detect HTML files and add specific instructions
  const isHtmlFile = filename.toLowerCase().endsWith('.html') || filename.toLowerCase().endsWith('.htm');
  const htmlInstruction = isHtmlFile
    ? `\n\nHTML FILE DETECTED: This is an HTML file. Focus on bugs that affect the rendered output:
- Change or remove class names (causing styling issues)
- Modify id attributes (breaking JavaScript selectors)
- Change data attributes or onclick handlers
- Swap or duplicate elements
- Modify text content to be incorrect
- Remove or duplicate script/link tags
- Change form input names or values
DO NOT break the HTML structure itself (keep tags properly closed).`
    : "";
  
  // Build optional focus area instruction
  const focusInstruction = context 
    ? `\n\nFOCUS AREA: The user wants to specifically test: "${context}"\nTry to apply the bugs in areas related to this focus when possible.`
    : "";
  
  const prompt = `You are a bug engineer introducing specific bugs into code for a debugging training game.

BUG LEVEL: ${stressLevel.toUpperCase()}
${config.description}

YOU MUST INTRODUCE EXACTLY THESE ${bugCount} BUG(S):

${bugInstructions}

${focusInstruction}

${frameworkInstruction}

${htmlInstruction}

CRITICAL RULES:
1. Introduce EXACTLY the bugs listed above - do not substitute or add different bugs
2. Each bug description tells you WHAT to do and gives examples - follow them closely
3. Do NOT add comments that reveal bug locations (no "// bug here" or hints)
4. Do NOT make syntax errors that IDEs would catch immediately
5. Bugs must be DETERMINISTIC - same behavior every time with same input
6. You MAY add helper functions to hide bugs (especially for medium/high stress)
7. The code must still compile/parse correctly

MANDATORY BUG REQUIREMENTS:
- Bugs MUST be CLEARLY VISIBLE breaking changes - users must immediately see something is wrong
- Bugs MUST cause OBVIOUS failures: wrong data displayed, missing items, crashes, incorrect calculations, reversed logic
- DO NOT create subtle performance issues like "app gets slower" or "memory leaks" - these are not noticeable enough
- Bugs MUST be 100% RELIABLE - they must happen every single time, not "sometimes" or "occasionally"
- Each bug MUST produce a specific, describable symptom that a QA tester can clearly report
- Examples of GOOD bugs: "All prices show $0", "Last 2 items missing", "Names appear backwards", "App crashes on load"
- Examples of BAD bugs: "App is slightly slower", "Memory usage increases over time", "Sometimes fails"

THE SCENARIO - A careless developer:
Imagine the code was written by a sloppy developer who:
- Never writes tests or double-checks their work
- Copies and pastes code without understanding it
- Makes "quick fixes" that break other things
- Gets confused by their own code
- Makes typos and doesn't proofread

Here is the code to modify:

FILENAME: ${filename}
\`\`\`
${content}
\`\`\`

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "modifiedCode": "the complete modified code with bugs introduced",
  "changes": ["technical description of bug 1", "technical description of bug 2"],
  "symptoms": ["Detailed bug report 1", "Detailed bug report 2"]
}

IMPORTANT about "symptoms": Write these like bug reports from a QA tester who sees the UI, not the code:
- Format: "[Specific Location]: [What went wrong]. Expected [X] but got [Y]."
- EVERY symptom MUST start with a specific location (page name, component, section of the UI)
- Location examples: "Home page:", "Filter bar on the Products page:", "User profile sidebar:", "Shopping cart modal:", "Search results in the header:"
- Do NOT mention variable names, function names, or line numbers
- Describe what the user SEES, not what the code does
- Symptoms MUST describe CLEAR, VISIBLE failures that happen 100% of the time
- Good examples with locations:
  - "Home page product grid: All prices show $0.00 instead of actual values"
  - "Filter dropdown in the sidebar: Last 2 filter options are missing from the list"
  - "User dashboard stats panel: App crashes with white screen when loading"
  - "Navigation breadcrumbs: Names appear in reverse order"
- DO NOT write symptoms like "app is slower" or "sometimes fails" - these are not clear enough
- DO NOT write generic locations like "On the page" or "In the app" - be SPECIFIC about WHERE in the UI

The modifiedCode must be the COMPLETE file content. Do not truncate or summarize.`;

  try {
    console.log(`Calling AI model with prompt length: ${prompt.length} characters`);
    const startTime = Date.now();
    
    const { text, finishReason, usage } = await generateText({
      model,
      prompt,
    });
    
    const duration = Date.now() - startTime;
    console.log(`AI response received in ${duration}ms`);
    console.log(`Finish reason: ${finishReason}, Usage:`, usage);
    console.log(`Response length: ${text?.length || 0} characters`);
    
    // Debug: log first 500 chars of response for troubleshooting
    if (text) {
      console.log(`Response preview: ${text.substring(0, 500)}...`);
    } else {
      console.log("WARNING: AI returned empty response");
    }

    // Check for empty or very short responses (common with Ollama misconfiguration)
    if (!text || text.trim().length < 50) {
      throw new AIStressError(
        `AI returned empty or insufficient response (${text?.length || 0} chars). ` +
        `This often means the model didn't understand the prompt or isn't loaded correctly. ` +
        `For Ollama: ensure the model is running with 'ollama run <model>' first.`
      );
    }

    // Parse the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Full AI response (no JSON found):", text);
      throw new AIStressError(
        `Failed to parse AI response - no JSON found in output. ` +
        `Response started with: "${text.substring(0, 200)}..."`
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parse error. Matched JSON:", jsonMatch[0].substring(0, 500));
      throw new AIStressError(
        `Failed to parse JSON from AI response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
        parseError
      );
    }
    
    if (!parsed.modifiedCode || !parsed.changes) {
      console.error("Invalid response structure:", Object.keys(parsed));
      throw new AIStressError(
        `Invalid AI response structure - missing modifiedCode or changes. ` +
        `Got keys: ${Object.keys(parsed).join(', ')}`
      );
    }

    console.log(`Successfully parsed AI response with ${parsed.changes.length} changes`);
    
    // Log comparison info for debugging
    const originalLength = content.length;
    const modifiedLength = parsed.modifiedCode?.length || 0;
    const contentChanged = parsed.modifiedCode !== content;
    console.log(`Content comparison: original=${originalLength} chars, modified=${modifiedLength} chars, changed=${contentChanged}`);
    
    if (!contentChanged) {
      console.warn("WARNING: AI returned content identical to original! The file will not be updated.");
      console.warn("This could indicate the AI failed to modify the code or echoed it back unchanged.");
    }
    
    if (parsed.changes.length === 0) {
      console.warn("WARNING: AI returned 0 changes! No bugs were introduced.");
    }

    // Prepare usage data for return (AI SDK v6 uses inputTokens/outputTokens)
    const usageData: TokenUsageData | null = usage ? {
      inputTokens: usage.inputTokens || 0,
      outputTokens: usage.outputTokens || 0,
      totalTokens: usage.totalTokens || 0,
    } : null;

    return {
      content: parsed.modifiedCode,
      changes: parsed.changes,
      symptoms: parsed.symptoms || selectedBugs.map(b => b.sampleSymptom),
      usage: usageData,
      provider: aiProvider,
      model: modelName,
    };
  } catch (error) {
    if (error instanceof AIStressError) {
      throw error;
    }
    console.error("AI stress generation error:", error);
    throw new AIStressError(
      `AI stress generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      `Please check your configuration and try again.`,
      error
    );
  }
}

/**
 * Generates detailed bug report descriptions from technical change descriptions.
 * Used as a fallback when AI doesn't provide symptoms.
 * 
 * @param changes - Array of technical change descriptions
 * @returns Array of detailed bug report descriptions
 */
function generateFallbackSymptoms(changes: string[]): string[] {
  const symptomTemplates = [
    "Home page product grid: The last 2 items are completely missing. We have 10 items but only 8 show up on screen.",
    "Header search bar component: The first letter of every search is being cut off. Typing 'Apple' searches for 'pple' instead.",
    "Products listing page cards: Every single item shows the same ID number. All 50 items display 'ID: 1001' even though they should be unique.",
    "User profile sidebar panel: All names are showing as 'undefined'. The other fields load fine but names are blank.",
    "Dashboard main content area: App crashes with white screen. Console shows 'Cannot read property of null' error.",
    "Order summary in checkout page: All totals and prices show $0.00. We have items worth hundreds of dollars but everything displays as zero.",
    "Category filter dropdown in sidebar: Half the options are completely blank. Every other filter (items 2, 4, 6, 8...) shows as empty.",
    "Featured items carousel on home page: Items that should be visible are hidden, and hidden items are showing. The display logic is completely inverted.",
    "Cart icon badge in navigation header: Shows '3 items' but there are clearly 5 items in cart. The count is always 2 less than actual.",
    "Form labels in settings page: The last few characters are cut off from every label. 'Description' shows as 'Descript', 'Username' shows as 'Userna'.",
  ];
  
  // Pick random symptoms based on number of changes
  const numSymptoms = Math.min(changes.length, 3);
  shuffleArray(symptomTemplates);
  return symptomTemplates.slice(0, numSymptoms);
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 * 
 * @param array - Array to shuffle
 * @returns The shuffled array (same reference)
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
