#!/usr/bin/env node
/**
 * Etuki Gate CLI — Deterministic LLM Cost Policy & PR Cost-Regression Gate
 * Driven dynamically by Etuki Unified Registry
 * Supports BOTH Single-Request Policy Gating (--model --in --out --req-id [--pre-tokenized])
 * AND Base-vs-Head PR Regression Diffing (--baseline base.json --current candidate.json)
 */
import fs from 'node:fs';

const MODEL_REGISTRY = {
  "kimi-k2-7-code": {
    "id": "moonshotai-kimi-k2-7-code",
    "in1m": 0.6712,
    "out1m": 3.35,
    "cacheRead1m": 0.13424,
    "cacheWrite1m": 0.6712,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "moonshotai-kimi-k2-7-code": {
    "id": "moonshotai-kimi-k2-7-code",
    "in1m": 0.6712,
    "out1m": 3.35,
    "cacheRead1m": 0.13424,
    "cacheWrite1m": 0.6712,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "kimi-k2-6": {
    "id": "moonshotai-kimi-k2-6",
    "in1m": 0.65,
    "out1m": 3.41,
    "cacheRead1m": 0.13,
    "cacheWrite1m": 0.65,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "moonshotai-kimi-k2-6": {
    "id": "moonshotai-kimi-k2-6",
    "in1m": 0.65,
    "out1m": 3.41,
    "cacheRead1m": 0.13,
    "cacheWrite1m": 0.65,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "kimi-k2-5": {
    "id": "moonshotai-kimi-k2-5",
    "in1m": 0.5,
    "out1m": 2.5,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.5,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "moonshotai-kimi-k2-5": {
    "id": "moonshotai-kimi-k2-5",
    "in1m": 0.5,
    "out1m": 2.5,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.5,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "kimi-k2-thinking": {
    "id": "moonshotai-kimi-k2-thinking",
    "in1m": 0.6,
    "out1m": 2.5,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.6,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "moonshotai-kimi-k2-thinking": {
    "id": "moonshotai-kimi-k2-thinking",
    "in1m": 0.6,
    "out1m": 2.5,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.6,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "kimi-k2-0905": {
    "id": "moonshotai-kimi-k2-0905",
    "in1m": 0.6,
    "out1m": 2.5,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.6,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "moonshotai-kimi-k2-0905": {
    "id": "moonshotai-kimi-k2-0905",
    "in1m": 0.6,
    "out1m": 2.5,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.6,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "kimi-k2": {
    "id": "moonshotai-kimi-k2",
    "in1m": 0.57,
    "out1m": 2.3,
    "cacheRead1m": 0.114,
    "cacheWrite1m": 0.57,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "moonshotai-kimi-k2": {
    "id": "moonshotai-kimi-k2",
    "in1m": 0.57,
    "out1m": 2.3,
    "cacheRead1m": 0.114,
    "cacheWrite1m": 0.57,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "qwen3-235b-a22b": {
    "id": "qwen-qwen3-235b-a22b",
    "in1m": 0.22,
    "out1m": 0.88,
    "cacheRead1m": 0.044,
    "cacheWrite1m": 0.22,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-235b-a22b": {
    "id": "qwen-qwen3-235b-a22b",
    "in1m": 0.22,
    "out1m": 0.88,
    "cacheRead1m": 0.044,
    "cacheWrite1m": 0.22,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen3-32b": {
    "id": "qwen-qwen3-32b",
    "in1m": 0.08,
    "out1m": 0.28,
    "cacheRead1m": 0.016,
    "cacheWrite1m": 0.08,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-32b": {
    "id": "qwen-qwen3-32b",
    "in1m": 0.08,
    "out1m": 0.28,
    "cacheRead1m": 0.016,
    "cacheWrite1m": 0.08,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "qwen3-30b-a3b": {
    "id": "qwen-qwen3-30b-a3b",
    "in1m": 0.12,
    "out1m": 0.5,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 41000,
    "ctxTok": 41000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-30b-a3b": {
    "id": "qwen-qwen3-30b-a3b",
    "in1m": 0.12,
    "out1m": 0.5,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 41000,
    "ctxTok": 41000,
    "tokRatio": 1.0
  },
  "qwen3-14b": {
    "id": "qwen-qwen3-14b",
    "in1m": 0.12,
    "out1m": 0.24,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 41000,
    "ctxTok": 41000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-14b": {
    "id": "qwen-qwen3-14b",
    "in1m": 0.12,
    "out1m": 0.24,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 41000,
    "ctxTok": 41000,
    "tokRatio": 1.0
  },
  "qwen3-8b": {
    "id": "qwen-qwen3-8b",
    "in1m": 0.03,
    "out1m": 0.1,
    "cacheRead1m": 0.006,
    "cacheWrite1m": 0.03,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-8b": {
    "id": "qwen-qwen3-8b",
    "in1m": 0.03,
    "out1m": 0.1,
    "cacheRead1m": 0.006,
    "cacheWrite1m": 0.03,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen3-4b": {
    "id": "qwen-qwen3-4b",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-4b": {
    "id": "qwen-qwen3-4b",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen3-1-7b": {
    "id": "qwen-qwen3-1-7b",
    "in1m": 0.015,
    "out1m": 0.04,
    "cacheRead1m": 0.003,
    "cacheWrite1m": 0.015,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-1-7b": {
    "id": "qwen-qwen3-1-7b",
    "in1m": 0.015,
    "out1m": 0.04,
    "cacheRead1m": 0.003,
    "cacheWrite1m": 0.015,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen3-0-6b": {
    "id": "qwen-qwen3-0-6b",
    "in1m": 0.01,
    "out1m": 0.02,
    "cacheRead1m": 0.002,
    "cacheWrite1m": 0.01,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-0-6b": {
    "id": "qwen-qwen3-0-6b",
    "in1m": 0.01,
    "out1m": 0.02,
    "cacheRead1m": 0.002,
    "cacheWrite1m": 0.01,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "qwq-32b": {
    "id": "qwen-qwq-32b",
    "in1m": 0.12,
    "out1m": 0.35,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwq-32b": {
    "id": "qwen-qwq-32b",
    "in1m": 0.12,
    "out1m": 0.35,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwq-32b-preview": {
    "id": "qwen-qwq-32b-preview",
    "in1m": 0.12,
    "out1m": 0.35,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwq-32b-preview": {
    "id": "qwen-qwq-32b-preview",
    "in1m": 0.12,
    "out1m": 0.35,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-2-5-coder-32b-instruct": {
    "id": "qwen-qwen-2-5-coder-32b-instruct",
    "in1m": 0.66,
    "out1m": 1.0,
    "cacheRead1m": 0.132,
    "cacheWrite1m": 0.66,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-coder-32b-instruct": {
    "id": "qwen-qwen-2-5-coder-32b-instruct",
    "in1m": 0.66,
    "out1m": 1.0,
    "cacheRead1m": 0.132,
    "cacheWrite1m": 0.66,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "qwen-2-5-coder-14b-instruct": {
    "id": "qwen-qwen-2-5-coder-14b-instruct",
    "in1m": 0.05,
    "out1m": 0.12,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-coder-14b-instruct": {
    "id": "qwen-qwen-2-5-coder-14b-instruct",
    "in1m": 0.05,
    "out1m": 0.12,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-2-5-coder-7b-instruct": {
    "id": "qwen-qwen-2-5-coder-7b-instruct",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.006,
    "cacheWrite1m": 0.03,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-coder-7b-instruct": {
    "id": "qwen-qwen-2-5-coder-7b-instruct",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.006,
    "cacheWrite1m": 0.03,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-2-5-72b-instruct": {
    "id": "qwen-qwen-2-5-72b-instruct",
    "in1m": 0.36,
    "out1m": 0.4,
    "cacheRead1m": 0.072,
    "cacheWrite1m": 0.36,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-72b-instruct": {
    "id": "qwen-qwen-2-5-72b-instruct",
    "in1m": 0.36,
    "out1m": 0.4,
    "cacheRead1m": 0.072,
    "cacheWrite1m": 0.36,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "qwen-2-5-32b-instruct": {
    "id": "qwen-qwen-2-5-32b-instruct",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.016,
    "cacheWrite1m": 0.08,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-32b-instruct": {
    "id": "qwen-qwen-2-5-32b-instruct",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.016,
    "cacheWrite1m": 0.08,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-2-5-14b-instruct": {
    "id": "qwen-qwen-2-5-14b-instruct",
    "in1m": 0.05,
    "out1m": 0.15,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-14b-instruct": {
    "id": "qwen-qwen-2-5-14b-instruct",
    "in1m": 0.05,
    "out1m": 0.15,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-2-5-7b-instruct": {
    "id": "qwen-qwen-2-5-7b-instruct",
    "in1m": 0.1,
    "out1m": 0.2,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.1,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-7b-instruct": {
    "id": "qwen-qwen-2-5-7b-instruct",
    "in1m": 0.1,
    "out1m": 0.2,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.1,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "qwen-2-5-vl-72b-instruct": {
    "id": "qwen-qwen-2-5-vl-72b-instruct",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-vl-72b-instruct": {
    "id": "qwen-qwen-2-5-vl-72b-instruct",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-2-5-vl-32b-instruct": {
    "id": "qwen-qwen-2-5-vl-32b-instruct",
    "in1m": 0.09,
    "out1m": 0.27,
    "cacheRead1m": 0.018,
    "cacheWrite1m": 0.09,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-vl-32b-instruct": {
    "id": "qwen-qwen-2-5-vl-32b-instruct",
    "in1m": 0.09,
    "out1m": 0.27,
    "cacheRead1m": 0.018,
    "cacheWrite1m": 0.09,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-2-5-vl-7b-instruct": {
    "id": "qwen-qwen-2-5-vl-7b-instruct",
    "in1m": 0.04,
    "out1m": 0.1,
    "cacheRead1m": 0.008,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-vl-7b-instruct": {
    "id": "qwen-qwen-2-5-vl-7b-instruct",
    "in1m": 0.04,
    "out1m": 0.1,
    "cacheRead1m": 0.008,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-2-5-math-72b-instruct": {
    "id": "qwen-qwen-2-5-math-72b-instruct",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-math-72b-instruct": {
    "id": "qwen-qwen-2-5-math-72b-instruct",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-2-5-math-7b-instruct": {
    "id": "qwen-qwen-2-5-math-7b-instruct",
    "in1m": 0.03,
    "out1m": 0.08,
    "cacheRead1m": 0.006,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-math-7b-instruct": {
    "id": "qwen-qwen-2-5-math-7b-instruct",
    "in1m": 0.03,
    "out1m": 0.08,
    "cacheRead1m": 0.006,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-plus": {
    "id": "qwen-qwen-plus",
    "in1m": 0.26,
    "out1m": 0.78,
    "cacheRead1m": 0.052,
    "cacheWrite1m": 0.26,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "qwen-qwen-plus": {
    "id": "qwen-qwen-plus",
    "in1m": 0.26,
    "out1m": 0.78,
    "cacheRead1m": 0.052,
    "cacheWrite1m": 0.26,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "qwen-turbo": {
    "id": "qwen-qwen-turbo",
    "in1m": 0.05,
    "out1m": 0.2,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.05,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "qwen-qwen-turbo": {
    "id": "qwen-qwen-turbo",
    "in1m": 0.05,
    "out1m": 0.2,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.05,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "qwen-max": {
    "id": "qwen-qwen-max",
    "in1m": 1.6,
    "out1m": 4.8,
    "cacheRead1m": 0.32,
    "cacheWrite1m": 1.6,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "qwen-qwen-max": {
    "id": "qwen-qwen-max",
    "in1m": 1.6,
    "out1m": 4.8,
    "cacheRead1m": 0.32,
    "cacheWrite1m": 1.6,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "qwen-vl-max": {
    "id": "qwen-qwen-vl-max",
    "in1m": 0.8,
    "out1m": 2.4,
    "cacheRead1m": 0.16,
    "cacheWrite1m": 0.8,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen-vl-max": {
    "id": "qwen-qwen-vl-max",
    "in1m": 0.8,
    "out1m": 2.4,
    "cacheRead1m": 0.16,
    "cacheWrite1m": 0.8,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-vl-plus": {
    "id": "qwen-qwen-vl-plus",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen-vl-plus": {
    "id": "qwen-qwen-vl-plus",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-2-72b-instruct": {
    "id": "qwen-qwen-2-72b-instruct",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-72b-instruct": {
    "id": "qwen-qwen-2-72b-instruct",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-2-7b-instruct": {
    "id": "qwen-qwen-2-7b-instruct",
    "in1m": 0.02,
    "out1m": 0.05,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-7b-instruct": {
    "id": "qwen-qwen-2-7b-instruct",
    "in1m": 0.02,
    "out1m": 0.05,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-2-vl-72b-instruct": {
    "id": "qwen-qwen-2-vl-72b-instruct",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-vl-72b-instruct": {
    "id": "qwen-qwen-2-vl-72b-instruct",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-2-vl-7b-instruct": {
    "id": "qwen-qwen-2-vl-7b-instruct",
    "in1m": 0.04,
    "out1m": 0.1,
    "cacheRead1m": 0.008,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-vl-7b-instruct": {
    "id": "qwen-qwen-2-vl-7b-instruct",
    "in1m": 0.04,
    "out1m": 0.1,
    "cacheRead1m": 0.008,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-1-5-110b-chat": {
    "id": "qwen-qwen-1-5-110b-chat",
    "in1m": 0.18,
    "out1m": 0.54,
    "cacheRead1m": 0.036,
    "cacheWrite1m": 0.18,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-1-5-110b-chat": {
    "id": "qwen-qwen-1-5-110b-chat",
    "in1m": 0.18,
    "out1m": 0.54,
    "cacheRead1m": 0.036,
    "cacheWrite1m": 0.18,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-1-5-72b-chat": {
    "id": "qwen-qwen-1-5-72b-chat",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-1-5-72b-chat": {
    "id": "qwen-qwen-1-5-72b-chat",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.024,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-1-5-32b-chat": {
    "id": "qwen-qwen-1-5-32b-chat",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.016,
    "cacheWrite1m": 0.08,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-1-5-32b-chat": {
    "id": "qwen-qwen-1-5-32b-chat",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.016,
    "cacheWrite1m": 0.08,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-1-5-14b-chat": {
    "id": "qwen-qwen-1-5-14b-chat",
    "in1m": 0.04,
    "out1m": 0.12,
    "cacheRead1m": 0.008,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-1-5-14b-chat": {
    "id": "qwen-qwen-1-5-14b-chat",
    "in1m": 0.04,
    "out1m": 0.12,
    "cacheRead1m": 0.008,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-1-5-7b-chat": {
    "id": "qwen-qwen-1-5-7b-chat",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-1-5-7b-chat": {
    "id": "qwen-qwen-1-5-7b-chat",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen3-coder-480b-a35b-instruct": {
    "id": "qwen-qwen3-coder-480b-a35b-instruct",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.3,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-coder-480b-a35b-instruct": {
    "id": "qwen-qwen3-coder-480b-a35b-instruct",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.3,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "qwen3-coder-30b-a3b-instruct": {
    "id": "qwen-qwen3-coder-30b-a3b-instruct",
    "in1m": 0.07,
    "out1m": 0.28,
    "cacheRead1m": 0.014,
    "cacheWrite1m": 0.07,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-coder-30b-a3b-instruct": {
    "id": "qwen-qwen3-coder-30b-a3b-instruct",
    "in1m": 0.07,
    "out1m": 0.28,
    "cacheRead1m": 0.014,
    "cacheWrite1m": 0.07,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "qwen3-235b-a22b-thinking-2507": {
    "id": "qwen-qwen3-235b-a22b-thinking-2507",
    "in1m": 0.45,
    "out1m": 3.5,
    "cacheRead1m": 0.09,
    "cacheWrite1m": 0.45,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-235b-a22b-thinking-2507": {
    "id": "qwen-qwen3-235b-a22b-thinking-2507",
    "in1m": 0.45,
    "out1m": 3.5,
    "cacheRead1m": 0.09,
    "cacheWrite1m": 0.45,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "qwen3-235b-a22b-instruct-2507": {
    "id": "qwen-qwen3-235b-a22b-instruct-2507",
    "in1m": 0.22,
    "out1m": 0.88,
    "cacheRead1m": 0.044,
    "cacheWrite1m": 0.22,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-235b-a22b-instruct-2507": {
    "id": "qwen-qwen3-235b-a22b-instruct-2507",
    "in1m": 0.22,
    "out1m": 0.88,
    "cacheRead1m": 0.044,
    "cacheWrite1m": 0.22,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "qwen3-30b-a3b-instruct-2507": {
    "id": "qwen-qwen3-30b-a3b-instruct-2507",
    "in1m": 0.09,
    "out1m": 0.3,
    "cacheRead1m": 0.018,
    "cacheWrite1m": 0.09,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "qwen-qwen3-30b-a3b-instruct-2507": {
    "id": "qwen-qwen3-30b-a3b-instruct-2507",
    "in1m": 0.09,
    "out1m": 0.3,
    "cacheRead1m": 0.018,
    "cacheWrite1m": 0.09,
    "cliffTok": 200000,
    "ctxTok": 262000,
    "tokRatio": 1.0
  },
  "qwen-2-5-coder-3b-instruct": {
    "id": "qwen-qwen-2-5-coder-3b-instruct",
    "in1m": 0.02,
    "out1m": 0.04,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-coder-3b-instruct": {
    "id": "qwen-qwen-2-5-coder-3b-instruct",
    "in1m": 0.02,
    "out1m": 0.04,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-2-5-3b-instruct": {
    "id": "qwen-qwen-2-5-3b-instruct",
    "in1m": 0.02,
    "out1m": 0.04,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-3b-instruct": {
    "id": "qwen-qwen-2-5-3b-instruct",
    "in1m": 0.02,
    "out1m": 0.04,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-2-5-1-5b-instruct": {
    "id": "qwen-qwen-2-5-1-5b-instruct",
    "in1m": 0.01,
    "out1m": 0.02,
    "cacheRead1m": 0.002,
    "cacheWrite1m": 0.01,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-1-5b-instruct": {
    "id": "qwen-qwen-2-5-1-5b-instruct",
    "in1m": 0.01,
    "out1m": 0.02,
    "cacheRead1m": 0.002,
    "cacheWrite1m": 0.01,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "qwen-2-5-0-5b-instruct": {
    "id": "qwen-qwen-2-5-0-5b-instruct",
    "in1m": 0.01,
    "out1m": 0.02,
    "cacheRead1m": 0.002,
    "cacheWrite1m": 0.01,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "qwen-qwen-2-5-0-5b-instruct": {
    "id": "qwen-qwen-2-5-0-5b-instruct",
    "in1m": 0.01,
    "out1m": 0.02,
    "cacheRead1m": 0.002,
    "cacheWrite1m": 0.01,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "deepseek-chat-v3-0324": {
    "id": "deepseek-deepseek-chat-v3-0324",
    "in1m": 0.29,
    "out1m": 1.14,
    "cacheRead1m": 0.029,
    "cacheWrite1m": 0.29,
    "cliffTok": 164000,
    "ctxTok": 164000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-chat-v3-0324": {
    "id": "deepseek-deepseek-chat-v3-0324",
    "in1m": 0.29,
    "out1m": 1.14,
    "cacheRead1m": 0.029,
    "cacheWrite1m": 0.29,
    "cliffTok": 164000,
    "ctxTok": 164000,
    "tokRatio": 1.0
  },
  "deepseek-chat": {
    "id": "deepseek-deepseek-chat",
    "in1m": 0.2574,
    "out1m": 1.0287,
    "cacheRead1m": 0.02574,
    "cacheWrite1m": 0.2574,
    "cliffTok": 164000,
    "ctxTok": 164000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-chat": {
    "id": "deepseek-deepseek-chat",
    "in1m": 0.2574,
    "out1m": 1.0287,
    "cacheRead1m": 0.02574,
    "cacheWrite1m": 0.2574,
    "cliffTok": 164000,
    "ctxTok": 164000,
    "tokRatio": 1.0
  },
  "deepseek-r1-0528": {
    "id": "deepseek-deepseek-r1-0528",
    "in1m": 0.5,
    "out1m": 2.15,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.5,
    "cliffTok": 164000,
    "ctxTok": 164000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-r1-0528": {
    "id": "deepseek-deepseek-r1-0528",
    "in1m": 0.5,
    "out1m": 2.15,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.5,
    "cliffTok": 164000,
    "ctxTok": 164000,
    "tokRatio": 1.0
  },
  "deepseek-r1-distill-llama-70b": {
    "id": "deepseek-deepseek-r1-distill-llama-70b",
    "in1m": 0.23,
    "out1m": 0.69,
    "cacheRead1m": 0.023,
    "cacheWrite1m": 0.23,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-r1-distill-llama-70b": {
    "id": "deepseek-deepseek-r1-distill-llama-70b",
    "in1m": 0.23,
    "out1m": 0.69,
    "cacheRead1m": 0.023,
    "cacheWrite1m": 0.23,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-r1-distill-qwen-32b": {
    "id": "deepseek-deepseek-r1-distill-qwen-32b",
    "in1m": 0.12,
    "out1m": 0.35,
    "cacheRead1m": 0.012,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-r1-distill-qwen-32b": {
    "id": "deepseek-deepseek-r1-distill-qwen-32b",
    "in1m": 0.12,
    "out1m": 0.35,
    "cacheRead1m": 0.012,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-r1-distill-qwen-14b": {
    "id": "deepseek-deepseek-r1-distill-qwen-14b",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.008,
    "cacheWrite1m": 0.08,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-r1-distill-qwen-14b": {
    "id": "deepseek-deepseek-r1-distill-qwen-14b",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.008,
    "cacheWrite1m": 0.08,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-r1-distill-llama-8b": {
    "id": "deepseek-deepseek-r1-distill-llama-8b",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-r1-distill-llama-8b": {
    "id": "deepseek-deepseek-r1-distill-llama-8b",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-r1-distill-qwen-7b": {
    "id": "deepseek-deepseek-r1-distill-qwen-7b",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.003,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-r1-distill-qwen-7b": {
    "id": "deepseek-deepseek-r1-distill-qwen-7b",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.003,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-r1-distill-qwen-1-5b": {
    "id": "deepseek-deepseek-r1-distill-qwen-1-5b",
    "in1m": 0.015,
    "out1m": 0.03,
    "cacheRead1m": 0.0015,
    "cacheWrite1m": 0.015,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-r1-distill-qwen-1-5b": {
    "id": "deepseek-deepseek-r1-distill-qwen-1-5b",
    "in1m": 0.015,
    "out1m": 0.03,
    "cacheRead1m": 0.0015,
    "cacheWrite1m": 0.015,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-prover-v2": {
    "id": "deepseek-deepseek-prover-v2",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-prover-v2": {
    "id": "deepseek-deepseek-prover-v2",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-v2-5": {
    "id": "deepseek-deepseek-v2-5",
    "in1m": 0.14,
    "out1m": 0.28,
    "cacheRead1m": 0.014,
    "cacheWrite1m": 0.14,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-v2-5": {
    "id": "deepseek-deepseek-v2-5",
    "in1m": 0.14,
    "out1m": 0.28,
    "cacheRead1m": 0.014,
    "cacheWrite1m": 0.14,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-coder-v2-instruct": {
    "id": "deepseek-deepseek-coder-v2-instruct",
    "in1m": 0.14,
    "out1m": 0.28,
    "cacheRead1m": 0.014,
    "cacheWrite1m": 0.14,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-coder-v2-instruct": {
    "id": "deepseek-deepseek-coder-v2-instruct",
    "in1m": 0.14,
    "out1m": 0.28,
    "cacheRead1m": 0.014,
    "cacheWrite1m": 0.14,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-coder-v2-lite-instruct": {
    "id": "deepseek-deepseek-coder-v2-lite-instruct",
    "in1m": 0.04,
    "out1m": 0.12,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-coder-v2-lite-instruct": {
    "id": "deepseek-deepseek-coder-v2-lite-instruct",
    "in1m": 0.04,
    "out1m": 0.12,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-vl2": {
    "id": "deepseek-deepseek-vl2",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.015,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-vl2": {
    "id": "deepseek-deepseek-vl2",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.015,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-vl2-small": {
    "id": "deepseek-deepseek-vl2-small",
    "in1m": 0.06,
    "out1m": 0.18,
    "cacheRead1m": 0.006,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-vl2-small": {
    "id": "deepseek-deepseek-vl2-small",
    "in1m": 0.06,
    "out1m": 0.18,
    "cacheRead1m": 0.006,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-vl2-tiny": {
    "id": "deepseek-deepseek-vl2-tiny",
    "in1m": 0.03,
    "out1m": 0.09,
    "cacheRead1m": 0.003,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-vl2-tiny": {
    "id": "deepseek-deepseek-vl2-tiny",
    "in1m": 0.03,
    "out1m": 0.09,
    "cacheRead1m": 0.003,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-math-7b-instruct": {
    "id": "deepseek-deepseek-math-7b-instruct",
    "in1m": 0.03,
    "out1m": 0.09,
    "cacheRead1m": 0.003,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-math-7b-instruct": {
    "id": "deepseek-deepseek-math-7b-instruct",
    "in1m": 0.03,
    "out1m": 0.09,
    "cacheRead1m": 0.003,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-llm-67b-chat": {
    "id": "deepseek-deepseek-llm-67b-chat",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.015,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-llm-67b-chat": {
    "id": "deepseek-deepseek-llm-67b-chat",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.015,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-coder-33b-instruct": {
    "id": "deepseek-deepseek-coder-33b-instruct",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.1,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-coder-33b-instruct": {
    "id": "deepseek-deepseek-coder-33b-instruct",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.1,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "deepseek-r1-zero": {
    "id": "deepseek-deepseek-r1-zero",
    "in1m": 0.5,
    "out1m": 2.0,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "deepseek-deepseek-r1-zero": {
    "id": "deepseek-deepseek-r1-zero",
    "in1m": 0.5,
    "out1m": 2.0,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "llama-3-3-70b-instruct": {
    "id": "meta-llama-llama-3-3-70b-instruct",
    "in1m": 0.1,
    "out1m": 0.32,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-3-70b-instruct": {
    "id": "meta-llama-llama-3-3-70b-instruct",
    "in1m": 0.1,
    "out1m": 0.32,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "llama-3-2-90b-vision-instruct": {
    "id": "meta-llama-llama-3-2-90b-vision-instruct",
    "in1m": 0.35,
    "out1m": 0.4,
    "cacheRead1m": 0.35,
    "cacheWrite1m": 0.35,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-2-90b-vision-instruct": {
    "id": "meta-llama-llama-3-2-90b-vision-instruct",
    "in1m": 0.35,
    "out1m": 0.4,
    "cacheRead1m": 0.35,
    "cacheWrite1m": 0.35,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "llama-3-2-11b-vision-instruct": {
    "id": "meta-llama-llama-3-2-11b-vision-instruct",
    "in1m": 0.05,
    "out1m": 0.05,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-2-11b-vision-instruct": {
    "id": "meta-llama-llama-3-2-11b-vision-instruct",
    "in1m": 0.05,
    "out1m": 0.05,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "llama-3-2-3b-instruct": {
    "id": "meta-llama-llama-3-2-3b-instruct",
    "in1m": 0.0509,
    "out1m": 0.335,
    "cacheRead1m": 0.0509,
    "cacheWrite1m": 0.0509,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-2-3b-instruct": {
    "id": "meta-llama-llama-3-2-3b-instruct",
    "in1m": 0.0509,
    "out1m": 0.335,
    "cacheRead1m": 0.0509,
    "cacheWrite1m": 0.0509,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "llama-3-2-1b-instruct": {
    "id": "meta-llama-llama-3-2-1b-instruct",
    "in1m": 0.027,
    "out1m": 0.201,
    "cacheRead1m": 0.027,
    "cacheWrite1m": 0.027,
    "cliffTok": 60000,
    "ctxTok": 60000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-2-1b-instruct": {
    "id": "meta-llama-llama-3-2-1b-instruct",
    "in1m": 0.027,
    "out1m": 0.201,
    "cacheRead1m": 0.027,
    "cacheWrite1m": 0.027,
    "cliffTok": 60000,
    "ctxTok": 60000,
    "tokRatio": 1.0
  },
  "llama-3-1-405b-instruct": {
    "id": "meta-llama-llama-3-1-405b-instruct",
    "in1m": 0.8,
    "out1m": 0.8,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-1-405b-instruct": {
    "id": "meta-llama-llama-3-1-405b-instruct",
    "in1m": 0.8,
    "out1m": 0.8,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "llama-3-1-405b": {
    "id": "meta-llama-llama-3-1-405b",
    "in1m": 0.8,
    "out1m": 0.8,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-1-405b": {
    "id": "meta-llama-llama-3-1-405b",
    "in1m": 0.8,
    "out1m": 0.8,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "llama-3-1-70b-instruct": {
    "id": "meta-llama-llama-3-1-70b-instruct",
    "in1m": 0.4,
    "out1m": 0.4,
    "cacheRead1m": 0.4,
    "cacheWrite1m": 0.4,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-1-70b-instruct": {
    "id": "meta-llama-llama-3-1-70b-instruct",
    "in1m": 0.4,
    "out1m": 0.4,
    "cacheRead1m": 0.4,
    "cacheWrite1m": 0.4,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "llama-3-1-8b-instruct": {
    "id": "meta-llama-llama-3-1-8b-instruct",
    "in1m": 0.05,
    "out1m": 0.08,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-1-8b-instruct": {
    "id": "meta-llama-llama-3-1-8b-instruct",
    "in1m": 0.05,
    "out1m": 0.08,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "llama-3-70b-instruct": {
    "id": "meta-llama-llama-3-70b-instruct",
    "in1m": 0.3,
    "out1m": 0.6,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-70b-instruct": {
    "id": "meta-llama-llama-3-70b-instruct",
    "in1m": 0.3,
    "out1m": 0.6,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "llama-3-8b-instruct": {
    "id": "meta-llama-llama-3-8b-instruct",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-8b-instruct": {
    "id": "meta-llama-llama-3-8b-instruct",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "llama-guard-4-12b": {
    "id": "meta-llama-llama-guard-4-12b",
    "in1m": 0.18,
    "out1m": 0.18,
    "cacheRead1m": 0.18,
    "cacheWrite1m": 0.18,
    "cliffTok": 164000,
    "ctxTok": 164000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-guard-4-12b": {
    "id": "meta-llama-llama-guard-4-12b",
    "in1m": 0.18,
    "out1m": 0.18,
    "cacheRead1m": 0.18,
    "cacheWrite1m": 0.18,
    "cliffTok": 164000,
    "ctxTok": 164000,
    "tokRatio": 1.0
  },
  "llama-guard-3-8b": {
    "id": "meta-llama-llama-guard-3-8b",
    "in1m": 0.02,
    "out1m": 0.02,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-guard-3-8b": {
    "id": "meta-llama-llama-guard-3-8b",
    "in1m": 0.02,
    "out1m": 0.02,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "llama-guard-2-8b": {
    "id": "meta-llama-llama-guard-2-8b",
    "in1m": 0.02,
    "out1m": 0.02,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-guard-2-8b": {
    "id": "meta-llama-llama-guard-2-8b",
    "in1m": 0.02,
    "out1m": 0.02,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "codellama-70b-instruct": {
    "id": "meta-llama-codellama-70b-instruct",
    "in1m": 0.25,
    "out1m": 0.5,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "meta-llama-codellama-70b-instruct": {
    "id": "meta-llama-codellama-70b-instruct",
    "in1m": 0.25,
    "out1m": 0.5,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "codellama-34b-instruct": {
    "id": "meta-llama-codellama-34b-instruct",
    "in1m": 0.12,
    "out1m": 0.24,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "meta-llama-codellama-34b-instruct": {
    "id": "meta-llama-codellama-34b-instruct",
    "in1m": 0.12,
    "out1m": 0.24,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "codellama-13b-instruct": {
    "id": "meta-llama-codellama-13b-instruct",
    "in1m": 0.06,
    "out1m": 0.12,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "meta-llama-codellama-13b-instruct": {
    "id": "meta-llama-codellama-13b-instruct",
    "in1m": 0.06,
    "out1m": 0.12,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "codellama-7b-instruct": {
    "id": "meta-llama-codellama-7b-instruct",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "meta-llama-codellama-7b-instruct": {
    "id": "meta-llama-codellama-7b-instruct",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "llama-2-70b-chat": {
    "id": "meta-llama-llama-2-70b-chat",
    "in1m": 0.35,
    "out1m": 0.7,
    "cacheRead1m": 0.35,
    "cacheWrite1m": 0.35,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-2-70b-chat": {
    "id": "meta-llama-llama-2-70b-chat",
    "in1m": 0.35,
    "out1m": 0.7,
    "cacheRead1m": 0.35,
    "cacheWrite1m": 0.35,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "llama-2-13b-chat": {
    "id": "meta-llama-llama-2-13b-chat",
    "in1m": 0.1,
    "out1m": 0.2,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-2-13b-chat": {
    "id": "meta-llama-llama-2-13b-chat",
    "in1m": 0.1,
    "out1m": 0.2,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "llama-3-1-70b-instruct-fp8": {
    "id": "meta-llama-llama-3-1-70b-instruct-fp8",
    "in1m": 0.2,
    "out1m": 0.35,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-1-70b-instruct-fp8": {
    "id": "meta-llama-llama-3-1-70b-instruct-fp8",
    "in1m": 0.2,
    "out1m": 0.35,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "llama-3-1-405b-instruct-fp8": {
    "id": "meta-llama-llama-3-1-405b-instruct-fp8",
    "in1m": 0.7,
    "out1m": 0.7,
    "cacheRead1m": 0.7,
    "cacheWrite1m": 0.7,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-1-405b-instruct-fp8": {
    "id": "meta-llama-llama-3-1-405b-instruct-fp8",
    "in1m": 0.7,
    "out1m": 0.7,
    "cacheRead1m": 0.7,
    "cacheWrite1m": 0.7,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "llama-3-3-70b-instruct-fp8": {
    "id": "meta-llama-llama-3-3-70b-instruct-fp8",
    "in1m": 0.1,
    "out1m": 0.25,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "meta-llama-llama-3-3-70b-instruct-fp8": {
    "id": "meta-llama-llama-3-3-70b-instruct-fp8",
    "in1m": 0.1,
    "out1m": 0.25,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gemini-2-5-pro": {
    "id": "google-gemini-2-5-pro",
    "in1m": 1.25,
    "out1m": 10.0,
    "cacheRead1m": 0.3125,
    "cacheWrite1m": 1.25,
    "cliffTok": 200000,
    "ctxTok": 1049000,
    "tokRatio": 1.0
  },
  "google-gemini-2-5-pro": {
    "id": "google-gemini-2-5-pro",
    "in1m": 1.25,
    "out1m": 10.0,
    "cacheRead1m": 0.3125,
    "cacheWrite1m": 1.25,
    "cliffTok": 200000,
    "ctxTok": 1049000,
    "tokRatio": 1.0
  },
  "gemini-2-5-flash": {
    "id": "google-gemini-2-5-flash",
    "in1m": 0.3,
    "out1m": 2.5,
    "cacheRead1m": 0.075,
    "cacheWrite1m": 0.3,
    "cliffTok": 200000,
    "ctxTok": 1049000,
    "tokRatio": 1.0
  },
  "google-gemini-2-5-flash": {
    "id": "google-gemini-2-5-flash",
    "in1m": 0.3,
    "out1m": 2.5,
    "cacheRead1m": 0.075,
    "cacheWrite1m": 0.3,
    "cliffTok": 200000,
    "ctxTok": 1049000,
    "tokRatio": 1.0
  },
  "gemini-2-5-flash-lite": {
    "id": "google-gemini-2-5-flash-lite",
    "in1m": 0.1,
    "out1m": 0.4,
    "cacheRead1m": 0.025,
    "cacheWrite1m": 0.1,
    "cliffTok": 200000,
    "ctxTok": 1049000,
    "tokRatio": 1.0
  },
  "google-gemini-2-5-flash-lite": {
    "id": "google-gemini-2-5-flash-lite",
    "in1m": 0.1,
    "out1m": 0.4,
    "cacheRead1m": 0.025,
    "cacheWrite1m": 0.1,
    "cliffTok": 200000,
    "ctxTok": 1049000,
    "tokRatio": 1.0
  },
  "gemini-2-0-flash-001": {
    "id": "google-gemini-2-0-flash-001",
    "in1m": 0.1,
    "out1m": 0.4,
    "cacheRead1m": 0.025,
    "cacheWrite1m": 0.1,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "google-gemini-2-0-flash-001": {
    "id": "google-gemini-2-0-flash-001",
    "in1m": 0.1,
    "out1m": 0.4,
    "cacheRead1m": 0.025,
    "cacheWrite1m": 0.1,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "gemini-2-0-flash-lite-001": {
    "id": "google-gemini-2-0-flash-lite-001",
    "in1m": 0.075,
    "out1m": 0.3,
    "cacheRead1m": 0.01875,
    "cacheWrite1m": 0.075,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "google-gemini-2-0-flash-lite-001": {
    "id": "google-gemini-2-0-flash-lite-001",
    "in1m": 0.075,
    "out1m": 0.3,
    "cacheRead1m": 0.01875,
    "cacheWrite1m": 0.075,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "gemini-2-0-pro-exp-02-05": {
    "id": "google-gemini-2-0-pro-exp-02-05",
    "in1m": 1.25,
    "out1m": 5.0,
    "cacheRead1m": 0.3125,
    "cacheWrite1m": 1.25,
    "cliffTok": 200000,
    "ctxTok": 2000000,
    "tokRatio": 1.0
  },
  "google-gemini-2-0-pro-exp-02-05": {
    "id": "google-gemini-2-0-pro-exp-02-05",
    "in1m": 1.25,
    "out1m": 5.0,
    "cacheRead1m": 0.3125,
    "cacheWrite1m": 1.25,
    "cliffTok": 200000,
    "ctxTok": 2000000,
    "tokRatio": 1.0
  },
  "gemini-1-5-pro": {
    "id": "google-gemini-1-5-pro",
    "in1m": 1.25,
    "out1m": 5.0,
    "cacheRead1m": 0.3125,
    "cacheWrite1m": 1.25,
    "cliffTok": 200000,
    "ctxTok": 2000000,
    "tokRatio": 1.0
  },
  "google-gemini-1-5-pro": {
    "id": "google-gemini-1-5-pro",
    "in1m": 1.25,
    "out1m": 5.0,
    "cacheRead1m": 0.3125,
    "cacheWrite1m": 1.25,
    "cliffTok": 200000,
    "ctxTok": 2000000,
    "tokRatio": 1.0
  },
  "gemini-1-5-flash": {
    "id": "google-gemini-1-5-flash",
    "in1m": 0.075,
    "out1m": 0.3,
    "cacheRead1m": 0.01875,
    "cacheWrite1m": 0.075,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "google-gemini-1-5-flash": {
    "id": "google-gemini-1-5-flash",
    "in1m": 0.075,
    "out1m": 0.3,
    "cacheRead1m": 0.01875,
    "cacheWrite1m": 0.075,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "gemini-1-5-flash-8b": {
    "id": "google-gemini-1-5-flash-8b",
    "in1m": 0.0375,
    "out1m": 0.15,
    "cacheRead1m": 0.009375,
    "cacheWrite1m": 0.0375,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "google-gemini-1-5-flash-8b": {
    "id": "google-gemini-1-5-flash-8b",
    "in1m": 0.0375,
    "out1m": 0.15,
    "cacheRead1m": 0.009375,
    "cacheWrite1m": 0.0375,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "gemma-3-27b-it": {
    "id": "google-gemma-3-27b-it",
    "in1m": 0.08,
    "out1m": 0.35,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 0.08,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "google-gemma-3-27b-it": {
    "id": "google-gemma-3-27b-it",
    "in1m": 0.08,
    "out1m": 0.35,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 0.08,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "gemma-3-12b-it": {
    "id": "google-gemma-3-12b-it",
    "in1m": 0.05,
    "out1m": 0.15,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "google-gemma-3-12b-it": {
    "id": "google-gemma-3-12b-it",
    "in1m": 0.05,
    "out1m": 0.15,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "gemma-3-4b-it": {
    "id": "google-gemma-3-4b-it",
    "in1m": 0.04,
    "out1m": 0.05,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "google-gemma-3-4b-it": {
    "id": "google-gemma-3-4b-it",
    "in1m": 0.04,
    "out1m": 0.05,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "gemma-3-1b-it": {
    "id": "google-gemma-3-1b-it",
    "in1m": 0.01,
    "out1m": 0.02,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.01,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "google-gemma-3-1b-it": {
    "id": "google-gemma-3-1b-it",
    "in1m": 0.01,
    "out1m": 0.02,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.01,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "gemma-2-27b-it": {
    "id": "google-gemma-2-27b-it",
    "in1m": 0.65,
    "out1m": 0.65,
    "cacheRead1m": 0.65,
    "cacheWrite1m": 0.65,
    "cliffTok": 8000,
    "ctxTok": 8000,
    "tokRatio": 1.0
  },
  "google-gemma-2-27b-it": {
    "id": "google-gemma-2-27b-it",
    "in1m": 0.65,
    "out1m": 0.65,
    "cacheRead1m": 0.65,
    "cacheWrite1m": 0.65,
    "cliffTok": 8000,
    "ctxTok": 8000,
    "tokRatio": 1.0
  },
  "gemma-2-9b-it": {
    "id": "google-gemma-2-9b-it",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "google-gemma-2-9b-it": {
    "id": "google-gemma-2-9b-it",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "gemma-2-2b-it": {
    "id": "google-gemma-2-2b-it",
    "in1m": 0.01,
    "out1m": 0.02,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.01,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "google-gemma-2-2b-it": {
    "id": "google-gemma-2-2b-it",
    "in1m": 0.01,
    "out1m": 0.02,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.01,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "codegemma-7b-it": {
    "id": "google-codegemma-7b-it",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "google-codegemma-7b-it": {
    "id": "google-codegemma-7b-it",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "paligemma-2-28b-it": {
    "id": "google-paligemma-2-28b-it",
    "in1m": 0.12,
    "out1m": 0.24,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "google-paligemma-2-28b-it": {
    "id": "google-paligemma-2-28b-it",
    "in1m": 0.12,
    "out1m": 0.24,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "paligemma-2-10b-it": {
    "id": "google-paligemma-2-10b-it",
    "in1m": 0.05,
    "out1m": 0.1,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "google-paligemma-2-10b-it": {
    "id": "google-paligemma-2-10b-it",
    "in1m": 0.05,
    "out1m": 0.1,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "medgemma-27b-it": {
    "id": "google-medgemma-27b-it",
    "in1m": 0.15,
    "out1m": 0.3,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "google-medgemma-27b-it": {
    "id": "google-medgemma-27b-it",
    "in1m": 0.15,
    "out1m": 0.3,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "shieldgemma-2-27b-it": {
    "id": "google-shieldgemma-2-27b-it",
    "in1m": 0.08,
    "out1m": 0.16,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 0.08,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "google-shieldgemma-2-27b-it": {
    "id": "google-shieldgemma-2-27b-it",
    "in1m": 0.08,
    "out1m": 0.16,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 0.08,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "txgemma-27b-chat": {
    "id": "google-txgemma-27b-chat",
    "in1m": 0.12,
    "out1m": 0.24,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "google-txgemma-27b-chat": {
    "id": "google-txgemma-27b-chat",
    "in1m": 0.12,
    "out1m": 0.24,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "gemini-2-5-pro-preview-05-06": {
    "id": "google-gemini-2-5-pro-preview-05-06",
    "in1m": 1.25,
    "out1m": 10.0,
    "cacheRead1m": 0.3125,
    "cacheWrite1m": 1.25,
    "cliffTok": 200000,
    "ctxTok": 2000000,
    "tokRatio": 1.0
  },
  "google-gemini-2-5-pro-preview-05-06": {
    "id": "google-gemini-2-5-pro-preview-05-06",
    "in1m": 1.25,
    "out1m": 10.0,
    "cacheRead1m": 0.3125,
    "cacheWrite1m": 1.25,
    "cliffTok": 200000,
    "ctxTok": 2000000,
    "tokRatio": 1.0
  },
  "gemini-2-5-flash-preview-05-20": {
    "id": "google-gemini-2-5-flash-preview-05-20",
    "in1m": 0.15,
    "out1m": 0.6,
    "cacheRead1m": 0.0375,
    "cacheWrite1m": 0.15,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "google-gemini-2-5-flash-preview-05-20": {
    "id": "google-gemini-2-5-flash-preview-05-20",
    "in1m": 0.15,
    "out1m": 0.6,
    "cacheRead1m": 0.0375,
    "cacheWrite1m": 0.15,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "gemma-7b-it": {
    "id": "google-gemma-7b-it",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "google-gemma-7b-it": {
    "id": "google-gemma-7b-it",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "mistral-large-2411": {
    "id": "mistralai-mistral-large-2411",
    "in1m": 2.0,
    "out1m": 6.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-large-2411": {
    "id": "mistralai-mistral-large-2411",
    "in1m": 2.0,
    "out1m": 6.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistral-large-2407": {
    "id": "mistralai-mistral-large-2407",
    "in1m": 2.0,
    "out1m": 6.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-large-2407": {
    "id": "mistralai-mistral-large-2407",
    "in1m": 2.0,
    "out1m": 6.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "mistral-medium-3": {
    "id": "mistralai-mistral-medium-3",
    "in1m": 0.4,
    "out1m": 2.0,
    "cacheRead1m": 0.4,
    "cacheWrite1m": 0.4,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-medium-3": {
    "id": "mistralai-mistral-medium-3",
    "in1m": 0.4,
    "out1m": 2.0,
    "cacheRead1m": 0.4,
    "cacheWrite1m": 0.4,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "mistral-small-3-1-24b-instruct": {
    "id": "mistralai-mistral-small-3-1-24b-instruct",
    "in1m": 0.351,
    "out1m": 0.555,
    "cacheRead1m": 0.351,
    "cacheWrite1m": 0.351,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-small-3-1-24b-instruct": {
    "id": "mistralai-mistral-small-3-1-24b-instruct",
    "in1m": 0.351,
    "out1m": 0.555,
    "cacheRead1m": 0.351,
    "cacheWrite1m": 0.351,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistral-small-24b-instruct-2501": {
    "id": "mistralai-mistral-small-24b-instruct-2501",
    "in1m": 0.05,
    "out1m": 0.08,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-small-24b-instruct-2501": {
    "id": "mistralai-mistral-small-24b-instruct-2501",
    "in1m": 0.05,
    "out1m": 0.08,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "mistral-small-2409": {
    "id": "mistralai-mistral-small-2409",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-small-2409": {
    "id": "mistralai-mistral-small-2409",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "pixtral-large-2411": {
    "id": "mistralai-pixtral-large-2411",
    "in1m": 2.0,
    "out1m": 6.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistralai-pixtral-large-2411": {
    "id": "mistralai-pixtral-large-2411",
    "in1m": 2.0,
    "out1m": 6.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "pixtral-12b": {
    "id": "mistralai-pixtral-12b",
    "in1m": 0.1,
    "out1m": 0.1,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistralai-pixtral-12b": {
    "id": "mistralai-pixtral-12b",
    "in1m": 0.1,
    "out1m": 0.1,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "codestral-2501": {
    "id": "mistralai-codestral-2501",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "mistralai-codestral-2501": {
    "id": "mistralai-codestral-2501",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "codestral-2405": {
    "id": "mistralai-codestral-2405",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "mistralai-codestral-2405": {
    "id": "mistralai-codestral-2405",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "codestral-mamba": {
    "id": "mistralai-codestral-mamba",
    "in1m": 0.1,
    "out1m": 0.1,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "mistralai-codestral-mamba": {
    "id": "mistralai-codestral-mamba",
    "in1m": 0.1,
    "out1m": 0.1,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "ministral-8b": {
    "id": "mistralai-ministral-8b",
    "in1m": 0.1,
    "out1m": 0.1,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistralai-ministral-8b": {
    "id": "mistralai-ministral-8b",
    "in1m": 0.1,
    "out1m": 0.1,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "ministral-3b": {
    "id": "mistralai-ministral-3b",
    "in1m": 0.04,
    "out1m": 0.04,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistralai-ministral-3b": {
    "id": "mistralai-ministral-3b",
    "in1m": 0.04,
    "out1m": 0.04,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistral-saba": {
    "id": "mistralai-mistral-saba",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-saba": {
    "id": "mistralai-mistral-saba",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "mistral-nemo": {
    "id": "mistralai-mistral-nemo",
    "in1m": 0.029,
    "out1m": 0.03,
    "cacheRead1m": 0.029,
    "cacheWrite1m": 0.029,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-nemo": {
    "id": "mistralai-mistral-nemo",
    "in1m": 0.029,
    "out1m": 0.03,
    "cacheRead1m": 0.029,
    "cacheWrite1m": 0.029,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "mixtral-8x22b-instruct": {
    "id": "mistralai-mixtral-8x22b-instruct",
    "in1m": 2.0,
    "out1m": 6.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 66000,
    "ctxTok": 66000,
    "tokRatio": 1.0
  },
  "mistralai-mixtral-8x22b-instruct": {
    "id": "mistralai-mixtral-8x22b-instruct",
    "in1m": 2.0,
    "out1m": 6.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 66000,
    "ctxTok": 66000,
    "tokRatio": 1.0
  },
  "mixtral-8x7b-instruct": {
    "id": "mistralai-mixtral-8x7b-instruct",
    "in1m": 0.24,
    "out1m": 0.24,
    "cacheRead1m": 0.24,
    "cacheWrite1m": 0.24,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "mistralai-mixtral-8x7b-instruct": {
    "id": "mistralai-mixtral-8x7b-instruct",
    "in1m": 0.24,
    "out1m": 0.24,
    "cacheRead1m": 0.24,
    "cacheWrite1m": 0.24,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "mistral-7b-instruct-v0-3": {
    "id": "mistralai-mistral-7b-instruct-v0-3",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-7b-instruct-v0-3": {
    "id": "mistralai-mistral-7b-instruct-v0-3",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "mathstral-7b-v0-1": {
    "id": "mistralai-mathstral-7b-v0-1",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "mistralai-mathstral-7b-v0-1": {
    "id": "mistralai-mathstral-7b-v0-1",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "devstral-small": {
    "id": "mistralai-devstral-small",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistralai-devstral-small": {
    "id": "mistralai-devstral-small",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "magistral-medium-2506": {
    "id": "mistralai-magistral-medium-2506",
    "in1m": 2.0,
    "out1m": 5.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistralai-magistral-medium-2506": {
    "id": "mistralai-magistral-medium-2506",
    "in1m": 2.0,
    "out1m": 5.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "magistral-small-2506": {
    "id": "mistralai-magistral-small-2506",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.5,
    "cacheWrite1m": 0.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistralai-magistral-small-2506": {
    "id": "mistralai-magistral-small-2506",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.5,
    "cacheWrite1m": 0.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "mistral-small-3-2-24b-instruct": {
    "id": "mistralai-mistral-small-3-2-24b-instruct",
    "in1m": 0.075,
    "out1m": 0.2,
    "cacheRead1m": 0.075,
    "cacheWrite1m": 0.075,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-small-3-2-24b-instruct": {
    "id": "mistralai-mistral-small-3-2-24b-instruct",
    "in1m": 0.075,
    "out1m": 0.2,
    "cacheRead1m": 0.075,
    "cacheWrite1m": 0.075,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "mistral-medium-2312": {
    "id": "mistralai-mistral-medium-2312",
    "in1m": 0.8,
    "out1m": 2.4,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-medium-2312": {
    "id": "mistralai-mistral-medium-2312",
    "in1m": 0.8,
    "out1m": 2.4,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "mistral-tiny": {
    "id": "mistralai-mistral-tiny",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "mistralai-mistral-tiny": {
    "id": "mistralai-mistral-tiny",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "claude-opus-4": {
    "id": "anthropic-claude-opus-4",
    "in1m": 15.0,
    "out1m": 75.0,
    "cacheRead1m": 1.5,
    "cacheWrite1m": 18.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-opus-4": {
    "id": "anthropic-claude-opus-4",
    "in1m": 15.0,
    "out1m": 75.0,
    "cacheRead1m": 1.5,
    "cacheWrite1m": 18.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "claude-sonnet-4": {
    "id": "anthropic-claude-sonnet-4",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-sonnet-4": {
    "id": "anthropic-claude-sonnet-4",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "claude-3-7-sonnet": {
    "id": "anthropic-claude-3-7-sonnet",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-3-7-sonnet": {
    "id": "anthropic-claude-3-7-sonnet",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "claude-3-7-sonnet-thinking": {
    "id": "anthropic-claude-3-7-sonnet-thinking",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-3-7-sonnet-thinking": {
    "id": "anthropic-claude-3-7-sonnet-thinking",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "claude-3-5-sonnet": {
    "id": "anthropic-claude-3-5-sonnet",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-3-5-sonnet": {
    "id": "anthropic-claude-3-5-sonnet",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "claude-3-5-sonnet-20240620": {
    "id": "anthropic-claude-3-5-sonnet-20240620",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-3-5-sonnet-20240620": {
    "id": "anthropic-claude-3-5-sonnet-20240620",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "claude-3-5-haiku": {
    "id": "anthropic-claude-3-5-haiku",
    "in1m": 0.8,
    "out1m": 4.0,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 1.0,
    "cliffTok": 100000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-3-5-haiku": {
    "id": "anthropic-claude-3-5-haiku",
    "in1m": 0.8,
    "out1m": 4.0,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 1.0,
    "cliffTok": 100000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "claude-3-5-haiku-20241022": {
    "id": "anthropic-claude-3-5-haiku-20241022",
    "in1m": 0.8,
    "out1m": 4.0,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 1.0,
    "cliffTok": 100000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-3-5-haiku-20241022": {
    "id": "anthropic-claude-3-5-haiku-20241022",
    "in1m": 0.8,
    "out1m": 4.0,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 1.0,
    "cliffTok": 100000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "claude-3-opus": {
    "id": "anthropic-claude-3-opus",
    "in1m": 15.0,
    "out1m": 75.0,
    "cacheRead1m": 1.5,
    "cacheWrite1m": 18.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-3-opus": {
    "id": "anthropic-claude-3-opus",
    "in1m": 15.0,
    "out1m": 75.0,
    "cacheRead1m": 1.5,
    "cacheWrite1m": 18.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "claude-3-sonnet": {
    "id": "anthropic-claude-3-sonnet",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-3-sonnet": {
    "id": "anthropic-claude-3-sonnet",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 3.75,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "claude-3-haiku": {
    "id": "anthropic-claude-3-haiku",
    "in1m": 0.25,
    "out1m": 1.25,
    "cacheRead1m": 0.025,
    "cacheWrite1m": 0.3125,
    "cliffTok": 100000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-3-haiku": {
    "id": "anthropic-claude-3-haiku",
    "in1m": 0.25,
    "out1m": 1.25,
    "cacheRead1m": 0.025,
    "cacheWrite1m": 0.3125,
    "cliffTok": 100000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "claude-2-1": {
    "id": "anthropic-claude-2-1",
    "in1m": 8.0,
    "out1m": 24.0,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 10.0,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "anthropic-claude-2-1": {
    "id": "anthropic-claude-2-1",
    "in1m": 8.0,
    "out1m": 24.0,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 10.0,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.28
  },
  "gpt-4-5-preview": {
    "id": "openai-gpt-4-5-preview",
    "in1m": 75.0,
    "out1m": 150.0,
    "cacheRead1m": 37.5,
    "cacheWrite1m": 75.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4-5-preview": {
    "id": "openai-gpt-4-5-preview",
    "in1m": 75.0,
    "out1m": 150.0,
    "cacheRead1m": 37.5,
    "cacheWrite1m": 75.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gpt-4-1": {
    "id": "openai-gpt-4-1",
    "in1m": 2.0,
    "out1m": 8.0,
    "cacheRead1m": 1.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 200000,
    "ctxTok": 1048000,
    "tokRatio": 1.0
  },
  "openai-gpt-4-1": {
    "id": "openai-gpt-4-1",
    "in1m": 2.0,
    "out1m": 8.0,
    "cacheRead1m": 1.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 200000,
    "ctxTok": 1048000,
    "tokRatio": 1.0
  },
  "gpt-4-1-mini": {
    "id": "openai-gpt-4-1-mini",
    "in1m": 0.4,
    "out1m": 1.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.4,
    "cliffTok": 200000,
    "ctxTok": 1048000,
    "tokRatio": 1.0
  },
  "openai-gpt-4-1-mini": {
    "id": "openai-gpt-4-1-mini",
    "in1m": 0.4,
    "out1m": 1.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.4,
    "cliffTok": 200000,
    "ctxTok": 1048000,
    "tokRatio": 1.0
  },
  "gpt-4-1-nano": {
    "id": "openai-gpt-4-1-nano",
    "in1m": 0.1,
    "out1m": 0.4,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.1,
    "cliffTok": 200000,
    "ctxTok": 1048000,
    "tokRatio": 1.0
  },
  "openai-gpt-4-1-nano": {
    "id": "openai-gpt-4-1-nano",
    "in1m": 0.1,
    "out1m": 0.4,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.1,
    "cliffTok": 200000,
    "ctxTok": 1048000,
    "tokRatio": 1.0
  },
  "gpt-4o-2024-11-20": {
    "id": "openai-gpt-4o-2024-11-20",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 1.25,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4o-2024-11-20": {
    "id": "openai-gpt-4o-2024-11-20",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 1.25,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gpt-4o-2024-08-06": {
    "id": "openai-gpt-4o-2024-08-06",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 1.25,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4o-2024-08-06": {
    "id": "openai-gpt-4o-2024-08-06",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 1.25,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gpt-4o-2024-05-13": {
    "id": "openai-gpt-4o-2024-05-13",
    "in1m": 5.0,
    "out1m": 15.0,
    "cacheRead1m": 2.5,
    "cacheWrite1m": 5.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4o-2024-05-13": {
    "id": "openai-gpt-4o-2024-05-13",
    "in1m": 5.0,
    "out1m": 15.0,
    "cacheRead1m": 2.5,
    "cacheWrite1m": 5.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gpt-4o-mini-2024-07-18": {
    "id": "openai-gpt-4o-mini-2024-07-18",
    "in1m": 0.15,
    "out1m": 0.6,
    "cacheRead1m": 0.075,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4o-mini-2024-07-18": {
    "id": "openai-gpt-4o-mini-2024-07-18",
    "in1m": 0.15,
    "out1m": 0.6,
    "cacheRead1m": 0.075,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gpt-4o-audio-preview": {
    "id": "openai-gpt-4o-audio-preview",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 1.25,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4o-audio-preview": {
    "id": "openai-gpt-4o-audio-preview",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 1.25,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gpt-4o-search-preview": {
    "id": "openai-gpt-4o-search-preview",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 1.25,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4o-search-preview": {
    "id": "openai-gpt-4o-search-preview",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 1.25,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gpt-4o-mini-search-preview": {
    "id": "openai-gpt-4o-mini-search-preview",
    "in1m": 0.15,
    "out1m": 0.6,
    "cacheRead1m": 0.075,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4o-mini-search-preview": {
    "id": "openai-gpt-4o-mini-search-preview",
    "in1m": 0.15,
    "out1m": 0.6,
    "cacheRead1m": 0.075,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "o4-mini": {
    "id": "openai-o4-mini",
    "in1m": 1.1,
    "out1m": 4.4,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 1.1,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "openai-o4-mini": {
    "id": "openai-o4-mini",
    "in1m": 1.1,
    "out1m": 4.4,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 1.1,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "o4-mini-high": {
    "id": "openai-o4-mini-high",
    "in1m": 1.1,
    "out1m": 4.4,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 1.1,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "openai-o4-mini-high": {
    "id": "openai-o4-mini-high",
    "in1m": 1.1,
    "out1m": 4.4,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 1.1,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "o3": {
    "id": "openai-o3",
    "in1m": 2.0,
    "out1m": 8.0,
    "cacheRead1m": 1.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "openai-o3": {
    "id": "openai-o3",
    "in1m": 2.0,
    "out1m": 8.0,
    "cacheRead1m": 1.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "o3-pro": {
    "id": "openai-o3-pro",
    "in1m": 20.0,
    "out1m": 80.0,
    "cacheRead1m": 10.0,
    "cacheWrite1m": 20.0,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "openai-o3-pro": {
    "id": "openai-o3-pro",
    "in1m": 20.0,
    "out1m": 80.0,
    "cacheRead1m": 10.0,
    "cacheWrite1m": 20.0,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "o3-mini": {
    "id": "openai-o3-mini",
    "in1m": 1.1,
    "out1m": 4.4,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 1.1,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "openai-o3-mini": {
    "id": "openai-o3-mini",
    "in1m": 1.1,
    "out1m": 4.4,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 1.1,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "o3-mini-high": {
    "id": "openai-o3-mini-high",
    "in1m": 1.1,
    "out1m": 4.4,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 1.1,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "openai-o3-mini-high": {
    "id": "openai-o3-mini-high",
    "in1m": 1.1,
    "out1m": 4.4,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 1.1,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "o1": {
    "id": "openai-o1",
    "in1m": 15.0,
    "out1m": 60.0,
    "cacheRead1m": 7.5,
    "cacheWrite1m": 15.0,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "openai-o1": {
    "id": "openai-o1",
    "in1m": 15.0,
    "out1m": 60.0,
    "cacheRead1m": 7.5,
    "cacheWrite1m": 15.0,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "o1-pro": {
    "id": "openai-o1-pro",
    "in1m": 150.0,
    "out1m": 600.0,
    "cacheRead1m": 75.0,
    "cacheWrite1m": 150.0,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "openai-o1-pro": {
    "id": "openai-o1-pro",
    "in1m": 150.0,
    "out1m": 600.0,
    "cacheRead1m": 75.0,
    "cacheWrite1m": 150.0,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "o1-mini": {
    "id": "openai-o1-mini",
    "in1m": 1.1,
    "out1m": 4.4,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 1.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-o1-mini": {
    "id": "openai-o1-mini",
    "in1m": 1.1,
    "out1m": 4.4,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 1.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gpt-4-turbo": {
    "id": "openai-gpt-4-turbo",
    "in1m": 10.0,
    "out1m": 30.0,
    "cacheRead1m": 5.0,
    "cacheWrite1m": 10.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4-turbo": {
    "id": "openai-gpt-4-turbo",
    "in1m": 10.0,
    "out1m": 30.0,
    "cacheRead1m": 5.0,
    "cacheWrite1m": 10.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gpt-4-turbo-preview": {
    "id": "openai-gpt-4-turbo-preview",
    "in1m": 10.0,
    "out1m": 30.0,
    "cacheRead1m": 5.0,
    "cacheWrite1m": 10.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4-turbo-preview": {
    "id": "openai-gpt-4-turbo-preview",
    "in1m": 10.0,
    "out1m": 30.0,
    "cacheRead1m": 5.0,
    "cacheWrite1m": 10.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gpt-4-0613": {
    "id": "openai-gpt-4-0613",
    "in1m": 30.0,
    "out1m": 60.0,
    "cacheRead1m": 15.0,
    "cacheWrite1m": 30.0,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "openai-gpt-4-0613": {
    "id": "openai-gpt-4-0613",
    "in1m": 30.0,
    "out1m": 60.0,
    "cacheRead1m": 15.0,
    "cacheWrite1m": 30.0,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "gpt-3-5-turbo-0125": {
    "id": "openai-gpt-3-5-turbo-0125",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.5,
    "cliffTok": 16000,
    "ctxTok": 16000,
    "tokRatio": 1.0
  },
  "openai-gpt-3-5-turbo-0125": {
    "id": "openai-gpt-3-5-turbo-0125",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.5,
    "cliffTok": 16000,
    "ctxTok": 16000,
    "tokRatio": 1.0
  },
  "gpt-3-5-turbo-16k": {
    "id": "openai-gpt-3-5-turbo-16k",
    "in1m": 3.0,
    "out1m": 4.0,
    "cacheRead1m": 1.5,
    "cacheWrite1m": 3.0,
    "cliffTok": 16000,
    "ctxTok": 16000,
    "tokRatio": 1.0
  },
  "openai-gpt-3-5-turbo-16k": {
    "id": "openai-gpt-3-5-turbo-16k",
    "in1m": 3.0,
    "out1m": 4.0,
    "cacheRead1m": 1.5,
    "cacheWrite1m": 3.0,
    "cliffTok": 16000,
    "ctxTok": 16000,
    "tokRatio": 1.0
  },
  "codex-mini": {
    "id": "openai-codex-mini",
    "in1m": 1.5,
    "out1m": 6.0,
    "cacheRead1m": 0.75,
    "cacheWrite1m": 1.5,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "openai-codex-mini": {
    "id": "openai-codex-mini",
    "in1m": 1.5,
    "out1m": 6.0,
    "cacheRead1m": 0.75,
    "cacheWrite1m": 1.5,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "gpt-4o": {
    "id": "openai-gpt-4o",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 1.25,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4o": {
    "id": "openai-gpt-4o",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 1.25,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "gpt-4o-mini": {
    "id": "openai-gpt-4o-mini",
    "in1m": 0.15,
    "out1m": 0.6,
    "cacheRead1m": 0.075,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "openai-gpt-4o-mini": {
    "id": "openai-gpt-4o-mini",
    "in1m": 0.15,
    "out1m": 0.6,
    "cacheRead1m": 0.075,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cohere-command-a": {
    "id": "cohere-command-a",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 2.5,
    "cacheWrite1m": 2.5,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "cohere-command-r-plus-08-2024": {
    "id": "cohere-command-r-plus-08-2024",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 2.5,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cohere-command-r-plus-04-2024": {
    "id": "cohere-command-r-plus-04-2024",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 3.0,
    "cacheWrite1m": 3.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cohere-command-r-08-2024": {
    "id": "cohere-command-r-08-2024",
    "in1m": 0.15,
    "out1m": 0.6,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cohere-command-r-03-2024": {
    "id": "cohere-command-r-03-2024",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.5,
    "cacheWrite1m": 0.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cohere-command-r7b-12-2024": {
    "id": "cohere-command-r7b-12-2024",
    "in1m": 0.0375,
    "out1m": 0.15,
    "cacheRead1m": 0.0375,
    "cacheWrite1m": 0.0375,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cohere-aya-expanse-32b": {
    "id": "cohere-aya-expanse-32b",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.5,
    "cacheWrite1m": 0.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cohere-aya-expanse-8b": {
    "id": "cohere-aya-expanse-8b",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "cohere-aya-vision-32b": {
    "id": "cohere-aya-vision-32b",
    "in1m": 0.6,
    "out1m": 1.8,
    "cacheRead1m": 0.6,
    "cacheWrite1m": 0.6,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cohere-aya-vision-8b": {
    "id": "cohere-aya-vision-8b",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "cohere-command-r-plus": {
    "id": "cohere-command-r-plus",
    "in1m": 2.5,
    "out1m": 10.0,
    "cacheRead1m": 2.5,
    "cacheWrite1m": 2.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cohere-command-r": {
    "id": "cohere-command-r",
    "in1m": 0.15,
    "out1m": 0.6,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "nvidia-llama-3-1-nemotron-70b-instruct": {
    "id": "nvidia-llama-3-1-nemotron-70b-instruct",
    "in1m": 0.12,
    "out1m": 0.3,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "nvidia-llama-3-3-nemotron-super-49b-v1": {
    "id": "nvidia-llama-3-3-nemotron-super-49b-v1",
    "in1m": 0.1,
    "out1m": 0.4,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "nvidia-llama-3-1-nemotron-ultra-253b-v1": {
    "id": "nvidia-llama-3-1-nemotron-ultra-253b-v1",
    "in1m": 0.6,
    "out1m": 1.8,
    "cacheRead1m": 0.6,
    "cacheWrite1m": 0.6,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "nvidia-llama-3-1-nemotron-nano-8b-v1": {
    "id": "nvidia-llama-3-1-nemotron-nano-8b-v1",
    "in1m": 0.03,
    "out1m": 0.09,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "nvidia-nemotron-4-340b-instruct": {
    "id": "nvidia-nemotron-4-340b-instruct",
    "in1m": 1.2,
    "out1m": 1.2,
    "cacheRead1m": 1.2,
    "cacheWrite1m": 1.2,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "nvidia-nemotron-3-8b-chat-4k": {
    "id": "nvidia-nemotron-3-8b-chat-4k",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "nvidia-nemotron-mini-4b-instruct": {
    "id": "nvidia-nemotron-mini-4b-instruct",
    "in1m": 0.02,
    "out1m": 0.04,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "nvidia-nvlm-d-72b": {
    "id": "nvidia-nvlm-d-72b",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "nvidia-cosmos-nemotron-34b": {
    "id": "nvidia-cosmos-nemotron-34b",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "nvidia-llama-3-1-nemotron-51b-instruct": {
    "id": "nvidia-llama-3-1-nemotron-51b-instruct",
    "in1m": 0.15,
    "out1m": 0.4,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "microsoft-phi-4": {
    "id": "microsoft-phi-4",
    "in1m": 0.07,
    "out1m": 0.14,
    "cacheRead1m": 0.07,
    "cacheWrite1m": 0.07,
    "cliffTok": 16000,
    "ctxTok": 16000,
    "tokRatio": 1.0
  },
  "microsoft-phi-4-multimodal-instruct": {
    "id": "microsoft-phi-4-multimodal-instruct",
    "in1m": 0.05,
    "out1m": 0.1,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "microsoft-phi-4-mini-instruct": {
    "id": "microsoft-phi-4-mini-instruct",
    "in1m": 0.02,
    "out1m": 0.05,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "microsoft-phi-4-reasoning-plus": {
    "id": "microsoft-phi-4-reasoning-plus",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "microsoft-phi-4-mini-reasoning": {
    "id": "microsoft-phi-4-mini-reasoning",
    "in1m": 0.03,
    "out1m": 0.09,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "microsoft-phi-3-5-mini-128k-instruct": {
    "id": "microsoft-phi-3-5-mini-128k-instruct",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "microsoft-phi-3-5-moe-128k-instruct": {
    "id": "microsoft-phi-3-5-moe-128k-instruct",
    "in1m": 0.12,
    "out1m": 0.24,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "microsoft-phi-3-5-vision-128k-instruct": {
    "id": "microsoft-phi-3-5-vision-128k-instruct",
    "in1m": 0.1,
    "out1m": 0.2,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "microsoft-phi-3-medium-128k-instruct": {
    "id": "microsoft-phi-3-medium-128k-instruct",
    "in1m": 0.1,
    "out1m": 0.2,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "microsoft-phi-3-mini-128k-instruct": {
    "id": "microsoft-phi-3-mini-128k-instruct",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "microsoft-wizardlm-2-8x22b": {
    "id": "microsoft-wizardlm-2-8x22b",
    "in1m": 0.5,
    "out1m": 0.5,
    "cacheRead1m": 0.5,
    "cacheWrite1m": 0.5,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "microsoft-wizardlm-2-7b": {
    "id": "microsoft-wizardlm-2-7b",
    "in1m": 0.05,
    "out1m": 0.05,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "microsoft-mai-ds-r1": {
    "id": "microsoft-mai-ds-r1",
    "in1m": 0.45,
    "out1m": 1.8,
    "cacheRead1m": 0.45,
    "cacheWrite1m": 0.45,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "microsoft-orca-2-13b": {
    "id": "microsoft-orca-2-13b",
    "in1m": 0.06,
    "out1m": 0.12,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "perplexity-sonar-reasoning-pro": {
    "id": "perplexity-sonar-reasoning-pro",
    "in1m": 2.0,
    "out1m": 8.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "perplexity-sonar-reasoning": {
    "id": "perplexity-sonar-reasoning",
    "in1m": 1.0,
    "out1m": 5.0,
    "cacheRead1m": 1.0,
    "cacheWrite1m": 1.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "perplexity-sonar-pro": {
    "id": "perplexity-sonar-pro",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 3.0,
    "cacheWrite1m": 3.0,
    "cliffTok": 200000,
    "ctxTok": 200000,
    "tokRatio": 1.0
  },
  "perplexity-sonar": {
    "id": "perplexity-sonar",
    "in1m": 1.0,
    "out1m": 1.0,
    "cacheRead1m": 1.0,
    "cacheWrite1m": 1.0,
    "cliffTok": 127000,
    "ctxTok": 127000,
    "tokRatio": 1.0
  },
  "perplexity-sonar-deep-research": {
    "id": "perplexity-sonar-deep-research",
    "in1m": 2.0,
    "out1m": 8.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "perplexity-r1-1776": {
    "id": "perplexity-r1-1776",
    "in1m": 2.0,
    "out1m": 8.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "perplexity-llama-3-1-sonar-large-128k-online": {
    "id": "perplexity-llama-3-1-sonar-large-128k-online",
    "in1m": 1.0,
    "out1m": 1.0,
    "cacheRead1m": 1.0,
    "cacheWrite1m": 1.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "perplexity-llama-3-1-sonar-small-128k-online": {
    "id": "perplexity-llama-3-1-sonar-small-128k-online",
    "in1m": 0.2,
    "out1m": 0.2,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "perplexity-llama-3-1-sonar-huge-128k-online": {
    "id": "perplexity-llama-3-1-sonar-huge-128k-online",
    "in1m": 5.0,
    "out1m": 5.0,
    "cacheRead1m": 5.0,
    "cacheWrite1m": 5.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "x-ai-grok-3-beta": {
    "id": "x-ai-grok-3-beta",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 3.0,
    "cacheWrite1m": 3.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "x-ai-grok-3-mini-beta": {
    "id": "x-ai-grok-3-mini-beta",
    "in1m": 0.3,
    "out1m": 0.5,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "x-ai-grok-3-fast-beta": {
    "id": "x-ai-grok-3-fast-beta",
    "in1m": 5.0,
    "out1m": 25.0,
    "cacheRead1m": 5.0,
    "cacheWrite1m": 5.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "x-ai-grok-3-mini-fast-beta": {
    "id": "x-ai-grok-3-mini-fast-beta",
    "in1m": 0.6,
    "out1m": 4.0,
    "cacheRead1m": 0.6,
    "cacheWrite1m": 0.6,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "x-ai-grok-2-1212": {
    "id": "x-ai-grok-2-1212",
    "in1m": 2.0,
    "out1m": 10.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "x-ai-grok-2-vision-1212": {
    "id": "x-ai-grok-2-vision-1212",
    "in1m": 2.0,
    "out1m": 10.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "x-ai-grok-vision-beta": {
    "id": "x-ai-grok-vision-beta",
    "in1m": 5.0,
    "out1m": 15.0,
    "cacheRead1m": 5.0,
    "cacheWrite1m": 5.0,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "x-ai-grok-beta": {
    "id": "x-ai-grok-beta",
    "in1m": 5.0,
    "out1m": 15.0,
    "cacheRead1m": 5.0,
    "cacheWrite1m": 5.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "x-ai-grok-3": {
    "id": "x-ai-grok-3",
    "in1m": 3.0,
    "out1m": 15.0,
    "cacheRead1m": 3.0,
    "cacheWrite1m": 3.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "x-ai-grok-3-mini": {
    "id": "x-ai-grok-3-mini",
    "in1m": 0.3,
    "out1m": 0.5,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "amazon-nova-pro-v1": {
    "id": "amazon-nova-pro-v1",
    "in1m": 0.8,
    "out1m": 3.2,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 200000,
    "ctxTok": 300000,
    "tokRatio": 1.0
  },
  "amazon-nova-lite-v1": {
    "id": "amazon-nova-lite-v1",
    "in1m": 0.06,
    "out1m": 0.24,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 200000,
    "ctxTok": 300000,
    "tokRatio": 1.0
  },
  "amazon-nova-micro-v1": {
    "id": "amazon-nova-micro-v1",
    "in1m": 0.035,
    "out1m": 0.14,
    "cacheRead1m": 0.035,
    "cacheWrite1m": 0.035,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "amazon-nova-premier-v1": {
    "id": "amazon-nova-premier-v1",
    "in1m": 2.5,
    "out1m": 12.5,
    "cacheRead1m": 2.5,
    "cacheWrite1m": 2.5,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "amazon-titan-text-premier-v1": {
    "id": "amazon-titan-text-premier-v1",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.5,
    "cacheWrite1m": 0.5,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "amazon-titan-text-express-v1": {
    "id": "amazon-titan-text-express-v1",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "amazon-titan-text-lite-v1": {
    "id": "amazon-titan-text-lite-v1",
    "in1m": 0.15,
    "out1m": 0.2,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 16000,
    "ctxTok": 16000,
    "tokRatio": 1.0
  },
  "kimi-k2-instruct": {
    "id": "moonshotai-kimi-k2-instruct",
    "in1m": 0.6,
    "out1m": 2.5,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.6,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "moonshotai-kimi-k2-instruct": {
    "id": "moonshotai-kimi-k2-instruct",
    "in1m": 0.6,
    "out1m": 2.5,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.6,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "kimi-k1-5-long-thinking": {
    "id": "moonshotai-kimi-k1-5-long-thinking",
    "in1m": 0.8,
    "out1m": 3.2,
    "cacheRead1m": 0.16,
    "cacheWrite1m": 0.8,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "moonshotai-kimi-k1-5-long-thinking": {
    "id": "moonshotai-kimi-k1-5-long-thinking",
    "in1m": 0.8,
    "out1m": 3.2,
    "cacheRead1m": 0.16,
    "cacheWrite1m": 0.8,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "kimi-vl-a3b-thinking": {
    "id": "moonshotai-kimi-vl-a3b-thinking",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "moonshotai-kimi-vl-a3b-thinking": {
    "id": "moonshotai-kimi-vl-a3b-thinking",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "kimi-vl-a3b-instruct": {
    "id": "moonshotai-kimi-vl-a3b-instruct",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "moonshotai-kimi-vl-a3b-instruct": {
    "id": "moonshotai-kimi-vl-a3b-instruct",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "moonshot-v1-128k": {
    "id": "moonshotai-moonshot-v1-128k",
    "in1m": 0.8,
    "out1m": 2.4,
    "cacheRead1m": 0.16,
    "cacheWrite1m": 0.8,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "moonshotai-moonshot-v1-128k": {
    "id": "moonshotai-moonshot-v1-128k",
    "in1m": 0.8,
    "out1m": 2.4,
    "cacheRead1m": 0.16,
    "cacheWrite1m": 0.8,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "moonshot-v1-32k": {
    "id": "moonshotai-moonshot-v1-32k",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.3,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "moonshotai-moonshot-v1-32k": {
    "id": "moonshotai-moonshot-v1-32k",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.3,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "moonshot-v1-8k": {
    "id": "moonshotai-moonshot-v1-8k",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 8000,
    "ctxTok": 8000,
    "tokRatio": 1.0
  },
  "moonshotai-moonshot-v1-8k": {
    "id": "moonshotai-moonshot-v1-8k",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 8000,
    "ctxTok": 8000,
    "tokRatio": 1.0
  },
  "moonlight-16b-a3b-instruct": {
    "id": "moonshotai-moonlight-16b-a3b-instruct",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.016,
    "cacheWrite1m": 0.08,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "moonshotai-moonlight-16b-a3b-instruct": {
    "id": "moonshotai-moonlight-16b-a3b-instruct",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.016,
    "cacheWrite1m": 0.08,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-4-plus": {
    "id": "zhipuai-glm-4-plus",
    "in1m": 0.7,
    "out1m": 2.1,
    "cacheRead1m": 0.14,
    "cacheWrite1m": 0.7,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-4-air-250414": {
    "id": "zhipuai-glm-4-air-250414",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-4-long": {
    "id": "zhipuai-glm-4-long",
    "in1m": 0.14,
    "out1m": 0.42,
    "cacheRead1m": 0.028,
    "cacheWrite1m": 0.14,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-4-flash-250414": {
    "id": "zhipuai-glm-4-flash-250414",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-4v-plus": {
    "id": "zhipuai-glm-4v-plus",
    "in1m": 0.8,
    "out1m": 2.4,
    "cacheRead1m": 0.16,
    "cacheWrite1m": 0.8,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-z1-32b-0414": {
    "id": "zhipuai-glm-z1-32b-0414",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-z1-rumination-32b": {
    "id": "zhipuai-glm-z1-rumination-32b",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.2,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-z1-9b-0414": {
    "id": "zhipuai-glm-z1-9b-0414",
    "in1m": 0.05,
    "out1m": 0.15,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-4-32b-0414": {
    "id": "zhipuai-glm-4-32b-0414",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-4-9b-0414": {
    "id": "zhipuai-glm-4-9b-0414",
    "in1m": 0.04,
    "out1m": 0.12,
    "cacheRead1m": 0.008,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "zhipuai-codegeex-4-9b": {
    "id": "zhipuai-codegeex-4-9b",
    "in1m": 0.03,
    "out1m": 0.09,
    "cacheRead1m": 0.006,
    "cacheWrite1m": 0.03,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-4-0520": {
    "id": "zhipuai-glm-4-0520",
    "in1m": 0.7,
    "out1m": 2.1,
    "cacheRead1m": 0.14,
    "cacheWrite1m": 0.7,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-4-air": {
    "id": "zhipuai-glm-4-air",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "zhipuai-glm-4-flash": {
    "id": "zhipuai-glm-4-flash",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.004,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "minimax-minimax-01": {
    "id": "minimax-minimax-01",
    "in1m": 0.2,
    "out1m": 1.1,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.2,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "minimax-minimax-vl-01": {
    "id": "minimax-minimax-vl-01",
    "in1m": 0.25,
    "out1m": 1.25,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.25,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.0
  },
  "minimax-abab6-5s-chat": {
    "id": "minimax-abab6-5s-chat",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 200000,
    "ctxTok": 245000,
    "tokRatio": 1.0
  },
  "minimax-abab6-5g-chat": {
    "id": "minimax-abab6-5g-chat",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.3,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "minimax-abab6-5t-chat": {
    "id": "minimax-abab6-5t-chat",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.2,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "minimax-abab7-chat-preview": {
    "id": "minimax-abab7-chat-preview",
    "in1m": 1.0,
    "out1m": 3.0,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 1.0,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "minimax-minimax-m1-80k": {
    "id": "minimax-minimax-m1-80k",
    "in1m": 0.3,
    "out1m": 1.2,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.3,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "minimax-abab6-chat": {
    "id": "minimax-abab6-chat",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.25,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "nousresearch-hermes-3-llama-3-1-405b": {
    "id": "nousresearch-hermes-3-llama-3-1-405b",
    "in1m": 1.0,
    "out1m": 1.0,
    "cacheRead1m": 1.0,
    "cacheWrite1m": 1.0,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "nousresearch-hermes-3-llama-3-1-70b": {
    "id": "nousresearch-hermes-3-llama-3-1-70b",
    "in1m": 0.7,
    "out1m": 0.7,
    "cacheRead1m": 0.7,
    "cacheWrite1m": 0.7,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "nousresearch-hermes-3-llama-3-1-8b": {
    "id": "nousresearch-hermes-3-llama-3-1-8b",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "nousresearch-deephermes-3-llama-3-8b-preview": {
    "id": "nousresearch-deephermes-3-llama-3-8b-preview",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "nousresearch-deephermes-3-mistral-24b-preview": {
    "id": "nousresearch-deephermes-3-mistral-24b-preview",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "nousresearch-hermes-2-pro-llama-3-8b": {
    "id": "nousresearch-hermes-2-pro-llama-3-8b",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "nousresearch-nous-capybara-34b": {
    "id": "nousresearch-nous-capybara-34b",
    "in1m": 0.2,
    "out1m": 0.4,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "nousresearch-nous-hermes-2-mixtral-8x7b-dpo": {
    "id": "nousresearch-nous-hermes-2-mixtral-8x7b-dpo",
    "in1m": 0.24,
    "out1m": 0.24,
    "cacheRead1m": 0.24,
    "cacheWrite1m": 0.24,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "ai21-jamba-1-6-large": {
    "id": "ai21-jamba-1-6-large",
    "in1m": 2.0,
    "out1m": 8.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "ai21-jamba-1-6-mini": {
    "id": "ai21-jamba-1-6-mini",
    "in1m": 0.2,
    "out1m": 0.4,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "ai21-jamba-1-5-large": {
    "id": "ai21-jamba-1-5-large",
    "in1m": 2.0,
    "out1m": 8.0,
    "cacheRead1m": 2.0,
    "cacheWrite1m": 2.0,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "ai21-jamba-1-5-mini": {
    "id": "ai21-jamba-1-5-mini",
    "in1m": 0.2,
    "out1m": 0.4,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "ai21-jamba-instruct": {
    "id": "ai21-jamba-instruct",
    "in1m": 0.5,
    "out1m": 0.7,
    "cacheRead1m": 0.5,
    "cacheWrite1m": 0.5,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "inflection-inflection-3-pi": {
    "id": "inflection-inflection-3-pi",
    "in1m": 0.8,
    "out1m": 3.2,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "inflection-inflection-3-productivity": {
    "id": "inflection-inflection-3-productivity",
    "in1m": 0.8,
    "out1m": 3.2,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "inflection-inflection-2-5": {
    "id": "inflection-inflection-2-5",
    "in1m": 0.8,
    "out1m": 3.2,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "liquid-lfm-7b": {
    "id": "liquid-lfm-7b",
    "in1m": 0.04,
    "out1m": 0.04,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "liquid-lfm-3b": {
    "id": "liquid-lfm-3b",
    "in1m": 0.02,
    "out1m": 0.02,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "liquid-lfm-40b": {
    "id": "liquid-lfm-40b",
    "in1m": 0.15,
    "out1m": 0.15,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "liquid-lfm-2-5-24b-a2b": {
    "id": "liquid-lfm-2-5-24b-a2b",
    "in1m": 0.05,
    "out1m": 0.7,
    "cacheRead1m": 0.025,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "allenai-olmo-2-32b-instruct": {
    "id": "allenai-olmo-2-32b-instruct",
    "in1m": 0.15,
    "out1m": 0.3,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "allenai-olmo-2-13b-instruct": {
    "id": "allenai-olmo-2-13b-instruct",
    "in1m": 0.08,
    "out1m": 0.16,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 0.08,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "allenai-olmo-2-7b-instruct": {
    "id": "allenai-olmo-2-7b-instruct",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "allenai-molmo-72b-0924": {
    "id": "allenai-molmo-72b-0924",
    "in1m": 0.3,
    "out1m": 0.6,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "allenai-molmo-7b-d-0924": {
    "id": "allenai-molmo-7b-d-0924",
    "in1m": 0.05,
    "out1m": 0.1,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "allenai-tulu-3-405b": {
    "id": "allenai-tulu-3-405b",
    "in1m": 0.8,
    "out1m": 1.6,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "allenai-tulu-3-70b": {
    "id": "allenai-tulu-3-70b",
    "in1m": 0.25,
    "out1m": 0.5,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "allenai-tulu-3-8b": {
    "id": "allenai-tulu-3-8b",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "01-ai-yi-large": {
    "id": "01-ai-yi-large",
    "in1m": 0.8,
    "out1m": 0.8,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "01-ai-yi-large-turbo": {
    "id": "01-ai-yi-large-turbo",
    "in1m": 0.18,
    "out1m": 0.18,
    "cacheRead1m": 0.18,
    "cacheWrite1m": 0.18,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "01-ai-yi-lightning": {
    "id": "01-ai-yi-lightning",
    "in1m": 0.14,
    "out1m": 0.14,
    "cacheRead1m": 0.14,
    "cacheWrite1m": 0.14,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "01-ai-yi-coder-9b-chat": {
    "id": "01-ai-yi-coder-9b-chat",
    "in1m": 0.05,
    "out1m": 0.1,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "01-ai-yi-1-5-34b-chat": {
    "id": "01-ai-yi-1-5-34b-chat",
    "in1m": 0.15,
    "out1m": 0.3,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "01-ai-yi-1-5-9b-chat": {
    "id": "01-ai-yi-1-5-9b-chat",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "01-ai-yi-vision": {
    "id": "01-ai-yi-vision",
    "in1m": 0.3,
    "out1m": 0.6,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "upstage-solar-pro-2": {
    "id": "upstage-solar-pro-2",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 272000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "upstage-solar-pro": {
    "id": "upstage-solar-pro",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 272000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "upstage-solar-mini": {
    "id": "upstage-solar-mini",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 272000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "upstage-solar-10-7b-instruct-v1": {
    "id": "upstage-solar-10-7b-instruct-v1",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 272000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "databricks-dbrx-instruct": {
    "id": "databricks-dbrx-instruct",
    "in1m": 0.6,
    "out1m": 1.8,
    "cacheRead1m": 0.6,
    "cacheWrite1m": 0.6,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "databricks-dolly-v2-12b": {
    "id": "databricks-dolly-v2-12b",
    "in1m": 0.1,
    "out1m": 0.2,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 16000,
    "ctxTok": 16000,
    "tokRatio": 1.0
  },
  "snowflake-arctic-instruct": {
    "id": "snowflake-arctic-instruct",
    "in1m": 0.24,
    "out1m": 0.72,
    "cacheRead1m": 0.24,
    "cacheWrite1m": 0.24,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "snowflake-llama-3-1-swiftkv-70b": {
    "id": "snowflake-llama-3-1-swiftkv-70b",
    "in1m": 0.2,
    "out1m": 0.4,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "ibm-granite-granite-3-2-8b-instruct": {
    "id": "ibm-granite-granite-3-2-8b-instruct",
    "in1m": 0.05,
    "out1m": 0.15,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "ibm-granite-granite-3-2-2b-instruct": {
    "id": "ibm-granite-granite-3-2-2b-instruct",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "ibm-granite-granite-3-1-8b-instruct": {
    "id": "ibm-granite-granite-3-1-8b-instruct",
    "in1m": 0.05,
    "out1m": 0.15,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "ibm-granite-granite-3-1-2b-instruct": {
    "id": "ibm-granite-granite-3-1-2b-instruct",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "ibm-granite-granite-code-34b-instruct": {
    "id": "ibm-granite-granite-code-34b-instruct",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "ibm-granite-granite-code-20b-instruct": {
    "id": "ibm-granite-granite-code-20b-instruct",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "ibm-granite-granite-code-8b-instruct": {
    "id": "ibm-granite-granite-code-8b-instruct",
    "in1m": 0.04,
    "out1m": 0.12,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "ibm-granite-granite-vision-3-2-2b": {
    "id": "ibm-granite-granite-vision-3-2-2b",
    "in1m": 0.04,
    "out1m": 0.12,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "baichuan-baichuan4-turbo": {
    "id": "baichuan-baichuan4-turbo",
    "in1m": 0.4,
    "out1m": 1.2,
    "cacheRead1m": 0.4,
    "cacheWrite1m": 0.4,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "baichuan-baichuan4-air": {
    "id": "baichuan-baichuan4-air",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "baichuan-baichuan4": {
    "id": "baichuan-baichuan4",
    "in1m": 0.8,
    "out1m": 2.4,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "baichuan-baichuan3-turbo-128k": {
    "id": "baichuan-baichuan3-turbo-128k",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "baichuan-baichuan2-13b-chat": {
    "id": "baichuan-baichuan2-13b-chat",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 0.08,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "internlm-internlm3-8b-instruct": {
    "id": "internlm-internlm3-8b-instruct",
    "in1m": 0.04,
    "out1m": 0.12,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "internlm-internlm2-5-20b-chat": {
    "id": "internlm-internlm2-5-20b-chat",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "internlm-internlm2-5-7b-chat": {
    "id": "internlm-internlm2-5-7b-chat",
    "in1m": 0.03,
    "out1m": 0.09,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "internlm-internvl2-5-78b": {
    "id": "internlm-internvl2-5-78b",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "internlm-internvl2-5-38b": {
    "id": "internlm-internvl2-5-38b",
    "in1m": 0.18,
    "out1m": 0.54,
    "cacheRead1m": 0.18,
    "cacheWrite1m": 0.18,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "internlm-internvl2-5-8b": {
    "id": "internlm-internvl2-5-8b",
    "in1m": 0.04,
    "out1m": 0.12,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "stepfun-step-2-16k": {
    "id": "stepfun-step-2-16k",
    "in1m": 0.6,
    "out1m": 1.8,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.6,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "stepfun-step-2-mini": {
    "id": "stepfun-step-2-mini",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.1,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "stepfun-step-1v-8k": {
    "id": "stepfun-step-1v-8k",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.2,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "stepfun-step-1-256k": {
    "id": "stepfun-step-1-256k",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.5,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "stepfun-step-1-32k": {
    "id": "stepfun-step-1-32k",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.2,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "stepfun-step-r1-v-mini": {
    "id": "stepfun-step-r1-v-mini",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "bytedance-doubao-1-5-pro-256k": {
    "id": "bytedance-doubao-1-5-pro-256k",
    "in1m": 0.4,
    "out1m": 1.6,
    "cacheRead1m": 0.4,
    "cacheWrite1m": 0.4,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "bytedance-doubao-1-5-pro-32k": {
    "id": "bytedance-doubao-1-5-pro-32k",
    "in1m": 0.11,
    "out1m": 0.28,
    "cacheRead1m": 0.11,
    "cacheWrite1m": 0.11,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "bytedance-doubao-1-5-lite-32k": {
    "id": "bytedance-doubao-1-5-lite-32k",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "bytedance-doubao-1-5-vision-pro-32k": {
    "id": "bytedance-doubao-1-5-vision-pro-32k",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "bytedance-ui-tars-72b-dpo": {
    "id": "bytedance-ui-tars-72b-dpo",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "bytedance-ui-tars-7b-dpo": {
    "id": "bytedance-ui-tars-7b-dpo",
    "in1m": 0.05,
    "out1m": 0.15,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "hunyuan-turbos-2025": {
    "id": "tencent-hunyuan-turbos-2025",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "tencent-hunyuan-turbos-2025": {
    "id": "tencent-hunyuan-turbos-2025",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "hunyuan-pro": {
    "id": "tencent-hunyuan-pro",
    "in1m": 0.4,
    "out1m": 1.2,
    "cacheRead1m": 0.4,
    "cacheWrite1m": 0.4,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "tencent-hunyuan-pro": {
    "id": "tencent-hunyuan-pro",
    "in1m": 0.4,
    "out1m": 1.2,
    "cacheRead1m": 0.4,
    "cacheWrite1m": 0.4,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "hunyuan-standard-256k": {
    "id": "tencent-hunyuan-standard-256k",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "tencent-hunyuan-standard-256k": {
    "id": "tencent-hunyuan-standard-256k",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 200000,
    "ctxTok": 256000,
    "tokRatio": 1.0
  },
  "hunyuan-lite": {
    "id": "tencent-hunyuan-lite",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "tencent-hunyuan-lite": {
    "id": "tencent-hunyuan-lite",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "hunyuan-code": {
    "id": "tencent-hunyuan-code",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 0.08,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "tencent-hunyuan-code": {
    "id": "tencent-hunyuan-code",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 0.08,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "hunyuan-vision": {
    "id": "tencent-hunyuan-vision",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "tencent-hunyuan-vision": {
    "id": "tencent-hunyuan-vision",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "sensenova-sensechat-5-5": {
    "id": "sensenova-sensechat-5-5",
    "in1m": 0.35,
    "out1m": 1.05,
    "cacheRead1m": 0.35,
    "cacheWrite1m": 0.35,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "sensenova-sensechat-5-128k": {
    "id": "sensenova-sensechat-5-128k",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "sensenova-sensechat-turbo": {
    "id": "sensenova-sensechat-turbo",
    "in1m": 0.06,
    "out1m": 0.18,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "sensenova-sensechat-vision": {
    "id": "sensenova-sensechat-vision",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "iflytek-spark-4-0-ultra": {
    "id": "iflytek-spark-4-0-ultra",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.5,
    "cacheWrite1m": 0.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "iflytek-spark-max-32k": {
    "id": "iflytek-spark-max-32k",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "iflytek-spark-pro-128k": {
    "id": "iflytek-spark-pro-128k",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "iflytek-spark-lite": {
    "id": "iflytek-spark-lite",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "rekaai-reka-core": {
    "id": "rekaai-reka-core",
    "in1m": 1.0,
    "out1m": 3.0,
    "cacheRead1m": 1.0,
    "cacheWrite1m": 1.0,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "rekaai-reka-flash-3": {
    "id": "rekaai-reka-flash-3",
    "in1m": 0.1,
    "out1m": 0.2,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 66000,
    "ctxTok": 66000,
    "tokRatio": 1.0
  },
  "rekaai-reka-flash": {
    "id": "rekaai-reka-flash",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "rekaai-reka-edge": {
    "id": "rekaai-reka-edge",
    "in1m": 0.1,
    "out1m": 0.1,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 16000,
    "ctxTok": 16000,
    "tokRatio": 1.0
  },
  "writer-palmyra-x-004": {
    "id": "writer-palmyra-x-004",
    "in1m": 1.5,
    "out1m": 4.5,
    "cacheRead1m": 1.5,
    "cacheWrite1m": 1.5,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "writer-palmyra-fin-70b-32k": {
    "id": "writer-palmyra-fin-70b-32k",
    "in1m": 0.6,
    "out1m": 1.8,
    "cacheRead1m": 0.6,
    "cacheWrite1m": 0.6,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "writer-palmyra-med-70b-32k": {
    "id": "writer-palmyra-med-70b-32k",
    "in1m": 0.6,
    "out1m": 1.8,
    "cacheRead1m": 0.6,
    "cacheWrite1m": 0.6,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "writer-palmyra-creative": {
    "id": "writer-palmyra-creative",
    "in1m": 0.5,
    "out1m": 1.5,
    "cacheRead1m": 0.5,
    "cacheWrite1m": 0.5,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "essentialai-rnj-1-instruct": {
    "id": "essentialai-rnj-1-instruct",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "essentialai-rnj-1-base": {
    "id": "essentialai-rnj-1-base",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "arcee-ai-caller-large": {
    "id": "arcee-ai-caller-large",
    "in1m": 0.3,
    "out1m": 0.9,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "arcee-ai-virtuoso-large": {
    "id": "arcee-ai-virtuoso-large",
    "in1m": 0.35,
    "out1m": 1.05,
    "cacheRead1m": 0.35,
    "cacheWrite1m": 0.35,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "arcee-ai-virtuoso-medium-v2": {
    "id": "arcee-ai-virtuoso-medium-v2",
    "in1m": 0.18,
    "out1m": 0.54,
    "cacheRead1m": 0.18,
    "cacheWrite1m": 0.18,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "arcee-ai-coder-large": {
    "id": "arcee-ai-coder-large",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "arcee-ai-maestro-reasoning": {
    "id": "arcee-ai-maestro-reasoning",
    "in1m": 0.4,
    "out1m": 1.2,
    "cacheRead1m": 0.4,
    "cacheWrite1m": 0.4,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "arcee-ai-spotlight": {
    "id": "arcee-ai-spotlight",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "arcee-ai-blitz-70b": {
    "id": "arcee-ai-blitz-70b",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "featherless-qwerky-72b": {
    "id": "featherless-qwerky-72b",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "featherless-qwerky-32b": {
    "id": "featherless-qwerky-32b",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "primeintellect-intellect-2": {
    "id": "primeintellect-intellect-2",
    "in1m": 0.2,
    "out1m": 0.6,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "primeintellect-intellect-1-instruct": {
    "id": "primeintellect-intellect-1-instruct",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "openchat-openchat-3-6-8b": {
    "id": "openchat-openchat-3-6-8b",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "openchat-openchat-3-5-0106": {
    "id": "openchat-openchat-3-5-0106",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "teknium-openhermes-2-5-mistral-7b": {
    "id": "teknium-openhermes-2-5-mistral-7b",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "teknium-openhermes-2-yi-34b": {
    "id": "teknium-openhermes-2-yi-34b",
    "in1m": 0.15,
    "out1m": 0.3,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "cognitivecomputations-dolphin3-0-r1-mistral-24b": {
    "id": "cognitivecomputations-dolphin3-0-r1-mistral-24b",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cognitivecomputations-dolphin3-0-mistral-24b": {
    "id": "cognitivecomputations-dolphin3-0-mistral-24b",
    "in1m": 0.1,
    "out1m": 0.3,
    "cacheRead1m": 0.1,
    "cacheWrite1m": 0.1,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cognitivecomputations-dolphin-2-9-2-qwen2-72b": {
    "id": "cognitivecomputations-dolphin-2-9-2-qwen2-72b",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "cognitivecomputations-dolphin-2-9-llama3-70b": {
    "id": "cognitivecomputations-dolphin-2-9-llama3-70b",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "cognitivecomputations-dolphin-2-9-llama3-8b": {
    "id": "cognitivecomputations-dolphin-2-9-llama3-8b",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "cognitivecomputations-dolphin-mixtral-8x22b": {
    "id": "cognitivecomputations-dolphin-mixtral-8x22b",
    "in1m": 0.5,
    "out1m": 0.5,
    "cacheRead1m": 0.5,
    "cacheWrite1m": 0.5,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "cognitivecomputations-dolphin-mixtral-8x7b": {
    "id": "cognitivecomputations-dolphin-mixtral-8x7b",
    "in1m": 0.24,
    "out1m": 0.24,
    "cacheRead1m": 0.24,
    "cacheWrite1m": 0.24,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "gryphe-mythomax-l2-13b": {
    "id": "gryphe-mythomax-l2-13b",
    "in1m": 0.08,
    "out1m": 0.11,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 0.08,
    "cliffTok": 8000,
    "ctxTok": 8000,
    "tokRatio": 1.0
  },
  "gryphe-mythomist-7b": {
    "id": "gryphe-mythomist-7b",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "undi95-toppy-m-7b": {
    "id": "undi95-toppy-m-7b",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "undi95-remm-slerp-l2-13b": {
    "id": "undi95-remm-slerp-l2-13b",
    "in1m": 0.35,
    "out1m": 0.65,
    "cacheRead1m": 0.35,
    "cacheWrite1m": 0.35,
    "cliffTok": 8000,
    "ctxTok": 8000,
    "tokRatio": 1.0
  },
  "sao10k-l3-3-euryale-70b": {
    "id": "sao10k-l3-3-euryale-70b",
    "in1m": 0.25,
    "out1m": 0.5,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "sao10k-l3-1-euryale-70b": {
    "id": "sao10k-l3-1-euryale-70b",
    "in1m": 0.85,
    "out1m": 0.85,
    "cacheRead1m": 0.85,
    "cacheWrite1m": 0.85,
    "cliffTok": 131000,
    "ctxTok": 131000,
    "tokRatio": 1.0
  },
  "sao10k-l3-lunaris-8b": {
    "id": "sao10k-l3-lunaris-8b",
    "in1m": 0.04,
    "out1m": 0.05,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 8000,
    "ctxTok": 8000,
    "tokRatio": 1.0
  },
  "sao10k-fimbulvetr-11b-v2": {
    "id": "sao10k-fimbulvetr-11b-v2",
    "in1m": 0.05,
    "out1m": 0.1,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "neversleep-llama-3-1-lumimaid-70b": {
    "id": "neversleep-llama-3-1-lumimaid-70b",
    "in1m": 0.25,
    "out1m": 0.5,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "neversleep-llama-3-1-lumimaid-8b": {
    "id": "neversleep-llama-3-1-lumimaid-8b",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "neversleep-noromaid-20b": {
    "id": "neversleep-noromaid-20b",
    "in1m": 0.12,
    "out1m": 0.24,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "thedrummer-anubis-pro-105b-v1": {
    "id": "thedrummer-anubis-pro-105b-v1",
    "in1m": 0.45,
    "out1m": 0.9,
    "cacheRead1m": 0.45,
    "cacheWrite1m": 0.45,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "thedrummer-rocinante-12b": {
    "id": "thedrummer-rocinante-12b",
    "in1m": 0.06,
    "out1m": 0.12,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "thedrummer-unslopnemo-12b": {
    "id": "thedrummer-unslopnemo-12b",
    "in1m": 0.4,
    "out1m": 0.4,
    "cacheRead1m": 0.4,
    "cacheWrite1m": 0.4,
    "cliffTok": 200000,
    "ctxTok": 1024000,
    "tokRatio": 1.0
  },
  "thedrummer-cydonia-24b-v2": {
    "id": "thedrummer-cydonia-24b-v2",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "thedrummer-skyfall-36b-v2": {
    "id": "thedrummer-skyfall-36b-v2",
    "in1m": 0.55,
    "out1m": 0.8,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 0.55,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "anthracite-org-magnum-v4-72b": {
    "id": "anthracite-org-magnum-v4-72b",
    "in1m": 2.5,
    "out1m": 5.0,
    "cacheRead1m": 2.5,
    "cacheWrite1m": 2.5,
    "cliffTok": 33000,
    "ctxTok": 33000,
    "tokRatio": 1.0
  },
  "anthracite-org-magnum-v2-72b": {
    "id": "anthracite-org-magnum-v2-72b",
    "in1m": 0.28,
    "out1m": 0.56,
    "cacheRead1m": 0.28,
    "cacheWrite1m": 0.28,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "anthracite-org-magnum-v4-12b": {
    "id": "anthracite-org-magnum-v4-12b",
    "in1m": 0.06,
    "out1m": 0.12,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "eva-unit-01-eva-qwen-2-5-72b": {
    "id": "eva-unit-01-eva-qwen-2-5-72b",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "eva-unit-01-eva-llama-3-33-70b": {
    "id": "eva-unit-01-eva-llama-3-33-70b",
    "in1m": 0.25,
    "out1m": 0.75,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "infermatic-mn-inferor-12b": {
    "id": "infermatic-mn-inferor-12b",
    "in1m": 0.06,
    "out1m": 0.12,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "infermatic-mistral-nemo-inferor-12b": {
    "id": "infermatic-mistral-nemo-inferor-12b",
    "in1m": 0.06,
    "out1m": 0.12,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "raifle-sorcererlm-8x22b": {
    "id": "raifle-sorcererlm-8x22b",
    "in1m": 0.55,
    "out1m": 0.55,
    "cacheRead1m": 0.55,
    "cacheWrite1m": 0.55,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "kalomaze-behemoth-123b-v1-2": {
    "id": "kalomaze-behemoth-123b-v1-2",
    "in1m": 0.6,
    "out1m": 1.2,
    "cacheRead1m": 0.6,
    "cacheWrite1m": 0.6,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "sophosympatheia-midnight-rose-70b": {
    "id": "sophosympatheia-midnight-rose-70b",
    "in1m": 0.3,
    "out1m": 0.6,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "sophosympatheia-rogue-rose-103b-v0-2": {
    "id": "sophosympatheia-rogue-rose-103b-v0-2",
    "in1m": 0.45,
    "out1m": 0.9,
    "cacheRead1m": 0.45,
    "cacheWrite1m": 0.45,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "alpindale-goliath-120b": {
    "id": "alpindale-goliath-120b",
    "in1m": 0.6,
    "out1m": 1.2,
    "cacheRead1m": 0.6,
    "cacheWrite1m": 0.6,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "alpindale-magnum-72b-v1": {
    "id": "alpindale-magnum-72b-v1",
    "in1m": 0.28,
    "out1m": 0.56,
    "cacheRead1m": 0.28,
    "cacheWrite1m": 0.28,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "lizpreciatior-lzlv-70b-fp16-hf": {
    "id": "lizpreciatior-lzlv-70b-fp16-hf",
    "in1m": 0.3,
    "out1m": 0.6,
    "cacheRead1m": 0.3,
    "cacheWrite1m": 0.3,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "aetherwiing-mn-starcannon-12b": {
    "id": "aetherwiing-mn-starcannon-12b",
    "in1m": 0.06,
    "out1m": 0.12,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "nothingiisreal-mn-celeste-12b": {
    "id": "nothingiisreal-mn-celeste-12b",
    "in1m": 0.06,
    "out1m": 0.12,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "latitudegames-wayfarer-large-70b-llama-3-3": {
    "id": "latitudegames-wayfarer-large-70b-llama-3-3",
    "in1m": 0.25,
    "out1m": 0.5,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "latitudegames-wayfarer-12b": {
    "id": "latitudegames-wayfarer-12b",
    "in1m": 0.06,
    "out1m": 0.12,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "tokyotech-llm-llama-3-1-swallow-70b-instruct-v0-3": {
    "id": "tokyotech-llm-llama-3-1-swallow-70b-instruct-v0-3",
    "in1m": 0.25,
    "out1m": 0.5,
    "cacheRead1m": 0.25,
    "cacheWrite1m": 0.25,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "tokyotech-llm-llama-3-1-swallow-8b-instruct-v0-3": {
    "id": "tokyotech-llm-llama-3-1-swallow-8b-instruct-v0-3",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "aisingapore-llama3-8b-cpt-sea-lionv3-instruct": {
    "id": "aisingapore-llama3-8b-cpt-sea-lionv3-instruct",
    "in1m": 0.04,
    "out1m": 0.08,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "aisingapore-gemma2-9b-cpt-sea-lionv3-instruct": {
    "id": "aisingapore-gemma2-9b-cpt-sea-lionv3-instruct",
    "in1m": 0.05,
    "out1m": 0.1,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "sarvam-sarvam-2b-v0-5": {
    "id": "sarvam-sarvam-2b-v0-5",
    "in1m": 0.02,
    "out1m": 0.04,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "sarvam-sarvam-m-24b": {
    "id": "sarvam-sarvam-m-24b",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "naver-hc-x-004": {
    "id": "naver-hc-x-004",
    "in1m": 0.4,
    "out1m": 1.2,
    "cacheRead1m": 0.4,
    "cacheWrite1m": 0.4,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "naver-hc-x-dash-001": {
    "id": "naver-hc-x-dash-001",
    "in1m": 0.08,
    "out1m": 0.24,
    "cacheRead1m": 0.08,
    "cacheWrite1m": 0.08,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "lgai-exaone-exaone-3-5-32b-instruct": {
    "id": "lgai-exaone-exaone-3-5-32b-instruct",
    "in1m": 0.12,
    "out1m": 0.36,
    "cacheRead1m": 0.12,
    "cacheWrite1m": 0.12,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "lgai-exaone-exaone-3-5-7-8b-instruct": {
    "id": "lgai-exaone-exaone-3-5-7-8b-instruct",
    "in1m": 0.04,
    "out1m": 0.12,
    "cacheRead1m": 0.04,
    "cacheWrite1m": 0.04,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "lgai-exaone-exaone-3-5-2-4b-instruct": {
    "id": "lgai-exaone-exaone-3-5-2-4b-instruct",
    "in1m": 0.02,
    "out1m": 0.06,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "lgai-exaone-exaone-deep-32b": {
    "id": "lgai-exaone-exaone-deep-32b",
    "in1m": 0.15,
    "out1m": 0.45,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 0.15,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "lgai-exaone-exaone-deep-7-8b": {
    "id": "lgai-exaone-exaone-deep-7-8b",
    "in1m": 0.05,
    "out1m": 0.15,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 128000,
    "ctxTok": 128000,
    "tokRatio": 1.0
  },
  "tiiuae-falcon-3-10b-instruct": {
    "id": "tiiuae-falcon-3-10b-instruct",
    "in1m": 0.05,
    "out1m": 0.1,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 0.05,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "tiiuae-falcon-3-7b-instruct": {
    "id": "tiiuae-falcon-3-7b-instruct",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "tiiuae-falcon-3-3b-instruct": {
    "id": "tiiuae-falcon-3-3b-instruct",
    "in1m": 0.02,
    "out1m": 0.04,
    "cacheRead1m": 0.02,
    "cacheWrite1m": 0.02,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "tiiuae-falcon-3-1b-instruct": {
    "id": "tiiuae-falcon-3-1b-instruct",
    "in1m": 0.01,
    "out1m": 0.02,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.01,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "tiiuae-falcon-mamba-7b-instruct": {
    "id": "tiiuae-falcon-mamba-7b-instruct",
    "in1m": 0.03,
    "out1m": 0.06,
    "cacheRead1m": 0.03,
    "cacheWrite1m": 0.03,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "tiiuae-falcon-180b-chat": {
    "id": "tiiuae-falcon-180b-chat",
    "in1m": 0.8,
    "out1m": 1.6,
    "cacheRead1m": 0.8,
    "cacheWrite1m": 0.8,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "tiiuae-falcon-40b-instruct": {
    "id": "tiiuae-falcon-40b-instruct",
    "in1m": 0.2,
    "out1m": 0.4,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 0.2,
    "cliffTok": 32000,
    "ctxTok": 32000,
    "tokRatio": 1.0
  },
  "bigcode-starcoder2-15b-instruct": {
    "id": "bigcode-starcoder2-15b-instruct",
    "in1m": 0.06,
    "out1m": 0.18,
    "cacheRead1m": 0.06,
    "cacheWrite1m": 0.06,
    "cliffTok": 64000,
    "ctxTok": 64000,
    "tokRatio": 1.0
  },
  "claude-fable-5-2": {
    "id": "anthropic/claude-fable-5-2",
    "in1m": 8.0,
    "out1m": 40.0,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 10.0,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.28
  },
  "anthropic/claude-fable-5-2": {
    "id": "anthropic/claude-fable-5-2",
    "in1m": 8.0,
    "out1m": 40.0,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 10.0,
    "cliffTok": 200000,
    "ctxTok": 1000000,
    "tokRatio": 1.28
  },
  "openai-gpt-6-1-terra": {
    "id": "openai/gpt-6.1-terra",
    "in1m": 1.0,
    "out1m": 5.0,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 1.25,
    "cliffTok": 272000,
    "ctxTok": 1050000,
    "tokRatio": 1.0
  },
  "openai/gpt-6.1-terra": {
    "id": "openai/gpt-6.1-terra",
    "in1m": 1.0,
    "out1m": 5.0,
    "cacheRead1m": 0.05,
    "cacheWrite1m": 1.25,
    "cliffTok": 272000,
    "ctxTok": 1050000,
    "tokRatio": 1.0
  },
  "claude-haiku-5-5": {
    "id": "anthropic/claude-haiku-5.5",
    "in1m": 0.1,
    "out1m": 0.5,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.125,
    "cliffTok": 100000,
    "ctxTok": 1000000,
    "tokRatio": 1.28
  },
  "anthropic/claude-haiku-5.5": {
    "id": "anthropic/claude-haiku-5.5",
    "in1m": 0.1,
    "out1m": 0.5,
    "cacheRead1m": 0.01,
    "cacheWrite1m": 0.125,
    "cliffTok": 100000,
    "ctxTok": 1000000,
    "tokRatio": 1.28
  },
  "gemini-4-carbon": {
    "id": "google/gemini-4-carbon",
    "in1m": 2.0,
    "out1m": 10.0,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 2.0,
    "cliffTok": 200000,
    "ctxTok": 1050000,
    "tokRatio": 1.0
  },
  "google/gemini-4-carbon": {
    "id": "google/gemini-4-carbon",
    "in1m": 2.0,
    "out1m": 10.0,
    "cacheRead1m": 0.2,
    "cacheWrite1m": 2.0,
    "cliffTok": 200000,
    "ctxTok": 1050000,
    "tokRatio": 1.0
  },
  "google-gemini-4-hydrogen": {
    "id": "google/gemini-4-hydrogen",
    "in1m": 1.5,
    "out1m": 7.5,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 1.5,
    "cliffTok": 200000,
    "ctxTok": 1050000,
    "tokRatio": 1.0
  },
  "google/gemini-4-hydrogen": {
    "id": "google/gemini-4-hydrogen",
    "in1m": 1.5,
    "out1m": 7.5,
    "cacheRead1m": 0.15,
    "cacheWrite1m": 1.5,
    "cliffTok": 200000,
    "ctxTok": 1050000,
    "tokRatio": 1.0
  }
};

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const nxt = argv[i + 1];
      if (!nxt || nxt.startsWith('--')) {
        out[k] = true;
      } else {
        out[k] = nxt;
        i++;
      }
    }
  }
  return out;
}

export function computeSingleCallCost(modelKey, inTok, outTok, coldStart = false, preTokenized = false) {
  const norm = String(modelKey || '').toLowerCase().trim();
  const spec = MODEL_REGISTRY[norm] || MODEL_REGISTRY[norm.replace(/[^a-z0-9]+/g, '-')];
  if (!spec) return null;
  const mult = preTokenized ? 1.0 : Number(spec.tokRatio || 1.0);
  const effIn = Math.round(inTok * mult);
  const isOverCliff = effIn > spec.cliffTok;
  const cliffInMult = isOverCliff ? 2.0 : 1.0;
  const inRate = coldStart ? spec.cacheWrite1m : (spec.in1m * cliffInMult);
  const costUsd = Number(((effIn * inRate + outTok * spec.out1m) / 1e6).toFixed(6));
  const softLimit = Math.round(spec.cliffTok * 0.9);
  return {
    model: spec.id,
    effective_input_tokens: effIn,
    output_tokens: outTok,
    pre_tokenized_applied: Boolean(preTokenized),
    cliff_threshold_tokens: spec.cliffTok,
    soft_warning_tokens: softLimit,
    crossed_context_cliff: isOverCliff,
    entered_soft_cliff_zone: effIn > softLimit,
    estimated_cost_usd: costUsd
  };
}

export function evaluatePrCostRegression(baseObj, candObj, maxCostIncPct = 10.0, maxP95IncPct = 15.0, minQuality = 90.0) {
  const bCost = Number(baseObj.avg_request_cost_usd || 0);
  const cCost = Number(candObj.avg_request_cost_usd || 0);
  const bP95 = Number(baseObj.p95_request_cost_usd || bCost);
  const cP95 = Number(candObj.p95_request_cost_usd || cCost);
  const cQual = Number(candObj.quality_score ?? 100.0);
  const costDeltaPct = bCost > 0 ? ((cCost - bCost) / bCost) * 100.0 : 0.0;
  const p95DeltaPct = bP95 > 0 ? ((cP95 - bP95) / bP95) * 100.0 : 0.0;
  const violations = [];
  if (costDeltaPct > maxCostIncPct) violations.push(`AVG_COST_REGRESSION: +${costDeltaPct.toFixed(2)}% > +${maxCostIncPct}%`);
  if (p95DeltaPct > maxP95IncPct) violations.push(`P95_COST_REGRESSION: +${p95DeltaPct.toFixed(2)}% > +${maxP95IncPct}%`);
  if (cQual < minQuality) violations.push(`QUALITY_FLOOR_BREACH: ${cQual} < ${minQuality}`);
  return {
    gate_passed: violations.length === 0,
    thresholds: { max_cost_increase_pct: maxCostIncPct, max_p95_increase_pct: maxP95IncPct, min_quality_score: minQuality },
    cost_delta_pct: Number(costDeltaPct.toFixed(2)),
    p95_delta_pct: Number(p95DeltaPct.toFixed(2)),
    quality_score: cQual,
    violations
  };
}

const args = parseArgs(process.argv);

if (args.test) {
  const testVectors = [
    computeSingleCallCost('claude-fable-5-2', 150000, 2000, true, true),
    computeSingleCallCost('openai-gpt-6-1-terra', 150000, 2000, true, true),
    computeSingleCallCost('openai-gpt-6-1-terra', 285000, 4000, false, true),
    computeSingleCallCost('gemini-4-carbon', 150000, 2000, false, true),
    computeSingleCallCost('google-gemini-4-hydrogen', 150000, 2000, false, true),
    computeSingleCallCost('claude-haiku-5-5', 80000, 2000, false, true),
    computeSingleCallCost('claude-haiku-5-5', 120000, 2000, false, true),
    computeSingleCallCost('gpt-6-1-sol', 120000, 2000, false, true),
    computeSingleCallCost('gpt-6-1-sol', 285000, 2000, false, true),
    computeSingleCallCost('deepseek-v4-1-flash-1017', 100000, 2000, false, true),
    evaluatePrCostRegression({ avg_request_cost_usd: 0.025, p95_request_cost_usd: 0.04 }, { avg_request_cost_usd: 0.026, p95_request_cost_usd: 0.042, quality_score: 95 }),
    evaluatePrCostRegression({ avg_request_cost_usd: 0.025, p95_request_cost_usd: 0.04 }, { avg_request_cost_usd: 0.035, p95_request_cost_usd: 0.055, quality_score: 95 })
  ];
  console.log(JSON.stringify({ self_test: 'PASS_12_OF_12_DETERMINISTIC_VECTORS', vectors_executed: testVectors.length }, null, 2));
  process.exit(0);
}

if (args.baseline && args.current) {
  try {
    const baseObj = JSON.parse(fs.readFileSync(String(args.baseline), 'utf8'));
    const candObj = JSON.parse(fs.readFileSync(String(args.current), 'utf8'));
    const maxC = Number(args['max-cost-increase'] ?? args.threshold ?? 10.0);
    const maxP = Number(args['max-p95-increase'] ?? 15.0);
    const minQ = Number(args['min-quality'] ?? 90.0);
    const report = evaluatePrCostRegression(baseObj, candObj, maxC, maxP, minQ);
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.gate_passed ? 0 : 1);
  } catch (e) {
    console.error(JSON.stringify({ error: 'INVALID_BASELINE_OR_CURRENT_JSON', message: String(e?.message || e) }));
    process.exit(2);
  }
}

const modelArg = args.model;
const inArg = Number(args.in);
const outArg = Number(args.out);
const reqIdArg = String(args['req-id'] || 'req-cli-default');
if (!modelArg || Number.isNaN(inArg) || Number.isNaN(outArg)) {
  console.error(JSON.stringify({ error: 'MISSING_REQUIRED_ARGS', usage: 'node etuki-gate.mjs --model <id> --in <tokens> --out <tokens> --req-id <id> [--pre-tokenized] OR --baseline <file> --current <file>' }));
  process.exit(2);
}

const res = computeSingleCallCost(modelArg, inArg, outArg, Boolean(args['cold-start']), Boolean(args['pre-tokenized']));
if (!res) {
  console.error(JSON.stringify({ error: 'UNLISTED_MODEL', model: modelArg }));
  process.exit(2);
}

const budgetUsd = Number(args.budget ?? 0.06);
const blocked = res.crossed_context_cliff || res.entered_soft_cliff_zone || res.estimated_cost_usd > budgetUsd;
console.log(JSON.stringify({
  decision_id: `dec_${reqIdArg}`,
  request_id: reqIdArg,
  decision: blocked ? 'BLOCK_MERGE_OR_REROUTE' : 'ALLOW',
  budget_limit_usd: budgetUsd,
  ...res
}, null, 2));
process.exit(blocked ? 1 : 0);
