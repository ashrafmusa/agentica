/**
 * Agentica MCP — ReasoningBank Tools
 * Provides: reasoningbank_retrieve, reasoningbank_record, reasoningbank_distill
 */

const { z }    = require('zod');
const { execSync } = require('child_process');
const path     = require('path');

const toolNames = ['reasoningbank_retrieve', 'reasoningbank_record', 'reasoningbank_distill'];

function register(server, agenticaRoot) {
  const scriptPath = path.join(agenticaRoot, 'scripts', 'reasoning_bank.py');

  function runPython(args) {
    try {
      const result = execSync(`python "${scriptPath}" ${args}`, {
        encoding: 'utf-8',
        cwd: agenticaRoot,
        timeout: 30000,
      });
      return JSON.parse(result);
    } catch (err) {
      return { error: err.message, stderr: err.stderr };
    }
  }

  // ── reasoningbank_retrieve ─────────────────────────────────────────────────
  server.tool(
    'reasoningbank_retrieve',
    'Query the ReasoningBank for similar past agent decisions. Returns top-K matches with similarity scores. Use before planning to check if a pattern already exists.',
    {
      query: z.string().describe('Task description to search for similar past decisions'),
      k:     z.number().int().min(1).max(10).default(5).describe('Number of results to return'),
    },
    async ({ query, k }) => {
      const result = runPython(`retrieve "${query.replace(/"/g, '\\"')}" --k ${k}`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  // ── reasoningbank_record ───────────────────────────────────────────────────
  server.tool(
    'reasoningbank_record',
    'Store a new decision in the ReasoningBank after completing a task. This enables self-learning by capturing what worked.',
    {
      task:     z.string().describe('The task that was performed'),
      decision: z.string().describe('The decision/approach taken'),
      outcome:  z.string().describe('What happened as a result'),
      success:  z.boolean().describe('Was the outcome successful?'),
      agent:    z.string().default('unknown').describe('Which agent handled this'),
      tags:     z.array(z.string()).default([]).describe('Relevant tags for categorization'),
    },
    async ({ task, decision, outcome, success, agent, tags }) => {
      const tagsArg = tags.length ? `--tags ${tags.join(' ')}` : '';
      const args = [
        'record',
        `--task "${task.replace(/"/g, '\\"')}"`,
        `--decision "${decision.replace(/"/g, '\\"')}"`,
        `--outcome "${outcome.replace(/"/g, '\\"')}"`,
        `--success ${success}`,
        `--agent "${agent}"`,
        tagsArg,
      ].filter(Boolean).join(' ');
      const result = runPython(args);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ── reasoningbank_distill ──────────────────────────────────────────────────
  server.tool(
    'reasoningbank_distill',
    'Extract recurring patterns from stored decisions. Run after accumulating 5+ decisions to improve future routing.',
    {},
    async () => {
      const result = runPython('distill');
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );
}

module.exports = { register, toolNames };
