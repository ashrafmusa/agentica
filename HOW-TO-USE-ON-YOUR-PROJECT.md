# Agenticana v2 — Using With Your Own Projects

## The 3 Ways to Use Agenticana on Any Project

---

### 🟢 Option A: LITE — Copy Copilot Instructions (5 minutes, recommended start)
**Best for:** Any project. Quick plug-in. No setup needed on project side.

```powershell
# From the Agenticana folder:
.\install-to-project.ps1 -ProjectPath "d:\YourProject" -Mode lite
```

What gets added to your project:
```
YourProject/
├── .github/
│   └── copilot-instructions.md   ← Copilot knows all 20 agents
└── .vscode/
    ├── mcp.json                   ← Points to Agenticana MCP server
    └── settings.json              ← Copilot settings merged in
```

Copilot Chat now knows all 20 agents and can call the 11 Agenticana tools.

---

### 🔵 Option B: LINK — Multi-Root Workspace (2 minutes, zero file copying)
**Best for:** When you don't want to touch your project's git history at all.

```powershell
# Creates a .code-workspace file — open this in VS Code instead of the project folder
.\install-to-project.ps1 -ProjectPath "d:\YourProject" -Mode link
```

This creates `Agenticana\YourProject.code-workspace`:
```json
{
  "folders": [
    { "name": "YourProject", "path": "d:/YourProject" },
    { "name": "Agenticana v2 (toolkit)", "path": "d:/_Projects/AGENTICANA" }
  ]
}
```

Open VS Code with:
```powershell
code "d:\_Projects\Agenticana\YourProject.code-workspace"
```
You see both your project AND Agenticana side-by-side in the explorer.

---

### 🟣 Option C: FULL — Local Memory + Scripts (10 minutes, most powerful)
**Best for:** Long-running projects where you want project-specific learning.

```powershell
.\install-to-project.ps1 -ProjectPath "d:\YourProject" -Mode full
```

What gets added:
```
YourProject/
├── .github/copilot-instructions.md
├── .vscode/mcp.json + settings.json
└── .Agenticana/                        ← Project-local Agenticana data
    ├── scripts/                       ← reasoning_bank.py, router_cli.py
    ├── memory/reasoning-bank/
    │   └── decisions.json            ← Empty, grows with YOUR project's patterns
    └── router/config.json
```

Project-local usage:
```powershell
# From YOUR project folder:
python .Agenticana\scripts\reasoning_bank.py stats
python .Agenticana\scripts\router_cli.py "fix the auth bug"
```

---

## Daily Usage on Your Project

### In Copilot Chat (after any of the above)

```
@frontend-specialist Add a data table with sorting and pagination to the dashboard.

@debugger The login form submits but the user isn't redirected. Debug it.

@backend-specialist Add rate limiting to the /api/auth/login endpoint.

@security-auditor Review our JWT implementation for security issues.

@test-engineer Write tests for the UserService.createUser() method.
```

### Using MCP Tools in Copilot Chat

After enabling Agenticana tools (🔧 icon in Copilot Chat):

```
You: Check if we've built something like this before, then route the task.
     Task: "Add real-time notifications with WebSockets"

Copilot: [calls reasoningbank_retrieve] → No close match found (similarity 0.42)
         [calls router_route] → MODEL=pro STRATEGY=COMPRESSED
         This is a new pattern. Here's the implementation plan...
```

```
You: Record what we just built to the ReasoningBank.

Copilot: [calls reasoningbank_record] → ✅ Recorded with id rb-XXX
         Tagged: websocket, notifications, backend, real-time
```

---

## Real Workflow Example

**Scenario:** You're working on `d:\_Projects\HIS` (Hospital Information System)

```powershell
# Step 1: Install Agenticana into HIS (one time)
cd d:\_Projects\Agenticana
.\install-to-project.ps1 -ProjectPath "d:\_Projects\HIS" -Mode full

# Step 2: Open HIS in VS Code
code "d:\_Projects\HIS"

# Step 3: Enable MCP tools in Copilot Chat
# Ctrl+Alt+I → 🔧 → Enable "Agenticana"
```

Now in VS Code on the HIS project:

```
You: I need to add the whitelabeling feature — logo and system name customization.

Copilot:
  [calls reasoningbank_retrieve "whitelabeling admin settings"]
  → Found: similarity 0.71 with past admin feature (medium match)
  [calls router_route]
  → tier: pro, strategy: COMPRESSED

  Based on past patterns and your codebase:
  The HIS already has an admin panel. Here's where to add it:
  - backend-specialist: Add /api/settings/brand endpoint
  - frontend-specialist: BrandingPanel component in admin settings
  - database-architect: Add brand_config table to schema

  Shall I create a whitelabeling.md plan?
```

---

## Quick Reference Card

| Task | Command / Chat |
|------|--------------|
| Install to project (quick) | `.\install-to-project.ps1 -ProjectPath "d:\MyProject"` |
| Install with local memory | `.\install-to-project.ps1 -ProjectPath "d:\MyProject" -Mode full` |
| Open as joint workspace | `.\install-to-project.ps1 -ProjectPath "d:\MyProject" -Mode link` |
| Debug a bug | `@debugger [describe the bug]` in Copilot Chat |
| Build a feature | `@orchestrator [describe the feature]` |
| Quick code gen | Just describe it — Copilot picks the agent |
| Check past patterns | `@copilot Check the ReasoningBank for [topic]` |
| Record a solution | `@copilot Record this solution to ReasoningBank` |

---

## What Copilot Knows About Your Project

After installation, GitHub Copilot will:

1. **Know all 20 Agenticana agents** and pick the right one automatically
2. **Call ReasoningBank** before planning (finds patterns from past work)
3. **Route tasks** to the right model (saves tokens on simple tasks)
4. **Follow the coding rules**: no purple colors, test coverage, clean code
5. **Plan before coding** for complex features (creates task-slug.md)
6. **Record successful solutions** back to memory for future reuse

