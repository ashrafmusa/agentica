# Contributing to Agenticana 🦅

> *"The Secretary Bird doesn't wait to be told what to stomp. It sees the snake and acts."*
> — That's the spirit we want in contributors.

**First time contributing to open source?** You're in the right place. We go out of our way to make this welcoming.

[![Good First Issues](https://img.shields.io/github/issues/ashrafmusa/agenticana/good%20first%20issue?color=7057ff&label=good%20first%20issues)](https://github.com/ashrafmusa/agenticana/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ashrafmusa/agenticana/pulls)

---

## 🗺️ What Can I Build?

Pick what excites you. Everything is valuable.

| What | Difficulty | Where | Impact |
|------|-----------|-------|--------|
| Fix a typo or doc | ⭐ Beginner | Any `.md` file | Immediate |
| New ReasoningBank decision | ⭐ Beginner | `memory/reasoning-bank/decisions.json` | High |
| New issue template or workflow | ⭐ Beginner | `.github/` | Medium |
| New skill (`SKILL.md`) | ⭐⭐ Easy | `skills/{name}/SKILL.md` | Medium |
| Improve an existing agent | ⭐⭐ Easy | `agents/{name}.md` | High |
| Add NL Swarm keyword triggers | ⭐⭐ Easy | `scripts/nl_swarm.py` | High |
| New agent (YAML + MD) | ⭐⭐⭐ Medium | `agents/` | High |
| New phase script (P20+) | ⭐⭐⭐⭐ Hard | `scripts/` | Very High |
| Real LLM agent provider | ⭐⭐⭐⭐ Hard | `scripts/real_simulacrum.py` | Very High |
| MCP tool (new capability) | ⭐⭐⭐⭐ Hard | `mcp/tools/` | Very High |

---

## ⚡ 5-Minute Setup

```bash
# 1. Fork the repo on GitHub, then clone YOUR fork
git clone https://github.com/YOUR_USERNAME/agenticana.git
cd agenticana

# 2. Install dependencies
# Windows:
powershell -ExecutionPolicy Bypass -File setup.ps1
# macOS/Linux:
pip install -r requirements.txt && cd mcp && npm install && cd ..

# 3. Install Guardian (protects your commits automatically)
python scripts/guardian_mode.py install

# 4. Verify everything runs
python scripts/verify_all.py .
python scripts/agentica_cli.py pulse

# 5. Create your branch
git checkout -b feat/your-feature-name
```

**That's it. You're ready.**

---

## 🤖 Adding a New Agent

Agents are the heart of Agenticana. Adding one is the most impactful contribution.

### Step 1 — Create the YAML spec
```bash
cp agents/frontend-specialist.yaml agents/your-agent.yaml
```

Edit it — follow [`schemas/agent-schema.json`](schemas/agent-schema.json):
```yaml
name: your-agent
version: "6.0"
description: "One clear sentence: what does this agent specialize in?"
model_tier: pro          # lite | flash | pro | pro-extended
complexity_tier: COMPLEX # SIMPLE | MODERATE | COMPLEX
token_budget: 8000
skills:
  - clean-code
  - your-relevant-skill
capabilities:
  - "Specific thing this agent can do (be concrete)"
  - "Another specific capability"
boundaries:
  - "What this agent should NOT do (be strict)"
routing_hints:
  domain: your-domain
  keywords: ["keyword1", "keyword2", "keyword3"]
  auto_invoke: true
```

### Step 2 — Write the MD rules
Create `agents/your-agent.md`. This is the instruction manual the AI reads. Include:
- The agent's persona and expertise
- Specific rules for their domain
- Anti-patterns to avoid
- Example interactions (very important!)

### Step 3 — Add NL Swarm triggers
Open `scripts/nl_swarm.py` and add your agent's trigger keywords to `AGENT_TRIGGERS`.

### Step 4 — Validate
```bash
# YAML syntax check
python -c "import yaml; print('Valid:', yaml.safe_load(open('agents/your-agent.yaml'))['name'])"

# Schema check
python -c "
import yaml, json
schema = json.load(open('schemas/agent-schema.json'))
data = yaml.safe_load(open('agents/your-agent.yaml'))
missing = [k for k in schema.get('required', []) if k not in data]
print('PASS' if not missing else f'Missing: {missing}')
"

# Full suite
python scripts/verify_all.py .
```

---

## 🧩 Adding a Skill

Skills are reusable instruction modules loaded by agents.

```bash
mkdir skills/your-skill
```

Create `skills/your-skill/SKILL.md`:
```yaml
---
name: your-skill
version: "1.0"
tier: 2              # 1=Core (always), 2=Domain (match), 3=Utility (explicit)
token_cost: MEDIUM   # LOW | MEDIUM | HIGH
domains: ["your-domain"]
lazy: false
---

# Your Skill — Instruction for the AI

## Purpose
[What problem does this skill solve?]

## Rules
1. [Concrete rule 1]
2. [Concrete rule 2]

## Anti-Patterns
- ❌ Never do X
- ❌ Avoid Y

## Example Application
[Show how an agent uses this skill in practice]
```

---

## 🧠 Contributing to ReasoningBank

The smartest contribution. Real decisions make the whole system smarter for everyone.

Add to `memory/reasoning-bank/decisions.json`:
```json
{
  "id": "rb-XXX",
  "timestamp": "2026-03-03T00:00:00Z",
  "task": "What you were trying to do",
  "task_type": "feature",
  "agent": "backend-specialist",
  "decision": "What approach you chose and the key reasoning",
  "outcome": "What happened — did it work? Any surprises?",
  "success": true,
  "tokens_used": 0,
  "model_used": "pro",
  "embedding": null,
  "tags": ["auth", "django", "security"]
}
```

Then check if it creates a new pattern:
```bash
python scripts/distill_patterns.py --dry-run
```

---

## 🚀 Proposing a New Phase (P20+)

Have an idea for a new Agenticana phase? We love this. Phases P15-P19 all started as ideas.

**Before coding:** Open a Discussion in [GitHub Discussions](https://github.com/ashrafmusa/agenticana/discussions) with:
- What problem does it solve?
- How does it fit with existing phases?
- What would the CLI look like?

We'll debate it using the Logic Simulacrum (yes, really) before implementing.

---

## ✅ Before You Submit

```bash
# 1. Run the full validation suite
python scripts/verify_all.py .

# 2. Run the performance check
python scripts/agentica_cli.py pulse

# 3. Sign your work (optional but appreciated)
python scripts/pow_commit.py sign

# 4. Guardian will auto-run on git commit
git commit -m "feat: your change"
# → Guardian intercepts → lint + secret scan → auto-approved or blocked
```

---

## 📬 Pull Request Guidelines

**Title format:** `[type]: description`

| Type | When |
|------|------|
| `feat:` | New agent, skill, phase, or feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code change with no behavior change |
| `chore:` | CI, tooling, dependencies |

**PR checklist:**
- [ ] `verify_all.py` passes
- [ ] Guardian hook installed and approved the commit
- [ ] No lobsters in the code 🦅
- [ ] One focused change per PR
- [ ] Description explains the *why*, not just the *what*

---

## 🎯 Good First Issues

Looking for a place to start? These are always available:

1. **Add your domain's ReasoningBank decisions** — share real problems you've solved
2. **Improve an agent's anti-patterns section** — add more "don't do this" rules
3. **Add NL Swarm keywords** for underrepresented domains (mobile, ML, game dev)
4. **Write a new example** in USAGE.md for a phase you've used
5. **Translate comments** in scripts to make them clearer
6. **Create a new issue template** for your use case

Browse [`good first issue`](https://github.com/ashrafmusa/agenticana/issues?q=is%3Aopen+label%3A%22good+first+issue%22) labels.

---

## 🏷️ Versioning

[Semantic Versioning](https://semver.org/):
- **MAJOR** — Breaking changes to agent YAML schema or MCP tool signatures
- **MINOR** — New agents, skills, phases, or MCP tools
- **PATCH** — Bug fixes, documentation, new ReasoningBank decisions

---

## 💬 Community & Questions

| Channel | Purpose |
|---------|---------|
| [GitHub Issues](https://github.com/ashrafmusa/agenticana/issues) | Bugs, feature requests |
| [GitHub Discussions](https://github.com/ashrafmusa/agenticana/discussions) | Ideas, Q&A, Show & Tell |
| PR comments | Code-specific feedback |

**No question is too small.** If something is confusing — that's a bug in our documentation, not a problem with you.

---

## 🦅 The Secretary Bird Standard

Every contribution to Agenticana should:
1. **Stomp** — solve a real problem, don't add noise
2. **Record** — document what you did and why
3. **Move forward** — leave the codebase better than you found it

*Thank you for contributing. You're building the system that proves AI can think before it acts.*
