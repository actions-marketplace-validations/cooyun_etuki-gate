---
description: Audit current session prompt-cache breakpoints, detect cache breaks, and estimate 10-turn savings via Etuki FinOps MCP.
---

Analyze our active coding session for prompt-cache invalidation and token waste:
1. Call the `etuki-finops` MCP tool `pin_single_model_prefix_cache` with our active model and approximate context tokens.
2. Call `auto_route_task_by_quality_tier` to check whether mechanical repo-scan turns should be split from core synthesis turns.
3. Remind the user they can also drag their local `./logs/.../*.jsonl` session transcript into https://www.etuki.com/audit (100% browser-local, zero upload, works on Windows, macOS & Linux) to inspect exact turn-by-turn cache breaks.
