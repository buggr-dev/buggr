"use client";

interface PublicRepo {
  name: string;
  description: string;
  stars: number;
  language: string;
}

interface PublicReposListProps {
  /** Optional callback when a repo is selected for forking */
  onFork?: (repoName: string) => void;
}

// Placeholder public repos - can be replaced with real data later
const PUBLIC_REPOS: PublicRepo[] = [
  { name: "stresst/demo-api", description: "REST API with auth bugs", stars: 128, language: "TypeScript" },
  { name: "stresst/react-starter", description: "React app with state issues", stars: 256, language: "JavaScript" },
  { name: "stresst/python-service", description: "Flask service with edge cases", stars: 89, language: "Python" },
];

/**
 * Returns the appropriate Tailwind color class for a programming language.
 *
 * @param language - The programming language name
 * @returns Tailwind background color class
 */
function getLanguageColor(language: string): string {
  switch (language) {
    case "TypeScript":
      return "bg-blue-400";
    case "JavaScript":
      return "bg-yellow-400";
    case "Python":
      return "bg-green-400";
    default:
      return "bg-gray-400";
  }
}

/**
 * Displays a list of public repositories available for forking.
 * Shows repo name, description, language, and star count.
 *
 * @param onFork - Optional callback triggered when a repo is clicked
 */
export function PublicReposList({ onFork }: PublicReposListProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gh-border" />
        <span className="text-xs font-medium text-gh-text-muted">or fork one of our public repos</span>
        <div className="h-px flex-1 bg-gh-border" />
      </div>

      <div className="flex flex-col gap-2">
        {PUBLIC_REPOS.map((repo) => (
          <button
            key={repo.name}
            className="group flex items-center justify-between rounded-lg border border-gh-border bg-gh-canvas-subtle px-4 py-3 text-left transition-all hover:border-gh-accent hover:bg-gh-canvas-subtle/80"
            onClick={() => {
              // TODO: Implement fork functionality
              if (onFork) {
                onFork(repo.name);
              } else {
                console.log("Fork repo:", repo.name);
              }
            }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-sm font-medium text-white group-hover:text-gh-accent">
                {repo.name}
              </span>
              <span className="text-xs text-gh-text-muted">{repo.description}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-gh-text-muted">
                <span className={`h-2.5 w-2.5 rounded-full ${getLanguageColor(repo.language)}`} />
                {repo.language}
              </div>
              <div className="flex items-center gap-1 text-xs text-gh-text-muted">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {repo.stars}
              </div>
              <svg
                className="h-4 w-4 text-gh-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-gh-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

