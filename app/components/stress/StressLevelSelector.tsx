"use client";

import { CoinIcon } from "@/app/components/icons";
import { STRESS_LEVEL_COSTS } from "@/lib/stress-costs";

// Re-export for convenience
export { STRESS_LEVEL_COSTS } from "@/lib/stress-costs";

type StressLevel = "low" | "medium" | "high" | "custom";

interface StressLevelSelectorProps {
  /**
   * The currently selected stress level.
   */
  value: StressLevel;
  /**
   * Callback when stress level changes.
   */
  onChange: (level: StressLevel) => void;
  /**
   * Whether the selector is disabled.
   */
  disabled?: boolean;
  /**
   * User's current coin balance.
   */
  userCoins?: number;
}

const levelConfig = {
  low: {
    emoji: "🌱",
    label: "Low",
    description: "1 file, 2 bugs total",
    activeClass: "bg-gh-success text-white",
    cost: STRESS_LEVEL_COSTS.low,
  },
  medium: {
    emoji: "🔥",
    label: "Medium",
    description: "2 files, 4 bugs total",
    activeClass: "bg-gh-warning text-white",
    cost: STRESS_LEVEL_COSTS.medium,
  },
  high: {
    emoji: "💀",
    label: "High",
    description: "3 files, 6 bugs total",
    activeClass: "bg-gh-danger text-white",
    cost: STRESS_LEVEL_COSTS.high,
  },
  custom: {
    emoji: "⚙️",
    label: "Custom",
    description: "Choose your own files and bugs",
    activeClass: "bg-gh-accent text-white",
    cost: STRESS_LEVEL_COSTS.custom,
  },
};

/**
 * A toggle button group for selecting bug level (low, medium, high).
 * Custom level is hidden from UI but functionality is kept.
 *
 * @param value - Currently selected bug level
 * @param onChange - Callback when selection changes
 * @param disabled - Whether the selector is disabled
 * @param userCoins - User's current coin balance (used to disable unaffordable options)
 */
export function StressLevelSelector({ value, onChange, disabled, userCoins }: StressLevelSelectorProps) {
  // Remove 'custom' from displayed options but keep functionality
  const displayedLevels = ["low", "medium", "high"] as const;
  
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gh-text-muted">Bug Level</label>
        {userCoins !== undefined && (
          <span className="flex items-center gap-1 text-xs font-medium text-gh-accent">
            <CoinIcon className="h-3.5 w-3.5" />
            {userCoins} coin{userCoins !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex rounded-lg border border-gh-border bg-gh-canvas p-1">
        {displayedLevels.map((level) => {
          const config = levelConfig[level];
          const isActive = value === level;
          const canAfford = userCoins === undefined || userCoins >= config.cost;
          const isDisabled = disabled || !canAfford;

          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              disabled={isDisabled}
              className={`flex flex-1 flex-col items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive ? config.activeClass : "text-gh-text-muted hover:text-white"
              }`}
              title={!canAfford ? `Need ${config.cost} coins` : undefined}
            >
              <div>{config.emoji} {config.label}</div>
              <div className="mt-0.5 flex items-center gap-0.5 text-[10px] opacity-70">
                <CoinIcon className="h-2.5 w-2.5" />
                {config.cost}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gh-text-subtle">{levelConfig[value].description}</p>
    </div>
  );
}

