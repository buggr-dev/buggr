import { signIn } from "@/auth";
import { Button } from "./components/inputs/Button";
import { ScrollHeader } from "./components/ScrollHeader";
import { FixedLoginButton } from "./components/FixedLoginButton";
import { PublicReposPreview } from "./components/repos/PublicReposPreview";
import { StressProcessSteps } from "./components/stress/StressProcessSteps";
import {
  GitHubIcon,
  LightningIcon,
  LightbulbIcon,
  ClipboardCheckIcon,
  TerminalIcon,
  FolderIcon,
  CopyIcon,
  CheckIcon,
  SparklesIcon,
  InfoIcon,
  TrophyIcon,
} from "./components/icons";

/** GitHub repository URL for "Pull from GitHub" buttons in website mode */
const GITHUB_REPO_URL = "https://github.com/brenoneill/stresst";

/**
 * Landing/info page shown to unauthenticated users.
 * Middleware handles redirecting authenticated users to /dashboard.
 * 
 * When WEBSITE_MODE env var is set, login buttons become "Pull from GitHub" links
 * since authentication only works when running locally.
 */
export default async function Home() {
  const isWebsiteMode = process.env.WEBSITE_MODE === "true";

  return (
    <div className="relative min-h-screen bg-gh-canvas">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gh-canvas-subtle via-gh-canvas to-[#010409]" />

      {/* Decorative grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Fixed Login Button - slides out when ScrollHeader appears */}
      <FixedLoginButton>
        {isWebsiteMode ? (
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="primary">
              <GitHubIcon className="h-4 w-4" />
              Pull from GitHub
            </Button>
          </a>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <Button type="submit" variant="primary">
              <GitHubIcon className="h-4 w-4" />
              Log in with GitHub
            </Button>
          </form>
        )}
      </FixedLoginButton>

      {/* Scroll-triggered Header */}
      <ScrollHeader>
        {isWebsiteMode ? (
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="primary">
              <GitHubIcon className="h-4 w-4" />
              Pull from GitHub
            </Button>
          </a>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <Button type="submit" variant="primary">
              <GitHubIcon className="h-4 w-4" />
              Log in with GitHub
            </Button>
          </form>
        )}
      </ScrollHeader>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        {/* Hero Section */}
        <section className="mb-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gh-border bg-gh-canvas-subtle px-4 py-1.5 text-sm text-gh-text-muted">
            <span className="text-lg">🔥</span>
            A debugging game for developers
          </div>
          <h2 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Are you a{" "}
            <span className="text-gh-danger-fg underline decoration-wavy decoration-gh-danger decoration-4 underline-offset-4">Vibe</span> Coder{" "}
            <br className="hidden md:block" />
            or a{" "}
            <span className="text-gh-success-fg underline decoration-wavy decoration-gh-success decoration-4 underline-offset-4">Jive</span> Coder?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gh-text-muted">
            We inject realistic bugs into any codebase. You find and fix them.
            The faster you finish, the better your score.
          </p>
          {isWebsiteMode ? (
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="primary" size="lg">
                <GitHubIcon className="h-5 w-5" />
                Pull from GitHub
              </Button>
            </a>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <Button type="submit" variant="primary" size="lg">
                <GitHubIcon className="h-5 w-5" />
                Get Started
              </Button>
            </form>
          )}
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <LightningIcon className="h-5 w-5 text-gh-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white">How It Works</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">🤖</span> AI-Generated Bugs
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                Our AI injects subtle bugs that real developers make — off-by-one errors, 
                null pointer issues, async/await mistakes, and logic inversions.
              </p>
            </div>
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">📊</span> Three Difficulty Levels
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                Easy (1-2 bugs), Medium (2-3 bugs), or Hard (3-5 bugs). 
                Start with easy to get a feel for it.
              </p>
            </div>
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">🔔</span> Realistic Bug Reports
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                You get vague user complaints like &quot;The posts are showing up blank&quot; or
                &quot;It crashes when I click that button&quot; — just like real life.
              </p>
            </div>
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">📋</span> Share With Others
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                Share bug reports with teammates and compare scores. 
                Great for team challenges or interviews.
              </p>
            </div>
          </div>

          {/* Bug report screenshot */}
          <div className="group relative mt-8">
            {/* Glow effect */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-gh-success/20 via-gh-accent/20 to-gh-danger/20 opacity-50 blur-lg transition-opacity group-hover:opacity-75" />
            
            <div className="relative overflow-hidden rounded-xl border border-gh-border bg-gh-canvas-inset">
              {/* Window header with dots */}
              <div className="flex items-center gap-3 border-b border-gh-border bg-gh-canvas-subtle px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-xs font-medium text-gh-text-muted">
                  Bug reports describe symptoms, not solutions
                </span>
              </div>
              <img
                src="/screenshots/screenshot-bug-report-showing-min.png"
                alt="Screenshot showing bug report notifications with realistic user complaints"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Why Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <LightbulbIcon className="h-5 w-5 text-gh-success" />
            </div>
            <h3 className="text-2xl font-bold text-white">Why stresst?</h3>
          </div>
          <div className="rounded-xl border border-gh-border bg-gradient-to-br from-gh-canvas-subtle to-gh-canvas p-8">
            <p className="mb-4 text-lg leading-relaxed text-gh-text-muted">
              AI writes code now. Cursor, Copilot, ChatGPT — everyone&apos;s shipping faster than ever.
              But{" "}
              <span className="font-semibold text-white">
                when it breaks, can you fix it?
              </span>
            </p>
            <p className="mb-4 text-lg leading-relaxed text-gh-text-muted">
              Or are you just re-prompting until the errors go away?
            </p>
            <p className="text-lg leading-relaxed text-gh-text-muted">
              <span className="font-semibold text-white">stresst</span> gives you practice debugging 
              real codebases with realistic bugs. It&apos;s a way to build actual debugging skills —{" "}
              <span className="font-semibold text-gh-danger-fg">
                skills you&apos;ll need when AI-generated code inevitably breaks.
              </span>
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <ClipboardCheckIcon className="h-5 w-5 text-gh-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white">Getting Started</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { step: "1", title: "Connect", desc: "Sign in with GitHub to access your repos" },
              { step: "2", title: "Select", desc: "Choose a repo, commit, and difficulty" },
              { step: "3", title: "Debug", desc: "Find and fix bugs — faster times = better scores" },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border border-gh-border bg-gh-canvas-subtle p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gh-success font-mono text-lg font-bold text-white">
                  {item.step}
                </div>
                <h4 className="mb-2 text-lg font-semibold text-white">{item.title}</h4>
                <p className="text-sm text-gh-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Select commit screenshot */}
          <div className="group relative mt-8">
            {/* Glow effect */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-gh-accent/20 via-gh-success/20 to-gh-accent/20 opacity-50 blur-lg transition-opacity group-hover:opacity-75" />
            
            <div className="relative overflow-hidden rounded-xl border border-gh-border bg-gh-canvas-inset">
              {/* Window header with dots */}
              <div className="flex items-center gap-3 border-b border-gh-border bg-gh-canvas-subtle px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-xs font-medium text-gh-text-muted">
                  Select a commit and configure stress level
                </span>
              </div>
              <img
                src="/screenshots/screenshot-select-commit-to-stress-min.png"
                alt="Screenshot showing the commit selection interface with stress level configuration"
                className="w-full"
              />
            </div>
          </div>

          {/* Stress Process Details */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col justify-center">
              <h4 className="mb-3 text-lg font-semibold text-white">The Process</h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                When you click &quot;Stress&quot;, our AI analyzes your code, 
                picks files to inject bugs into, creates a new branch, and gives you a bug 
                report describing the symptoms.
              </p>
            </div>
            <div className="md:col-span-2">
              <StressProcessSteps />
            </div>
          </div>
        </section>

        {/* Scoring Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <TrophyIcon className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">Scoring</h3>
          </div>
          <div className="rounded-xl border border-gh-border bg-gradient-to-br from-gh-canvas-subtle to-gh-canvas p-8">
            <p className="mb-6 text-lg leading-relaxed text-gh-text-muted">
              Fix the bugs, commit your changes, and come back to check your score.
              You&apos;re graded based on how long it took to fix everything.
            </p>

            {/* Grade Cards */}
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-400/10 to-yellow-500/10 p-4 text-center">
                <div className="mb-1 text-2xl">🌟</div>
                <div className="text-lg font-bold text-amber-300">A Grade</div>
                <div className="text-xs text-gh-text-muted">Outstanding</div>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 p-4 text-center">
                <div className="mb-1 text-2xl">🔥</div>
                <div className="text-lg font-bold text-emerald-400">B Grade</div>
                <div className="text-xs text-gh-text-muted">Great</div>
              </div>
              <div className="rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-400/10 to-cyan-500/10 p-4 text-center">
                <div className="mb-1 text-2xl">👍</div>
                <div className="text-lg font-bold text-blue-300">C Grade</div>
                <div className="text-xs text-gh-text-muted">Good</div>
              </div>
              <div className="rounded-lg border border-slate-500/30 bg-gradient-to-br from-slate-400/10 to-slate-500/10 p-4 text-center">
                <div className="mb-1 text-2xl">💪</div>
                <div className="text-lg font-bold text-slate-300">D Grade</div>
                <div className="text-xs text-gh-text-muted">Keep practicing</div>
              </div>
            </div>

            {/* Time Thresholds Table */}
            <div className="overflow-hidden rounded-lg border border-gh-border">
              <table className="w-full text-sm">
                <thead className="bg-gh-canvas-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gh-text-muted">Difficulty</th>
                    <th className="px-4 py-3 text-center font-medium text-amber-300">A</th>
                    <th className="px-4 py-3 text-center font-medium text-emerald-400">B</th>
                    <th className="px-4 py-3 text-center font-medium text-blue-300">C</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-300">D</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gh-border">
                  <tr className="bg-gh-canvas">
                    <td className="px-4 py-3 font-medium text-green-400">🌱 Easy</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">0-5 min</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">5-10 min</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">10-15 min</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">15+ min</td>
                  </tr>
                  <tr className="bg-gh-canvas-subtle">
                    <td className="px-4 py-3 font-medium text-yellow-400">🔥 Medium</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">0-7 min</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">7-11 min</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">11-15 min</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">15+ min</td>
                  </tr>
                  <tr className="bg-gh-canvas">
                    <td className="px-4 py-3 font-medium text-red-400">💀 Hard</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">0-10 min</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">10-15 min</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">15-20 min</td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">20+ min</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Scorecard screenshot */}
          <div className="group relative mt-8">
            {/* Glow effect */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-blue-500/20 opacity-50 blur-lg transition-opacity group-hover:opacity-75" />
            
            <div className="relative overflow-hidden rounded-xl border border-gh-border bg-gh-canvas-inset">
              {/* Window header with dots */}
              <div className="flex items-center gap-3 border-b border-gh-border bg-gh-canvas-subtle px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-xs font-medium text-gh-text-muted">
                  Check your score after fixing the bugs
                </span>
              </div>
              <img
                src="/screenshots/screenshot-scorecard.png"
                alt="Screenshot showing the scorecard with grade and time taken"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Choose Your Codebase Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <TerminalIcon className="h-5 w-5 text-gh-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white">Choose Your Codebase</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gh-border-muted">
                <FolderIcon className="h-6 w-6 text-gh-text-muted" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-white">Your Own Repos</h4>
              <p className="mb-4 text-sm leading-relaxed text-gh-text-muted">
                Use any repository you have access to. Test yourself on code you 
                work with every day.
              </p>
              <div className="flex items-center gap-2 text-xs text-gh-text-muted">
                <InfoIcon className="h-4 w-4" />
                Requires write access to create branches
              </div>
            </div>
            <div className="relative rounded-xl border-2 border-gh-success bg-gradient-to-br from-gh-success/10 to-gh-canvas-subtle p-6">
              <div className="absolute -top-3 right-4 rounded-full bg-gh-success px-3 py-1 text-xs font-semibold text-white">
                Recommended
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gh-success/20">
                <CopyIcon className="h-6 w-6 text-gh-success-fg" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-white">Practice Repos</h4>
              <p className="mb-4 text-sm leading-relaxed text-gh-text-muted">
                Fork one of our public repos designed for practice.
                No risk to your real code.
              </p>
              <div className="flex items-center gap-2 text-xs text-gh-success-fg">
                <CheckIcon className="h-4 w-4" />
                One-click fork after sign in
              </div>
            </div>
          </div>

          {/* Practice Repos Preview */}
          <div className="mt-8">
            <h4 className="mb-4 text-sm font-medium text-gh-text-muted">
              Available Practice Repositories
            </h4>
            <PublicReposPreview />
          </div>
        </section>

        {/* Quick Start Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <SparklesIcon className="h-5 w-5 text-gh-success" />
            </div>
            <h3 className="text-2xl font-bold text-white">Quick Start</h3>
          </div>
          <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
            <div className="mb-6">
              <h4 className="mb-3 font-semibold text-white">What You Need</h4>
              <ul className="space-y-2 text-sm text-gh-text-muted">
                <li className="flex items-center gap-2">
                  <span className="text-gh-success-fg">✓</span> Node.js 18+
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gh-success-fg">✓</span> A GitHub account
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gh-success-fg">✓</span>
                  <span>
                    An LLM provider — <span className="text-gh-accent">Anthropic</span> (recommended), OpenAI, or a local LLM
                    <span className="block text-xs text-gh-text-muted/70">
                      Anthropic works best. Local LLMs need a beefy machine.
                    </span>
                  </span>
                </li>
              </ul>
            </div>
            <div className="mb-6">
              <h4 className="mb-3 font-semibold text-white">Setup</h4>
              <div className="space-y-3">
                <div className="rounded-lg bg-gh-canvas p-4">
                  <code className="text-sm text-gh-text-muted">
                    <span className="text-gh-text-muted">$</span>{" "}
                    <span className="text-gh-accent">git clone</span> https://github.com/brenoneill/stresst.git
                  </code>
                </div>
                <div className="rounded-lg bg-gh-canvas p-4">
                  <code className="text-sm text-gh-text-muted">
                    <span className="text-gh-text-muted">$</span> <span className="text-gh-accent">cd</span>{" "}
                    stresst && <span className="text-gh-accent">npm install</span>
                  </code>
                </div>
                <div className="rounded-lg bg-gh-canvas p-4">
                  <code className="text-sm text-gh-text-muted">
                    <span className="text-gh-text-muted">$</span> <span className="text-gh-accent">npm run</span>{" "}
                    dev
                  </code>
                </div>
              </div>
            </div>
            <p className="text-sm text-gh-text-muted">
              Check the{" "}
              <a
                href="https://github.com/brenoneill/stresst#readme"
                className="text-gh-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                README
              </a>{" "}
              for full setup including GitHub OAuth and API keys.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <div className="rounded-xl border border-gh-border bg-gradient-to-r from-gh-danger/10 via-gh-canvas-subtle to-gh-success/10 p-10">
            <h3 className="mb-4 text-2xl font-bold text-white">Ready to find out?</h3>
            <p className="mx-auto mb-6 max-w-lg text-gh-text-muted">
              Connect your GitHub account and start debugging.
            </p>
            {isWebsiteMode ? (
              <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="primary" size="lg">
                  <GitHubIcon className="h-5 w-5" />
                  Pull from GitHub
                </Button>
              </a>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/dashboard" });
                }}
              >
                <Button type="submit" variant="primary" size="lg">
                  <GitHubIcon className="h-5 w-5" />
                  Start Stressing
                </Button>
              </form>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-gh-border pt-8 text-center text-sm text-gh-text-muted">
          <p>Built for developers who want to get better at debugging</p>
        </footer>
      </main>
    </div>
  );
}
