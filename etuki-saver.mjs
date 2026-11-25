#!/usr/bin/env node
/**
 * Etuki Local Prompt-Cache Break & CSV Inspector (Read-Only Local CLI)
 * Never modifies IDE configs (.vscode/mcp.json) and never proxies traffic through external gateways.
 * For signed executive CFO PDF reports and team monitoring, visit https://www.etuki.com/audit
 */
import fs from 'node:fs';

const fileArg = process.argv[2];
if (!fileArg || !fs.existsSync(fileArg)) {
  console.log('Usage: node etuki-saver.mjs <path-to-session.jsonl-or-billing.csv>');
  console.log('Runs 100% locally (read-only). For Signed CFO PDF Audit Certificates, use https://www.etuki.com/audit');
  process.exit(0);
}
const raw = fs.readFileSync(fileArg, 'utf8').trim().split(/\r?\n/);
console.log(`[Etuki Local Inspector] Scanned ${raw.length} lines locally (0 bytes uploaded).`);
