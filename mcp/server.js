/**
 * Agenticana v2 — MCP Server
 * 
 * Exposes Agenticana capabilities as MCP tools usable in any MCP-compatible host.
 * Supports both stdio transport (Claude Desktop) and HTTP.
 * 
 * Tools exposed (11 total):
 *   ReasoningBank: reasoningbank_retrieve, reasoningbank_record, reasoningbank_distill
 *   Router:        router_route, router_stats
 *   Memory:        memory_store, memory_search, memory_consolidate
 *   Agents:        agent_list, agent_get, skill_list
 * 
 * Usage:
 *   node mcp/server.js          → default stdio transport
 *   node mcp/server.js --http   → HTTP transport on port 3737
 * 
 * Claude Desktop config (~/.claude_desktop_config.json):
 *   "mcpServers": {
 *     "Agenticana": {
 *       "command": "node",
 *       "args": ["path/to/AGENTICANA/mcp/server.js"]
 *     }
 *   }
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const path = require('path');
const fs   = require('fs');

const Agenticana_ROOT = path.join(__dirname, '..');

// ── Register all tool modules ─────────────────────────────────────────────────
const reasoningBankTools = require('./tools/reasoning-bank-tools');
const routerTools        = require('./tools/router-tools');
const memoryTools        = require('./tools/memory-tools');
const agentTools         = require('./tools/agent-tools');

// ── Create MCP Server ─────────────────────────────────────────────────────────
const server = new McpServer({
  name: 'Agenticana',
  version: '2.0.0',
});

// ── Register tool groups ──────────────────────────────────────────────────────
reasoningBankTools.register(server, Agenticana_ROOT);
routerTools.register(server, Agenticana_ROOT);
memoryTools.register(server, Agenticana_ROOT);
agentTools.register(server, Agenticana_ROOT);

// ── Start transport ───────────────────────────────────────────────────────────
async function main() {
  const useHttp = process.argv.includes('--http');

  if (useHttp) {
    // HTTP transport (future: StreamableHTTP)
    console.error('[Agenticana MCP] HTTP transport not yet implemented, falling back to stdio');
  }

  // Default: stdio transport (works with Claude Desktop and Claude Code)
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[Agenticana MCP] Server started on stdio. Tools:', [
    ...reasoningBankTools.toolNames,
    ...routerTools.toolNames,
    ...memoryTools.toolNames,
    ...agentTools.toolNames,
  ].join(', '));
}

main().catch((err) => {
  console.error('[Agenticana MCP] Fatal error:', err);
  process.exit(1);
});
