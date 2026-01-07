"use client";

import { Button } from "@/app/components/inputs/Button";
import { Card } from "@/app/components/Card";
import { LightningIcon, CloseIcon } from "@/app/components/icons";

interface StressResult {
  message: string;
  results: { file: string; success: boolean; changes?: string[] }[];
  symptoms?: string[];
}

interface StressResultCardProps {
  /**
   * The buggr result data.
   */
  result: StressResult;
  /**
   * The author's name to display.
   */
  authorName: string;
  /**
   * Callback when the card is dismissed.
   */
  onDismiss: () => void;
}

/**
 * A card displaying the results of a bugger operation.
 *
 * @param result - The buggr result data
 * @param authorName - Author name to show in the message
 * @param onDismiss - Callback to dismiss the card
 */
export function StressResultCard({ result, authorName, onDismiss }: StressResultCardProps) {
  return (
    <Card variant="danger">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 font-medium text-gh-danger-fg">
          <LightningIcon className="h-4 w-4" />
          {authorName}&apos;s commit is now buggered! 😈
        </h4>
        <Button variant="ghost" size="icon" onClick={onDismiss}>
          <CloseIcon className="h-4 w-4" />
        </Button>
      </div>
      <p className="mb-2 text-sm text-gh-danger-fg">{result.message}</p>
      <div className="space-y-2">
        {result.results
          .filter((r) => r.success)
          .map((fileResult) => (
            <div
              key={fileResult.file}
              className="rounded border border-gh-border bg-gh-canvas-subtle p-2 text-xs"
            >
              <div className="font-mono text-white">{fileResult.file}</div>
              {fileResult.changes && (
                <ul className="mt-1 list-inside list-disc text-gh-text-muted">
                  {fileResult.changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </div>
    </Card>
  );
}

