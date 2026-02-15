"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Modal } from "@/app/components/Modal";
import { CoinIcon } from "@/app/components/icons";

interface InvitePromptModalProps {
  /** Whether the user has sent any invites */
  hasInvites: boolean;
  /** Whether the data is still loading */
  isLoading: boolean;
}

const STORAGE_KEY = "buggr-invite-prompt-dismissed";

/**
 * Modal that prompts users to invite friends to earn coins.
 * Only shows if:
 * - User hasn't sent any invites
 * - User hasn't dismissed the modal before
 * - Data has finished loading
 *
 * @param hasInvites - Whether the user has already sent invites
 * @param isLoading - Whether invitation data is still loading
 */
export function InvitePromptModal({ hasInvites, isLoading }: InvitePromptModalProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  // Calculate if modal should be open
  const isOpen = !isLoading && !hasInvites && !isDismissed;

  /**
   * Handles dismissing the modal and persisting the preference.
   */
  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsDismissed(true);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss}>
      <div className="p-6 text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 ring-1 ring-amber-500/30">
          <CoinIcon className="h-8 w-8 text-amber-400" />
        </div>

        {/* Heading */}
        <h2 className="mb-2 text-xl font-bold text-white">
          Earn 30 Free Coins! 🎁
        </h2>

        {/* Description */}
        <p className="mb-6 text-sm text-gh-text-muted">
          Invite your friends to Buggr and get{" "}
          <span className="font-semibold text-amber-400">50 coins</span> for your first invite.
          Plus, earn{" "}
          <span className="font-semibold text-amber-400">30 more coins</span> for each friend who signs up!
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/profile"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-3 text-sm font-semibold text-black transition-all hover:from-amber-400 hover:to-yellow-400 hover:shadow-lg hover:shadow-amber-500/25"
          >
            <CoinIcon className="h-4 w-4" />
            Invite Friends Now
          </Link>

          <button
            onClick={handleDismiss}
            className="text-sm text-gh-text-muted transition-colors hover:text-white"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
}
