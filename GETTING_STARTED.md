# Getting Started with Common Tools Pattern Development

**Note:** This guide is for Claude Code to use when guiding new users through workspace setup. Users should complete the pre-setup steps in README.md first.

---

## Workspace Setup

User has already completed Phase 1 (in README.md):
- ✅ Installed Claude Code
- ✅ Installed tools (deno, gh, node) and verified git is available
- ✅ Cloned their fork of community-patterns
- ✅ Configured Playwright MCP
- ✅ Restarted Claude Code

Now guide them through cloning dependencies, getting API keys, and creating their workspace.

---

## Step 1: Clone Required Repositories

Clone the labs repository (required) and recipes repository (optional, if accessible).

```bash
cd ~/Code

# Clone labs (framework - REQUIRED, READ ONLY)
gh repo clone commontoolsinc/labs

# Try to clone recipes (optional - don't worry if this fails)
gh repo clone commontoolsinc/recipes 2>/dev/null || echo "Note: recipes repo not accessible (this is fine)"
```

**Tell the user:** "I've cloned the Common Tools framework repository (labs). The recipes repository is optional and may not be accessible depending on your permissions."

---

## Step 2: Get API Keys

**Guide user to get their API keys.**

**Anthropic API Key** (REQUIRED):
1. Visit: https://console.anthropic.com/
2. Navigate to "API Keys" → Create new key
3. Save it securely - they'll need it in the next step
4. **This is the only required key to get started**

**Optional keys** (only needed for specific features):

**Jina AI** (for web search in patterns):
1. Visit: https://jina.ai/
2. Sign up/login → API Keys → Create key
3. Save it securely

**Google OAuth** (for Gmail patterns):
1. Visit: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `http://localhost:8000/api/integrations/google-oauth/callback`
4. Save Client ID and Client Secret

Tell user: "You can skip the optional keys for now and add them later if needed."

---

## Step 3: Create .env File

Guide user to create `.env` file in `labs/packages/toolshed` with their API keys.

```bash
cd ~/Code/labs/packages/toolshed

cat > .env << 'EOF'
ENV=development
PORT=8000
LOG_LEVEL=info

# Shell frontend URL for local development
SHELL_URL=http://localhost:5173

## OpenTelemetry Configuration (disabled for local dev)
OTEL_ENABLED=false

## REQUIRED: Anthropic API Key
# Get from: https://console.anthropic.com/
CTTS_AI_LLM_ANTHROPIC_API_KEY=sk-ant-xxxx-their-actual-key-here

## OPTIONAL: Jina AI web reader API key (only needed for web search in patterns)
# Get from: https://jina.ai/
# JINA_API_KEY=jina_xxxx-their-actual-key-here

## OPTIONAL: Google OAuth Credentials (only needed for Gmail patterns)
## Get from: https://console.cloud.google.com/apis/credentials
## Add redirect URI: http://localhost:8000/api/integrations/google-oauth/callback
# GOOGLE_CLIENT_ID=your-client-id-here
# GOOGLE_CLIENT_SECRET=your-client-secret-here
EOF

chmod 600 .env
```

**Ask user for their Anthropic API key** and replace `sk-ant-xxxx-their-actual-key-here` with it.

---

## Step 4: Create Pattern Namespace

Create the user's pattern directory:

```bash
cd ~/Code/community-patterns

# Get username from git origin
GITHUB_USER=$(git remote get-url origin | sed -E 's/.*[:/]([^/]+)\/community-patterns.*/\1/')

# Create their directory
mkdir -p patterns/$GITHUB_USER

# Create README
cat > patterns/$GITHUB_USER/README.md << 'EOF'
# My Common Tools Patterns

Personal collection of Common Tools patterns.

## Patterns

- (patterns will be listed here as you create them)
EOF

# Commit and push
git add patterns/$GITHUB_USER/
git commit -m "Create my pattern namespace"
git push origin main
```

---

## Step 5: Create Identity Key and Workspace Config

```bash
cd ~/Code/community-patterns

# Create identity key (at repo root)
deno task -c ~/Code/labs/deno.json ct id new > claude.key
chmod 600 claude.key

# Get username
GITHUB_USER=$(git remote get-url origin | sed -E 's/.*[:/]([^/]+)\/community-patterns.*/\1/')

# Create workspace config
cat > .claude-workspace << EOF
username=$GITHUB_USER
setup_complete=true
EOF

echo "Created workspace for: $GITHUB_USER"
```

---

## Step 6: Start Dev Servers

Check if dev servers are running, start if needed:

```bash
# Check toolshed (port 8000)
if ! lsof -ti:8000 > /dev/null 2>&1; then
  cd ~/Code/labs/packages/toolshed && deno task dev > /tmp/toolshed-dev.log 2>&1 &
  echo "Started toolshed server"
fi

# Check shell (port 5173)
if ! lsof -ti:5173 > /dev/null 2>&1; then
  cd ~/Code/labs/packages/shell && deno task dev-local > /tmp/shell-dev.log 2>&1 &
  echo "Started shell server"
fi

sleep 3
echo "Dev servers ready at http://localhost:8000"
```

---

## Step 7: Create First Pattern

Walk user through creating a simple counter pattern:

```bash
cd ~/Code/community-patterns/patterns/$GITHUB_USER
```

Create `counter.tsx`:

```typescript
/// <cts-enable />
import { Cell, NAME, pattern, UI } from "commontools";

interface CounterInput {
  count: Cell<number>;
}

interface CounterOutput {
  count: Cell<number>;
}

export default pattern<CounterInput, CounterOutput>(
  "Counter",
  ({ count }) => {
    return {
      [NAME]: "My Counter",
      [UI]: (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Count: {count}</h1>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button onClick={() => count.set(count.get() - 1)}>-</button>
            <button onClick={() => count.set(0)}>Reset</button>
            <button onClick={() => count.set(count.get() + 1)}>+</button>
          </div>
        </div>
      ),
      count,
    };
  }
);
```

---

## Step 8: Test Pattern

Deploy and test the counter:

```bash
# Test syntax
cd ~/Code/labs
deno task ct dev ../community-patterns/patterns/$GITHUB_USER/counter.tsx --no-run

# Deploy (if syntax check passes)
deno task ct charm new \
  --api-url http://localhost:8000 \
  --identity ../community-patterns/claude.key \
  --space test-$GITHUB_USER-1 \
  ../community-patterns/patterns/$GITHUB_USER/counter.tsx

# Note the charm ID from output
```

If Playwright is available, test in browser:
```
Navigate to: http://localhost:8000/test-$GITHUB_USER-1/CHARM-ID
```

---

## Step 9: Commit Pattern

```bash
cd ~/Code/community-patterns
git add patterns/$GITHUB_USER/counter.tsx
git commit -m "Add counter pattern"
git push origin main
```

---

## ✅ Setup Complete!

User is now ready to build patterns. Remind them:
- Patterns go in `patterns/$GITHUB_USER/WIP/` while developing
- Move to root level when stable and tested
- Claude auto-starts dev servers on future sessions
- Check DEVELOPMENT.md for daily workflows

---

## Daily Workflow Reference

For future sessions, user just needs to:

```bash
cd ~/Code/community-patterns
# Launch Claude Code here
```

Claude will:
- Auto-start both dev servers if needed
- Check for upstream updates
- Guide pattern development
