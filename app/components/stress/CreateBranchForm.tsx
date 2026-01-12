"use client";

import { Button } from "@/app/components/inputs/Button";
import { Card } from "@/app/components/Card";
import { Container } from "@/app/components/Container";
import { StressLevelSelector } from "./StressLevelSelector";
import { LoadingProgress, type LoadingStep } from "./LoadingProgress";
import { CloseIcon, LightningIcon } from "@/app/components/icons";

type StressLevel = "low" | "medium" | "high" | "custom";

interface CreateBranchFormProps {
  /**
   * The base branch name being buggered.
   */
  baseBranch: string;
  /**
   * The timestamp for the branch name.
   */
  timestamp: string;
  /**
   * Current branch suffix value.
   */
  branchSuffix: string;
  /**
   * Callback when branch suffix changes.
   */
  onBranchSuffixChange: (value: string) => void;
  /**
   * Current stress context value.
   */
  stressContext: string;
  /**
   * Callback when stress context changes.
   */
  onStressContextChange: (value: string) => void;
  /**
   * Current stress level.
   */
  stressLevel: StressLevel;
  /**
   * Callback when stress level changes.
   */
  onStressLevelChange: (level: StressLevel) => void;
  /**
   * Custom number of files to stress (only used when stressLevel is "custom").
   */
  customFilesCount?: number;
  /**
   * Callback when custom files count changes.
   */
  onCustomFilesCountChange?: (count: number) => void;
  /**
   * Custom total number of bugs to introduce (only used when stressLevel is "custom").
   */
  customBugCount?: number;
  /**
   * Callback when custom bug count changes.
   */
  onCustomBugCountChange?: (count: number) => void;
  /**
   * Maximum number of files available to stress.
   */
  maxFilesAvailable?: number;
  /**
   * User's current coin balance.
   */
  userCoins?: number;
  /**
   * Whether the form is currently submitting.
   */
  isLoading: boolean;
  /**
   * Current loading step (1-indexed).
   */
  loadingStep: number;
  /**
   * Array of loading steps to display.
   */
  loadingSteps: LoadingStep[];
  /**
   * Callback when form is submitted.
   */
  onSubmit: (e: React.FormEvent) => void;
  /**
   * Callback when form is cancelled.
   */
  onCancel: () => void;
}

/**
 * Returns the full branch name with prefix, timestamp, and optional suffix.
 */
function getFullBranchName(baseBranch: string, timestamp: string, suffix: string): string {
  const base = `buggr-${baseBranch}-${timestamp}`;
  return suffix.trim() ? `${base}-${suffix.trim()}` : base;
}

/**
 * Form component for creating a buggered branch.
 *
 * @param props - Form configuration and callbacks
 */
export function CreateBranchForm({
  baseBranch,
  timestamp,
  branchSuffix,
  onBranchSuffixChange,
  stressContext,
  onStressContextChange,
  stressLevel,
  onStressLevelChange,
  customFilesCount = 1,
  onCustomFilesCountChange,
  customBugCount = 1,
  onCustomBugCountChange,
  maxFilesAvailable = 1,
  userCoins,
  isLoading,
  loadingStep,
  loadingSteps,
  onSubmit,
  onCancel,
}: CreateBranchFormProps) {
  const fullBranchName = getFullBranchName(baseBranch, timestamp, branchSuffix);

  return (
    <Card as="form" onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">
          Create buggered branch from this commit
        </label>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <CloseIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Branch name input */}
      <div className="flex items-center rounded-lg border border-gh-border bg-gh-canvas">
        <span className="whitespace-nowrap border-r border-gh-border bg-gh-canvas-subtle px-3 py-2 font-mono text-sm text-gh-text-muted">
          buggr-{baseBranch}-{timestamp}-
        </span>
        <input
          type="text"
          value={branchSuffix}
          onChange={(e) => onBranchSuffixChange(e.target.value.replace(/\s/g, "-"))}
          placeholder="optional-suffix"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-gh-text-muted focus:outline-none"
          disabled={isLoading}
        />
      </div>

      <p className="text-xs text-gh-text-muted">
        Full branch name: <code className="text-gh-accent">{fullBranchName}</code>
      </p>

      {/* Stress level selector */}
      <StressLevelSelector
        value={stressLevel}
        onChange={onStressLevelChange}
        disabled={isLoading}
        userCoins={userCoins}
      />

      {/* Custom stress settings */}
      {stressLevel === "custom" && (
        <Container className="flex flex-col gap-3 p-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gh-text-muted">
              Number of files to bugger
            </label>
            <input
              type="number"
              min="1"
              max={maxFilesAvailable}
              value={customFilesCount}
              onChange={(e) => {
                const value = Math.max(1, Math.min(maxFilesAvailable, parseInt(e.target.value) || 1));
                onCustomFilesCountChange?.(value);
              }}
              className="w-full rounded-lg border border-gh-border bg-gh-canvas px-3 py-2 text-sm text-white focus:border-gh-accent focus:outline-none focus:ring-1 focus:ring-gh-accent"
              disabled={isLoading}
            />
            <p className="text-xs text-gh-text-subtle">
              Max {maxFilesAvailable} file{maxFilesAvailable !== 1 ? "s" : ""} available
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gh-text-muted">
              Total number of bugs (across all files)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={customBugCount}
              onChange={(e) => {
                const value = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                onCustomBugCountChange?.(value);
              }}
              className="w-full rounded-lg border border-gh-border bg-gh-canvas px-3 py-2 text-sm text-white focus:border-gh-accent focus:outline-none focus:ring-1 focus:ring-gh-accent"
              disabled={isLoading}
            />
            <p className="text-xs text-gh-text-subtle">
              Total bugs distributed across all selected files
            </p>
          </div>
        </Container>
      )}

      {/* Optional stress context */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gh-text-muted">
          Focus area <span className="text-gh-text-subtle">(optional)</span>
        </label>
        <div className="relative">
          <textarea
            value={stressContext}
            onChange={(e) => onStressContextChange(e.target.value.slice(0, 200))}
            placeholder="e.g., Test their understanding of async/await, null handling, or array bounds..."
            className="w-full resize-none rounded-lg border border-gh-border bg-gh-canvas px-3 py-2 text-sm text-white placeholder-gh-text-subtle focus:border-gh-danger focus:outline-none focus:ring-1 focus:ring-gh-danger"
            rows={2}
            maxLength={200}
            disabled={isLoading}
          />
          <span className="absolute bottom-2 right-2 text-xs text-gh-text-subtle">
            {stressContext.length}/200
          </span>
        </div>
      </div>

      {/* Submit button or Loading progress */}
      {isLoading ? (
        <LoadingProgress steps={loadingSteps} currentStep={loadingStep} />
      ) : (
        <Button type="submit" variant="danger" size="lg" fullWidth>
          <LightningIcon className="h-4 w-4" />
          Create & Bugger
        </Button>
      )}
    </Card>
  );
}

