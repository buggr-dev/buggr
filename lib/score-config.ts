/**
 * Score Configuration
 *
 * This file manages all scoring thresholds and display configurations.
 * Update the time thresholds below to adjust grade boundaries.
 */

/** Score grade configuration for display */
export interface ScoreRating {
  grade: string;
  label: string;
  emoji: string;
  description: string;
  gradient: string;
  textColor: string;
}

/** Difficulty level type */
export type DifficultyLevel = "low" | "medium" | "high";

/**
 * Time thresholds in MINUTES for each grade per difficulty level.
 * Grades are awarded based on completion time:
 * - A: 0 to maxA minutes
 * - B: maxA to maxB minutes
 * - C: maxB to maxC minutes
 * - D: maxC+ minutes
 */
export const TIME_THRESHOLDS: Record<
  DifficultyLevel,
  { maxA: number; maxB: number; maxC: number }
> = {
  // Easy Mode: A=0-5, B=5-10, C=10-15, D=15+
  low: { maxA: 5, maxB: 10, maxC: 15 },

  // Medium Mode: A=0-7, B=7-11, C=11-15, D=15+
  medium: { maxA: 7, maxB: 11, maxC: 15 },

  // Hard Mode: A=0-10, B=10-15, C=15-20, D=20+
  high: { maxA: 10, maxB: 15, maxC: 20 },
};

/** Score ratings from best to worst */
export const SCORE_RATINGS: Record<string, ScoreRating> = {
  A: {
    grade: "A",
    label: "Outstanding",
    emoji: "🌟",
    description: "Exceptional debugging skills!",
    gradient: "from-amber-400 to-yellow-500",
    textColor: "text-white",
  },
  B: {
    grade: "B",
    label: "Great Job",
    emoji: "🔥",
    description: "Solid work, well done!",
    gradient: "from-emerald-600/80 to-teal-600/80",
    textColor: "text-emerald-400",
  },
  C: {
    grade: "C",
    label: "Good Work",
    emoji: "👍",
    description: "Nice effort, keep improving!",
    gradient: "from-blue-400 to-cyan-500",
    textColor: "text-blue-300",
  },
  D: {
    grade: "D",
    label: "Keep Practicing",
    emoji: "💪",
    description: "You finished! Practice makes perfect.",
    gradient: "from-slate-400 to-slate-500",
    textColor: "text-slate-300",
  },
};

/** Difficulty display configuration */
export const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { label: string; color: string; bg: string }
> = {
  low: { label: "Easy", color: "text-green-400", bg: "bg-green-500/20" },
  medium: { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  high: { label: "Hard", color: "text-red-400", bg: "bg-red-500/20" },
};

/**
 * Calculates a score rating based on difficulty and time taken.
 *
 * @param difficultyLevel - The stress level (low, medium, high)
 * @param timeMs - Time taken in milliseconds
 * @returns Score rating object
 */
export function calculateScoreRating(
  difficultyLevel: DifficultyLevel | undefined,
  timeMs: number
): ScoreRating {
  const timeMinutes = timeMs / (1000 * 60);
  const difficulty = difficultyLevel || "medium";
  const thresholds = TIME_THRESHOLDS[difficulty];

  if (timeMinutes <= thresholds.maxA) {
    return SCORE_RATINGS.A;
  } else if (timeMinutes <= thresholds.maxB) {
    return SCORE_RATINGS.B;
  } else if (timeMinutes <= thresholds.maxC) {
    return SCORE_RATINGS.C;
  } else {
    return SCORE_RATINGS.D;
  }
}

