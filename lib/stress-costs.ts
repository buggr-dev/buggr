/**
 * Coin costs for each stress level.
 * Shared between client and server code.
 */
export const STRESS_LEVEL_COSTS = {
  low: 5,
  medium: 10,
  high: 15,
  custom: 15, // Custom uses high cost
} as const;

export type StressLevel = keyof typeof STRESS_LEVEL_COSTS;
