import type { GitHubCommit, StressMetadata } from "@/lib/github";
import { Button } from "@/app/components/inputs/Button";
import { TrophyIcon, CloseIcon } from "@/app/components/icons";

interface ScorePanelProps {
  /** The commit where debugging started (contains "start" in message) */
  startCommit: GitHubCommit;
  /** The commit where debugging completed (contains "complete" in message) */
  completeCommit: GitHubCommit;
  /** The branch name being viewed */
  branchName: string;
  /** Callback to close the score panel */
  onClose: () => void;
  /** Optional stress test metadata from .stresst.json */
  stressMetadata?: StressMetadata | null;
}

/** Score rating configuration */
interface ScoreRating {
  grade: string;
  label: string;
  emoji: string;
  description: string;
  gradient: string;
  textColor: string;
}

/** Time thresholds in minutes for each difficulty level */
const TIME_THRESHOLDS = {
  low: { fast: 5, medium: 15 },
  medium: { fast: 15, medium: 45 },
  high: { fast: 30, medium: 90 },
} as const;

/** Score ratings from best to worst */
const SCORE_RATINGS: Record<string, ScoreRating> = {
  legendary: {
    grade: "S",
    label: "Bug Slayer",
    emoji: "⚡",
    description: "Lightning fast! You crushed it.",
    gradient: "from-purple-500 via-pink-500 to-orange-500",
    textColor: "text-purple-300",
  },
  outstanding: {
    grade: "A",
    label: "Outstanding",
    emoji: "🌟",
    description: "Exceptional debugging skills!",
    gradient: "from-amber-400 to-yellow-500",
    textColor: "text-amber-300",
  },
  great: {
    grade: "B",
    label: "Great Job",
    emoji: "🔥",
    description: "Solid work, well done!",
    gradient: "from-emerald-600/80 to-teal-600/80",
    textColor: "text-emerald-400",
  },
  good: {
    grade: "C",
    label: "Good Work",
    emoji: "👍",
    description: "Nice effort, keep improving!",
    gradient: "from-blue-400 to-cyan-500",
    textColor: "text-blue-300",
  },
  practice: {
    grade: "D",
    label: "Keep Practicing",
    emoji: "💪",
    description: "You finished! Practice makes perfect.",
    gradient: "from-slate-400 to-slate-500",
    textColor: "text-slate-300",
  },
};

/**
 * Calculates a score rating based on difficulty, time taken, and bug count.
 *
 * @param difficultyLevel - The stress level (low, medium, high)
 * @param timeMs - Time taken in milliseconds
 * @param bugCount - Number of bugs that were introduced (more = harder)
 * @returns Score rating object
 */
function calculateScoreRating(
  difficultyLevel: "low" | "medium" | "high" | undefined,
  timeMs: number,
  bugCount?: number
): ScoreRating {
  const timeMinutes = timeMs / (1000 * 60);
  const difficulty = difficultyLevel || "medium";
  const thresholds = TIME_THRESHOLDS[difficulty];

  // Difficulty bonus: harder = more impressive (0-2 points)
  const difficultyBonus = difficulty === "high" ? 2 : difficulty === "medium" ? 1 : 0;

  // Bug count bonus: more bugs = more impressive (0-1.5 points)
  // 1 bug = 0, 2 bugs = 0.5, 3+ bugs = 1, 4+ bugs = 1.5
  const bugs = bugCount || 1;
  const bugBonus = bugs >= 4 ? 1.5 : bugs >= 3 ? 1 : bugs >= 2 ? 0.5 : 0;

  // Adjust time thresholds based on bug count (more bugs = more time allowed)
  const bugTimeMultiplier = 1 + (bugs - 1) * 0.25; // Each extra bug adds 25% more time allowance
  const adjustedFast = thresholds.fast * bugTimeMultiplier;
  const adjustedMedium = thresholds.medium * bugTimeMultiplier;

  // Calculate base score from time (1-4 points)
  let timeScore: number;
  if (timeMinutes <= adjustedFast) {
    timeScore = 4; // Very fast
  } else if (timeMinutes <= adjustedMedium) {
    timeScore = 3; // Good time
  } else if (timeMinutes <= adjustedMedium * 2) {
    timeScore = 2; // Took a while
  } else {
    timeScore = 1; // Slow but finished
  }

  // Combined score (1-7.5 range)
  const totalScore = timeScore + difficultyBonus + bugBonus;

  // Map to rating (adjusted thresholds for new range)
  if (totalScore >= 7) return SCORE_RATINGS.legendary;
  if (totalScore >= 5.5) return SCORE_RATINGS.outstanding;
  if (totalScore >= 4.5) return SCORE_RATINGS.great;
  if (totalScore >= 3) return SCORE_RATINGS.good;
  return SCORE_RATINGS.practice;
}

/**
 * Formats a date string into a human-readable format.
 *
 * @param dateString - ISO date string to format
 * @returns Formatted date string (e.g., "Dec 17, 2025 at 2:30 PM")
 */
function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Calculates the time difference between start and complete commits.
 *
 * @param startCommit - The commit where debugging started
 * @param completeCommit - The commit where debugging completed
 * @returns Object with formatted string and raw milliseconds
 */
function calculateTimeDifference(
  startCommit: GitHubCommit,
  completeCommit: GitHubCommit
): { formatted: string; ms: number } {
  const startTime = new Date(startCommit.commit.author.date).getTime();
  const completeTime = new Date(completeCommit.commit.author.date).getTime();
  const diffMs = Math.abs(completeTime - startTime);

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  let formatted: string;
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return { formatted, ms: diffMs };
}

/** Maps stress level to display configuration */
const DIFFICULTY_CONFIG = {
  low: { label: "Easy", color: "text-green-400", bg: "bg-green-500/20" },
  medium: { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  high: { label: "Hard", color: "text-red-400", bg: "bg-red-500/20" },
} as const;

export function ScorePanel({
  startCommit,
  completeCommit,
  branchName,
  onClose,
  stressMetadata,
}: ScorePanelProps) {
  const { formatted: timeDifference, ms: timeMs } = calculateTimeDifference(
    startCommit,
    completeCommit
  );
  const difficulty = stressMetadata?.stressLevel
    ? DIFFICULTY_CONFIG[stressMetadata.stressLevel]
    : null;
  const repoFullName = stressMetadata
    ? `${stressMetadata.owner}/${stressMetadata.repo}`
    : null;
  const scoreRating = calculateScoreRating(
    stressMetadata?.stressLevel,
    timeMs,
    stressMetadata?.bugCount
  );

  const bugCount = stressMetadata?.bugCount || 1;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto">
      {/* Main Score Card */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${scoreRating.gradient} p-[2px]`}>
        <div className="rounded-[14px] bg-gh-canvas-default p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrophyIcon className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold tracking-wide text-gh-text-muted uppercase">stresst</span>
            </div>
            {repoFullName && (
              <code className="font-mono text-xs text-gh-text-muted">{repoFullName}</code>
            )}
          </div>

          {/* Grade */}
          <div className="text-center mb-6">
            <div className={`inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${scoreRating.gradient} mb-3`}>
              <span className="text-6xl font-black text-white drop-shadow-lg">
                {scoreRating.grade}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl">{scoreRating.emoji}</span>
              <h2 className={`text-xl font-bold ${scoreRating.textColor}`}>
                {scoreRating.label}
              </h2>
            </div>
            <p className="text-sm text-white">
              {scoreRating.description}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-gh-canvas-subtle p-3 text-center">
              <p className="text-2xl font-bold text-white">{timeDifference}</p>
              <p className="text-xs text-gh-text-muted mt-1">Time</p>
            </div>
            <div className="rounded-lg bg-gh-canvas-subtle p-3 text-center">
              <p className="text-2xl font-bold text-white">{bugCount}</p>
              <p className="text-xs text-gh-text-muted mt-1">{bugCount === 1 ? "Bug" : "Bugs"}</p>
            </div>
            <div className="rounded-lg bg-gh-canvas-subtle p-3 text-center">
              <p className={`text-2xl font-bold ${difficulty?.color || "text-white"}`}>
                {difficulty?.label || "—"}
              </p>
              <p className="text-xs text-gh-text-muted mt-1">Level</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline - Compact */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold tracking-wide text-gh-text-muted uppercase">Timeline</h3>
        
        <div className="space-y-2">
          {/* Start */}
          <div className="flex items-center gap-3 rounded-lg border border-gh-border bg-gh-canvas-subtle p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
              <span className="text-sm">🚀</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {startCommit.commit.message.split("\n")[0]}
              </p>
              <p className="text-xs text-gh-text-muted">
                {formatFullDate(startCommit.commit.author.date)}
              </p>
            </div>
            <code className="shrink-0 rounded bg-gh-canvas-default px-2 py-0.5 font-mono text-xs text-gh-accent">
              {startCommit.sha.substring(0, 7)}
            </code>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <div className="h-4 w-0.5 bg-gh-border" />
          </div>

          {/* Complete */}
          <div className="flex items-center gap-3 rounded-lg border border-gh-border bg-gh-canvas-subtle p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20">
              <span className="text-sm">✅</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {completeCommit.commit.message.split("\n")[0]}
              </p>
              <p className="text-xs text-gh-text-muted">
                {formatFullDate(completeCommit.commit.author.date)}
              </p>
            </div>
            <code className="shrink-0 rounded bg-gh-canvas-default px-2 py-0.5 font-mono text-xs text-gh-accent">
              {completeCommit.sha.substring(0, 7)}
            </code>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gh-border">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <CloseIcon className="h-4 w-4" />
            Close
          </Button>
          <code className="font-mono text-xs text-gh-text-muted">{branchName}</code>
        </div>
      </div>
    </div>
  );
}

