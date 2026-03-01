/**
 * Agentica MCP — Agent Tools
 * Provides: agent_list, agent_get, skill_list
 */

const { z }  = require('zod');
const fs     = require('fs');
const path   = require('path');
const yaml   = require('js-yaml');  // Optional dep — fallback to raw file if not installed

const toolNames = ['agent_list', 'agent_get', 'skill_list'];

function safeParseYaml(content) {
  try {
    // Try yaml parse
    if (typeof yaml !== 'undefined' && yaml.load) {
      return yaml.load(content);
    }
  } catch { /* fall through */ }
  // Fallback: return raw content
  return { raw: content };
}

function register(server, agenticaRoot) {
  const agentsDir = path.join(agenticaRoot, 'agents');
  const skillsDir = path.join(agenticaRoot, 'skills');

  // ── agent_list ─────────────────────────────────────────────────────────────
  server.tool(
    'agent_list',
    'List all available Agentica agents with their metadata (model tier, complexity, capabilities).',
    {
      filter_tier: z.enum(['SIMPLE', 'MODERATE', 'COMPLEX', 'all']).default('all').describe('Filter by complexity tier'),
    },
    async ({ filter_tier }) => {
      const yamlFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.yaml'));
      const agents = [];

      for (const file of yamlFiles) {
        try {
          const content = fs.readFileSync(path.join(agentsDir, file), 'utf-8');
          const parsed  = safeParseYaml(content);
          if (filter_tier !== 'all' && parsed.complexity_tier !== filter_tier) continue;
          agents.push({
            name: parsed.name || file.replace('.yaml', ''),
            description: parsed.description || '',
            model_tier: parsed.model_tier || 'pro',
            complexity_tier: parsed.complexity_tier || 'MODERATE',
            domain: parsed.routing_hints?.domain || 'general',
            auto_invoke: parsed.routing_hints?.auto_invoke ?? false,
            capabilities_count: (parsed.capabilities || []).length,
          });
        } catch { /* skip unparseable files */ }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ count: agents.length, agents }, null, 2),
        }],
      };
    }
  );

  // ── agent_get ──────────────────────────────────────────────────────────────
  server.tool(
    'agent_get',
    'Get the full specification for a specific agent including capabilities, boundaries, and examples.',
    {
      name: z.string().describe('Agent name (e.g. "frontend-specialist", "orchestrator")'),
    },
    async ({ name }) => {
      const yamlPath = path.join(agentsDir, `${name}.yaml`);
      if (!fs.existsSync(yamlPath)) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: `Agent "${name}" not found`, available: fs.readdirSync(agentsDir).filter(f => f.endsWith('.yaml')).map(f => f.replace('.yaml', '')) }),
          }],
        };
      }
      const content = fs.readFileSync(yamlPath, 'utf-8');
      const parsed  = safeParseYaml(content);
      return { content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }] };
    }
  );

  // ── skill_list ─────────────────────────────────────────────────────────────
  server.tool(
    'skill_list',
    'List all available Agentica skills, optionally filtered by tier (1=Core, 2=Domain, 3=Utility).',
    {
      tier: z.number().int().min(1).max(3).optional().describe('Filter by tier: 1=Core, 2=Domain, 3=Utility'),
    },
    async ({ tier }) => {
      const tier1 = ['clean-code', 'brainstorming', 'plan-writing', 'intelligent-routing', 'behavioral-modes', 'parallel-agents'];
      const tier2 = ['frontend-design', 'mobile-design', 'api-patterns', 'database-design', 'testing-patterns', 'nextjs-react-expert', 'nodejs-best-practices', 'architecture', 'game-development', 'systematic-debugging'];

      const skillDirs = fs.existsSync(skillsDir)
        ? fs.readdirSync(skillsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name)
        : [];

      const skills = skillDirs.map(name => ({
        name,
        tier: tier1.includes(name) ? 1 : tier2.includes(name) ? 2 : 3,
        has_scripts: fs.existsSync(path.join(skillsDir, name, 'scripts')),
      })).filter(s => !tier || s.tier === tier);

      const byTier = { 1: [], 2: [], 3: [] };
      for (const s of skills) byTier[s.tier].push(s.name);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            total: skills.length,
            tier_filter: tier || 'all',
            by_tier: byTier,
            skills,
          }, null, 2),
        }],
      };
    }
  );
}

module.exports = { register, toolNames };
