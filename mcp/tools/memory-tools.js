/**
 * Agenticana v2 — MCP Memory Tools
 *
 * Tools:
 *   memory_store       — Write a key/value entry to persistent memory
 *   memory_search      — Search memory entries by keyword or tag
 *   memory_consolidate — Summarize and prune stale entries (keep top by recency + score)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const TOOL_NAMES = ['memory_store', 'memory_search', 'memory_consolidate'];

/**
 * Resolve the project-aware memory file path.
 * Precedence:
 *   1. Agenticana_MEMORY_FILE env var  (explicit override)
 *   2. .Agenticana/memory/memory.json  (project-local, if run from project dir)
 *   3. <Agenticana_ROOT>/memory/memory.json  (global Agenticana store)
 */
function resolveMemoryFile(AgenticanaRoot) {
  if (process.env.Agenticana_MEMORY_FILE) {
    return process.env.Agenticana_MEMORY_FILE;
  }
  // Check for project-local store (cwd-relative)
  const localStore = path.join(process.cwd(), '.Agenticana', 'memory', 'memory.json');
  if (fs.existsSync(path.dirname(localStore))) {
    return localStore;
  }
  // Fall back to global Agenticana store
  return path.join(AgenticanaRoot, 'memory', 'memory.json');
}

function loadMemory(filePath) {
  if (!fs.existsSync(filePath)) {
    return { version: '2.0', entries: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return { version: '2.0', entries: [] };
  }
}

function saveMemory(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Register all memory tools on an McpServer instance.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {string} AgenticanaRoot
 */
function register(server, AgenticanaRoot) {
  const { z } = require('zod');

  // ── memory_store ─────────────────────────────────────────────────────────────
  server.tool(
    'memory_store',
    'Store a key/value memory entry with optional tags and quality score. Use this to save important patterns, decisions, or notes for later retrieval. Overwrites are opt-in.',
    {
      key:       z.string().describe('Unique identifier / short label for this memory (e.g. "stripe-webhook-pattern")'),
      value:     z.string().describe('The content to store — decision, snippet, note, or structured JSON string'),
      tags:      z.array(z.string()).optional().describe('Tags for filtering later (e.g. ["auth","backend"])'),
      score:     z.number().min(0).max(1).optional().describe('Quality/confidence score 0-1 (default 1.0)'),
      overwrite: z.boolean().optional().describe('Overwrite if key already exists (default false)'),
    },
    async ({ key, value, tags = [], score = 1.0, overwrite = false }) => {
      const filePath = resolveMemoryFile(AgenticanaRoot);
      const store    = loadMemory(filePath);

      const existingIdx = store.entries.findIndex((e) => e.key === key);

      if (existingIdx !== -1 && !overwrite) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status:  'skipped',
              reason:  `Key "${key}" already exists. Use overwrite:true to replace.`,
              existing: store.entries[existingIdx],
            }, null, 2),
          }],
        };
      }

      const entry = {
        key,
        value,
        tags,
        score,
        created_at: existingIdx !== -1 ? store.entries[existingIdx].created_at : nowIso(),
        updated_at: nowIso(),
        access_count: existingIdx !== -1 ? (store.entries[existingIdx].access_count ?? 0) : 0,
      };

      if (existingIdx !== -1) {
        store.entries[existingIdx] = entry;
      } else {
        store.entries.push(entry);
      }

      saveMemory(filePath, store);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status:       'stored',
            key,
            total_entries: store.entries.length,
            store_path:   filePath,
          }, null, 2),
        }],
      };
    }
  );

  // ── memory_search ─────────────────────────────────────────────────────────────
  server.tool(
    'memory_search',
    'Search stored memory entries by keyword, phrase, or tags. Returns results ranked by score and recency. Use before starting work to find relevant past context.',
    {
      query: z.string().describe('Keyword(s) or phrase to search in keys, values, and tags'),
      tags:  z.array(z.string()).optional().describe('Filter results to entries containing ALL of these tags'),
      limit: z.number().int().min(1).max(50).optional().describe('Max results to return (default 10)'),
    },
    async ({ query, tags = [], limit = 10 }) => {
      const filePath = resolveMemoryFile(AgenticanaRoot);
      const store    = loadMemory(filePath);

      if (!store.entries.length) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ results: [], message: 'Memory store is empty' }, null, 2),
          }],
        };
      }

      const q = query.toLowerCase();

      let results = store.entries.filter((e) => {
        const matchesQuery =
          e.key.toLowerCase().includes(q) ||
          e.value.toLowerCase().includes(q) ||
          (e.tags || []).some((t) => t.toLowerCase().includes(q));

        const matchesTags =
          tags.length === 0 ||
          tags.every((tag) => (e.tags || []).includes(tag));

        return matchesQuery && matchesTags;
      });

      // Sort: score desc, then updated_at desc
      results.sort((a, b) => {
        const scoreDiff = (b.score ?? 1) - (a.score ?? 1);
        if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      results = results.slice(0, limit);

      // Track access count
      const resultKeys = new Set(results.map((r) => r.key));
      store.entries = store.entries.map((e) =>
        resultKeys.has(e.key) ? { ...e, access_count: (e.access_count ?? 0) + 1 } : e
      );
      saveMemory(filePath, store);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query,
            results_count: results.length,
            results: results.map(({ key, value, tags: t, score: s, updated_at }) => ({
              key, value, tags: t, score: s, updated_at,
            })),
          }, null, 2),
        }],
      };
    }
  );

  // ── memory_consolidate ────────────────────────────────────────────────────────
  server.tool(
    'memory_consolidate',
    'Prune low-quality or stale memory entries to keep the store lean. Retains top entries ranked by score, access frequency, and recency. Supports dry_run preview.',
    {
      max_entries:    z.number().int().min(10).max(10000).optional().describe('Max entries to keep (default 500)'),
      min_score:      z.number().min(0).max(1).optional().describe('Remove entries below this score (default 0.3)'),
      dry_run:        z.boolean().optional().describe('Preview what would be removed without saving (default false)'),
    },
    async ({ max_entries = 500, min_score = 0.3, dry_run = false }) => {
      const filePath = resolveMemoryFile(AgenticanaRoot);
      const store    = loadMemory(filePath);

      const before = store.entries.length;

      // Filter: remove low-score entries
      let filtered = store.entries.filter((e) => (e.score ?? 1) >= min_score);

      // Sort by composite rank: score × log(access_count+1) × recency_weight
      const now = Date.now();
      filtered.sort((a, b) => {
        const recencyA = 1 / (1 + (now - new Date(a.updated_at).getTime()) / 86400000);
        const recencyB = 1 / (1 + (now - new Date(b.updated_at).getTime()) / 86400000);
        const rankA = (a.score ?? 1) * Math.log((a.access_count ?? 0) + 2) * recencyA;
        const rankB = (b.score ?? 1) * Math.log((b.access_count ?? 0) + 2) * recencyB;
        return rankB - rankA;
      });

      // Cap to max_entries
      filtered = filtered.slice(0, max_entries);
      const after   = filtered.length;
      const removed = before - after;

      if (!dry_run) {
        store.entries = filtered;
        store.last_consolidated = nowIso();
        saveMemory(filePath, store);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status:     dry_run ? 'dry_run' : 'consolidated',
            before,
            after,
            removed,
            min_score_filter: min_score,
            max_entries_cap:  max_entries,
            store_path:       filePath,
          }, null, 2),
        }],
      };
    }
  );
}

module.exports = { register, toolNames: TOOL_NAMES };
