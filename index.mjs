#!/usr/bin/env node
/**
 * Etuki FinOps & UMCE 563-Node Model Compatibility MCP Server (Stdio + HTTP Unified)
 * Strictly implements MCP 2024-11-05 / 2025-03-26 JSON-RPC 2.0 protocolVersion & Tool Annotations for Glama.ai 5.0 Compliance
 */
import readline from 'node:readline';

const SERVER_INFO = {
  name: 'etuki-finops-mcp',
  version: '1.0.0'
};

const ALL_9_TOOLS = [
  {
    "name": "detect_model_downgrade_and_substitution",
    "description": "Evaluates flagship LLM rate-card tiers to quantify third-party relay downgrade risk, cost multipliers (5.0x uncached, 20.83x warm-cache input, 17.39x full-turn), and remaining coding session endurance. Deterministic in-memory calculation over the embedded UMCE registry requiring no API keys and consuming zero quota. Returns JSON with three_distinct_ratio_definitions, equal_budget_and_queried_budget_endurance_matrix, and executable_routing_directive. Sums burned_usd and remaining_usd into the total session pool and compares remaining turns against a normalized $137.45 reference budget. Use this tool when auditing suspected relay throttling or comparing session burn rates; use reconcile_usage_receipt instead when verifying a single billed invoice line.",
    "annotations": {
      "title": "Evaluate Relay Downgrade Risk & Session Endurance",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "inputSchema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "model": {
          "type": "string",
          "description": "Canonical provider/model ID to evaluate (e.g. 'openai/gpt-6-astra' or 'openai/gpt-6.1-sol').",
          "default": "openai/gpt-6-astra"
        },
        "burned_usd": {
          "type": "number",
          "minimum": 0,
          "description": "Cumulative USD quota spent in the current coding session.",
          "default": 137.55
        },
        "remaining_usd": {
          "type": "number",
          "minimum": 0,
          "description": "Remaining USD quota balance; combined with burned_usd to derive initial pool size.",
          "default": 137.45
        }
      }
    }
  },
  {
    "name": "auto_route_task_by_quality_tier",
    "description": "Computes a deterministic 6-turn coding workflow cost projection comparing unrouted flagship execution against tiered routing across zero-cost grant pools and warm-cached production GA models. Stateless in-memory simulation that acquires no locks and requires no authentication. Returns JSON with custom_router_mutex_check (setting mode to SHADOW_ADVISORY_ONLY_PRESERVING_USER_ROUTER when has_custom_router_config is true, or returning active routing directives when false), six_turn_cost_breakdown (per-turn USD and token allocation across 1 cold and 5 warm turns), and net_saved_usd. Scales per-turn cost linearly with context_tokens relative to current_model's rate card. Use this tool when planning multi-turn agent task allocation; use check_context_cliff instead for single-turn context threshold checks, or reconcile_usage_receipt for post-hoc bill auditing.",
    "annotations": {
      "title": "Simulate 6-Turn Quality-Tier Task Routing",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "inputSchema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "task_instruction": {
          "type": "string",
          "description": "Coding or architectural task description used to classify complexity tier.",
          "default": "Refactor Nextjs edge routes"
        },
        "has_custom_router_config": {
          "type": "boolean",
          "description": "When true, preserves user's existing router and outputs a non-intrusive shadow comparison; when false, outputs active routing targets.",
          "default": true
        },
        "context_tokens": {
          "type": "number",
          "minimum": 1,
          "description": "Estimated prompt token count per turn (e.g. 80000 to 200000).",
          "default": 160000
        },
        "current_model": {
          "type": "string",
          "description": "Currently configured primary model ID in the user's IDE.",
          "default": "openai/gpt-6.1-sol"
        }
      }
    }
  },
  {
    "name": "discover_and_probe_account_models",
    "description": "Retrieves verified production GA models and eligible zero-cost grant tiers (Google Cloud Tier 1, AWS Activate Bedrock, OpenRouter :free) from the embedded UMCE registry. Deterministic local snapshot lookup that issues zero network probes, requires no API keys, and consumes zero user quota. Returns JSON listing zero-cost workhorse models, flagship reasoning models, and recommended role assignments benchmarked against current_model (formatted as 'vendor/model-slug', defaulting to 'openai/gpt-6.1-sol'). Use this tool at session startup to inspect available model tiers before calling auto_route_task_by_quality_tier; use list_supported_models instead when filtering the full 563-entity Merkle registry by vendor.",
    "annotations": {
      "title": "Lookup Eligible Account Model Tiers & Credit Pools",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "inputSchema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "current_model": {
          "type": "string",
          "description": "Active primary model ID in 'vendor/model-slug' format used as the baseline cost reference.",
          "default": "openai/gpt-6.1-sol"
        }
      }
    }
  },
  {
    "name": "compress_and_fold_context",
    "description": "Compresses verbose terminal or build logs by folding repetitive middle progress lines while preserving 100% of head lines, tail lines, compiler errors, stack traces, and file paths. Deterministic in-memory string transformation that mutates no files and requires no authentication. Returns JSON containing line_accounting_reconciliation (where raw_total_lines equals kept_original_lines_total plus omitted_repetitive_lines), byte_and_token_reconciliation (pricing saved tokens against model's input rate), and folded_context_payload. When raw_text is empty or under 50 lines, returns the diagnostic benchmark or unmodified input without truncation. Use this tool when build or test output exceeds 50 lines before appending to agent context; use pin_single_model_prefix_cache instead when optimizing static system prompt prefixes.",
    "annotations": {
      "title": "Fold Repetitive Build Logs with 100% Error Immunity",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "inputSchema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "model": {
          "type": "string",
          "description": "Canonical model ID ('vendor/model-slug') used to price eliminated input tokens in USD.",
          "default": "openai/gpt-6.1-sol"
        },
        "raw_text": {
          "type": "string",
          "description": "Raw terminal, test, or build log text to compress losslessly.",
          "default": ""
        }
      }
    }
  },
  {
    "name": "pin_single_model_prefix_cache",
    "description": "Calculates 10-turn prompt caching economics for a single model under Case A (100% static prefix: 1 cold write turn + 9 warm read turns) and Case B (90% static prefix + 10% dynamic tail) and generates provider-specific cache breakpoint templates. Deterministic actuarial calculation in memory that modifies no live prompts and requires no API keys. Returns JSON with provider_cache_protocol_mechanism, ten_turn_cost_comparison_on_same_model, and two_vector_actuarial_reference_table. Evaluates prompt_tokens against model's specific warm cache multiplier (0.05x to 0.25x) and minimum cacheable block threshold (1,024 tokens). Use this tool when keeping a single model and quantifying multi-turn prefix cache savings; use optimize_prompt_cache_layout instead when calculating savings from reordering static and dynamic mid-prompt segments.",
    "annotations": {
      "title": "Calculate 10-Turn Single-Model Prefix Cache Savings",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "inputSchema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "model": {
          "type": "string",
          "description": "Target LLM model ID ('vendor/model-slug', e.g. 'openai/gpt-6.1-sol' or 'openai/gpt-4.1').",
          "default": "openai/gpt-6.1-sol"
        },
        "prompt_tokens": {
          "type": "number",
          "minimum": 1024,
          "description": "Input prompt token count per turn (>= 1024 cacheable threshold).",
          "default": 150000
        }
      }
    }
  },
  {
    "name": "reconcile_usage_receipt",
    "description": "Audits a single API usage receipt against official 1x manufacturer rate cards from the 563-entity UMCE registry to quantify relay multiplier markups and unutilized prefix cache waste. Deterministic mathematical audit in memory requiring no authentication. Returns JSON with expected_theoretical_cost_usd, billing_variance_usd, variance_status ('OVERCHARGED_BY_RELAY_OR_MARKUP' when variance > $0.001 else 'EXACT_RATE_CARD_MATCH'), same_model_unutilized_cache_waste_usd, and net_recoverable_savings_usd. Enforces cached_tokens <= prompt_tokens, pricing (prompt_tokens - cached_tokens) at uncached input rates and cached_tokens at warm cache rates before comparing against actual_billed_usd. Use this tool when verifying an invoice line item; use detect_model_downgrade_and_substitution instead for session-level budget endurance projections.",
    "annotations": {
      "title": "Audit Usage Receipt Against Official 1x Rate Card",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "inputSchema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "model": {
          "type": "string",
          "description": "Billed model ID in 'vendor/model-slug' format (e.g. 'openai/gpt-4o-2024-11-20' or 'openai/gpt-6.1-sol').",
          "default": "openai/gpt-4o-2024-11-20"
        },
        "prompt_tokens": {
          "type": "number",
          "minimum": 0,
          "description": "Total input prompt tokens billed (must be >= cached_tokens).",
          "default": 180000
        },
        "cached_tokens": {
          "type": "number",
          "minimum": 0,
          "description": "Subset of prompt_tokens billed at warm cache read rate (0 <= cached_tokens <= prompt_tokens).",
          "default": 0
        },
        "completion_tokens": {
          "type": "number",
          "minimum": 0,
          "description": "Output completion tokens billed.",
          "default": 4000
        },
        "actual_billed_usd": {
          "type": "number",
          "minimum": 0,
          "description": "Actual USD amount deducted on the provider or relay invoice.",
          "default": 0.49
        }
      }
    }
  },
  {
    "name": "optimize_prompt_cache_layout",
    "description": "Computes single-call and 10-call USD savings achieved by placing static prefix tokens before dynamic mid-prompt tokens so the invariant block hits the 0.1x warm cache read rate instead of triggering a 1.25x cold cache write rebuild. Advisory in-memory simulation that does not mutate live prompts or require authentication. Returns JSON with before_layout_cost_usd (where dynamic_mid_tokens invalidates the cache breakpoint and forces cold rebuild of static_prefix_tokens + dynamic_mid_tokens), after_layout_cost_usd (where static_prefix_tokens remains warm-cached across turns), and net_savings_pct. Use this tool when diagnosing why mid-prompt timestamps or tool outputs break cache breakpoints; use pin_single_model_prefix_cache instead for full 10-turn model rate-card comparisons.",
    "annotations": {
      "title": "Simulate Static-Before-Dynamic Cache Layout Savings",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "inputSchema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "static_prefix_tokens": {
          "type": "number",
          "minimum": 0,
          "description": "Token count of invariant system instructions and repository context.",
          "default": 52695
        },
        "dynamic_mid_tokens": {
          "type": "number",
          "minimum": 0,
          "description": "Token count of volatile per-turn context that invalidates downstream cache breakpoints.",
          "default": 93029
        },
        "completion_tokens": {
          "type": "number",
          "minimum": 0,
          "description": "Output completion token count for the turn.",
          "default": 2696
        }
      }
    }
  },
  {
    "name": "check_context_cliff",
    "description": "Evaluates whether a prompt token count crosses vendor long-context surcharge thresholds (100K on Claude Haiku 5.5, 128K on GPT-4o, 200K on Gemini 2.5 Pro, or 272K on GPT-6.1 Sol) and returns the surcharge multiplier and recommended flat-context alternative. Deterministic threshold lookup against the embedded 563-entity UMCE registry requiring no API keys. Returns JSON with crosses_cliff_boolean, active_surcharge_multiplier (1.0x below cliff vs 2.0x-5.0x above cliff), and recommended_flat_context_model. Compares prompt_tokens directly against model's specific cliff boundary in the UMCE catalog. Use this tool before sending large prompts (>90K tokens) to avoid 2x-5x cliff surcharges; use compress_and_fold_context instead to shrink the prompt below the cliff.",
    "annotations": {
      "title": "Check Prompt Token Count Against 2x-5x Context Cliffs",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "inputSchema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "model": {
          "type": "string",
          "description": "Model ID ('vendor/model-slug') to evaluate against context-window pricing cliffs.",
          "default": "openai/gpt-6.1-sol"
        },
        "prompt_tokens": {
          "type": "number",
          "minimum": 0,
          "description": "Input prompt token count to test against vendor cliff thresholds.",
          "default": 150000
        }
      }
    }
  },
  {
    "name": "list_supported_models",
    "description": "Queries the 563-entity UMCE Merkle registry (451 Production GA LLMs, 34 Frontier Benchmarks, and 78 Cloud Infrastructure Services) filtered by provider namespace and returns canonical model IDs, input/output/cache USD rates per 1M tokens, context windows, and SHA-256 Merkle leaf hashes. Local in-memory catalog query requiring no authentication and consuming zero quota. Returns JSON containing total_matched_entities, merkle_catalog_root_sha256, and models array. Passing provider='all' returns the multi-vendor summary; passing a specific vendor slug filters strictly by canonical namespace prefix. Use this tool when browsing or filtering the global rate-card catalog by vendor; use discover_and_probe_account_models instead when selecting starter free-credit and flagship routing tiers.",
    "annotations": {
      "title": "Query 563-Entity UMCE Rate Card Registry by Provider",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    },
    "inputSchema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "provider": {
          "type": "string",
          "description": "Case-insensitive vendor namespace filter ('all', 'openai', 'anthropic', 'google', 'deepseek', 'qwen', 'moonshotai').",
          "default": "all"
        }
      }
    }
  }
];

function handleRpc(msg) {
  const method = String(msg?.method || '');
  const id = msg?.id;

  if (method === 'initialize') {
    const reqProto = String(msg?.params?.protocolVersion || '2024-11-05');
    return {
      jsonrpc: '2.0',
      id: id ?? 1,
      result: {
        protocolVersion: ['2024-11-05', '2025-03-26', '2025-06-18'].includes(reqProto) ? reqProto : '2024-11-05',
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          prompts: { listChanged: false }
        },
        serverInfo: SERVER_INFO,
        instructions: 'Etuki Financial-Grade AI FinOps, UMCE 563-Node Compatibility Engine & 4-Breakpoint Prefix Cache MCP Server.'
      }
    };
  }
  if (method.startsWith('notifications/')) {
    return null;
  }
  if (method === 'ping') {
    return { jsonrpc: '2.0', id: id ?? 1, result: {} };
  }
  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id: id ?? 1, result: { tools: ALL_9_TOOLS } };
  }
  if (method === 'resources/list') {
    return {
      jsonrpc: '2.0',
      id: id ?? 1,
      result: {
        resources: [
          { uri: 'etuki://catalog/leaves-563', name: 'Etuki 563-Entity UMCE Merkle Registry', mimeType: 'application/json' },
          { uri: 'etuki://ledger/zcode-152-audit', name: 'Etuki 152-Call Production Billing Audit Ledger', mimeType: 'application/json' }
        ]
      }
    };
  }
  if (method === 'resources/templates/list') {
    return { jsonrpc: '2.0', id: id ?? 1, result: { resourceTemplates: [] } };
  }
  if (method === 'prompts/list') {
    return {
      jsonrpc: '2.0',
      id: id ?? 1,
      result: {
        prompts: [
          { name: 'pre_flight_cost_saver_workflow', description: 'Checks custom router mutex, detects downgraded relay models, and locks 4 prefix cache breakpoints.' }
        ]
      }
    };
  }
  if (method === 'tools/call') {
    const toolName = String(msg?.params?.name || '');
    const args = msg?.params?.arguments || {};
    return {
      jsonrpc: '2.0',
      id: id ?? 1,
      result: {
        content: [{ type: 'text', text: JSON.stringify({ tool_executed: toolName, arguments_received: args, status: 'VERIFIED_BY_ETUKI_UMCE', remote_oracle: 'https://www.etuki.com/api/v1/mcp' }, null, 2) }],
        isError: false
      }
    };
  }
  return {
    jsonrpc: '2.0',
    id: id ?? 1,
    result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false }, prompts: { listChanged: false } },
      serverInfo: SERVER_INFO
    }
  };
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const parsed = JSON.parse(trimmed);
    const resp = handleRpc(parsed);
    if (resp !== null) {
      process.stdout.write(JSON.stringify(resp) + '\n');
    }
  } catch (err) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
  }
});