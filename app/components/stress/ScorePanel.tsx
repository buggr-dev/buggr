"use client";

import { useEffect, useState, useRef } from "react";
import type { GitHubCommit, StressMetadata } from "@/lib/github";
import type { AnalysisFeedback, AnalyzeResponse } from "@/app/api/github/analyze/route";
import { Button } from "@/app/components/inputs/Button";
import { LoadingProgress, LoadingStep } from "@/app/components/stress/LoadingProgress";
import { CloseIcon, BuggrIcon, SparklesIcon, CheckIcon, InfoIcon, LightbulbIcon } from "@/app/components/icons";
import {
  calculateScoreRating,
  DIFFICULTY_CONFIG,
} from "@/lib/score-config";

/** Steps shown during code analysis */
const ANALYSIS_STEPS: LoadingStep[] = [
  { label: "Fetching commit changes", timeEstimate: "~2s" },
  { label: "Reading your code diff", timeEstimate: "~1s" },
  { label: "Checking for reasoning.txt", timeEstimate: "~1s" },
  { label: "AI analyzing your fix", timeEstimate: "~5s" },
  { label: "Generating feedback", timeEstimate: "~2s" },
];

interface ScorePanelProps {
  /** The commit where debugging started (contains "start" in message) */
  startCommit: GitHubCommit;
  /** The commit where debugging completed (contains "complete" in message) */
  completeCommit: GitHubCommit;
  /** The branch name being viewed */
  branchName: string;
  /** Callback to close the score panel */
  onClose: () => void;
  /** Optional buggr metadata from .buggr.json */
  stressMetadata?: StressMetadata | null;
}

/**
 * Formats a date string into a human-readable format.
 *
 * @param dateString - ISO date string to format
 * @returns Formatted date string (e.g., "Dec 17, 2025 at 2:30 PM")
 */
function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Calculates the time difference between start and complete commits.
 *
 * @param startCommit - The commit where debugging started
 * @param completeCommit - The commit where debugging completed
 * @returns Object with formatted string and raw milliseconds
 */
function calculateTimeDifference(
  startCommit: GitHubCommit,
  completeCommit: GitHubCommit
): { formatted: string; ms: number } {
  const startTime = new Date(startCommit.commit.author.date).getTime();
  const completeTime = new Date(completeCommit.commit.author.date).getTime();
  const diffMs = Math.abs(completeTime - startTime);

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  let formatted: string;
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return { formatted, ms: diffMs };
}

/** Props for the score card helper components */
interface ScoreCardProps {
  scoreRating: ReturnType<typeof calculateScoreRating>;
  timeDifference: string;
  bugCount: number;
  difficulty: { label: string; color: string } | null;
  repoFullName: string | null;
  isVisible: boolean;
}

/**
 * Renders a compact/slim version of the score card.
 * Used when analysis results are displayed to save vertical space.
 * 
 * @param props - Score card display properties
 * @returns JSX element for the slim score card
 */
function SlimScoreCard({
  scoreRating,
  timeDifference,
  bugCount,
  difficulty,
}: ScoreCardProps) {
  return (
    <div 
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${scoreRating.gradient} p-[2px] transition-all duration-500 ease-out`}
    >
      <div className="rounded-[10px] bg-gh-canvas-default px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Grade Badge */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${scoreRating.gradient}`}>
            <span className="text-2xl font-black text-white drop-shadow-lg">
              {scoreRating.grade}
            </span>
          </div>
          
          {/* Score Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{scoreRating.emoji}</span>
              <h2 className={`text-base font-bold ${scoreRating.textColor}`}>
                {scoreRating.label}
              </h2>
            </div>
            <p className="text-xs text-gh-text-muted truncate">{scoreRating.description}</p>
          </div>
          
          {/* Compact Stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="text-center px-2">
              <p className="font-bold text-white">{timeDifference}</p>
              <p className="text-gh-text-muted">Time</p>
            </div>
            <div className="w-px h-6 bg-gh-border" />
            <div className="text-center px-2">
              <p className="font-bold text-white">{bugCount}</p>
              <p className="text-gh-text-muted">{bugCount === 1 ? "Bug" : "Bugs"}</p>
            </div>
            <div className="w-px h-6 bg-gh-border" />
            <div className="text-center px-2">
              <p className={`font-bold ${difficulty?.color || "text-white"}`}>{difficulty?.label || "—"}</p>
              <p className="text-gh-text-muted">Level</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the full score card with all details and animations.
 * Used before analysis is triggered to show the complete score breakdown.
 * 
 * @param props - Score card display properties
 * @returns JSX element for the full score card
 */
function FullScoreCard({
  scoreRating,
  timeDifference,
  bugCount,
  difficulty,
  repoFullName,
  isVisible,
}: ScoreCardProps) {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${scoreRating.gradient} p-[2px] transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}
      style={{ transitionDelay: "100ms" }}
    >
      <div className="rounded-[14px] bg-gh-canvas-default p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BuggrIcon className="h-4 w-4 text-gh-success" />
            <span className="text-xs font-semibold tracking-wide text-white uppercase">Buggr</span>
          </div>
          {repoFullName && (
            <code className="font-mono text-xs text-white">{repoFullName}</code>
          )}
        </div>

        {/* Grade */}
        <div 
          className={`text-center mb-6 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "300ms" }}
        >
          <div className={`inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${scoreRating.gradient} mb-3 transition-transform duration-700 ease-out ${isVisible ? "scale-100 rotate-0" : "scale-50 -rotate-12"}`}
            style={{ transitionDelay: "400ms" }}
          >
            <span className="text-6xl font-black text-white drop-shadow-lg">
              {scoreRating.grade}
            </span>
          </div>
          <div 
            className={`flex items-center justify-center gap-2 mb-1 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            style={{ transitionDelay: "500ms" }}
          >
            <span className="text-2xl">{scoreRating.emoji}</span>
            <h2 className={`text-xl font-bold ${scoreRating.textColor}`}>
              {scoreRating.label}
            </h2>
          </div>
          <p 
            className={`text-sm text-white transition-all duration-500 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "600ms" }}
          >
            {scoreRating.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div 
            className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "650ms" }}
          >
            <p className="text-2xl font-bold text-white">{timeDifference}</p>
            <p className="text-xs text-gh-text-muted mt-1">Time</p>
          </div>
          <div 
            className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "750ms" }}
          >
            <p className="text-2xl font-bold text-white">{bugCount}</p>
            <p className="text-xs text-gh-text-muted mt-1">{bugCount === 1 ? "Bug" : "Bugs"}</p>
          </div>
          <div 
            className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "850ms" }}
          >
            <p className={`text-2xl font-bold ${difficulty?.color || "text-white"}`}>
              {difficulty?.label || "—"}
            </p>
            <p className="text-xs text-gh-text-muted mt-1">Level</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScorePanel({
  startCommit,
  completeCommit,
  branchName,
  onClose,
  stressMetadata,
}: ScorePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Ref to track step progression intervals
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger entrance animation on mount
  useEffect(() => {
    // Small delay to ensure the component is mounted before animating
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Cleanup step interval on unmount
  useEffect(() => {
    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, []);

  const { formatted: timeDifference, ms: timeMs } = calculateTimeDifference(
    startCommit,
    completeCommit
  );
  const difficulty = stressMetadata?.stressLevel
    ? DIFFICULTY_CONFIG[stressMetadata.stressLevel]
    : null;
  const repoFullName = stressMetadata
    ? `${stressMetadata.owner}/${stressMetadata.repo}`
    : null;
  const scoreRating = calculateScoreRating(
    stressMetadata?.stressLevel,
    timeMs
  );

  const bugCount = stressMetadata?.bugCount || 1;

  /**
   * Handles the analyze code action.
   * Fetches the complete commit's diff and analyzes it for common issues.
   * Shows step-by-step progress during the analysis.
   */
  const handleAnalyzeCode = async () => {
    if (!stressMetadata) {
      setAnalysisError("No stress metadata available for analysis");
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStep(1);
    
    // Progress through steps automatically
    // Steps 1-3 are quick (fetching/reading), step 4 (AI) takes longer
    const stepTimings = [1500, 1000, 800, 4000, 2000]; // ms per step
    let currentStep = 1;
    
    stepIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep <= ANALYSIS_STEPS.length) {
        setAnalysisStep(currentStep);
      }
    }, stepTimings[currentStep - 1] || 1500);

    try {
      const response = await fetch("/api/github/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: stressMetadata.owner,
          repo: stressMetadata.repo,
          sha: completeCommit.sha,
          stressMetadata,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze code");
      }

      const result: AnalyzeResponse = await response.json();
      
      // Complete all steps before showing result
      setAnalysisStep(ANALYSIS_STEPS.length);
      
      // Small delay to show completion before transitioning
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error analyzing code:", error);
      setAnalysisError("Failed to analyze code. Please try again.");
    } finally {
      // Clear the interval
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
      setAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  /**
   * Returns the appropriate icon for a feedback type.
   * 
   * @param type - The feedback type
   * @returns JSX element for the icon
   */
  const getFeedbackIcon = (type: AnalysisFeedback["type"]) => {
    switch (type) {
      case "success":
        return <CheckIcon className="h-4 w-4 text-green-400" />;
      case "warning":
        return <span className="text-sm">⚠️</span>;
      case "hint":
        return <LightbulbIcon className="h-4 w-4 text-yellow-400" />;
      case "tip":
        return <SparklesIcon className="h-4 w-4 text-purple-400" />;
      case "info":
      default:
        return <InfoIcon className="h-4 w-4 text-blue-400" />;
    }
  };

  /**
   * Returns the appropriate background color for a feedback type.
   * 
   * @param type - The feedback type
   * @returns Tailwind CSS class for background color
   */
  const getFeedbackBgColor = (type: AnalysisFeedback["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/30";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "hint":
        return "bg-amber-500/10 border-amber-500/30";
      case "tip":
        return "bg-purple-500/10 border-purple-500/30";
      case "info":
      default:
        return "bg-blue-500/10 border-blue-500/30";
    }
  };

  // Props for score card components
  const scoreCardProps: ScoreCardProps = {
    scoreRating,
    timeDifference,
    bugCount,
    difficulty,
    repoFullName,
    isVisible,
  };

  return (
    <div className={`flex h-full flex-col gap-4 overflow-y-auto pt-6 transition-all duration-500 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}>
      {/* Score Card - slim when analysis shown, full otherwise */}
      {analysisResult ? (
        <SlimScoreCard {...scoreCardProps} />
      ) : (
        <FullScoreCard {...scoreCardProps} />
      )}

      {/* Analyze Button or Loading Progress */}
      <div 
        className={`transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionDelay: "900ms" }}
      >
        {analyzing ? (
          <LoadingProgress
            steps={ANALYSIS_STEPS}
            currentStep={analysisStep}
            title="Analyzing your code"
            subtitle="AI is reviewing your fix..."
          />
        ) : !analysisResult ? (
          <Button 
            variant="primary" 
            className="w-full" 
            onClick={handleAnalyzeCode}
            disabled={!stressMetadata}
          >
            <SparklesIcon className="h-4 w-4" />
            Analyze Code
          </Button>
        ) : null}
      </div>

      {/* Analysis Results */}
      {analysisError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{analysisError}</p>
        </div>
      )}

      {analysisResult && (
        <div 
          className={`space-y-3 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h3 className="text-xs font-semibold tracking-wide text-gh-text-muted uppercase">Analysis</h3>
          
          {/* Summary */}
          <div className={`rounded-lg border p-3 ${analysisResult.isPerfect ? "border-green-500/30 bg-green-500/10" : "border-gh-border bg-gh-canvas-subtle"}`}>
            <p className={`text-sm font-medium ${analysisResult.isPerfect ? "text-green-400" : "text-white"}`}>
              {analysisResult.summary}
            </p>
          </div>

          {/* Feedback Items */}
          {analysisResult.feedback.length > 0 && (
            <div className="space-y-2">
              {analysisResult.feedback.map((item, index) => (
                <div 
                  key={index}
                  className={`rounded-lg border p-3 ${getFeedbackBgColor(item.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">
                      {getFeedbackIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-gh-text-muted mt-1">{item.message}</p>
                      {/* Show improvement suggestion for tips */}
                      {item.improvement && (
                        <div className="mt-2 rounded-md bg-gh-canvas-default/50 p-2">
                          <p className="text-xs font-medium text-purple-300 mb-1">💡 Better approach:</p>
                          <p className="text-xs text-gh-text-secondary">{item.improvement}</p>
                        </div>
                      )}
                      {item.file && (
                        <code className="mt-2 inline-block rounded bg-gh-canvas-default px-1.5 py-0.5 font-mono text-xs text-gh-accent">
                          {item.file}
                        </code>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline - Compact (only shown when no analysis) */}
      {!analysisResult && (
      <div 
        className={`space-y-3 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        style={{ transitionDelay: "1000ms" }}
      >
        <h3 className="text-xs font-semibold tracking-wide text-gh-text-muted uppercase">Timeline</h3>
        
        <div className="space-y-2">
          {/* Start */}
          <div 
            className={`flex items-center gap-3 rounded-lg border border-gh-border bg-gh-canvas-subtle p-3 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
            style={{ transitionDelay: "1100ms" }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
              <span className="text-sm">🚀</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {startCommit.commit.message.split("\n")[0]}
              </p>
              <p className="text-xs text-gh-text-muted">
                {formatFullDate(startCommit.commit.author.date)}
              </p>
            </div>
            <code className="shrink-0 rounded bg-gh-canvas-default px-2 py-0.5 font-mono text-xs text-gh-accent">
              {startCommit.sha.substring(0, 7)}
            </code>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <div 
              className={`w-0.5 bg-gh-border transition-all duration-300 ease-out ${isVisible ? "h-4" : "h-0"}`}
              style={{ transitionDelay: "1200ms" }}
            />
          </div>

          {/* Complete */}
          <div 
            className={`flex items-center gap-3 rounded-lg border border-gh-border bg-gh-canvas-subtle p-3 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
            style={{ transitionDelay: "1250ms" }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20">
              <span className="text-sm">✅</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {completeCommit.commit.message.split("\n")[0]}
              </p>
              <p className="text-xs text-gh-text-muted">
                {formatFullDate(completeCommit.commit.author.date)}
              </p>
            </div>
            <code className="shrink-0 rounded bg-gh-canvas-default px-2 py-0.5 font-mono text-xs text-gh-accent">
              {completeCommit.sha.substring(0, 7)}
            </code>
          </div>
        </div>
      </div>
      )}

      {/* Footer */}
      <div 
        className={`mt-auto pt-4 border-t border-gh-border transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionDelay: "1350ms" }}
      >
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <CloseIcon className="h-4 w-4" />
            Close
          </Button>
          <code className="font-mono text-xs text-gh-text-muted">{branchName}</code>
        </div>
      </div>
    </div>
  );
}

