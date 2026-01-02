# 🚀 Getting Started with stresst

A step-by-step guide to stress testing your own repository.

---

## Overview

This guide walks you through:
1. Setting up a repository for stress testing
2. Marking files you want stresst to break
3. Creating a stressed branch with AI-generated bugs
4. Running your broken app to practice debugging

**Time to complete:** ~15 minutes

---

## Step 1: Create Your Repository

Start with a working application. This can be:
- A new project you're creating for practice
- An existing project you want to use for training
- A simple app to test the workflow

### Example: Create a Simple React App

```bash
npx create-next-app@latest my-stresst-app
cd my-stresst-app
```

Or use any existing project you have.

> **Tip:** For your first time, start with a small project (3-5 files). This makes debugging easier while you learn the workflow.

---

## Step 2: Mark Files for stresst

stresst works by analyzing commits. When you select a commit, it looks at the **files changed in that commit** and introduces bugs into those files.

### How to Target Specific Files

To control which files get stressed, create a commit that touches only the files you want to break. Here's the workflow:

**Option A: Add a stresst marker comment**

Add a small comment to each file you want to potentially stress:

```javascript
// stresst: include this file in stress testing
```

```typescript
// stresst: this component handles user authentication
```

```python
# stresst: core business logic - good candidate for debugging practice
```

The comment itself doesn't affect stresst's behavior, but making this change ensures the file appears in your commit's diff.

**Option B: Make a meaningful change**

Instead of marker comments, make small functional changes to the files you want stressed:
- Add a console.log
- Update a comment
- Refactor a variable name

### Example Structure

```
my-stresst-app/
├── src/
│   ├── components/
│   │   ├── UserCard.tsx      // stresst: add marker here
│   │   └── ProductList.tsx   // stresst: add marker here
│   ├── utils/
│   │   └── calculations.ts   // stresst: add marker here
│   └── App.tsx
├── package.json
└── README.md
```

---

## Step 3: Commit Your Changes

Create a commit that includes all the files you want to stress:

```bash
# Stage files you marked
git add src/components/UserCard.tsx
git add src/components/ProductList.tsx
git add src/utils/calculations.ts

# Create a descriptive commit
git commit -m "feat: prepare files for stress testing"
```

> **Important:** Only files in this commit will be candidates for bug injection. If you want to stress `App.tsx`, make sure it's modified in your commit.

---

## Step 4: Push to GitHub

Your repository needs to be on GitHub for stresst to access it:

```bash
# If you haven't already, create a GitHub repo and add the remote
git remote add origin https://github.com/YOUR_USERNAME/my-stresst-app.git

# Push your branch
git push -u origin main
```

Make sure your repository is **not private** or that you've granted stresst access to your private repos during OAuth.

---

## Step 5: Launch stresst

### Start the stresst Development Server

```bash
cd /path/to/stresst
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Step 6: Connect Your GitHub Account

1. Click **"Sign in with GitHub"**
2. Authorize stresst to access your repositories
3. You'll be redirected to the dashboard

![Sign in flow](https://via.placeholder.com/600x300?text=Sign+in+with+GitHub)

---

## Step 7: Select Your Repository and Commit

### 7.1 Choose Your Repository

1. Use the **Repository** dropdown
2. Find and select `my-stresst-app` (or your repo name)

### 7.2 Choose Your Branch

1. Use the **Branch** dropdown
2. Select `main` (or whichever branch has your commit)

### 7.3 Select Your Commit

1. The commit list shows recent commits
2. Find the commit you created in Step 3 (e.g., "feat: prepare files for stress testing")
3. Click on it to expand and see the files changed

You should see the files you marked listed in the commit details.

---

## Step 8: Stress the Commit

### 8.1 Open the Stress Panel

Click **"Stress this commit"** (or the 🔥 button) on your selected commit.

### 8.2 Configure Your Stress Test

| Setting | Description | Recommendation |
|---------|-------------|----------------|
| **Branch Name** | Name for the stressed branch | Use default or add a suffix like `-round1` |
| **Stress Level** | Number and difficulty of bugs | Start with **Low** for your first time |
| **Focus Area** | Optional: specific things to test | Leave blank or try "data handling" |

### 8.3 Create the Stressed Branch

Click **"Create & Stress"**

Wait for the AI to:
1. Analyze your code
2. Generate realistic bugs
3. Create a new branch with the buggy code
4. Push it to your GitHub

This usually takes 10-30 seconds depending on file sizes.

### 8.4 Copy the Bug Report

Once complete, you'll see a **Bug Report** with symptoms like:
- "Users are seeing blank names on their profile cards"
- "The total calculation is always showing $0.00"
- "Items at the end of the list are missing"

**Click "Copy Bug Report"** to save this for reference!

---

## Step 9: Navigate to the Stressed Branch

### Option A: Use stresst's Branch Viewer

1. Click **"Show Stressed Branch"** in stresst
2. Look for commits starting with 🔥 — these contain the bugs
3. Review the changes to understand what was modified

### Option B: Clone Locally via Terminal

```bash
# Navigate to your app directory
cd /path/to/my-stresst-app

# Fetch the new branch
git fetch origin

# Check out the stressed branch
git checkout stresst-<your-branch-name>
```

---

## Step 10: Run Your Broken App

### Start Your App on a Different Port

To avoid conflicts with stresst (running on port 3000), run your app on a different port:

```bash
# For Next.js
npm run dev -- -p 3001

# For Create React App
PORT=3001 npm start

# For Vite
npm run dev -- --port 3001
```

### Open Your Broken App

Navigate to [http://localhost:3001](http://localhost:3001)

🎉 **Your app is now broken by stresst!**

---

## Step 11: Find and Fix the Bugs

Now the real challenge begins:

1. **Read the Bug Report** — What symptoms should you look for?
2. **Reproduce the Bugs** — Can you see the issues in the UI?
3. **Debug the Code** — Use your debugging skills to find the root causes
4. **Fix the Issues** — Make the corrections
5. **Verify Your Fixes** — Does the app work correctly now?

### Using the Timer (Optional)

For scored debugging practice:

```bash
# Start the timer with a commit message containing "start"
git commit --allow-empty -m "start debugging"

# ... fix the bugs ...

# Stop the timer with a commit containing "done"
git commit -am "done - fixed all bugs"

# Push your fixes
git push
```

Return to stresst and click **"Check Score"** to see your grade!

---

## Tips for Success

### For Creating Stress-Testable Code

- ✅ **Keep files focused** — One component/function per file is easier to debug
- ✅ **Include variety** — Mix UI components, utilities, and data handling
- ✅ **Make it functional first** — The app should work before you stress it
- ✅ **Start small** — 3-5 files is ideal for learning

### For Debugging

- 🔍 **Read error messages carefully** — They often point to the bug location
- 🔍 **Use console.log** — Add logging to trace data flow
- 🔍 **Compare with original** — The original branch shows working code
- 🔍 **Check the bug categories** — stresst injects specific bug types (off-by-one, null checks, etc.)

### For Teams

- 👥 **Share the bug report** — Send it to a colleague without showing them the code changes
- 👥 **Time the challenge** — See who can fix bugs fastest
- 👥 **Rotate roles** — Take turns creating stress tests and solving them

---

## Troubleshooting

### "No repositories found"

- Make sure you've pushed your repo to GitHub
- Check that you authorized stresst to access your repositories
- For private repos, ensure you granted private repo access

### "No commits found"

- Verify your branch has commits
- Push your latest commits: `git push origin main`
- Refresh the stresst page

### "Stress generation failed"

- Check that you have a valid API key configured
- Verify the files in your commit aren't too large (>10KB files may timeout)
- Try with fewer files or smaller files

### App won't start after stressing

- The bugs are designed to cause runtime errors, not syntax errors
- If you see syntax errors, report an issue — this shouldn't happen
- Check the console for error messages — this is part of debugging!

---

## Next Steps

- 📚 Try **Medium** and **High** stress levels for harder challenges
- 🎯 Use **Focus Areas** to target specific bug types
- 🦙 Set up a [local LLM](LOCAL_LLM_SETUP.md) to avoid API costs
- 🏆 Challenge your team and track scores

---

## Quick Reference

```bash
# Your app setup
cd my-app
# ... make changes to files you want stressed ...
git add .
git commit -m "feat: files ready for stress testing"
git push origin main

# After stressing in stresst UI
git fetch origin
git checkout stresst-<branch-name>
npm run dev -- -p 3001  # Run on different port
```

Happy debugging! 🔥

