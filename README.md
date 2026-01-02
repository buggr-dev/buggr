# 🔥 stresst

**Insurance against vibe coding**

AI code generation is everywhere. Cursor, Copilot, ChatGPT — developers are shipping code faster than ever. But here's the uncomfortable question: **do they actually understand what they're shipping?**

When the AI-generated code breaks (and it will), can your team debug it? Or are they just prompting until the errors go away?

**stresst** is a training tool that stress-tests developer comprehension. It uses AI to introduce realistic, subtle bugs into real codebases — the kind of bugs that require *actual understanding* to find and fix. No amount of "please fix" prompts will help.

### Why stresst?

- 🛡️ **Verify comprehension** — Ensure developers understand the code they're shipping, not just generating
- 🔍 **Build debugging muscle** — AI can write code, but debugging is still a human skill
- 🎯 **Identify skill gaps** — Find out who can navigate a codebase and who's just along for the ride
- 🎮 **Gamified training** — Make learning fun with configurable difficulty levels
- 📋 **Interview tool** — Test candidates with real debugging scenarios, not leetcode

## How It Works

1. **Connect your GitHub account** — stresst uses OAuth to access your repositories
2. **Select a repository and branch** — choose the code you want to stress
3. **Pick a commit** — select which files to introduce bugs into
4. **Configure stress level** — Low (1-2 bugs), Medium (2-3 bugs), or High (3-5 bugs)
5. **Create stressed branch** — AI analyzes your code and introduces realistic bugs
6. **Share with your team** — send the bug report to a colleague to debug

## Features

### 🤖 AI-Powered Bug Generation
Uses Claude AI to introduce subtle, realistic bugs that developers actually make:
- Off-by-one errors
- Null pointer issues
- Async/await mistakes
- Logic inversions
- Missing error handling
- And many more...

### 📊 Configurable Stress Levels
- **🌱 Low** — 1-2 straightforward bugs, easier to spot
- **🔥 Medium** — 2-3 subtle bugs, requires careful review
- **💀 High** — 3-5 devious bugs, may include spaghetti code

### 🎯 Focus Areas
Optionally specify what you want to test (e.g., "async/await", "null handling", "array bounds")

### 🔔 Bug Reports
Automatic notifications with user-friendly symptom descriptions:
- "The posts are showing up blank"
- "The app crashes when I select an item"
- "Some users' names are showing as 'undefined'"

### 📋 Easy Sharing
Copy bug reports to clipboard to share with colleagues via email or Slack

### 🗑️ Branch Management
Delete stressed branches when you're done to keep your repository clean

## Getting Started

> 📖 **New to stresst?** Check out the [step-by-step Getting Started guide](docs/GETTING_STARTED.md) for a complete walkthrough with your own repository.

### Prerequisites

- Node.js 18+
- A GitHub account
- **One of the following for AI bug generation:**
  - An Anthropic API key (recommended, default)
  - A local LLM via Ollama (free, no API key needed)
  - Any OpenAI-compatible local server

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# GitHub OAuth (create at https://github.com/settings/developers)
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret

# Auth.js secret (generate with: npx auth secret)
AUTH_SECRET=your_random_secret

# Anthropic API key (get at https://console.anthropic.com)
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 🦙 Using a Local LLM (Free Alternative)

Don't want to pay for API calls? You can run stresst with a local LLM using Ollama or any OpenAI-compatible server.

**Quick start with Ollama:**

```bash
# Install additional dependency
npm install @ai-sdk/openai

# Set environment variables
export AI_PROVIDER=ollama
export OLLAMA_MODEL=llama3
```

**📖 See [docs/LOCAL_LLM_SETUP.md](docs/LOCAL_LLM_SETUP.md) for detailed setup instructions.**

> **Note:** Local LLMs may produce less consistent results than Claude. We recommend using a capable model like Llama 3 70B, CodeLlama 34B, or Mistral Large for best results.

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: stresst (or your preferred name)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret to your `.env.local`

### Installation

```bash
# Clone the repository
git clone https://github.com/brenoneill/stresst.git
cd stresst

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to get started.

## Usage

### Creating a Stressed Branch

1. Sign in with your GitHub account
2. Select a repository from the dropdown
3. Choose a branch to base the stressed version on
4. Click on a commit to see the changed files
5. Click "Stress out this commit"
6. Configure:
   - Branch name suffix (optional)
   - Stress level (Low/Medium/High)
   - Focus area (optional)
7. Click "Create & Stress"
8. Wait for the AI to introduce bugs
9. Share the bug report with your team!

### Playing the Game

Once you have a stressed branch to debug:

1. **Clone the stressed branch** to your local machine
2. **Start the timer** — Make a commit with `start` in the message (e.g., "start debugging")
3. **Find and fix the bugs** — Review the code, identify issues, and make your fixes
4. **Stop the timer** — Make a commit with `done`, `complete`, `end`, or `stop` in the message
5. **Check your score** — Return to stresst and click "Check Score" to see your grade

The scoring system tracks the time between your start and completion commits, then grades you based on the difficulty level:

### 🏆 Scoring System

| Difficulty | A Grade | B Grade | C Grade | D Grade |
|------------|---------|---------|---------|---------|
| **🌱 Easy** | 0-5 min | 5-10 min | 10-15 min | 15+ min |
| **🔥 Medium** | 0-7 min | 7-11 min | 11-15 min | 15+ min |
| **💀 Hard** | 0-10 min | 10-15 min | 15-20 min | 20+ min |

> **Tip:** The scoring thresholds can be customized in `lib/score-config.ts`

### Finding the Bugs

Once a stressed branch is created:

1. Click "Show Stressed Branch" to view the commits
2. Look for commits starting with "🔥" — these contain the bugs
3. Review the code changes and try to identify what's wrong
4. Compare with the original branch to verify your findings

### Cleaning Up

To delete a stressed branch:
1. Select the stressed branch
2. Click the "Delete" button next to the branch name
3. Confirm the deletion

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: NextAuth.js v5 with GitHub OAuth
- **AI**: Anthropic Claude (via Vercel AI SDK) — or local LLMs via Ollama
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Project Structure

```
stresst/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth.js routes
│   │   └── github/        # GitHub API endpoints
│   ├── components/        # React components
│   ├── context/           # React context providers
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/
│   ├── ai-stress.ts       # AI bug generation logic
│   ├── github.ts          # GitHub API utilities
│   └── score-config.ts    # Scoring thresholds configuration
├── auth.ts                # NextAuth.js configuration
└── types/                 # TypeScript type definitions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Disclaimer

⚠️ **Use responsibly!** This tool is designed for educational purposes and training scenarios. Only use it on repositories and branches where you have permission to create and modify branches. Never use it on production code or without proper authorization.

---

Built with ❤️ for developer education
