# Contributing to Agenticana v2

Thank you for your interest in contributing! Agenticana is built by developers for developers — every contribution makes the kit smarter.

## 🗺️ What You Can Contribute

| Contribution | Where | Impact |
|---|---|---|
| New agent | `agents/{name}.yaml` + `agents/{name}.md` | High |
| New skill | `skills/{name}/SKILL.md` | Medium |
| ReasoningBank decisions | `memory/reasoning-bank/decisions.json` | High |
| Bug fix in scripts | `scripts/*.py` or `mcp/tools/*.js` | High |
| Router improvements | `router/*.js` | High |
| Documentation | `*.md` files | Medium |

---

## 🚀 Getting Started

```bash
git clone https://github.com/ashrafmusa/AGENTICANA.git
cd Agenticana

# Install all dependencies
powershell -ExecutionPolicy Bypass -File setup.ps1   # Windows
# OR
pip install -r requirements.txt && cd mcp && npm install  # macOS/Linux

# Verify everything works
python scripts/verify_all.py .
python scripts/reasoning_bank.py stats
python scripts/router_cli.py "test task" --compact
```

---

## 📋 Adding a New Agent

1. **Create the YAML spec** (machine-readable):
```bash
cp agents/frontend-specialist.yaml agents/your-agent.yaml
```

Edit `agents/your-agent.yaml` — follow the schema in `schemas/agent-schema.json`:
```yaml
name: your-agent
version: "2.0"
description: "One-line description of what this agent specializes in"
model_tier: pro          # lite | flash | pro | pro-extended
complexity_tier: COMPLEX # SIMPLE | MODERATE | COMPLEX
token_budget: 8000
skills:
  - clean-code
  - your-relevant-skill
capabilities:
  - "What this agent can do (specific)"
boundaries:
  - "What this agent should NOT do"
routing_hints:
  domain: your-domain
  keywords: ["keyword1", "keyword2"]
  auto_invoke: true
```

2. **Create the MD rules file** (human-readable instructions for the AI):
```bash
# Create agents/your-agent.md with:
# - Deep domain expertise
# - Coding rules specific to this domain
# - Anti-patterns to avoid
# - Example interactions
```

3. **Validate your agent:**
```bash
# Check YAML is valid
python -c "import yaml; yaml.safe_load(open('agents/your-agent.yaml'))"

# Check CI would pass
python -c "
import yaml, json
schema = json.load(open('schemas/agent-schema.json'))
data = yaml.safe_load(open('agents/your-agent.yaml'))
required = schema.get('required', [])
missing = [k for k in required if k not in data]
if missing: print('Missing:', missing)
else: print('Valid!')
"
```

---

## 🧠 Contributing Decisions to ReasoningBank

The ReasoningBank gets smarter with real decisions. If you've solved something interesting, share it:

1. Add your decision to `memory/reasoning-bank/decisions.json`:
```json
{
  "id": "rb-XXX",
  "timestamp": "2026-01-01T00:00:00Z",
  "task": "Your task description",
  "task_type": "feature|bug|performance|security|refactor",
  "agent": "agent-name",
  "decision": "What was decided and why",
  "outcome": "What happened as a result",
  "success": true,
  "tokens_used": 0,
  "model_used": "pro",
  "embedding": null,
  "tags": ["tag1", "tag2"]
}
```

2. Run distillation to see if your decision creates a new pattern:
```bash
python scripts/distill_patterns.py --dry-run
```

---

## 🔧 Adding a Skill

```bash
mkdir skills/your-skill
```

Create `skills/your-skill/SKILL.md` with frontmatter:
```yaml
---
name: your-skill
version: "1.0"
tier: 2           # 1=Core, 2=Domain, 3=Utility
token_cost: MEDIUM # LOW | MEDIUM | HIGH
domains: ["your-domain"]
lazy: false
---

# Your Skill Instructions

[Detailed instructions for the AI on how to apply this skill]
```

---

## 🧪 Before Submitting a PR

Run the full validation suite:

```bash
# All checks must pass
python scripts/verify_all.py .

# Specific checks
python scripts/reasoning_bank.py stats
python -c "import yaml; [yaml.safe_load(open(f'agents/{f}')) for f in __import__('os').listdir('agents') if f.endswith('.yaml')]; print('All YAMLs valid')"
cd mcp && node -e "['./tools/memory-tools','./tools/reasoning-bank-tools','./tools/router-tools','./tools/agent-tools'].forEach(m=>require(m)); process.exit(0)"
```

---

## 📐 Code Style

- **JavaScript:** No ESM, use CommonJS (`require`/`module.exports`). Functions documented with JSDoc.
- **Python:** Type hints preferred. Follow PEP 8. Functions < 40 lines.
- **YAML:** Follow `schemas/agent-schema.json`. All required fields must be present.
- **Markdown:** Clear headings, code blocks with language tags, tables for structured data.

---

## 📬 Pull Request Guidelines

1. **Title:** `[agent]` / `[skill]` / `[fix]` / `[docs]` / `[ci]` prefix
2. **Description:** What you changed and why. Include example output if adding a script.
3. **Tests:** CI must pass. For new agents, include at least 2 example interactions in the YAML.
4. **One thing per PR:** Keep PRs focused. Separate agent additions from bug fixes.

---

## 🏷️ Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** — Breaking changes to agent YAML schema or MCP tool signatures
- **MINOR** — New agents, skills, or MCP tools
- **PATCH** — Bug fixes, documentation, new ReasoningBank decisions

---

## 💬 Questions?

Open an [issue](https://github.com/ashrafmusa/AGENTICANA/issues) with the `question` label.
