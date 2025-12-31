"use client";

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
}

const levelConfig = {
  low: {
    emoji: "🌱",
    label: "Low",
    description: "1 file, 2 bugs total",
    activeClass: "bg-gh-success text-white",
  },
  medium: {
    emoji: "🔥",
    label: "Medium",
    description: "2 files, 4 bugs total",
    activeClass: "bg-gh-warning text-white",
  },
  high: {
    emoji: "💀",
    label: "High",
    description: "3 files, 6 bugs total",
    activeClass: "bg-gh-danger text-white",
  },
  custom: {
    emoji: "⚙️",
    label: "Custom",
    description: "Choose your own files and bugs",
    activeClass: "bg-gh-accent text-white",
  },
};

/**
 * A toggle button group for selecting stress level (low, medium, high).
 *
 * @param value - Currently selected stress level
 * @param onChange - Callback when selection changes
 * @param disabled - Whether the selector is disabled
 */
export function StressLevelSelector({ value, onChange, disabled }: StressLevelSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gh-text-muted">Stress Level</label>
      <div className="flex rounded-lg border border-gh-border bg-gh-canvas p-1">
        {(["low", "medium", "high", "custom"] as const).map((level) => {
          const config = levelConfig[level];
          const isActive = value === level;

          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              disabled={disabled}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive ? config.activeClass : "text-gh-text-muted hover:text-white"
              }`}
            >
              {config.emoji} {config.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gh-text-subtle">{levelConfig[value].description}</p>
    </div>
  );
}

