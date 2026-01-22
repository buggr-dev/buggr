"use client";

import { Modal } from "@/app/components/Modal";
import { Button } from "@/app/components/inputs/Button";
import { Card } from "@/app/components/Card";
import {
  CheckIcon,
  TerminalIcon,
  SparklesIcon,
  ArrowRightIcon,
  TrophyIcon,
} from "@/app/components/icons";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
  onShowBranch: () => void;
}

interface StepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  code?: string;
}

function Step({ number, icon, title, description, code }: StepProps) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gh-accent/20 text-sm font-bold text-gh-accent">
        {number}
      </div>
      <div className="flex-1 pt-0.5">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h4 className="text-sm font-medium text-white">{title}</h4>
        </div>
        <p className="text-xs text-gh-text-muted">{description}</p>
        {code && (
          <code className="mt-2 block rounded bg-gh-canvas-subtle px-2 py-1.5 font-mono text-xs text-gh-accent">
            {code}
          </code>
        )}
      </div>
    </div>
  );
}

export function HowToPlayModal({
  isOpen,
  onClose,
  branchName,
  onShowBranch,
}: HowToPlayModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      showCloseButton={true}
      closeOnBackdrop={false}
    >
      <div className="p-5">
        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gh-success/30 to-green-600/20">
            <CheckIcon className="h-7 w-7 text-gh-success" />
          </div>
          <h2 className="text-lg font-bold text-white">Branch Created!</h2>
          <p className="mt-1 text-sm text-gh-text-muted">
            Ready to debug? Here&apos;s how to play:
          </p>
        </div>

        {/* Branch name */}
        <Card variant="inset" padded className="mb-5 p-3 text-center">
          <code className="font-mono text-sm text-gh-success">{branchName}</code>
        </Card>

        {/* Steps */}
        <div className="mb-5 space-y-4">
          <Step
            number={1}
            icon={<TerminalIcon className="h-4 w-4 text-blue-400" />}
            title="Clone & Start Timer"
            description="Pull the buggered branch and create a commit with 'start' in the message to begin timing."
            code='git commit --allow-empty -m "start"'
          />

          <Step
            number={2}
            icon={<span className="text-sm">🔍</span>}
            title="Find & Fix the Bugs"
            description="Review the code, identify the bugs, and make your fixes. No cheating with AI!"
          />

          <Step
            number={3}
            icon={<CheckIcon className="h-4 w-4 text-green-400" />}
            title="Stop the Timer"
            description="Commit your fixes with 'done', 'complete', 'end', or 'stop' in the message."
            code='git commit -m "done - fixed all bugs"'
          />

          <Step
            number={4}
            icon={<TrophyIcon className="h-4 w-4 text-yellow-400" />}
            title="Get Your Score"
            description="Push your changes, return here, select your branch, and click 'Check Score' to see your grade."
          />
        </div>

        {/* Tip */}
        <Card variant="default" padded className="mb-5 p-3">
          <div className="flex items-start gap-2">
            <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
            <p className="text-xs text-gh-text-muted">
              <span className="font-medium text-white">Pro tip:</span> After finishing, 
              click &quot;Analyze Code&quot; to get AI feedback on your fix quality — not just speed!
            </p>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Got it
          </Button>
          <Button variant="primary" onClick={onShowBranch} className="flex-1">
            <ArrowRightIcon className="h-4 w-4" />
            Show Branch
          </Button>
        </div>
      </div>
    </Modal>
  );
}
