#!/usr/bin/env node
/**
 * Etuki FinOps MCP Server (etuki-finops-mcp)
 * Implements the Model Context Protocol (MCP 2025-06-18 / 2026) over STDIO and Streamable HTTP
 * Compatible with @modelcontextprotocol/sdk Server, StdioServerTransport, tools/list, tools/call, resources/list, prompts/list
 */
import readline from 'node:readline';

const REMOTE_MCP_ENDPOINT = 'https://www.etuki.com/api/v1/mcp';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    const res = await fetch(REMOTE_MCP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (res.status === 202) return;
    const data = await res.json();
    process.stdout.write(JSON.stringify(data) + '\n');
  } catch (err) {
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32603, message: String(err?.message || err) }
    }) + '\n');
  }
});
