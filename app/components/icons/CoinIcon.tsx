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
      viewBox="0 0 24 24"
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
    >
      {/* Coin background */}
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
      {/* Coin outline */}
      <path 
        fill="currentColor" 
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" 
      />
      {/* Buggr logo inside - scaled bracket-bug */}
      <g 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      >
        {/* Top bracket */}
        <path d="M9 8 L12 10.5 L15 8" />
        <path d="M9 8 L12 5.5 L15 8" />
        {/* Bottom bracket */}
        <path d="M8 14 L12 18 L16 14" />
        <path d="M8 14 L12 10 L16 14" />
      </g>
    </svg>
  );
}
