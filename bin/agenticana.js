#!/usr/bin/env node
/**
 * Agenticana v2 CLI — npx Agenticana init
 *
 * Usage:
 *   npx Agenticana init                          # install into current directory (lite)
 *   npx Agenticana init --path d:\Projects\App   # specific path
 *   npx Agenticana init --mode full              # with local memory + scripts
 *   npx Agenticana init --mode link              # create .code-workspace only
 *   Agenticana status                            # check MCP server & tool status
 *   Agenticana bank stats                        # ReasoningBank statistics
 *   Agenticana route "build a login page"        # test model routing
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const VERSION      = require('../package.json').version;
const Agenticana_DIR = path.join(__dirname, '..');

// ── ANSI color helpers ────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  white:  '\x1b[97m',
};
const log  = (msg) => console.log(msg);
const ok   = (msg) => log(`  ${c.green}✅${c.reset} ${msg}`);
const warn = (msg) => log(`  ${c.yellow}⚠️ ${c.reset} ${msg}`);
const err  = (msg) => log(`  ${c.red}❌${c.reset} ${msg}`);
const info = (msg) => log(`  ${c.gray}→${c.reset}  ${msg}`);
const h1   = (msg) => log(`\n${c.bold}${c.cyan}${msg}${c.reset}\n`);

// ── Banner ────────────────────────────────────────────────────────────────────
function banner() {
  log(`
${c.cyan}${c.bold}  ╔═══════════════════════════════════════╗
  ║        Agenticana v${VERSION} CLI              ║
  ║  Self-learning AI agents for VS Code  ║
  ╚═══════════════════════════════════════╝${c.reset}
`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dest, overwrite = false) {
  if (fs.existsSync(dest) && !overwrite) return false;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

function writeFile(dest, content, overwrite = false) {
  if (fs.existsSync(dest) && !overwrite) return false;
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, content, 'utf8');
  return true;
}

function mergeJson(dest, additions) {
  let existing = {};
  if (fs.existsSync(dest)) {
    try { existing = JSON.parse(fs.readFileSync(dest, 'utf8')); } catch {}
  }
  const merged = deepMerge(existing, additions);
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, JSON.stringify(merged, null, 2), 'utf8');
}

function deepMerge(target, source) {
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof target[k] === 'object') {
      out[k] = deepMerge(target[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ── Commands ──────────────────────────────────────────────────────────────────

/** Agenticana init [--path <dir>] [--mode lite|full|link] */
function cmdInit(args) {
  const pathArg = args['--path'] || args['-p'] || process.cwd();
  const mode    = args['--mode'] || args['-m'] || 'lite';
  const target  = path.resolve(pathArg);
  const mcpServer = path.join(Agenticana_DIR, 'mcp', 'server.js').replace(/\\/g, '/');

  if (!fs.existsSync(target)) {
    err(`Target directory not found: ${target}`);
    process.exit(1);
  }

  const projectName = path.basename(target);

  banner();
  log(`${c.bold}Installing Agenticana v${VERSION} into:${c.reset} ${c.cyan}${target}${c.reset}`);
  log(`${c.bold}Mode:${c.reset} ${c.yellow}${mode}${c.reset}\n`);

  // ── LINK mode ───────────────────────────────────────────────────────────────
  if (mode === 'link') {
    h1('Creating VS Code multi-root workspace...');
    const wsContent = JSON.stringify({
      folders: [
        { name: projectName, path: target.replace(/\\/g, '/') },
        { name: 'Agenticana v2 (toolkit)', path: Agenticana_DIR.replace(/\\/g, '/') },
      ],
      settings: {
        'github.copilot.chat.codeGeneration.useInstructionFiles': true,
      },
    }, null, 2);

    const wsFile = path.join(Agenticana_DIR, `${projectName}.code-workspace`);
    fs.writeFileSync(wsFile, wsContent, 'utf8');
    ok(`Workspace: ${wsFile}`);
    log('');
    info(`Open in VS Code: code "${wsFile}"`);
    return;
  }

  // ── Shared: LITE + FULL ─────────────────────────────────────────────────────
  h1('[1/3] Copilot instructions...');

  const copilotSrc  = path.join(Agenticana_DIR, '.github', 'copilot-instructions.md');
  const copilotDest = path.join(target, '.github', 'copilot-instructions.md');
  if (copyFile(copilotSrc, copilotDest)) ok('copilot-instructions.md');
  else warn('copilot-instructions.md already exists — skipped');

  h1('[2/3] VS Code integration...');

  // mcp.json
  const mcpConfig = {
    servers: {
      Agenticana: {
        type: 'stdio',
        command: 'node',
        args: [mcpServer],
        env: { Agenticana_ROOT: Agenticana_DIR.replace(/\\/g, '/') },
      },
    },
  };
  const mcpDest = path.join(target, '.vscode', 'mcp.json');
  if (writeFile(mcpDest, JSON.stringify(mcpConfig, null, 2))) ok('mcp.json');
  else warn('mcp.json already exists — skipped');

  // Merge settings.json
  const settingsDest = path.join(target, '.vscode', 'settings.json');
  mergeJson(settingsDest, {
    'github.copilot.chat.codeGeneration.useInstructionFiles': true,
    'github.copilot.enable': { '*': true },
  });
  ok('settings.json (merged)');

  // ── FULL mode extras ─────────────────────────────────────────────────────────
  if (mode === 'full') {
    h1('[3/3] Local memory + scripts...');

    // Scripts
    for (const script of ['reasoning_bank.py', 'router_cli.py', 'distill_patterns.py']) {
      const src  = path.join(Agenticana_DIR, 'scripts', script);
      const dest = path.join(target, '.Agenticana', 'scripts', script);
      if (copyFile(src, dest)) ok(`scripts/${script}`);
    }

    // Local decisions.json (fresh)
    const bankDest = path.join(target, '.Agenticana', 'memory', 'reasoning-bank', 'decisions.json');
    const bankInit = JSON.stringify({
      version: '2.0',
      description: `Project-local ReasoningBank for ${projectName}`,
      project: projectName,
      last_consolidated: null,
      total_decisions: 0,
      decisions: [],
      patterns: [],
    }, null, 2);
    if (writeFile(bankDest, bankInit)) ok('.Agenticana/memory/reasoning-bank/decisions.json');

    // Router config
    const routerSrc  = path.join(Agenticana_DIR, 'router', 'config.json');
    const routerDest = path.join(target, '.Agenticana', 'router', 'config.json');
    if (copyFile(routerSrc, routerDest)) ok('.Agenticana/router/config.json');

    // .gitignore append
    const gitignore = path.join(target, '.gitignore');
    if (fs.existsSync(gitignore)) {
      const existing = fs.readFileSync(gitignore, 'utf8');
      if (!existing.includes('Agenticana')) {
        fs.appendFileSync(gitignore, '\n# Agenticana v2\n.Agenticana/memory/trajectories/\n.Agenticana/__pycache__/\n');
        ok('.gitignore (appended .Agenticana rules)');
      }
    }
  } else {
    log(`  ${c.gray}[3/3] Lite mode — skipping local scripts/memory (use --mode full for these)${c.reset}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  log(`
${c.cyan}${c.bold}═══════════════════════════════════════${c.reset}
${c.green}${c.bold}  ✅ Agenticana installed into ${projectName}!${c.reset}
${c.cyan}${c.bold}═══════════════════════════════════════${c.reset}

${c.bold}Next steps:${c.reset}
  ${c.gray}1.${c.reset} Open ${c.cyan}${target}${c.reset} in VS Code
  ${c.gray}2.${c.reset} Copilot Chat (${c.yellow}Ctrl+Alt+I${c.reset}) → ${c.yellow}🔧 Tools${c.reset} → Enable ${c.cyan}"Agenticana"${c.reset}
  ${c.gray}3.${c.reset} Start working:
     ${c.gray}"@debugger the login returns 401"${c.reset}
     ${c.gray}"@frontend-specialist add a dashboard card"${c.reset}
     ${c.gray}"@orchestrator plan the billing feature"${c.reset}
`);
}

/** Agenticana status */
function cmdStatus() {
  banner();
  h1('Agenticana Health Check');

  // Node.js
  try {
    const v = execSync('node --version', { encoding: 'utf8' }).trim();
    ok(`Node.js ${v}`);
  } catch { err('Node.js not found'); }

  // Python
  try {
    const v = execSync('python --version', { encoding: 'utf8' }).trim();
    ok(`Python ${v}`);
  } catch { err('Python not found'); }

  // MCP deps
  const mcpModules = path.join(Agenticana_DIR, 'mcp', 'node_modules');
  if (fs.existsSync(mcpModules)) ok('MCP server dependencies installed');
  else warn('MCP deps missing — run: cd mcp && npm install');

  // ReasoningBank
  const bankFile = path.join(Agenticana_DIR, 'memory', 'reasoning-bank', 'decisions.json');
  if (fs.existsSync(bankFile)) {
    try {
      const bank = JSON.parse(fs.readFileSync(bankFile, 'utf8'));
      ok(`ReasoningBank: ${bank.decisions?.length ?? 0} decisions, ${bank.patterns?.length ?? 0} patterns`);
    } catch { warn('ReasoningBank file unreadable'); }
  } else warn('ReasoningBank not found');

  // Tools check
  for (const tool of ['reasoning-bank-tools', 'router-tools', 'memory-tools', 'agent-tools']) {
    try {
      require(path.join(Agenticana_DIR, 'mcp', 'tools', tool));
      ok(`mcp/tools/${tool}.js`);
    } catch (e) { err(`mcp/tools/${tool}.js: ${e.message}`); }
  }

  log('');
  info(`Agenticana root: ${Agenticana_DIR}`);
  info(`MCP server:    ${path.join(Agenticana_DIR, 'mcp', 'server.js')}`);
  log('');
}

/** Agenticana bank [stats|distill|retrieve <query>] */
function cmdBank(args, rest) {
  const sub = rest[0] || 'stats';
  const pythonArgs = sub === 'retrieve'
    ? ['scripts/reasoning_bank.py', 'retrieve', rest.slice(1).join(' ')]
    : ['scripts/reasoning_bank.py', sub];
  const result = spawnSync('python', pythonArgs, { cwd: Agenticana_DIR, stdio: 'inherit' });
  process.exit(result.status ?? 0);
}

/** Agenticana route "<task>" */
function cmdRoute(args, rest) {
  const task = rest.join(' ');
  if (!task) { err('Usage: Agenticana route "your task description"'); process.exit(1); }
  const result = spawnSync('python', ['scripts/router_cli.py', task], { cwd: Agenticana_DIR, stdio: 'inherit' });
  process.exit(result.status ?? 0);
}

/** Agenticana help */
function cmdHelp() {
  banner();
  log(`${c.bold}Usage:${c.reset}
  Agenticana init [--path <dir>] [--mode lite|full|link]
  Agenticana status
  Agenticana bank [stats|distill|retrieve <query>]
  Agenticana route "<task description>"
  Agenticana help

${c.bold}Examples:${c.reset}
  ${c.gray}npx Agenticana init${c.reset}                         Install into current directory
  ${c.gray}npx Agenticana init --mode full${c.reset}             Install with local memory
  ${c.gray}npx Agenticana init --path d:\\Projects\\App${c.reset}  Install into specific project
  ${c.gray}npx Agenticana bank retrieve "auth login"${c.reset}   Search ReasoningBank
  ${c.gray}npx Agenticana route "build dashboard"${c.reset}      Get model routing recommendation
  ${c.gray}npx Agenticana status${c.reset}                       Health check all components
`);
}

// ── Argument Parser ───────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {};
  const rest = [];
  let i = 0;
  while (i < argv.length) {
    if (argv[i].startsWith('--') || argv[i].startsWith('-')) {
      args[argv[i]] = argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[++i] : true;
    } else {
      rest.push(argv[i]);
    }
    i++;
  }
  return { args, rest };
}

// ── Entry Point ───────────────────────────────────────────────────────────────
const argv       = process.argv.slice(2);
const command    = argv[0] || 'help';
const { args, rest } = parseArgs(argv.slice(1));

switch (command) {
  case 'init':    cmdInit(args); break;
  case 'status':  cmdStatus(); break;
  case 'bank':    cmdBank(args, rest); break;
  case 'route':   cmdRoute(args, rest); break;
  case '--version':
  case '-v':
    log(`Agenticana v${VERSION}`); break;
  case 'help':
  case '--help':
  case '-h':
  default:
    cmdHelp();
}
