#!/usr/bin/env node
/**
 * Etuki AI FinOps MCP Server — Local Stdio Edition
 * Implements all 6 local FinOps calculation & log-auditing tools in Node.js:
 *   1. list_supported_models
 *   2. pin_single_model_prefix_cache
 *   3. auto_route_task_by_quality_tier
 *   4. compress_and_fold_context
 *   5. reconcile_usage_receipt
 *   6. audit_local_usage_log
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

function findRateCard(modelId) {
  const models = CATALOG.models || [];
  if (!modelId) return models.find((m) => m.id.includes('claude-3.7-sonnet')) || models[0];
  const q = String(modelId).toLowerCase().trim();
  const exact = models.find((m) => m.id.toLowerCase() === q || m.id.toLowerCase().endsWith('/' + q));
  if (exact) return exact;
  const normQ = q.replace(/[^a-z0-9]/g, '');
  const fuzzy = models.find((m) => m.id.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normQ) || String(m.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(normQ));
  if (fuzzy) return fuzzy;
  return models.find((m) => m.id.includes('claude-3.7-sonnet')) || models[0];
}

function foldLogText(rawLog) {
  const lines = String(rawLog || '').split(/\r?\n/);
  if (lines.length <= 40) return { folded_text: rawLog, original_lines: lines.length, kept_lines: lines.length, reduction_pct: 0 };
  const head = lines.slice(0, 15);
  const tail = lines.slice(-15);
  const mid = lines.slice(15, -15);
  const errRe = /(error|exception|fail|fatal|traceback|syntaxerror|typeerror|referenceerror|assert|cannot find)/i;
  const keptMid = mid.filter((l) => errRe.test(l));
  const out = [...head, `... [Folded ${mid.length - keptMid.length} repetitive lines; preserved ${keptMid.length} error lines] ...`, ...keptMid, ...tail];
  return {
    original_lines: lines.length,
    kept_lines: out.length,
    reduction_pct: Number((((lines.length - out.length) / lines.length) * 100).toFixed(2)),
    folded_text: out.join('\n')
  };
}

function auditRawTranscript(rawText, defaultModel = 'anthropic/claude-3.7-sonnet') {
  const lines = String(rawText || '').trim().split(/\r?\n/).filter(Boolean);
  const turns = [];
  let prevTsMs = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('{')) continue;
    try {
      const obj = JSON.parse(line);
      const usage = obj.usage || obj.message?.usage || obj.response?.usage;
      if (!usage) continue;
      const inTok = Number(usage.input_tokens ?? usage.prompt_tokens ?? 0);
      const cRead = Number(usage.cache_read_input_tokens ?? usage.prompt_tokens_details?.cached_tokens ?? 0);
      const cWrite = Number(usage.cache_creation_input_tokens ?? 0);
      const outTok = Number(usage.output_tokens ?? usage.completion_tokens ?? 0);
      if (inTok + cRead + cWrite + outTok <= 0) continue;
      const rate = findRateCard(obj.model || obj.message?.model || defaultModel);
      const tsStr = obj.timestamp || obj.created_at || `Turn-${turns.length + 1}`;
      const ms = Date.parse(tsStr);
      const gapSec = prevTsMs && !Number.isNaN(ms) ? Math.round((ms - prevTsMs) / 1000) : 0;
      if (!Number.isNaN(ms)) prevTsMs = ms;
      const tIdx = turns.length + 1;
      const isBreak = tIdx > 1 && cWrite > 1024;
      const actualUsd = Number(((inTok * rate.input_usd_1m + cRead * rate.cache_read_usd_1m + cWrite * rate.cache_write_usd_1m + outTok * rate.output_usd_1m) / 1e6).toFixed(6));
      const optUsd = tIdx === 1 ? actualUsd : Number(((inTok * rate.input_usd_1m + (cRead + cWrite) * rate.cache_read_usd_1m + outTok * rate.output_usd_1m) / 1e6).toFixed(6));
      turns.push({
        turn: tIdx,
        model: rate.id,
        input_tokens: inTok,
        cache_read_tokens: cRead,
        cache_write_tokens: cWrite,
        output_tokens: outTok,
        actual_cost_usd: actualUsd,
        warm_optimized_usd: optUsd,
        cache_break: isBreak,
        reason: !isBreak ? 'OK' : gapSec > 300 ? `>5m TTL Expired (${gapSec}s gap)` : 'Prefix Hash Shift'
      });
    } catch {}
  }
  const totAct = Number(turns.reduce((s, t) => s + t.actual_cost_usd, 0).toFixed(6));
  const totOpt = Number(turns.reduce((s, t) => s + t.warm_optimized_usd, 0).toFixed(6));
  return {
    turns_analyzed: turns.length,
    cache_breaks_detected: turns.filter((t) => t.cache_break).length,
    total_actual_cost_usd: totAct,
    total_warm_optimized_usd: totOpt,
    recoverable_waste_usd: Number(Math.max(0, totAct - totOpt).toFixed(6)),
    turns
  };
}

const cliArgs = process.argv.slice(2);
if (cliArgs.includes('--ci-gate')) {
  const getArg = (f, d) => { const idx = cliArgs.indexOf(f); return idx !== -1 && cliArgs[idx + 1] ? cliArgs[idx + 1] : d; };
  const base = JSON.parse(fs.readFileSync(getArg('--baseline', 'baseline.json'), 'utf8'));
  const curr = JSON.parse(fs.readFileSync(getArg('--current', 'current.json'), 'utf8'));
  const maxCost = Number(getArg('--max-cost-increase', '10'));
  const costDelta = base.avg_request_cost_usd > 0 ? ((curr.avg_request_cost_usd - base.avg_request_cost_usd) / base.avg_request_cost_usd) * 100 : 0;
  const passed = costDelta <= maxCost;
  console.log(JSON.stringify({ gate_passed: passed, cost_delta_pct: Number(costDelta.toFixed(2)) }, null, 2));
  process.exit(passed ? 0 : 1);
}

const TOOLS = [
  {
    name: 'list_supported_models',
    description: 'Search verified OpenRouter and LiteLLM model rate cards locally (input, output, cache read, and cache write rates per 1M tokens).',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: { query: { type: 'string', description: 'Provider or model name filter (e.g. claude, gpt-4.1, gemini, deepseek)' } }
    }
  },
  {
    name: 'pin_single_model_prefix_cache',
    description: 'Calculate 10-turn prompt-cache breakeven turns, enterprise contracted rate discounts, and two-bucket retry cost attribution locally.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        model: { type: 'string', description: 'Model ID (e.g. anthropic/claude-3.7-sonnet, openai/gpt-4.1)' },
        prompt_tokens: { type: 'number', description: 'Static cached prefix token count' },
        contract_discount_multiplier: { type: 'number', description: 'Contracted discount multiplier (e.g. 0.85 for 15% discount)' },
        provider_infra_retry_rate: { type: 'number', description: 'HTTP 429/502/503/529 provider retry rate (e.g. 0.05)' },
        model_prompt_retry_rate: { type: 'number', description: 'Malformed output / tool retry rate (e.g. 0.08)' }
      }
    }
  },
  {
    name: 'auto_route_task_by_quality_tier',
    description: 'Calculate 6-turn coding session cost savings by splitting 4 repository scan turns (fast model) from 2 synthesis turns (flagship model with warm cache).',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        context_tokens: { type: 'number', description: 'Repository context token size (e.g. 80000 or 160000)' },
        flagship_model: { type: 'string', description: 'Primary synthesis model ID (e.g. anthropic/claude-3.7-sonnet)' },
        scan_model: { type: 'string', description: 'Fast scan model ID (e.g. google/gemini-2.5-flash)' }
      }
    }
  },
  {
    name: 'compress_and_fold_context',
    description: 'Fold repetitive middle lines of terminal/compiler logs while preserving head, tail, and all error/exception lines.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        raw_log: { type: 'string', description: 'Raw terminal or build log text to fold' }
      },
      required: ['raw_log']
    }
  },
  {
    name: 'reconcile_usage_receipt',
    description: 'Compare an actual billed dollar amount against official 1x model rate cards to check for relay markups or uncached prefix waste.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        model: { type: 'string', description: 'Model ID billed' },
        prompt_tokens: { type: 'number', description: 'Uncached input tokens' },
        cached_tokens: { type: 'number', description: 'Cache read tokens' },
        completion_tokens: { type: 'number', description: 'Output tokens' },
        actual_billed_usd: { type: 'number', description: 'Actual dollar amount deducted' }
      }
    }
  },
  {
    name: 'audit_local_usage_log',
    description: 'Parse raw JSONL usage lines locally in memory to detect mid-session prompt-cache breaks (>5m TTL expiry or prefix shifts).',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        jsonl_lines: { type: 'string', description: 'Newline-separated JSON usage objects' },
        model: { type: 'string', description: 'Fallback model ID' }
      },
      required: ['jsonl_lines']
    }
  }
];

function handleLocalToolCall(name, args = {}) {
  const models = CATALOG.models || [];
  if (name === 'list_supported_models') {
    const q = String(args.query || '').toLowerCase().trim();
    const matched = q ? models.filter((m) => JSON.stringify(m).toLowerCase().includes(q)).slice(0, 30) : models.slice(0, 30);
    return { total_catalog_models: models.length, matched_count: matched.length, models: matched };
  }
  if (name === 'pin_single_model_prefix_cache') {
    const m = findRateCard(args.model);
    const tok = Number(args.prompt_tokens || 150000);
    const cMult = Math.max(0.05, Math.min(2.0, Number(args.contract_discount_multiplier ?? 1.0)));
    const infR = Math.max(0, Number(args.provider_infra_retry_rate ?? 0.0));
    const modR = Math.max(0, Number(args.model_prompt_retry_rate ?? 0.0));
    const uncached10Turn = Number(((tok * 10 * Number(m.input_usd_1m)) / 1e6).toFixed(4));
    const cached10Turn = Number((((tok * Number(m.cache_write_usd_1m)) + (tok * 9 * Number(m.cache_read_usd_1m))) / 1e6).toFixed(4));
    const contractedCost = Number((cached10Turn * cMult).toFixed(6));
    const infraRetryCost = Number((contractedCost * infR).toFixed(6));
    const modelRetryCost = Number((contractedCost * modR).toFixed(6));
    return {
      reference_model: m.id,
      prompt_tokens: tok,
      uncached_10_turn_input_usd: uncached10Turn,
      warm_cache_pinned_10_turn_usd: cached10Turn,
      contracted_rate_cost_usd: contractedCost,
      provider_infra_retry_cost_usd: infraRetryCost,
      model_or_prompt_retry_cost_usd: modelRetryCost,
      effective_cost_per_completed_task_usd: Number((contractedCost + infraRetryCost + modelRetryCost).toFixed(6))
    };
  }
  if (name === 'auto_route_task_by_quality_tier') {
    const tok = Number(args.context_tokens || 160000);
    const flagM = findRateCard(args.flagship_model || 'anthropic/claude-3.7-sonnet');
    const scanM = findRateCard(args.scan_model || 'google/gemini-2.5-flash');
    const unrouted6Turn = Number(((tok * 6 * flagM.input_usd_1m) / 1e6).toFixed(4));
    const scan4Turn = Number(((tok * 4 * scanM.input_usd_1m) / 1e6).toFixed(4));
    const synth2TurnWarm = Number((((tok * flagM.cache_write_usd_1m) + (tok * flagM.cache_read_usd_1m)) / 1e6).toFixed(4));
    const totalRouted = Number((scan4Turn + synth2TurnWarm).toFixed(4));
    return {
      context_tokens: tok,
      flagship_model: flagM.id,
      scan_model: scanM.id,
      unrouted_6_turn_usd: unrouted6Turn,
      routed_4_scan_plus_2_warm_synthesis_usd: totalRouted,
      estimated_savings_usd: Number(Math.max(0, unrouted6Turn - totalRouted).toFixed(4))
    };
  }
  if (name === 'compress_and_fold_context') {
    return foldLogText(args.raw_log || '');
  }
  if (name === 'reconcile_usage_receipt') {
    const m = findRateCard(args.model);
    const pTok = Number(args.prompt_tokens || 100000);
    const cTok = Number(args.cached_tokens || 0);
    const oTok = Number(args.completion_tokens || 2000);
    const billed = Number(args.actual_billed_usd || 0);
    const officialUsd = Number(((pTok * m.input_usd_1m + cTok * m.cache_read_usd_1m + oTok * m.output_usd_1m) / 1e6).toFixed(6));
    const variance = Number((billed - officialUsd).toFixed(6));
    return {
      model: m.id,
      official_1x_expected_usd: officialUsd,
      actual_billed_usd: billed,
      variance_usd: variance,
      status: variance > 0.001 ? 'ABOVE_OFFICIAL_1X_LIST_RATE' : 'MATCHES_OR_BELOW_LIST_RATE'
    };
  }
  if (name === 'audit_local_usage_log') {
    return auditRawTranscript(args.jsonl_lines || '', args.model || 'anthropic/claude-3.7-sonnet');
  }
  return { error: `Unknown tool: ${name}` };
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
          serverInfo: { name: 'etuki-finops-mcp', version: '1.3.2' }
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
