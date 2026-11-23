# 🛡️ Etuki AI FinOps (`etuki-gate` & `etuki-finops-mcp`)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/etuki.etuki-finops?label=VS%20Code%20Marketplace&color=007ACC)](https://marketplace.visualstudio.com/items?itemName=etuki.etuki-finops)
[![Official MCP Registry](https://img.shields.io/badge/MCP_Registry-io.github.cooyun%2Fetuki--finops--mcp-8b5cf6)](https://registry.modelcontextprotocol.io/?q=etuki)
[![Glama Tier A](https://img.shields.io/badge/Glama_MCP-Tier_A_(4.6%2F5.0)-10b981)](https://glama.ai/mcp/connectors/com.etuki/etuki-fin-ops-and-llm-pricing-oracle)
[![SealKeeper Verified](https://img.shields.io/badge/SealKeeper-4%2F4_Tests_OK-06b6d4)](https://sealkeeper.run/agents/etuki.com/www-etuki-com)
[![M8ven Trust Index](https://img.shields.io/badge/M8ven_Trust_Index-Verified_MCP-10b981)](https://m8ven.ai/mcp/cooyun/etuki-gate)
[![npm etuki-finops-mcp](https://img.shields.io/npm/v/etuki-finops-mcp?label=npm&color=cb3837)](https://www.npmjs.com/package/etuki-finops-mcp)
[![PyPI etuki-cost-gate](https://img.shields.io/pypi/v/etuki-cost-gate?label=PyPI&color=3775A9)](https://pypi.org/project/etuki-cost-gate/)
[![AI Cost Audited by Etuki](https://img.shields.io/endpoint?url=https%3A%2F%2Fwww.etuki.com%2Fapi%2Foracle%2Fbadges%2Fetuki-audited.json&style=flat)](https://www.etuki.com/badges)
[![Live Claude Fable 5.2 Cost](https://img.shields.io/endpoint?url=https%3A%2F%2Fwww.etuki.com%2Fapi%2Foracle%2Fbadges%2Fclaude-fable-5-2.json&style=flat)](https://www.etuki.com/provider/claude-fable-5-2)

> **If your AI agent bill went up and nothing errored, a prompt cache broke.**  
> Works on **Windows, macOS & Linux** (pure **MIT License**) — 100% browser-local `.jsonl` transcript & CSV bill auditor ([etuki.com/audit](https://www.etuki.com/audit)), live auto-calibrated pricing across 563+ models, pre-flight MCP router, and native Claude Code Plugin (`.claude-plugin/`).


![Etuki 10-Second Prompt-Cache Break Audit Demo](./assets/etuki-cache-break-demo.gif)


### Install from Official Microsoft VS Code Marketplace (VS Code / Cursor / Windsurf)
Search **`Etuki AI FinOps`** in your Extensions sidebar, visit [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=etuki.etuki-finops), or run:
```bash
code --install-extension etuki.etuki-finops
```

### Quick Install as Native Claude Code Plugin
```bash
/plugin marketplace add cooyun/etuki-gate
/plugin install etuki-finops@etuki-finops-marketplace
```

**`etuki-finops-mcp`** is an official **Model Context Protocol (MCP) Server** built on the `@modelcontextprotocol/sdk` standard (supporting both **STDIO** and **Streamable HTTP / SSE** transports at `https://www.etuki.com/api/v1/mcp`).

It equips MCP clients (**Claude Desktop**, **Claude Code**, **Cursor**, **Windsurf**, **Cline**, **ZCode**, and **Gemini CLI**) with **9 deterministic MCP Tools**, **2 MCP Resources**, and **2 MCP Prompts** for real-time LLM API pricing lookup across 563+ models, 0.1x/0.025x prompt-cache breakpoint locking, relay downgrade detection, and SHA-256 billing receipt reconciliation.

---

## 🏗️ MCP Server Implementation in This Repository

- **Root STDIO & HTTP MCP Server Entrypoint**: [`./index.mjs`](./index.mjs) & [`./etuki-finops-mcp/index.mjs`](./etuki-finops-mcp/index.mjs)
- **Package & MCP SDK Dependency (`@modelcontextprotocol/sdk`)**: [`./package.json`](./package.json)
- **Glama Server Manifest**: [`./glama.json`](./glama.json)
- **Official MCP Registry Manifest**: [`./server.json`](./server.json)
- **Container Sandbox**: [`./Dockerfile`](./Dockerfile)
- **Remote Streamable-HTTP MCP Endpoint**: `https://www.etuki.com/api/v1/mcp`

---

## 🛠️ Exposed MCP Tools (`tools/list` — 9 Read-Only Deterministic Tools)

All 9 MCP tools implement strict JSON Schema `inputSchema`, `outputSchema`, and MCP security annotations (`readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`):

| # | MCP Tool Name | Description | Required Parameters |
| :- | :--- | :--- | :--- |
| 1 | `discover_and_probe_account_models` | Probes available & free-tier models in the user's connected API account to offload non-architectural file scans. | `primary_model` (`string`) |
| 2 | `auto_route_task_by_quality_tier` | Computes a 6-turn Pareto routing plan (4 scan turns + 2 flagship synthesis turns) with dual cash vs full-economic accounting. | `task_instruction` (`string`), `context_tokens` (`number`) |
| 3 | `pin_single_model_prefix_cache` | Calculates 10-turn prompt cache savings and places 4 `cache_control: ephemeral` breakpoints without changing the user's active model. | `model` (`string`), `prompt_tokens` (`number`) |
| 4 | `compress_and_fold_context` | Folds repetitive build/terminal logs by up to 90% while preserving 100% of AST/compiler error lines. | `raw_log_text` (`string`) |
| 5 | `detect_model_downgrade_and_substitution` | Evaluates channel risk for silent model downgrade or quantization on third-party API relays. | `model` (`string`), `burned_usd` (`number`), `remaining_usd` (`number`) |
| 6 | `reconcile_usage_receipt` | Audits an LLM API usage receipt against official 1x vendor rate cards to detect relay markups and unpinned cache waste. | `model` (`string`), `prompt_tokens` (`number`), `actual_billed_usd` (`number`) |
| 7 | `check_context_cliff` | Detects >128K / >200K context window surcharge cliffs and recommends optimal sliding-window truncation. | `model` (`string`), `prompt_tokens` (`number`) |
| 8 | `list_supported_models` (`etuki_search_models`) | Queries the 563-entity Merkle-verified LLM & cloud rate card catalog (`input_usd_1m`, `output_usd_1m`, `cache_read_usd_1m`, `context_window`). | `query` (`string`) |
| 9 | `etuki_get_audit_evidence` | Retrieves the RS256 cryptographic signature envelope, 12-field Merkle inclusion proofs, and double-entry ledger state. | `verify_chain` (`boolean`) |

---

## 📚 Exposed MCP Resources (`resources/list`)

1. **`etuki://catalog/leaves-563`** (`application/json`): 563-Entity 12-Field Merkle Rate Card & Model Compatibility Registry.
2. **`etuki://ledger/zcode-152-audit`** (`application/json`): SHA-256 Reconciled Production Billing Audit Ledger.

---

## 💬 Exposed MCP Prompts (`prompts/list`)

1. **`pre_flight_cost_saver_workflow`**: Pre-flight cost optimization workflow combining model discovery, 6-turn routing, and prefix cache pinning.
2. **`sha256_bill_forensic_audit`**: Forensic audit prompt for verifying API usage receipts against official 1x vendor pricing.

---

## ⚡ Quick Start & MCP Client Configuration

### Option A: Claude Desktop (`claude_desktop_config.json`) or Cursor (`.cursor/mcp.json`) — Remote Streamable HTTP
```json
{
  "mcpServers": {
    "etuki-finops-mcp": {
      "url": "https://www.etuki.com/api/v1/mcp"
    }
  }
}
```

### Option B: Local STDIO Execution via Node.js (`index.mjs`)
```json
{
  "mcpServers": {
    "etuki-finops-mcp": {
      "command": "node",
      "args": ["/path/to/etuki-gate/index.mjs"]
    }
  }
}
```

```bash
# Run STDIO MCP Server locally:
npm install
node index.mjs
```
