# Etuki AI FinOps MCP Server & Offline `.jsonl` / CSV Prompt-Cache Auditor (`etuki-finops-mcp`)

Open-source local stdio Model Context Protocol (MCP) server and CLI calculator for checking LLM API rate cards (452 verified OpenRouter & LiteLLM production models), 10-turn prompt-cache breakeven turns, two-bucket retry cost attribution, and local `.jsonl`/CSV cache-break diagnostics.

- **Web Dashboard & Visual Multi-Cloud Bill X-Ray**: [https://www.etuki.com](https://www.etuki.com)
- **VS Code Extension**: [etuki.etuki-finops](https://marketplace.visualstudio.com/items?itemName=etuki.etuki-finops)
- **npm Package**: `npx -y etuki-finops-mcp`

## Included Local Stdio MCP Tools (6 Tools)

1. **`list_supported_models`**: Search the 452 live-synced OpenRouter/LiteLLM model rate cards (input, output, cache read, and cache write rates per 1M tokens).
2. **`pin_single_model_prefix_cache`**: Compute 10-turn warm prompt-cache breakeven turns, enterprise contracted rate discounts (`contract_discount_multiplier`), and two-bucket retry cost attribution (`provider_infra_retry_rate` vs. `model_prompt_retry_rate`).
3. **`auto_route_task_by_quality_tier`**: Estimate 6-turn coding task savings when offloading 4 initial repository scan turns to a fast model while keeping 2 synthesis turns on a flagship model with warm cache.
4. **`compress_and_fold_context`**: Fold repetitive middle lines of terminal/compiler logs while preserving head, tail, and error/exception lines.
5. **`reconcile_usage_receipt`**: Compare an actual billed dollar amount against official 1x model rate cards.
6. **`audit_local_usage_log`**: Parse JSONL usage objects in memory to flag mid-session prompt-cache breaks (`>5m TTL` expirations or prefix shifts).

## Local Stdio MCP Configuration

```json
{
  "mcpServers": {
    "etuki-finops": {
      "command": "npx",
      "args": ["-y", "etuki-finops-mcp"]
    }
  }
}
```

## Offline CLI Usage

```bash
# Audit a local .jsonl or .csv usage log offline:
node etuki-saver.mjs ./sample-usage.jsonl --model anthropic/claude-3.7-sonnet

# Run CI/CD Pull Request cost-regression check:
node etuki-saver.mjs --ci-gate --baseline baseline.json --current current.json
```

## License

MIT
