# Instructions for Claude Code Sessions

## Session Startup Sequence

**CRITICAL: Follow these steps IN ORDER on every session startup:**

### Step 1: Check for Upstream Updates

**Always check for updates from upstream first:**

```bash
# Check if updates are available
git fetch upstream 2>/dev/null || echo "No upstream configured"
git status

# If behind upstream/main, pull updates
# Example output: "Your branch is behind 'upstream/main' by 3 commits"
```

**If updates available:**
```bash
# Pull updates (will update CLAUDE.md, GETTING_STARTED.md, examples, etc.)
git pull --rebase upstream main

# If rebase succeeds
git push origin main

# If conflicts (rare - user files are in their namespace)
# Show conflicts and help resolve
```

**Why this matters:**
- Gets latest CLAUDE.md (this file!) with new instructions
- Gets updated GETTING_STARTED.md and DEVELOPMENT.md
- Gets new example patterns
- Gets other users' contributed patterns

**Tell user:**
```
Checking for updates from upstream...
[If found updates]: Pulled latest updates! This includes:
  - Updated documentation
  - New example patterns
  - [list what changed if significant]

[If no updates]: Already up to date with upstream.
```

### Step 1.5: Check Reference Repositories (Weekly)

**If it's been a while since last check, remind user to update reference repos:**

```bash
# Check if labs or recipes need updating
cd ~/Code/labs && git fetch origin && git status
cd ~/Code/recipes && git fetch origin && git status 2>/dev/null
```

**If updates available, guide user:**

```
It looks like the labs framework has updates available.
Would you like me to help you update?

This requires:
1. Stopping the dev server (if running)
2. Pulling updates: git pull origin main
3. Restarting the dev server: deno task dev
```

**Important Notes:**
- **labs/** updates may include new framework features, bug fixes, or documentation
- **Dev server must be restarted** after pulling labs updates
- **recipes/** (if cloned) contains example patterns - optional to update
- Check approximately weekly, or when user encounters framework issues

### Step 2: Detect User's Workspace

**Use this procedure to reliably find the user's patterns folder:**

```bash
# Method 1: Extract from fork's origin remote
# Format: https://github.com/USERNAME/community-patterns.git
# or: git@github.com:USERNAME/community-patterns.git
ORIGIN_URL=$(git remote get-url origin 2>/dev/null)

# Extract username from URL
# For HTTPS: https://github.com/USERNAME/repo.git
# For SSH: git@github.com:USERNAME/repo.git
if [[ $ORIGIN_URL =~ github.com[:/]([^/]+)/ ]]; then
    GITHUB_USER="${BASH_REMATCH[1]}"
fi

# Method 2: Fallback to git config
if [ -z "$GITHUB_USER" ]; then
    GITHUB_USER=$(git config user.name)
fi

# Method 3: Fallback to checking .git/config for fork info
if [ -z "$GITHUB_USER" ]; then
    # Parse .git/config for [remote "origin"] section
    GITHUB_USER=$(git config --get remote.origin.url | sed -E 's/.*github\.com[:/]([^/]+)\/.*/\1/')
fi

# Method 4: Look for existing pattern directories (exclude examples)
if [ -z "$GITHUB_USER" ]; then
    # List directories in patterns/, exclude examples
    ls -d patterns/*/ 2>/dev/null | grep -v "examples" | head -1 | xargs basename
fi

# Method 5: Ask the user
if [ -z "$GITHUB_USER" ]; then
    # Prompt: "I couldn't detect your GitHub username. What is it?"
    # Then verify: ls patterns/$GITHUB_USER/
fi

# Verify workspace exists
if [ -d "patterns/$GITHUB_USER" ]; then
    echo "Found your workspace: patterns/$GITHUB_USER/"
else
    echo "Workspace not found. This appears to be first-time setup."
fi
```

**Detection priority:**
1. Extract from fork's `origin` remote URL (most reliable)
2. Git config `user.name`
3. Parse `.git/config` for remote info
4. Look for existing directories in `patterns/`
5. Ask the user directly

**Why origin remote is most reliable:**
- User's fork URL always contains their username
- Doesn't depend on local git config
- Works even if user hasn't set git config
- Format: `https://github.com/USERNAME/community-patterns.git`

**If workspace doesn't exist (First-Time Setup):**

1. Tell user: "Welcome! This appears to be your first session. Let me help you get set up."

2. **Check prerequisites** (in order):
   - [ ] Is `upstream` remote configured? If not: `git remote add upstream https://github.com/commontoolsinc/community-patterns.git`
   - [ ] Does `~/Code/labs` exist? If not, guide cloning: `gh repo clone commontoolsinc/labs`
   - [ ] Does `~/Code/labs/.env` exist? If not, guide creation (see GETTING_STARTED.md for template)
   - [ ] Is dev server running? Check with user, help start if needed: `cd ~/Code/labs && deno task dev`
   - [ ] Is Playwright MCP configured? Suggest setup if not (see GETTING_STARTED.md)

3. **Create user's workspace:**
   - Create `patterns/$GITHUB_USER/` directory
   - Create identity key: `deno task -c ~/Code/labs/deno.json ct id new > patterns/$GITHUB_USER/claude.key`
   - Create basic README.md
   - Commit and push

4. **Guide through first pattern** - Suggest starting with a simple counter or todo list

5. **Reference GETTING_STARTED.md** for detailed setup information if needed

**If workspace exists (Normal Development):**

1. Tell user: "Ready to work! Your workspace: `patterns/$GITHUB_USER/`"
2. Read and follow: **DEVELOPMENT.md**
3. Proceed with normal development workflow

---

## Repository Structure

```
community-patterns/        # THIS REPO (user's fork)
├── CLAUDE.md              # This file - Claude's instructions
├── GETTING_STARTED.md     # First-time setup guide
├── DEVELOPMENT.md         # Normal development workflows
├── README.md              # Quick overview
└── patterns/
    ├── examples/          # Shared examples (READ-ONLY)
    ├── alice/, bob/, ...  # Other users (READ-ONLY)
    └── $GITHUB_USER/      # USER's workspace (WRITABLE)
        ├── README.md      # Optional: user's notes
        ├── claude.key     # Identity key (gitignored)
        ├── WIP/           # Work-in-progress patterns
        │   └── *.tsx      # Patterns under active development
        ├── lib/           # Copied upstream patterns (NO MODIFICATIONS)
        │   └── *.tsx      # Reference patterns from labs
        └── *.tsx          # Stable/production patterns

~/Code/labs/               # Framework repo (separate, READ-ONLY)
```

### User Workspace Structure

**Recommended organization within `patterns/$GITHUB_USER/`:**

**WIP/** - Work in progress
- Patterns actively being developed
- Experimental features
- Not fully tested
- Can be messy/incomplete

**lib/** - Copied reference patterns
- **CRITICAL**: NO MODIFICATIONS to files in lib/
- Copy patterns from labs or examples here for reference
- If you want to modify them, copy to WIP/ or root
- Helps differentiate your work from upstream patterns

**Root level** - Stable patterns
- Completed, tested patterns
- Ready for use or sharing
- Well-documented

**Example structure:**
```
patterns/alice/
├── README.md
├── claude.key
├── WIP/
│   ├── experimental-ai-chat.tsx
│   └── testing-new-feature.tsx
├── lib/
│   ├── counter.tsx              # Copied from examples (unchanged)
│   └── shopping-list.tsx        # Copied from labs (unchanged)
├── my-todo-list.tsx             # Alice's stable pattern
└── my-notes-app.tsx             # Alice's stable pattern
```

---

## Core Principles

### DO

✅ **Always update from upstream first** (Step 1 above)
✅ **Work only in `patterns/$GITHUB_USER/`** - user's namespace
✅ **Commit frequently** with clear messages
✅ **Test patterns** before committing
✅ **Reference example patterns** for learning
✅ **Ask user** before structural changes

### DON'T

❌ **Never skip upstream update check** on session startup
❌ **Never modify other users' patterns** (`patterns/alice/`, etc.)
❌ **Never modify example patterns** (`patterns/examples/`)
❌ **Never modify root docs** (CLAUDE.md, etc.) unless user explicitly asks
❌ **Never commit identity keys** (claude.key - gitignored)
❌ **Never work outside user's namespace** without permission

### Working with labs Repository

❌ **NEVER commit or push to labs** - it's READ-ONLY
✅ **If you accidentally changed something**: `git restore .`
✅ **To update labs**: User should `git pull origin main` in labs directory

---

## Key Paths

| Purpose | Path |
|---------|------|
| User's workspace | `patterns/$GITHUB_USER/` |
| Identity key | `patterns/$GITHUB_USER/claude.key` |
| Example patterns | `patterns/examples/` |
| Development guide | `DEVELOPMENT.md` |
| Setup guide | `GETTING_STARTED.md` |
| Labs framework | `~/Code/labs/` |
| Labs docs | `~/Code/labs/docs/common/` |

---

## Pattern Development Commands

### Test Syntax

```bash
cd ~/Code/labs
deno task ct dev ../community-patterns/patterns/$GITHUB_USER/pattern.tsx --no-run
```

### Deploy Pattern

```bash
cd ~/Code/labs
deno task ct charm new \
  --api-url http://localhost:8000 \
  --identity ../community-patterns/patterns/$GITHUB_USER/claude.key \
  --space my-space \
  ../community-patterns/patterns/$GITHUB_USER/pattern.tsx
```

### Update Deployed Pattern

```bash
cd ~/Code/labs
deno task ct charm setsrc \
  --api-url http://localhost:8000 \
  --identity ../community-patterns/patterns/$GITHUB_USER/claude.key \
  --space my-space \
  --charm CHARM-ID \
  ../community-patterns/patterns/$GITHUB_USER/pattern.tsx
```

**IMPORTANT**: Always use `deno task ct`, never just `ct` directly.

---

## Testing Patterns with Playwright

If Playwright MCP is available, use it to test patterns in a real browser.

### Navigate to Deployed Pattern

```
Use Playwright to navigate to: http://localhost:8000/my-space/CHARM-ID
```

### Test Pattern Functionality

Once the page loads:
1. Take a snapshot to see the UI: `browser_snapshot`
2. Interact with elements: click buttons, fill inputs, check boxes
3. Verify behavior: check that counters increment, items are added, etc.
4. Report any issues found

### Registering (First Time Only)

If you see a login/registration page:
1. Click "Register" or "Generate Passphrase"
2. Follow the registration flow
3. Then navigate back to the pattern URL

### Testing Workflow

**After deploying a new pattern:**
```
1. Deploy with ct charm new
2. Note the charm ID
3. Use Playwright to test at http://localhost:8000/space/charm-id
4. Verify all functionality works
5. Report to user if tests pass or if issues found
```

**After updating a pattern:**
```
1. Update with ct charm setsrc
2. Use Playwright to verify changes
3. Test that fixes work and nothing broke
```

**When Playwright unavailable:**
- Suggest user test manually in browser
- Provide the URL to test
- Ask them to report any issues

---

## Git Workflow

### Committing Work

```bash
cd ~/Code/community-patterns

git add patterns/$GITHUB_USER/pattern.tsx
git commit -m "Add pattern: description"
git push origin main
```

### Getting Updates (Already done in Step 1)

```bash
git fetch upstream
git pull --rebase upstream main
git push origin main
```

### Sharing Work Upstream

If user wants to contribute patterns back:

```bash
git push origin main
gh pr create \
  --repo commontoolsinc/community-patterns \
  --title "Add: pattern name" \
  --body "Description"
```

---

## Documentation

### For First-Time Setup

Read and follow: **GETTING_STARTED.md**

Covers:
- Installing tools
- Forking and cloning repos
- Setting up environment
- Creating workspace
- First pattern

### For Normal Development

Read and follow: **DEVELOPMENT.md**

Covers:
- Daily workflows
- Pattern best practices
- Testing and deployment
- Common patterns
- Troubleshooting

### For Pattern Reference

**In this repo**:
- `patterns/examples/` - Working example patterns

**In labs repo**:
- `docs/common/PATTERNS.md` - Pattern examples
- `docs/common/COMPONENTS.md` - Component reference
- `docs/common/CELLS_AND_REACTIVITY.md` - Reactivity guide
- `docs/common/TYPES_AND_SCHEMAS.md` - Type system
- `docs/common/LLM.md` - Using AI features

---

## Session Startup Checklist

Every session:

- [ ] **Step 1**: Check and pull from upstream (this repo)
- [ ] **Step 1.5**: Check if labs/recipes need updates (weekly)
- [ ] **Step 2**: Detect user's workspace
- [ ] **Route**: First-time → GETTING_STARTED.md, Existing → DEVELOPMENT.md
- [ ] **Confirm**: Working directory is `patterns/$GITHUB_USER/`
- [ ] **Check**: Is dev server running? Remind to start if needed
- [ ] **Check**: Is Playwright MCP available for testing?
- [ ] **Ready**: Ask user what they want to work on

---

## When User Finishes Session

- [ ] Ensure all work is committed
- [ ] Ensure changes are pushed: `git push origin main`
- [ ] Remind: "Next session I'll check for upstream updates automatically"

---

## Remember

- **Auto-update is critical** - Gets latest instructions for you!
- **User's fork is their workspace** - Push freely to origin
- **Upstream is shared repo** - Pull from here for updates
- **Everyone in their own namespace** - No conflicts
- **Be helpful and encouraging** - Guide users through learning

---

## Special Cases

### User Asks to Modify Docs

If user wants to modify CLAUDE.md, GETTING_STARTED.md, etc.:
1. Confirm they understand this will diverge from upstream
2. Suggest creating issue/PR to upstream instead
3. If they insist, make changes but warn about merge conflicts on updates

### User Wants to Browse Other Patterns

```bash
# Show what's available
ls patterns/

# Show specific user's patterns
ls patterns/alice/

# Copy pattern to study
cp patterns/alice/shopping.tsx patterns/$GITHUB_USER/study-shopping.tsx
```

### User Encounters Merge Conflicts

Usually rare (everyone in their own namespace), but if it happens:
```bash
git status
# Show which files conflict

# If in their namespace - keep their version
# If in docs - review changes and merge carefully
```

---

Happy pattern development! 🚀
