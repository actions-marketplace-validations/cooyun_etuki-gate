#!/usr/bin/env node
/**
 * Etuki Coding Agent Context-Saver & 600s Zero-Disconnect CLI (etuki-saver.mjs)
 * Install & Run: curl -sSfL https://www.etuki.com/sdk/etuki-saver.mjs -o etuki-saver.mjs && node etuki-saver.mjs init
 */
import http from 'http';
import https from 'https';
import fs from 'fs';

const args = process.argv.slice(2);
const cmd = args[0] || 'init';
const keyArg = args.find(a => a.startsWith('--key='))?.split('=')[1] || process.env.ETUKI_LICENSE_KEY || 'FREE_TRIAL';
const isPaid = /^ETK-(FOUNDER|PARTNER|30D)-/i.test(keyArg);

console.log('======================================================================');
console.log('⚡ Etuki Coding Agent Context-Saver & 4-Block Cache Lock v2.0');
console.log('🌐 Official Hub: https://www.etuki.com/context-mode | SLA: https://www.etuki.com/sla');
console.log(isPaid
  ? `🟢 License Active (${keyArg}) — 600s Zero-Disconnect & Unlimited Folding Unlocked!`
  : `🟡 Free Trial Mode (30 Turns/Day) — Get 30-Day Unlimited Pass ($19 One-Time): https://www.etuki.com/sponsor`);
console.log('======================================================================');

if (cmd === 'init') {
  const mcpConfig = {
    servers: {
      'etuki-finops-mcp': {
        url: 'https://www.etuki.com/api/v1/mcp',
        env: { ETUKI_LICENSE_KEY: keyArg, ETUKI_PIN_4_CACHE_BREAKPOINTS: 'true' }
      }
    }
  };
  try {
    fs.mkdirSync('.vscode', { recursive: true });
    fs.writeFileSync('.vscode/mcp.json', JSON.stringify(mcpConfig, null, 2));
    console.log('✅ Wrote .vscode/mcp.json — Your IDE is now connected to Etuki 4-Block Cache Pinning!');
    console.log('👉 For ZCode / Cursor / Cline 600s Zero-Disconnect Cloud Saver, set Base URL to:');
    console.log('   https://gw-sg.etuki.com:8088/v1  (or http://127.0.0.1:8088/v1)');
  } catch (e) {
    console.log('Config preview:\n', JSON.stringify(mcpConfig, null, 2));
  }
}
