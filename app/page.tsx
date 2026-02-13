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
  DocumentIcon,
} from "./components/icons";

/** GitHub repository URL for "View on GitHub" buttons in website mode */
const GITHUB_REPO_URL = "https://github.com/buggr-dev/buggr";

/**
 * Landing/info page shown to unauthenticated users.
 * Middleware handles redirecting authenticated users to /dashboard.
 *
 * When WEBSITE_MODE env var is set, login buttons become "View on GitHub" links
 * since authentication only works when running locally.
 */
export default async function Home() {
  const isWebsiteMode = process.env.WEBSITE_MODE === "true";

  /** Renders either a "View on GitHub" link or a GitHub sign-in form */
  function AuthButton({ size = "default" }: { size?: "default" | "lg" }) {
    if (isWebsiteMode) {
      return (
        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="primary" size={size}>
            <GitHubIcon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
            View on GitHub
          </Button>
        </a>
      );
    }

    return (
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/dashboard" });
        }}
      >
        <Button type="submit" variant="primary" size={size}>
          <GitHubIcon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
          {size === "lg" ? "Start Playing" : "Log in with GitHub"}
        </Button>
      </form>
    );
  }

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
        <AuthButton />
      </FixedLoginButton>

      {/* Scroll-triggered Header */}
      <ScrollHeader>
        <AuthButton />
      </ScrollHeader>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        {/* Hero Section */}
        <section className="mb-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gh-border bg-gh-canvas-subtle px-4 py-1.5 text-sm text-gh-text-muted">
            <span className="text-lg">🎓</span>
            An educational debugging game for developers
          </div>
          <h2 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Can you actually{" "}
            <span className="text-gh-danger-fg underline decoration-wavy decoration-gh-danger decoration-4 underline-offset-4">
              debug
            </span>{" "}
            <br className="hidden md:block" />
            what AI{" "}
            <span className="text-gh-success-fg underline decoration-wavy decoration-gh-success decoration-4 underline-offset-4">
              writes
            </span>
            ?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gh-text-muted">
            AI generates code faster than ever — but when it breaks, someone has
            to fix it. Buggr is a game that teaches you to find and fix real bugs
            in real codebases, building the skill that matters most in the AI era.
          </p>
          <div className="mb-8 flex flex-wrap justify-center gap-3 text-sm text-gh-text-muted">
            <div className="flex items-center gap-2 rounded-full border border-gh-border bg-gh-canvas-subtle px-4 py-2">
              <span className="text-gh-accent">🧠</span>
              Learn by doing — fix real bugs, not toy exercises
            </div>
            <div className="flex items-center gap-2 rounded-full border border-gh-border bg-gh-canvas-subtle px-4 py-2">
              <span className="text-gh-danger-fg">!</span>
              No code-gen tools — prove it&apos;s really you
            </div>
          </div>
          <AuthButton size="lg" />
        </section>

        {/* The AI Era Problem */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <LightbulbIcon className="h-5 w-5 text-gh-success" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              The Most Important Skill in 2025
            </h3>
          </div>
          <div className="rounded-xl border border-gh-border bg-gradient-to-br from-gh-canvas-subtle to-gh-canvas p-8">
            <p className="mb-4 text-lg leading-relaxed text-gh-text-muted">
              Cursor, Copilot, ChatGPT — everyone ships faster now. But there&apos;s
              a growing gap between{" "}
              <span className="font-semibold text-white">
                generating code
              </span>{" "}
              and{" "}
              <span className="font-semibold text-white">
                understanding code.
              </span>
            </p>
            <p className="mb-4 text-lg leading-relaxed text-gh-text-muted">
              When AI-generated code breaks — and it will — the developer who can
              read a stack trace, trace the logic, and fix the root cause is{" "}
              <span className="font-semibold text-gh-success-fg">
                10x more valuable
              </span>{" "}
              than the one who just re-prompts until the errors disappear.
            </p>
            <p className="text-lg leading-relaxed text-gh-text-muted">
              <span className="font-semibold text-white">Buggr</span> is a game
              that builds that muscle. We inject realistic bugs into codebases and
              challenge you to find and fix them — under the clock, with no AI
              help.{" "}
              <span className="font-semibold text-gh-danger-fg">
                It&apos;s how you prove you really understand the code, not just the prompts.
              </span>
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <LightningIcon className="h-5 w-5 text-gh-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white">How It Works</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">🤖</span> AI-Injected Bugs
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                Our AI injects the kind of bugs real developers hit every day —
                off-by-one errors, null pointer issues, async/await mistakes, and
                subtle logic inversions.
              </p>
            </div>
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">📊</span> Three Difficulty Levels
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                Easy (1-2 bugs), Medium (2-3 bugs), or Hard (3-5 bugs). Start
                with easy to build confidence, then level up.
              </p>
            </div>
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">🔔</span> Realistic Bug Reports
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                You get vague user complaints like &quot;The posts are showing up
                blank&quot; — just like the real tickets you&apos;ll face on the
                job.
              </p>
            </div>
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">⏱️</span> Timed Challenges
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                Every run is timed. The faster you find and fix the bugs, the
                better your grade. Track your improvement over time.
              </p>
            </div>
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">📋</span> Share & Compare
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                Share bug reports with teammates and compare scores. Great for
                team challenges, study groups, or interviews.
              </p>
            </div>
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">🙅‍♂️</span> No Code-Gen Allowed
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                This is a human debugging challenge. Keep Copilot/Cursor code
                generation off — your score should reflect your real skills.
              </p>
            </div>
          </div>

          {/* Bug report screenshot */}
          <div className="group relative mt-8">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-gh-success/20 via-gh-accent/20 to-gh-danger/20 opacity-50 blur-lg transition-opacity group-hover:opacity-75" />
            <div className="relative overflow-hidden rounded-xl border border-gh-border bg-gh-canvas-inset">
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

        {/* Tutorial Integration Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <DocumentIcon className="h-5 w-5 text-gh-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              Connect Your Tutorials
            </h3>
          </div>
          <div className="rounded-xl border-2 border-gh-accent/40 bg-gradient-to-br from-gh-accent/5 via-gh-canvas-subtle to-gh-canvas p-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gh-accent/10 px-3 py-1 text-xs font-medium text-gh-accent">
              <SparklesIcon className="h-3.5 w-3.5" />
              Level up your learning
            </div>
            <h4 className="mb-4 text-xl font-bold text-white">
              Built a project from a tutorial? Prove you actually understand it.
            </h4>
            <p className="mb-4 text-lg leading-relaxed text-gh-text-muted">
              Following along with a tutorial is one thing — truly understanding
              the codebase is another. Connect any repo you&apos;ve built from a
              course, guide, or tutorial to Buggr and we&apos;ll inject bugs into
              it.
            </p>
            <p className="mb-6 text-lg leading-relaxed text-gh-text-muted">
              If you can find and fix bugs in code you&apos;ve written (or
              followed along to build), you{" "}
              <span className="font-semibold text-white">
                genuinely understand the architecture
              </span>
              . If you can&apos;t, you know exactly where to go back and learn
              more deeply.
            </p>

            {/* Use cases */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gh-border bg-gh-canvas p-4">
                <div className="mb-2 text-2xl">🎓</div>
                <h5 className="mb-1 text-sm font-semibold text-white">
                  Students &amp; Bootcampers
                </h5>
                <p className="text-xs leading-relaxed text-gh-text-muted">
                  Finished a course project? Bugger it and prove to yourself (or
                  your instructor) that you truly get it.
                </p>
              </div>
              <div className="rounded-lg border border-gh-border bg-gh-canvas p-4">
                <div className="mb-2 text-2xl">📚</div>
                <h5 className="mb-1 text-sm font-semibold text-white">
                  Tutorial Creators
                </h5>
                <p className="text-xs leading-relaxed text-gh-text-muted">
                  Add Buggr challenges to your tutorials. Give learners a way to
                  test their understanding after completing your content.
                </p>
              </div>
              <div className="rounded-lg border border-gh-border bg-gh-canvas p-4">
                <div className="mb-2 text-2xl">🏢</div>
                <h5 className="mb-1 text-sm font-semibold text-white">
                  Teams &amp; Hiring
                </h5>
                <p className="text-xs leading-relaxed text-gh-text-muted">
                  Onboard new hires by having them debug real project code.
                  Faster than take-home tests, more realistic than LeetCode.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started Steps */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <ClipboardCheckIcon className="h-5 w-5 text-gh-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white">Getting Started</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Connect",
                desc: "Sign in with GitHub — we securely clone your repo on the server",
              },
              {
                step: "2",
                title: "Select",
                desc: "Choose a repo, commit, and difficulty — we inject the bugs",
              },
              {
                step: "3",
                title: "Debug",
                desc: "Find and fix the bugs without code-gen tools — faster fixes = better scores",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border border-gh-border bg-gh-canvas-subtle p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gh-success font-mono text-lg font-bold text-white">
                  {item.step}
                </div>
                <h4 className="mb-2 text-lg font-semibold text-white">
                  {item.title}
                </h4>
                <p className="text-sm text-gh-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Select commit screenshot */}
          <div className="group relative mt-8">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-gh-accent/20 via-gh-success/20 to-gh-accent/20 opacity-50 blur-lg transition-opacity group-hover:opacity-75" />
            <div className="relative overflow-hidden rounded-xl border border-gh-border bg-gh-canvas-inset">
              <div className="flex items-center gap-3 border-b border-gh-border bg-gh-canvas-subtle px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-xs font-medium text-gh-text-muted">
                  Select a commit and configure difficulty
                </span>
              </div>
              <img
                src="/screenshots/screenshot-select-commit-to-stress-min.png"
                alt="Screenshot showing the commit selection interface with difficulty configuration"
                className="w-full"
              />
            </div>
          </div>

          {/* Stress Process Details */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col justify-center">
              <h4 className="mb-3 text-lg font-semibold text-white">
                The Process
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                When you 'bugger up some code', our AI analyzes your code,
                picks files to inject bugs into, creates a new branch, and gives
                you a bug report describing the symptoms.
              </p>
            </div>
            <div className="md:col-span-2">
              <StressProcessSteps />
            </div>
          </div>
        </section>

        {/* How to Play Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <TerminalIcon className="h-5 w-5 text-gh-success" />
            </div>
            <h3 className="text-2xl font-bold text-white">How to Play</h3>
          </div>
          <div className="rounded-xl border border-gh-border bg-gradient-to-br from-gh-canvas-subtle to-gh-canvas p-8">
            <p className="mb-6 text-lg leading-relaxed text-gh-text-muted">
              Once you&apos;ve created a buggered branch, here&apos;s how to
              debug it and earn your score:
            </p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gh-accent/20 font-bold text-gh-accent">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 font-semibold text-white">
                    Start the Timer
                  </h4>
                  <p className="mb-2 text-sm text-gh-text-muted">
                    Clone the buggered branch and create an empty commit with
                    &quot;start&quot; in the message:
                  </p>
                  <div className="rounded-lg bg-gh-canvas p-3">
                    <code className="text-sm text-gh-accent">
                      git commit --allow-empty -m &quot;start&quot;
                    </code>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gh-accent/20 font-bold text-gh-accent">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 font-semibold text-white">
                    Find &amp; Fix the Bugs
                  </h4>
                  <p className="text-sm text-gh-text-muted">
                    Review the code, read the bug report, trace the logic, and
                    make your fixes. No AI code generation tools!
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gh-accent/20 font-bold text-gh-accent">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 font-semibold text-white">
                    Stop the Timer
                  </h4>
                  <p className="mb-2 text-sm text-gh-text-muted">
                    Commit your fixes with &quot;done&quot; or &quot;end&quot; in
                    the message:
                  </p>
                  <div className="rounded-lg bg-gh-canvas p-3">
                    <code className="text-sm text-gh-accent">
                      git commit -m &quot;done - fixed all bugs&quot;
                    </code>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gh-accent/20 font-bold text-gh-accent">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 font-semibold text-white">
                    Get Your Score
                  </h4>
                  <p className="text-sm text-gh-text-muted">
                    Push your changes, return to Buggr, select your branch, and
                    click &quot;Check Score&quot; to see your grade.
                  </p>
                </div>
              </div>
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
              Your grade is based on how quickly you identify and fix the bugs.
              Track your improvement over time and see how you stack up.
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
                <div className="text-lg font-bold text-emerald-400">
                  B Grade
                </div>
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
                <div className="text-xs text-gh-text-muted">
                  Keep practicing
                </div>
              </div>
            </div>

            {/* Time Thresholds Table */}
            <div className="overflow-hidden rounded-lg border border-gh-border">
              <table className="w-full text-sm">
                <thead className="bg-gh-canvas-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gh-text-muted">
                      Difficulty
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-amber-300">
                      A
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-emerald-400">
                      B
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-blue-300">
                      C
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-slate-300">
                      D
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gh-border">
                  <tr className="bg-gh-canvas">
                    <td className="px-4 py-3 font-medium text-green-400">
                      🌱 Easy
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      0-5 min
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      5-10 min
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      10-15 min
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      15+ min
                    </td>
                  </tr>
                  <tr className="bg-gh-canvas-subtle">
                    <td className="px-4 py-3 font-medium text-yellow-400">
                      🔥 Medium
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      0-7 min
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      7-11 min
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      11-15 min
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      15+ min
                    </td>
                  </tr>
                  <tr className="bg-gh-canvas">
                    <td className="px-4 py-3 font-medium text-red-400">
                      💀 Hard
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      0-10 min
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      10-15 min
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      15-20 min
                    </td>
                    <td className="px-4 py-3 text-center text-gh-text-muted">
                      20+ min
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Scorecard screenshot */}
          <div className="group relative mt-8">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-blue-500/20 opacity-50 blur-lg transition-opacity group-hover:opacity-75" />
            <div className="relative overflow-hidden rounded-xl border border-gh-border bg-gh-canvas-inset">
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
            <h3 className="text-2xl font-bold text-white">
              Choose Your Codebase
            </h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gh-border-muted">
                <FolderIcon className="h-6 w-6 text-gh-text-muted" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-white">
                Your Own Repos
              </h4>
              <p className="mb-4 text-sm leading-relaxed text-gh-text-muted">
                Use any repository you have access to — including projects you&apos;ve
                built from tutorials, courses, or side projects. We clone and
                branch on the server.
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
              <h4 className="mb-2 text-lg font-semibold text-white">
                Practice Repos
              </h4>
              <p className="mb-4 text-sm leading-relaxed text-gh-text-muted">
                Fork one of our public repos designed for practice. No risk to
                your real code — perfect for getting started.
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
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gh-border bg-gh-canvas p-4">
                <h4 className="mb-2 font-semibold text-white">
                  Play on our server (recommended)
                </h4>
                <ul className="space-y-1 text-sm text-gh-text-muted">
                  <li>• Sign in with GitHub</li>
                  <li>• Pick a repo/commit and difficulty</li>
                  <li>• Debug in the browser — no local setup needed</li>
                  <li>• Keep code-gen tools off for an honest score</li>
                </ul>
              </div>
              <div className="rounded-lg border border-gh-border bg-gh-canvas p-4">
                <h4 className="mb-2 font-semibold text-white">
                  Self-host it (open source)
                </h4>
                <ul className="space-y-1 text-sm text-gh-text-muted">
                  <li>• Clone the repo and install dependencies</li>
                  <li>• Configure GitHub OAuth + your LLM provider</li>
                  <li>• Start the app locally</li>
                  <li>• Still keep code-gen tools off during challenges</li>
                </ul>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="mb-3 font-semibold text-white">
                Self-hosting? (optional)
              </h4>
              <p className="mb-3 text-sm text-gh-text-muted">
                Want to run Buggr on your own infra? Clone and boot locally:
              </p>
              <div className="mb-3">
                <h5 className="mb-2 text-sm font-semibold text-white">
                  What you need
                </h5>
                <ul className="space-y-2 text-sm text-gh-text-muted">
                  <li className="flex items-center gap-2">
                    <span className="text-gh-success-fg">✓</span> Node.js 18+
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-gh-success-fg">✓</span> A GitHub
                    account
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gh-success-fg">✓</span>
                    <span>
                      An LLM provider —{" "}
                      <span className="text-gh-accent">Anthropic</span>{" "}
                      (recommended), OpenAI, or a local LLM
                      <span className="block text-xs text-gh-text-muted/70">
                        Anthropic works best. Local LLMs need a beefy machine.
                      </span>
                    </span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-gh-canvas p-4">
                  <code className="text-sm text-gh-text-muted">
                    <span className="text-gh-text-muted">$</span>{" "}
                    <span className="text-gh-accent">git clone</span>{" "}
                    https://github.com/buggr-dev/buggr.git
                  </code>
                </div>
                <div className="rounded-lg bg-gh-canvas p-4">
                  <code className="text-sm text-gh-text-muted">
                    <span className="text-gh-text-muted">$</span>{" "}
                    <span className="text-gh-accent">cd</span> buggr &&{" "}
                    <span className="text-gh-accent">npm install</span>
                  </code>
                </div>
                <div className="rounded-lg bg-gh-canvas p-4">
                  <code className="text-sm text-gh-text-muted">
                    <span className="text-gh-text-muted">$</span>{" "}
                    <span className="text-gh-accent">npm run</span> dev
                  </code>
                </div>
              </div>
            </div>
            <p className="text-sm text-gh-text-muted">
              Check the{" "}
              <a
                href="https://github.com/buggr-dev/buggr#readme"
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
            <h3 className="mb-4 text-2xl font-bold text-white">
              Ready to prove you can actually code?
            </h3>
            <p className="mx-auto mb-6 max-w-lg text-gh-text-muted">
              Connect your GitHub, pick a codebase — your own project, a tutorial
              repo, or one of ours — and start debugging.
            </p>
            <AuthButton size="lg" />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-gh-border pt-8 text-center text-sm text-gh-text-muted">
          <p>
            Built for developers who want to get better at debugging in the AI
            era
          </p>
        </footer>
      </main>
    </div>
  );
}
