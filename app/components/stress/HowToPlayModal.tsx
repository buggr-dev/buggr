"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/app/components/Modal";
import { Button } from "@/app/components/inputs/Button";
import { Card } from "@/app/components/Card";
import {
  CheckIcon,
  TerminalIcon,
  SparklesIcon,
  TrophyIcon,
} from "@/app/components/icons";

const LOCALSTORAGE_KEY = "buggr-how-to-play-dismissed";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function useHowToPlayDismissed() {
  const [isDismissed, setIsDismissed] = useState(true); // Default true to prevent flash

  useEffect(() => {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    setIsDismissed(stored === "true");
  }, []);

  return isDismissed;
}

export function HowToPlayModal({
  isOpen,
  onClose,
}: HowToPlayModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(LOCALSTORAGE_KEY, "true");
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-lg"
      showCloseButton={true}
      closeOnBackdrop={false}
    >
      <div className="p-5">
        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gh-danger/30 to-red-600/20">
            <span className="text-3xl">🐛</span>
          </div>
          <h2 className="text-lg font-bold text-white">How to Play</h2>
          <p className="mt-1 text-sm text-gh-text-muted">
            Here&apos;s how to debug and get your score:
          </p>
        </div>

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

        {/* Don't show again checkbox */}
        <label className="mb-4 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="h-4 w-4 rounded border-gh-border bg-gh-canvas-subtle text-gh-accent focus:ring-gh-accent focus:ring-offset-0"
          />
          <span className="text-sm text-gh-text-muted">Don&apos;t show this again</span>
        </label>

        {/* Actions */}
        <Button variant="primary" onClick={handleClose} fullWidth>
          Got it
        </Button>
      </div>
    </Modal>
  );
}
