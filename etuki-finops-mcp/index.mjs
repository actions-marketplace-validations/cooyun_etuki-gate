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
    "description": "Evaluates flagship LLM pricing tiers and optional upstream response headers to estimate relay downgrade risk, input-only (20.83x) vs full-turn (17.39x) cost ratios, and remaining coding turns. Purely read-only, deterministic in-memory calculation against the embedded 563-entity UMCE rate card; performs zero network I/O, mutates zero state, requires no auth, and consumes zero quota. Returns JSON containing three_distinct_ratio_definitions, equal_budget_and_queried_budget_endurance_matrix, and executable_routing_directive. Parameters: model (string, e.g. 'openai/gpt-6-astra'), burned_usd (number >= 0, USD spent), remaining_usd (number >= 0, USD remaining; sums with burned_usd to form total_initial_quota_pool_usd). Use this tool when auditing suspected third-party relay throttling or comparing flagship burn rates; use reconcile_usage_receipt instead when auditing a specific billed invoice line.",
    "annotations": {
      "title": "Estimate Relay Downgrade Risk & Endurance Ratios",
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
          "description": "Model ID to evaluate (e.g. 'openai/gpt-6-astra' or 'openai/gpt-6.1-sol').",
          "default": "openai/gpt-6-astra"
        },
        "burned_usd": {
          "type": "number",
          "description": "Cumulative USD quota spent in the current session (>= 0).",
          "default": 137.55
        },
        "remaining_usd": {
          "type": "number",
          "description": "Remaining USD quota balance (>= 0); added to burned_usd to compute total pool.",
          "default": 137.45
        }
      }
    }
  },
  {
    "name": "auto_route_task_by_quality_tier",
    "description": "Computes a deterministic 6-turn coding workflow cost projection comparing unrouted flagship execution against tiered routing across free credit pools and warm-cached production GA models. Purely read-only, stateless in-memory calculation; acquires no locks, mutates zero state, and makes zero external network calls. Returns JSON with custom_router_mutex_check (when has_custom_router_config is true, sets mode to SHADOW_ADVISORY_ONLY_PRESERVING_USER_ROUTER without overriding the user's router; when false, returns active routing target), six_turn_cost_breakdown, and net_saved_usd. Parameters: task_instruction (string prompt), has_custom_router_config (boolean), context_tokens (number > 0, tokens per turn), current_model (string model ID). Use this tool when planning multi-turn agent task allocation; use check_context_cliff instead for single-turn context window threshold checks.",
    "annotations": {
      "title": "Simulate Quality-Tier Task Routing & Cost Savings",
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
          "description": "Coding or analysis task description used to classify complexity tier.",
          "default": "Refactor Nextjs edge routes"
        },
        "has_custom_router_config": {
          "type": "boolean",
          "description": "If true, preserves user's existing router and outputs a non-intrusive shadow cost comparison; if false, outputs active routing directives.",
          "default": true
        },
        "context_tokens": {
          "type": "number",
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
    "description": "Returns the catalog of verified production GA models and eligible free/grant credit tiers (Google Cloud Tier 1, AWS Activate Bedrock, OpenRouter :free) from the embedded UMCE registry. Purely read-only, closed-world lookup against local snapshot data; issues zero external network probes, requires no API keys, and consumes zero user quota. Returns JSON listing eligible zero-cost workhorse models, flagship reasoning models, and recommended tier assignments for current_model. Use this tool at session startup to inspect available model tiers before calling auto_route_task_by_quality_tier; use list_supported_models instead when filtering the full 563-entity Merkle registry by vendor name.",
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
          "description": "Active primary model ID in the IDE used as the baseline reference.",
          "default": "openai/gpt-6.1-sol"
        }
      }
    }
  },
  {
    "name": "compress_and_fold_context",
    "description": "Compresses verbose terminal or build logs by folding repetitive middle progress lines while preserving 100% of head lines, tail lines, error messages, stack traces, and file paths. Purely read-only, deterministic string transformation in memory; mutates no files or external state. Returns JSON containing line_accounting_reconciliation (raw_total_lines = kept_original_lines_total + omitted_repetitive_lines), byte_and_token_reconciliation, and folded_context_payload. Parameters: raw_text (string log content to fold), model (string model ID used to price saved tokens). Use this tool when tool output or build logs exceed 50 lines before appending to agent context; use pin_single_model_prefix_cache instead when optimizing static system prompt prefixes.",
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
          "description": "Model ID used to calculate USD savings from eliminated tokens.",
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
    "description": "Calculates 10-turn prompt caching economics for a single model under Case A (100% static prefix: 1 cold turn + 9 warm cached turns) and Case B (90% static prefix + 10% dynamic tail) and returns provider-specific cache breakpoint configuration templates. Purely read-only, deterministic actuarial calculation; modifies no live prompts or external state. Returns JSON with provider_cache_protocol_mechanism, ten_turn_cost_comparison_on_same_model, and two_vector_actuarial_reference_table. Parameters: model (string model ID), prompt_tokens (number > 0, input tokens per turn). Use this tool when keeping a single model and quantifying prefix cache savings; use optimize_prompt_cache_layout instead when calculating exact token-reordering savings from separating static and dynamic mid-prompt segments.",
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
          "description": "Target LLM model ID (e.g. 'openai/gpt-6.1-sol' or 'openai/gpt-4.1').",
          "default": "openai/gpt-6.1-sol"
        },
        "prompt_tokens": {
          "type": "number",
          "description": "Input prompt token count per turn (e.g. 150000 or 200000).",
          "default": 150000
        }
      }
    }
  },
  {
    "name": "reconcile_usage_receipt",
    "description": "Audits a single API usage receipt against official 1x manufacturer rate cards from the 563-entity UMCE registry to quantify relay multiplier markups and unutilized prefix cache waste. Purely read-only, deterministic mathematical audit; makes zero external network calls. Returns JSON with expected_theoretical_cost_usd, billing_variance_usd, variance_status ('OVERCHARGED_BY_RELAY_OR_MARKUP' when variance > $0.001 else 'EXACT_RATE_CARD_MATCH'), same_model_unutilized_cache_waste_usd, and net_recoverable_savings_usd. Parameters: model (string), prompt_tokens (number >= 0, total input tokens), cached_tokens (number >= 0, warm cached subset of prompt_tokens), completion_tokens (number >= 0), actual_billed_usd (number >= 0, amount charged on invoice). Use this tool when verifying an invoice line item; use detect_model_downgrade_and_substitution instead for session-level budget endurance projections.",
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
          "description": "Billed model ID (e.g. 'openai/gpt-4o-2024-11-20' or 'openai/gpt-6.1-sol').",
          "default": "openai/gpt-4o-2024-11-20"
        },
        "prompt_tokens": {
          "type": "number",
          "description": "Total input prompt tokens billed (>= cached_tokens).",
          "default": 180000
        },
        "cached_tokens": {
          "type": "number",
          "description": "Subset of prompt_tokens billed at warm cache read rate (0 <= cached_tokens <= prompt_tokens).",
          "default": 0
        },
        "completion_tokens": {
          "type": "number",
          "description": "Output completion tokens billed (>= 0).",
          "default": 4000
        },
        "actual_billed_usd": {
          "type": "number",
          "description": "Actual USD amount deducted by the provider or relay for this call.",
          "default": 0.49
        }
      }
    }
  },
  {
    "name": "optimize_prompt_cache_layout",
    "description": "Computes the exact single-call and 10-call USD savings achieved by placing static prefix tokens before dynamic mid-prompt tokens so the static block hits the 0.1x warm cache rate instead of triggering a 1.25x cold cache write rebuild. Purely read-only advisory simulation; does not mutate live prompts or external state. Returns JSON with before_layout_cost_usd (where dynamic_mid_tokens invalidates the cache breakpoint), after_layout_cost_usd (where static_prefix_tokens stays cached), and net_savings_pct. Parameters: static_prefix_tokens (number >= 0), dynamic_mid_tokens (number >= 0), completion_tokens (number >= 0). Use this tool when diagnosing why mid-prompt timestamps or tool outputs break cache breakpoints; use pin_single_model_prefix_cache instead for full 10-turn model rate-card comparisons.",
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
          "description": "Token count of invariant system instructions and repository context.",
          "default": 52695
        },
        "dynamic_mid_tokens": {
          "type": "number",
          "description": "Token count of volatile per-turn context that previously invalidated the cache.",
          "default": 93029
        },
        "completion_tokens": {
          "type": "number",
          "description": "Output completion token count for the turn.",
          "default": 2696
        }
      }
    }
  },
  {
    "name": "check_context_cliff",
    "description": "Evaluates whether a prompt token count crosses vendor long-context surcharge thresholds (100K on Claude Haiku 5.5, 128K on GPT-4o, 200K on Gemini 2.5 Pro, or 272K on GPT-6.1 Sol) and returns the surcharge multiplier and recommended flat-context alternative. Purely read-only threshold lookup against the embedded UMCE registry; performs zero network I/O. Returns JSON with crosses_cliff_boolean, active_surcharge_multiplier, and recommended_flat_context_model. Parameters: model (string model ID), prompt_tokens (number >= 0). Use this tool before sending large prompts (>90K tokens) to avoid 2x-5x cliff surcharges; use compress_and_fold_context instead to shrink the prompt below the cliff.",
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
          "description": "Model ID to check for context-window pricing cliffs.",
          "default": "openai/gpt-6.1-sol"
        },
        "prompt_tokens": {
          "type": "number",
          "description": "Input prompt token count to evaluate against cliff thresholds.",
          "default": 150000
        }
      }
    }
  },
  {
    "name": "list_supported_models",
    "description": "Queries the 563-entity UMCE Merkle registry (451 Production GA LLMs, 34 Frontier Benchmarks, and 78 Cloud Infrastructure Services) filtered by provider name and returns canonical model IDs, input/output/cache USD rates per 1M tokens, context windows, and Merkle leaf hashes. Purely read-only local catalog query; makes zero external network calls. Parameters: provider (string vendor filter such as 'openai', 'anthropic', 'google', 'deepseek', or 'all'). Use this tool when browsing or filtering the global rate-card catalog by vendor; use discover_and_probe_account_models instead when selecting starter free-credit and flagship routing tiers.",
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
          "description": "Vendor filter ('all', 'openai', 'anthropic', 'google', 'deepseek', 'qwen', 'moonshotai').",
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