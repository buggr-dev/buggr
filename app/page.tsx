import { signIn } from "@/auth";
import { Button } from "./components/inputs/Button";
import { ScrollHeader } from "./components/ScrollHeader";
import { FixedLoginButton } from "./components/FixedLoginButton";
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
            Insurance against vibe coding
          </div>
          <h2 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Are you a{" "}
            <span className="text-gh-danger-fg underline decoration-wavy decoration-gh-danger decoration-4 underline-offset-4">Vibe</span> Coder{" "}
            <br className="hidden md:block" />
            or a{" "}
            <span className="text-gh-success-fg underline decoration-wavy decoration-gh-success decoration-4 underline-offset-4">Jive</span> Coder?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gh-text-muted">
            AI can write code, but can you debug it? stresst introduces realistic bugs into real
            codebases to test if developers truly understand what they&apos;re shipping.
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

        {/* What It Is Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <LightningIcon className="h-5 w-5 text-gh-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white">What is stresst?</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">🤖</span> AI-Powered Bug Generation
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                Uses Claude AI to introduce subtle, realistic bugs that developers actually make — off-by-one
                errors, null pointer issues, async/await mistakes, logic inversions, and more.
              </p>
            </div>
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">📊</span> Configurable Difficulty
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                Choose your stress level: Low (1-2 bugs), Medium (2-3 bugs), or High (3-5 devious bugs).
                Optionally focus on specific areas like async/await or null handling.
              </p>
            </div>
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">🔔</span> Realistic Bug Reports
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                Receive user-friendly symptom descriptions like &quot;The posts are showing up blank&quot; or
                &quot;The app crashes when I select an item&quot; — just like real production issues.
              </p>
            </div>
            <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-xl">📋</span> Share & Collaborate
              </h4>
              <p className="text-sm leading-relaxed text-gh-text-muted">
                Copy bug reports to share with colleagues via email or Slack. Perfect for team training
                sessions, code reviews, or interview scenarios.
              </p>
            </div>
          </div>
        </section>

        {/* Why Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <LightbulbIcon className="h-5 w-5 text-gh-success" />
            </div>
            <h3 className="text-2xl font-bold text-white">Why I Built This</h3>
          </div>
          <div className="rounded-xl border border-gh-border bg-gradient-to-br from-gh-canvas-subtle to-gh-canvas p-8">
            <p className="mb-4 text-lg leading-relaxed text-gh-text-muted">
              AI code generation is everywhere — Cursor, Copilot, ChatGPT. Developers are shipping code faster
              than ever. But here&apos;s the uncomfortable question:{" "}
              <span className="font-semibold text-white">
                do they actually understand what they&apos;re shipping?
              </span>
            </p>
            <p className="mb-4 text-lg leading-relaxed text-gh-text-muted">
              When AI-generated code breaks (and it will), can your team debug it? Or are they just prompting
              until the errors go away?
            </p>
            <p className="text-lg leading-relaxed text-gh-text-muted">
              <span className="font-semibold text-white">stresst</span> provides a challenging and engaging way
              for developers to learn how to fix bugs and diagnose code. It&apos;s essential for anyone using
              code-gen tools — because when things go wrong,{" "}
              <span className="font-semibold text-gh-danger-fg">
                it&apos;s imperative to be able to get things back on track.
              </span>
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <ClipboardCheckIcon className="h-5 w-5 text-gh-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white">How It Works</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { step: "1", title: "Connect", desc: "Sign in with GitHub to access your repositories" },
              { step: "2", title: "Select", desc: "Choose a repo, branch, and commit to stress" },
              { step: "3", title: "Stress", desc: "AI introduces realistic bugs — share & debug!" },
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
              <h4 className="mb-2 text-lg font-semibold text-white">Your Own Codebase</h4>
              <p className="mb-4 text-sm leading-relaxed text-gh-text-muted">
                Use any repository you have access to. Great for testing your team&apos;s familiarity with
                your actual production code.
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
              <h4 className="mb-2 text-lg font-semibold text-white">Our Practice Codebases</h4>
              <p className="mb-4 text-sm leading-relaxed text-gh-text-muted">
                Fork one of our public &quot;dummy&quot; repositories designed specifically for practice.
                No risk to your real code, and they&apos;re structured to be great learning material.
              </p>
              <div className="flex items-center gap-2 text-xs text-gh-success-fg">
                <CheckIcon className="h-4 w-4" />
                One-click fork available after sign in
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle">
              <SparklesIcon className="h-5 w-5 text-gh-success" />
            </div>
            <h3 className="text-2xl font-bold text-white">Getting Started</h3>
          </div>
          <div className="rounded-xl border border-gh-border bg-gh-canvas-subtle p-6">
            <div className="mb-6">
              <h4 className="mb-3 font-semibold text-white">Prerequisites</h4>
              <ul className="space-y-2 text-sm text-gh-text-muted">
                <li className="flex items-center gap-2">
                  <span className="text-gh-success-fg">✓</span> Node.js 18+
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gh-success-fg">✓</span> A GitHub account
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gh-success-fg">✓</span> An Anthropic API key
                </li>
              </ul>
            </div>
            <div className="mb-6">
              <h4 className="mb-3 font-semibold text-white">Quick Setup</h4>
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
              See the{" "}
              <a
                href="https://github.com/brenoneill/stresst#readme"
                className="text-gh-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                README
              </a>{" "}
              for full environment setup including GitHub OAuth and Anthropic API configuration.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <div className="rounded-xl border border-gh-border bg-gradient-to-r from-gh-danger/10 via-gh-canvas-subtle to-gh-success/10 p-10">
            <h3 className="mb-4 text-2xl font-bold text-white">Ready to stress test your skills?</h3>
            <p className="mx-auto mb-6 max-w-lg text-gh-text-muted">
              Connect your GitHub account and start building real debugging muscle today.
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
          <p>Built with ❤️ for developer education</p>
        </footer>
      </main>
    </div>
  );
}
