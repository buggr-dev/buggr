"use client";

import { Button } from "@/app/components/inputs/Button";
import { Card } from "@/app/components/Card";
import { CheckIcon, CloseIcon, ArrowRightIcon } from "@/app/components/icons";

interface BranchSuccessCardProps {
  /**
   * The name of the successfully created branch.
   */
  branchName: string;
  /**
   * Callback when the card is dismissed.
   */
  onDismiss: () => void;
  /**
   * Callback when "Show Buggered Branch" is clicked.
   */
  onShowBranch: () => void;
}

/**
 * A success card displayed after a branch is created.
 *
 * @param branchName - Name of the created branch
 * @param onDismiss - Callback to dismiss the card
 * @param onShowBranch - Callback to navigate to the branch
 */
export function BranchSuccessCard({ branchName, onDismiss, onShowBranch }: BranchSuccessCardProps) {
  return (
    <Card variant="success">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gh-success-fg">
          <CheckIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Branch created successfully!</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onDismiss}>
          <CloseIcon className="h-4 w-4" />
        </Button>
      </div>
      <p className="mb-3 text-xs text-gh-text-muted">
        <code className="rounded bg-gh-border px-1.5 py-0.5 font-mono text-gh-success-fg">
          {branchName}
        </code>
      </p>
      <Button variant="primary" fullWidth onClick={onShowBranch}>
        <ArrowRightIcon className="h-4 w-4" />
        Show Buggered Branch
      </Button>
    </Card>
  );
}

