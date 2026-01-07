import { LOADING_STEPS } from "./loading-steps";
import { SearchIcon, CheckIcon, LightningIcon } from "@/app/components/icons";

/**
 * Returns the appropriate icon component for a loading step.
 */
function StepIcon({ icon }: { icon: string | undefined }) {
  const className = "h-4 w-4";

  switch (icon) {
    case undefined:
      return <div className="h-2 w-2 rounded-full bg-current" />;
    case "branch":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case "search":
      return <SearchIcon className={className} />;
    case "stress":
      return <LightningIcon className={className} />;
    case "commit":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "check":
      return <CheckIcon className={className} />;
    default:
      return <div className="h-2 w-2 rounded-full bg-current" />;
  }
}

/**
 * Displays the buggr process steps in a visual timeline format.
 * Used on the landing page to illustrate what happens during the buggering process.
 */
export function StressProcessSteps() {
  return (
    <div className="rounded-xl border border-gh-border bg-gh-canvas p-6">
      <div className="mb-4 text-center">
        <span className="text-xs font-medium uppercase tracking-wider text-gh-text-muted">
          Behind the scenes
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {LOADING_STEPS.map((step, index) => (
          <div
            key={step.label}
            className="group flex items-center gap-3"
          >
            {/* Step number and connector line */}
            <div className="relative flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gh-border bg-gh-canvas-subtle text-gh-text-muted transition-colors group-hover:border-gh-success group-hover:text-gh-success-fg">
                <StepIcon icon={step.icon} />
              </div>
              {index < LOADING_STEPS.length - 1 && (
                <div className="absolute top-8 h-6 w-px bg-gh-border" />
              )}
            </div>

            {/* Step content */}
            <div className="flex flex-1 items-center justify-between py-1">
              <span className="text-sm text-white">{step.label}</span>
              <span className="font-mono text-xs text-gh-text-muted">
                ~{step.timeEstimate}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-gh-border pt-4 text-center">
        <span className="text-xs text-gh-text-muted">
          Total time: <span className="font-mono text-gh-success-fg">~2-4 minutes</span>
        </span>
      </div>
    </div>
  );
}

