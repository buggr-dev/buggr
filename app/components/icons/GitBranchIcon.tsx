import type { IconProps } from "./types";

/**
 * Git branch icon for branch lists and selection.
 * Uses stroke="currentColor" to inherit text color from parent.
 *
 * @param className - Tailwind classes for styling
 * @param ariaLabel - Accessibility label (optional)
 */
export function GitBranchIcon({ className = "h-5 w-5", ariaLabel }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18a2 2 0 100-4 2 2 0 000 4zm0 0V4m6 14a2 2 0 100-4 2 2 0 000 4zm0-4V8a2 2 0 012-2h2"
      />
    </svg>
  );
}
