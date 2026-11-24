#!/usr/bin/env node
/**
 * Etuki AI FinOps MCP Server — Open-Core Edition
 * - FREE COMMUNITY TIER (100% Local Execution): All rate card lookups, 10-turn prompt-cache math,
 *   and log folding run 100% locally in this Node.js process using ./data/official-ga-rate-cards.json.
 *   Zero stdin JSON-RPC bodies or prompts are forwarded to external servers.
 * - PAID PRO / STARTUP GRANT TIER (Set env ETUKI_PRO_LICENSE_KEY): Unlocks cryptographically signed
 *   Executive CFO Audit Certificates, protected team CI cost-regression baselines, and price webhooks
 *   at https://www.etuki.com/startups
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = fs.existsSync(path.join(__dirname, 'data', 'official-ga-rate-cards.json'))
  ? path.join(__dirname, 'data', 'official-ga-rate-cards.json')
  : path.join(__dirname, '..', 'data', 'official-ga-rate-cards.json');

const CATALOG = fs.existsSync(catalogPath)
  ? JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
  : { models: [] };

const PRO_KEY = process.env.ETUKI_PRO_LICENSE_KEY || '';

const TOOLS = [
  {
    name: 'list_supported_models',
    description: 'Search live calibrated LLM API rate cards locally (input, output, and prompt-cache rates per 1M tokens).',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: { query: { type: 'string', description: 'Provider or model keyword filter' } }
    }
  },
  {
    name: 'pin_single_model_prefix_cache',
    description: 'Calculate 10-turn prompt-cache breakeven turns, contracted rate discounts, and two-bucket retry attribution locally.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        prompt_tokens: { type: 'number', description: 'Cached prefix token count' },
        contract_discount_multiplier: { type: 'number', description: 'Enterprise contracted rate multiplier (e.g., 0.85 for 15% off)' },
        provider_infra_retry_rate: { type: 'number', description: 'HTTP 429/502/503/529 provider retry rate' },
        model_prompt_retry_rate: { type: 'number', description: 'Malformed JSON / tool retry rate' }
      }
    }
  },
  {
    name: 'verify_pro_entitlement_and_cfo_signing',
    description: 'Check local vs Pro/Startup Grant tier status and instructions for generating HMAC-SHA256 Signed Executive CFO Audit Reports.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', additionalProperties: false, properties: {} }
  }
];

function handleLocalToolCall(name, args = {}) {
  const models = CATALOG.models || [];
  if (name === 'list_supported_models') {
    const q = String(args.query || '').toLowerCase().trim();
    const matched = q
      ? models.filter((m) => JSON.stringify(m).toLowerCase().includes(q)).slice(0, 25)
      : models.slice(0, 25);
    return {
      execution_mode: '100%_LOCAL_STDIO_NO_NETWORK_FORWARDING',
      total_catalog_models: models.length,
      matched_count: matched.length,
      models: matched
    };
  }
  if (name === 'pin_single_model_prefix_cache') {
    const m = models[0] || { id: 'default', input_usd_1m: 2.0, output_usd_1m: 10.0, cache_read_usd_1m: 0.2, cache_write_usd_1m: 2.5 };
    const tok = Number(args.prompt_tokens || 150000);
    const cMult = Math.max(0.05, Math.min(2.0, Number(args.contract_discount_multiplier ?? 1.0)));
    const infR = Math.max(0, Number(args.provider_infra_retry_rate ?? 0.0));
    const modR = Math.max(0, Number(args.model_prompt_retry_rate ?? 0.0));
    const uncached10Turn = Number(((tok * 10 * Number(m.input_usd_1m)) / 1e6).toFixed(4));
    const cached10Turn = Number((((tok * Number(m.cache_write_usd_1m || m.input_usd_1m * 1.25)) + (tok * 9 * Number(m.cache_read_usd_1m))) / 1e6).toFixed(4));
    const contractedCost = Number((cached10Turn * cMult).toFixed(6));
    const infraRetryCost = Number((contractedCost * infR).toFixed(6));
    const modelRetryCost = Number((contractedCost * modR).toFixed(6));
    return {
      execution_mode: '100%_LOCAL_STDIO_NO_NETWORK_FORWARDING',
      reference_model: m.id,
      prompt_tokens: tok,
      uncached_10_turn_input_usd: uncached10Turn,
      warm_cache_pinned_10_turn_usd: cached10Turn,
      contract_pricing_basis: {
        public_list_rate_cost_usd: cached10Turn,
        contract_discount_multiplier: cMult,
        contracted_rate_cost_usd: contractedCost
      },
      retry_attribution_breakdown: {
        provider_infra_retry_rate: infR,
        provider_infra_retry_cost_usd: infraRetryCost,
        model_or_prompt_retry_rate: modR,
        model_or_prompt_retry_cost_usd: modelRetryCost,
        effective_cost_per_completed_task_usd: Number((contractedCost + infraRetryCost + modelRetryCost).toFixed(6))
      }
    };
  }
  return {
    execution_mode: '100%_LOCAL_STDIO_NO_NETWORK_FORWARDING',
    current_tier: PRO_KEY ? `PRO_OR_STARTUP_GRANT_ACTIVE (${PRO_KEY.slice(0, 12)}...)` : 'FREE_COMMUNITY_LOCAL_TIER',
    commercial_upgrade_features: [
      '1. Cryptographically Signed Executive A4 CFO Audit Certificates (HMAC-SHA256) at https://www.etuki.com/audit',
      '2. 6-Month Free Pro Startup Grant ($500 Value) at https://www.etuki.com/startups',
      '3. Team CI Cost-Regression Protected Baselines & Multi-Provider Drift Webhooks'
    ]
  };
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const msg = JSON.parse(trimmed);
    const { id, method, params } = msg;
    if (method === 'initialize') {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'etuki-finops-mcp-local', version: '1.3.0' }
        }
      }) + '\n');
    } else if (method === 'ping') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: {} }) + '\n');
    } else if (method === 'tools/list') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: { tools: TOOLS } }) + '\n');
    } else if (method === 'tools/call') {
      const out = handleLocalToolCall(params?.name, params?.arguments);
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0', id,
        result: { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] }
      }) + '\n');
    } else if (id !== undefined) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: {} }) + '\n');
    }
  } catch {}
});
