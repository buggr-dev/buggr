"use client";

import { useState, useEffect, ReactNode } from "react";
import { GitHubIcon } from "@/app/components/icons";

interface ScrollHeaderProps {
  /**
   * Content to render inside the header (typically a login form/button).
   */
  children: ReactNode;
}

/**
 * A fixed header that appears when the user scrolls down the page.
 * Hidden at the top of the page, slides in from the top on scroll.
 *
 * @param children - Content to render in the header (login button, etc.)
 */
export function ScrollHeader({ children }: ScrollHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show header after scrolling 100px
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-gh-border bg-gh-canvas/95 px-6 py-4 backdrop-blur-sm transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
          <GitHubIcon className="h-5 w-5 text-white" />
        </div>
        <h1 className="font-mono text-xl font-bold text-white">Buggr</h1>
      </div>
      {children}
    </header>
  );
}

