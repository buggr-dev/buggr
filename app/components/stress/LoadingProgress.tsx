"use client";

import { Card } from "@/app/components/Card";

export interface LoadingStep {
  label: string;
  icon?: string;
  timeEstimate?: string;
}

interface LoadingProgressProps {
  /**
   * Array of steps to display.
   */
  steps: LoadingStep[];
  /**
   * Current step number (1-indexed). 0 means not started.
   */
  currentStep: number;
  /**
   * Optional title text.
   */
  title?: string;
  /**
   * Optional subtitle text.
   */
  subtitle?: string;
}

/**
 * A multi-step loading progress indicator with animated steps.
 *
 * @param steps - Array of step objects with labels
 * @param currentStep - The current step number (1-indexed)
 * @param title - Optional title override
 * @param subtitle - Optional subtitle text
 */
export function LoadingProgress({ steps, currentStep, title, subtitle }: LoadingProgressProps) {
  const currentLabel = steps[currentStep - 1]?.label || "Preparing...";

  return (
    <Card variant="inset">
      {/* Progress header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gh-border border-t-gh-accent" />
        <div>
          <p className="text-sm font-medium text-white">{title || currentLabel}</p>
          <p className="text-xs text-gh-text-muted">{subtitle || "This may take a moment"}</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isComplete = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;

          return (
            <div key={step.label} className="flex items-center gap-3">
              {/* Step indicator */}
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isComplete
                    ? "bg-gh-success text-white"
                    : isCurrent
                      ? "animate-pulse bg-gh-accent text-white"
                      : "bg-gh-border text-gh-text-muted"
                }`}
              >
                {isComplete ? (
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>

              {/* Step label */}
              <span
                className={`flex-1 text-sm transition-colors ${
                  isComplete
                    ? "text-gh-success-fg"
                    : isCurrent
                      ? "font-medium text-white"
                      : "text-gh-text-muted"
                }`}
              >
                {step.label}
                {isCurrent && <span className="ml-1.5 inline-block animate-pulse">...</span>}
              </span>

              {/* Time estimate */}
              {step.timeEstimate && (
                <span className="text-xs text-gh-text-subtle">{step.timeEstimate}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gh-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gh-accent to-gh-accent/80 transition-all duration-500"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>
    </Card>
  );
}

