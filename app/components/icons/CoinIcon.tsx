import type { IconProps } from "./types";

/**
 * Coin icon for currency/credits display.
 * Uses fill="currentColor" to inherit text color from parent.
 *
 * @param className - Tailwind classes for styling
 * @param ariaLabel - Accessibility label (optional)
 */
export function CoinIcon({ className = "h-5 w-5", ariaLabel }: IconProps) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
    >
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <path d="M12.5 7h-1v2H10v1.5h1.5v3c0 1.1.9 2 2 2H15V14h-1.5c-.28 0-.5-.22-.5-.5v-3h2V9h-2V7z" />
    </svg>
  );
}
