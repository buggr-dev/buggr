"use client";

import { useState, useEffect, ReactNode } from "react";

interface FixedLoginButtonProps {
  /**
   * Content to render (typically a login form/button).
   */
  children: ReactNode;
}

/**
 * A fixed login button that appears in the top right corner.
 * Slides out when user scrolls down (when ScrollHeader appears).
 * Slides back in when user scrolls back to top.
 *
 * @param children - Content to render (login button, etc.)
 */
export function FixedLoginButton({ children }: FixedLoginButtonProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Hide button after scrolling 100px (when ScrollHeader appears)
      setIsVisible(window.scrollY <= 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed right-6 top-6 z-40 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

