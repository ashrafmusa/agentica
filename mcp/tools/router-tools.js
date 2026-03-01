/**
 * Agentica MCP — Router Tools
 * Provides: router_route, router_stats
 */

const { z }        = require('zod');
const { execSync } = require('child_process');
const path         = require('path');

const toolNames = ['router_route', 'router_stats'];

function register(server, agenticaRoot) {
  const scriptPath = path.join(agenticaRoot, 'scripts', 'router_cli.py');

  function runRouter(args) {
    try {
      const result = execSync(`python "${scriptPath}" ${args}`, {
        encoding: 'utf-8',
        cwd: agenticaRoot,
        timeout: 15000,
      });
      return JSON.parse(result);
    } catch (err) {
      return { error: err.message };
    }
  }

  // ── router_route ───────────────────────────────────────────────────────────
  server.tool(
    'router_route',
    'Get model and context strategy recommendation for a task. Call this before expensive agent invocations to optimize token usage.',
    {
      task:  z.string().describe('The task description to route'),
      agent: z.string().default('orchestrator').describe('Which agent will handle the task'),
      rb_similarity: z.number().min(0).max(1).default(0).describe('ReasoningBank similarity if pre-checked (0-1)'),
    },
    async ({ task, agent, rb_similarity }) => {
      const args = `"${task.replace(/"/g, '\\"')}" --agent "${agent}" --rb-similarity ${rb_similarity}`;
      const result = runRouter(args);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ── router_stats ───────────────────────────────────────────────────────────
  server.tool(
    'router_stats',
    'Get the Model Router configuration and estimated token savings breakdown.',
    {},
    async () => {
      const result = runRouter('--stats');
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );
}

module.exports = { register, toolNames };
