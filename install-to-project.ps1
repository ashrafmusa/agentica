# Agentica v2 — Install to Any Project (Windows)
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File install-to-project.ps1 -ProjectPath "d:\path\to\myproject"
#   powershell -ExecutionPolicy Bypass -File install-to-project.ps1 -ProjectPath "d:\path\to\myproject" -Mode lite
#   powershell -ExecutionPolicy Bypass -File install-to-project.ps1 -ProjectPath "d:\path\to\myproject" -Mode full
#
# Modes:
#   lite   — Copilot instructions + VS Code settings only (5 files, 2 min)
#   full   — Everything: scripts, memory, router, MCP server (complete setup)
#   link   — Creates a VS Code multi-root workspace (no file copying)

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,

    [Parameter(Mandatory=$false)]
    [ValidateSet("lite", "full", "link")]
    [string]$Mode = "lite"
)

$AgenticaRoot = $PSScriptRoot
$ProjectPath  = (Resolve-Path $ProjectPath -ErrorAction SilentlyContinue)?.Path

if (-not $ProjectPath -or -not (Test-Path $ProjectPath)) {
    Write-Host "❌ Project path not found: $ProjectPath" -ForegroundColor Red
    Write-Host "   Usage: .\install-to-project.ps1 -ProjectPath `"d:\MyProject`"" -ForegroundColor Gray
    exit 1
}

$ProjectName = Split-Path $ProjectPath -Leaf

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Agentica v2 → $ProjectName  [$Mode mode]" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── HELPER: Copy file with parent dir creation ─────────────────────────────────
function Copy-AgenticaFile {
    param([string]$Src, [string]$Dest)
    $destDir = Split-Path $Dest -Parent
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
    if (-not (Test-Path $Dest)) {
        Copy-Item $Src $Dest
        Write-Host "  ✅ $(Split-Path $Dest -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  $(Split-Path $Dest -Leaf) [already exists, skipped]" -ForegroundColor DarkGray
    }
}

# ─────────────────────────────────────────────────────────────────────────────
#  MODE: LINK — Multi-root workspace (no file copying, recommended)
# ─────────────────────────────────────────────────────────────────────────────
if ($Mode -eq "link") {
    Write-Host "[LINK MODE] Creating VS Code multi-root workspace..." -ForegroundColor Yellow
    Write-Host "  This lets you use Agentica tools while working on $ProjectName" -ForegroundColor Gray
    Write-Host ""

    $workspaceContent = @{
        folders = @(
            @{ name = $ProjectName; path = $ProjectPath },
            @{ name = "Agentica v2 (toolkit)"; path = $AgenticaRoot }
        )
        settings = @{
            "github.copilot.chat.codeGeneration.useInstructionFiles" = $true
        }
    } | ConvertTo-Json -Depth 5

    $workspaceFile = Join-Path $AgenticaRoot "$ProjectName.code-workspace"
    Set-Content $workspaceFile $workspaceContent -Encoding UTF8
    Write-Host "  ✅ Workspace file: $workspaceFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "  → Open this in VS Code:" -ForegroundColor White
    Write-Host "    code `"$workspaceFile`"" -ForegroundColor DarkCyan
    Write-Host ""
    Write-Host "  ℹ️  Copilot will see both your project AND Agentica tools." -ForegroundColor Gray
    exit 0
}

# ─────────────────────────────────────────────────────────────────────────────
#  MODE: LITE — Copilot instructions + VS Code settings (minimum viable)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "[1/3] Copying Copilot instructions..." -ForegroundColor Yellow

# .github/copilot-instructions.md
$copilotSrc  = Join-Path $AgenticaRoot ".github\copilot-instructions.md"
$copilotDest = Join-Path $ProjectPath ".github\copilot-instructions.md"
Copy-AgenticaFile $copilotSrc $copilotDest

# .vscode/mcp.json (with Agentica's MCP server path baked in)
Write-Host "[2/3] Configuring VS Code MCP + settings..." -ForegroundColor Yellow
$vscodeDir = Join-Path $ProjectPath ".vscode"
if (-not (Test-Path $vscodeDir)) { New-Item -ItemType Directory -Path $vscodeDir | Out-Null }

$mcpServerPath = Join-Path $AgenticaRoot "mcp\server.js"
$mcpConfig = @{
    servers = @{
        agentica = @{
            type    = "stdio"
            command = "node"
            args    = @($mcpServerPath.Replace("\", "/"))
            env     = @{ AGENTICA_ROOT = $AgenticaRoot.Replace("\", "/") }
        }
    }
} | ConvertTo-Json -Depth 5

$mcpDest = Join-Path $vscodeDir "mcp.json"
if (-not (Test-Path $mcpDest)) {
    Set-Content $mcpDest $mcpConfig -Encoding UTF8
    Write-Host "  ✅ mcp.json" -ForegroundColor Green
} else {
    Write-Host "  ⏭️  mcp.json [already exists]" -ForegroundColor DarkGray
}

# Merge VS Code settings (don't overwrite existing settings)
$settingsDest = Join-Path $vscodeDir "settings.json"
$agenticaSettings = @{
    "github.copilot.chat.codeGeneration.useInstructionFiles" = $true
    "github.copilot.enable" = @{ "*" = $true }
}
if (Test-Path $settingsDest) {
    $existing = Get-Content $settingsDest | ConvertFrom-Json -AsHashtable -ErrorAction SilentlyContinue
    if ($existing) {
        foreach ($key in $agenticaSettings.Keys) { $existing[$key] = $agenticaSettings[$key] }
        $existing | ConvertTo-Json -Depth 5 | Set-Content $settingsDest -Encoding UTF8
        Write-Host "  ✅ settings.json [merged Agentica keys]" -ForegroundColor Green
    }
} else {
    $agenticaSettings | ConvertTo-Json -Depth 5 | Set-Content $settingsDest -Encoding UTF8
    Write-Host "  ✅ settings.json" -ForegroundColor Green
}

# ─────────────────────────────────────────────────────────────────────────────
#  MODE: FULL — Also copy scripts + memory + router
# ─────────────────────────────────────────────────────────────────────────────
if ($Mode -eq "full") {
    Write-Host "[3/3] Copying Agentica scripts, memory, and router..." -ForegroundColor Yellow

    # scripts/
    $scriptsDir = Join-Path $ProjectPath ".agentica\scripts"
    if (-not (Test-Path $scriptsDir)) { New-Item -ItemType Directory -Path $scriptsDir | Out-Null }
    Copy-Item (Join-Path $AgenticaRoot "scripts\reasoning_bank.py") (Join-Path $scriptsDir "reasoning_bank.py") -Force
    Copy-Item (Join-Path $AgenticaRoot "scripts\router_cli.py")     (Join-Path $scriptsDir "router_cli.py")     -Force
    Copy-Item (Join-Path $AgenticaRoot "scripts\distill_patterns.py") (Join-Path $scriptsDir "distill_patterns.py") -Force
    Write-Host "  ✅ .agentica/scripts/ (reasoning_bank.py, router_cli.py, distill_patterns.py)" -ForegroundColor Green

    # memory/
    $memDir = Join-Path $ProjectPath ".agentica\memory\reasoning-bank"
    if (-not (Test-Path $memDir)) { New-Item -ItemType Directory -Path $memDir | Out-Null }
    $emptyBank = @{
        version = "2.0"
        description = "Project-level ReasoningBank for $ProjectName"
        last_consolidated = $null
        total_decisions = 0
        decisions = @()
        patterns = @()
    } | ConvertTo-Json -Depth 3
    $bankDest = Join-Path $memDir "decisions.json"
    if (-not (Test-Path $bankDest)) {
        Set-Content $bankDest $emptyBank -Encoding UTF8
        Write-Host "  ✅ .agentica/memory/reasoning-bank/decisions.json [fresh]" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  decisions.json [already exists]" -ForegroundColor DarkGray
    }

    # router config
    $routerDir = Join-Path $ProjectPath ".agentica\router"
    if (-not (Test-Path $routerDir)) { New-Item -ItemType Directory -Path $routerDir | Out-Null }
    Copy-Item (Join-Path $AgenticaRoot "router\config.json") (Join-Path $routerDir "config.json") -Force
    Write-Host "  ✅ .agentica/router/config.json" -ForegroundColor Green

    # Add .agentica to .gitignore memory folder (decisions grow and shouldn't be committed by default)
    $gitignorePath = Join-Path $ProjectPath ".gitignore"
    $gitignoreEntry = "`n# Agentica v2 memory (optional: commit to share patterns with team)`n.agentica/memory/trajectories/"
    if (Test-Path $gitignorePath) {
        $content = Get-Content $gitignorePath -Raw
        if ($content -notmatch "agentica") {
            Add-Content $gitignorePath $gitignoreEntry
            Write-Host "  ✅ .gitignore [added .agentica/memory/trajectories/]" -ForegroundColor Green
        }
    }
} else {
    Write-Host "[3/3] Lite mode — skipping scripts/memory (use -Mode full for those)" -ForegroundColor DarkGray
}

# ── Final Summary ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ✅ Agentica v2 installed into $ProjectName!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Open your project in VS Code:" -ForegroundColor Gray
Write-Host "     code `"$ProjectPath`"" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  2. Open Copilot Chat (Ctrl+Alt+I) → 🔧 Tools → Enable 'agentica'" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Start working — example:" -ForegroundColor Gray
Write-Host "     `"@debugger the /api/users endpoint returns 401`"" -ForegroundColor DarkCyan
Write-Host "     `"@frontend-specialist build a dashboard card for user stats`"" -ForegroundColor DarkCyan
Write-Host ""

if ($Mode -eq "full") {
    Write-Host "  4. Use project-local ReasoningBank:" -ForegroundColor Gray
    Write-Host "     python .agentica\scripts\reasoning_bank.py stats" -ForegroundColor DarkCyan
    Write-Host ""
}
