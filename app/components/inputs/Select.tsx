"use client";

import { SelectHTMLAttributes } from "react";

interface SelectOption {
  /**
   * The value of the option.
   */
  value: string | number;
  /**
   * The display label for the option.
   */
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  /**
   * Array of options to render in the select.
   */
  options: SelectOption[];
  /**
   * Label text displayed above the select. If omitted, no label is rendered.
   */
  label?: string;
  /**
   * Placeholder text shown as the first disabled option.
   */
  placeholder?: string;
}

/**
 * A styled select input component with a label and custom dropdown chevron.
 * Uses the GitHub-inspired theme colors for consistent styling.
 *
 * @param options - Array of options with value and label
 * @param label - Label text displayed above the select
 * @param placeholder - Optional placeholder text for the default option
 * @param props - Standard select HTML attributes (value, onChange, disabled, etc.)
 */
export function Select({ options, label, placeholder, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-gh-text-muted">{label}</label>}
      <div className="relative">
        <select
          className="w-full appearance-none rounded-lg border border-gh-border bg-gh-canvas-subtle px-4 py-2.5 pr-10 text-sm text-white transition-colors focus:border-gh-success focus:outline-none focus:ring-1 focus:ring-gh-success disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-4 w-4 text-gh-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

