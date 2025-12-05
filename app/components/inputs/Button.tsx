"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "danger" | "secondary" | "ghost";
type ButtonSize = "sm" | "default" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The content to render inside the button.
   */
  children: ReactNode;
  /**
   * The visual style variant of the button.
   * @default "primary"
   */
  variant?: ButtonVariant;
  /**
   * The size of the button.
   * @default "default"
   */
  size?: ButtonSize;
  /**
   * Whether the button should take full width of its container.
   * @default false
   */
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gh-success text-white hover:bg-gh-success-emphasis border border-gh-success",
  danger:
    "bg-gh-danger text-white hover:bg-gh-danger-emphasis border border-gh-danger",
  secondary:
    "bg-gh-border-muted text-white hover:bg-gh-border border border-gh-border",
  ghost:
    "text-gh-text-muted hover:text-white bg-transparent border-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-2 py-1 text-xs rounded",
  default: "px-4 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-sm rounded-lg",
  icon: "p-1 rounded",
};

/**
 * A styled button component with multiple variants and sizes.
 * Uses the GitHub-inspired theme colors for consistent styling.
 *
 * @param children - Content to render inside the button
 * @param variant - Visual style variant (primary, danger, secondary, ghost)
 * @param size - Size of the button (sm, default, lg, icon)
 * @param fullWidth - Whether button takes full container width
 * @param props - Standard button HTML attributes
 */
export function Button({
  children,
  variant = "primary",
  size = "default",
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium transition-colors
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
      `.trim().replace(/\s+/g, " ")}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

