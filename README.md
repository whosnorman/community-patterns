# Common Tools Community Patterns

A community-driven repository for sharing Common Tools patterns. Each developer works in their own namespace under `patterns/YOUR-USERNAME/`.

## Already Set Up?

If you've already completed the first-time setup:

```bash
cd ~/Code/community-patterns
# Launch Claude Code here
```

That's it! Claude auto-starts dev servers and guides you.

---

## First-Time Setup

Complete these steps BEFORE launching Claude Code for the first time. This takes about 30 minutes.

### Step 1: Install Tools

```bash
# 1. Install Homebrew (macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install required tools
brew install deno git gh

# 3. Verify installations
deno --version
git --version
gh --version

# 4. Authenticate with GitHub
gh auth login
# Choose: GitHub.com → HTTPS → Yes → Login with browser
```

### Step 2: Get API Keys

**Anthropic API Key** (REQUIRED):
- Visit: https://console.anthropic.com/
- Navigate to "API Keys" → Create new key
- Save it securely
- **This is the only required key to get started**

**Optional keys** (only needed for specific features):

**Jina AI** (for web search in patterns):
- Visit: https://jina.ai/
- Sign up/login → API Keys → Create key

**Google OAuth** (for Gmail patterns):
- Visit: https://console.cloud.google.com/apis/credentials
- Create OAuth 2.0 Client ID

### Step 3: Clone Repositories

```bash
cd ~/Code

# 1. Fork this repo on GitHub first
# Go to: https://github.com/commontoolsinc/community-patterns
# Click "Fork"

# 2. Clone your fork
gh repo clone YOUR-USERNAME/community-patterns
cd community-patterns

# 3. Add upstream remote (to get updates)
git remote add upstream https://github.com/commontoolsinc/community-patterns.git
git fetch upstream

# 4. Clone labs (framework - READ ONLY)
cd ~/Code
gh repo clone commontoolsinc/labs
```

### Step 4: Install and Configure Playwright MCP (Optional but Recommended)

Playwright enables automated browser testing of your patterns.

```bash
# Install Playwright MCP
npm install -g @modelcontextprotocol/server-playwright
```

**Configure Claude Code** (edit this file manually):

**On macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**On Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**On Linux**: `~/.config/Claude/claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-playwright"
      ]
    }
  }
}
```

### Step 5: Restart Claude Code

**CRITICAL:** Quit Claude Code completely (Cmd+Q on macOS) and relaunch it.

You should see a small "🔌" icon indicating MCP is connected.

---

## ✅ Setup Complete!

Now launch Claude Code and let it guide you through the rest:

```bash
cd ~/Code/community-patterns
# Launch Claude Code here
```

Claude will help you:
- Create `.env` file with your API keys
- Create your pattern namespace
- Create identity key
- Build your first pattern

## Repository Structure

```
community-patterns/
├── README.md              # This file
├── CLAUDE.md              # Claude Code instructions
├── GETTING_STARTED.md     # First-time setup guide
├── DEVELOPMENT.md         # Development workflows
└── patterns/
    ├── examples/          # Community-maintained examples
    │   ├── counter.tsx
    │   └── todo-list.tsx
    └── YOUR-USERNAME/     # Your patterns
        ├── WIP/           # Work in progress
        ├── lib/           # Reference patterns (unchanged)
        └── *.tsx          # Stable patterns
```

## Key Features

✅ **Namespace Isolation** - Everyone works in `patterns/YOUR-USERNAME/`
✅ **Auto-Updates** - Claude pulls latest docs automatically on launch
✅ **Zero Conflicts** - Your namespace is yours alone
✅ **Discover Patterns** - Browse other users' work for inspiration
✅ **Optional Sharing** - Create PRs to contribute back

## Documentation

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Complete setup guide for new users
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Daily workflows and best practices
- **[CLAUDE.md](CLAUDE.md)** - Instructions for Claude Code (read automatically)

## Resources

- [Common Tools Labs](https://github.com/commontoolsinc/labs) - Framework repository
- [Pattern Documentation](https://github.com/commontoolsinc/labs/blob/main/docs/common/PATTERNS.md) - Pattern examples
- [Component Reference](https://github.com/commontoolsinc/labs/blob/main/docs/common/COMPONENTS.md) - UI components

## How It Works

1. **Fork and clone** this repository
2. **Add upstream** remote to get updates
3. **Launch Claude Code** from the repo directory
4. **Claude auto-updates** from upstream and guides you
5. **Create patterns** in your `patterns/USERNAME/` namespace
6. **Commit and push** to your fork
7. **Optional**: Create PR to share patterns with community

## Community Guidelines

- Work only in your `patterns/USERNAME/` directory
- Don't modify other users' patterns
- Keep `lib/` folder for reference patterns (unchanged)
- Use `WIP/` folder for work in progress
- Share your best patterns via PR!

## Getting Help

**Stuck?**
- Check [GETTING_STARTED.md](GETTING_STARTED.md) for setup help
- Check [DEVELOPMENT.md](DEVELOPMENT.md) for workflow help
- Ask Claude Code - it has access to all documentation
- Browse example patterns in `patterns/examples/`

## Concept Guide

For a comprehensive overview of what Common Tools is, how it works, and why it's designed this way, see:

**[Common Tools Concept Overview](https://docs.google.com/document/d/13gJ5akQQId9pz1Z2sjzkkTUmHKrHFZaaIMNqm5YsBFU/edit?tab=t.0)**

*Note: If you don't have access to this document, please ask an employee of Common Tools for access.*

Happy pattern building! 🚀
