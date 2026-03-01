# Changelog

All notable changes to Agentica are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [2.0.0] — 2026-03-01

### 🚀 Major Release — Agentica v2

#### Added
- **ReasoningBank** — Vector-based decision memory with cosine similarity search. Stores past decisions, retrieves similar patterns, distills recurring solutions. Pre-seeded with 10 real decisions.
- **Model Router** — Intelligent task complexity scoring (1-10). Auto-selects `lite/flash/pro/pro-extended` model. ~40% average token savings. Node.js engine with Python CLI wrapper.
- **MCP Server** — 11 tools exposed via Model Context Protocol: `reasoningbank_retrieve`, `reasoningbank_record`, `reasoningbank_distill`, `router_route`, `router_stats`, `memory_store`, `memory_search`, `memory_consolidate`, `agent_list`, `agent_get`, `skill_list`.
- **20 Agent YAML Specs** — All agents now have machine-readable YAML specifications (`agents/*.yaml`) validated against `schemas/agent-schema.json`.
- **Memory Tools** — `memory_store`, `memory_search`, `memory_consolidate` with project-aware path resolution and score-based ranking.
- **`npx agentica init`** — One-command project installation. Supports `lite`, `full`, and `link` modes.
- **`agentica status`** — Health check CLI for all components.
- **VS Code Deep Integration** — `.vscode/mcp.json`, `.vscode/settings.json` with Copilot custom instructions, `.vscode/launch.json` with debug configs.
- **`.github/copilot-instructions.md`** — Auto-loaded by Copilot Chat, teaches it all 20 agents and coding rules.
- **`install-to-project.ps1`** — Windows PowerShell project installer with lite/full/link modes.
- **GitHub Actions CI** — Validates agents, skills, MCP modules, JSON/YAML syntax, and secret scanning on every push.
- **GitHub Actions Release** — Automated releases on version tags with npm publishing.
- **ARCHITECTURE.md** — Comprehensive system architecture document.
- **3-Tier Skill System** — Skills categorized as Core (always), Domain (match), Utility (explicit). Strategy-aware loading: FULL/COMPRESSED/MINIMAL.
- **`distill_patterns.py`** — Automated pattern distillation from decisions. Clusters by tag, scores by success rate.
- **`verify_all.py`** — Full health check script for all Agentica components.
- **`schemas/agent-schema.json`** + **`schemas/skill-schema.json`** — JSON Schema validation for all agent and skill definitions.
- **Token Optimization** — MINIMAL strategy (Tier-1 only) saves ~30% tokens. COMPRESSED saves ~15%. ReasoningBank Fast Path (similarity ≥ 0.85) saves ~60%.
- **Self-Learning Loop** — Record decisions → distill patterns → Fast Path activates for similar tasks.
- **Project-Local Memory** — `full` install mode adds `.agentica/` folder with project-specific ReasoningBank.
- **Team Knowledge Sync** — `.agentica/memory/reasoning-bank/` committed to git shares patterns across team.

#### Changed
- `GEMINI.md` updated with v2 protocols: Phase -1 (ReasoningBank), Step 0 (Model Router), Tier-Aware Skill Loading, Request Classifier table.
- All agent `.md` files now have corresponding `.yaml` spec counterparts.

#### Architecture
- **ReasoningBank storage:** JSON-based (zero infrastructure, portable)
- **Embedding model:** `all-MiniLM-L6-v2` via `sentence-transformers` with TF-based fallback
- **MCP transport:** stdio (Claude Desktop / VS Code) with HTTP stub for future
- **Router engine:** Node.js with Python CLI fallback
- **Agent specs:** YAML + JSON Schema validation

---

## [1.0.0] — 2025-12-01

### Initial Release

#### Added
- 20 specialist agent `.md` files with rules and personas
- 36 skills organized into a 3-tier hierarchy
- `GEMINI.md` — AI behavior protocol file
- Basic `scripts/` directory with utility scripts
- `.vscode/` configuration files
- Initial agent routing via `intelligent-routing` skill

---

[2.0.0]: https://github.com/ashrafmusa/agentica/releases/tag/v2.0.0
[1.0.0]: https://github.com/ashrafmusa/agentica/releases/tag/v1.0.0
