#!/usr/bin/env node
/**
 * Stop Hook - Rappelle de vérifier les gates
 *
 * Input: JSON via stdin (Claude Code hooks spec)
 */

import { execSync } from 'child_process';
import { isEnabled } from '../../tools/instrumentation/config.js';

// Read JSON input from stdin (Claude Code hooks pass data via stdin, not argv)
function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    // Timeout fallback for non-interactive mode
    setTimeout(() => resolve(data), 100);
  });
}

const stdinData = await readStdin();
let input = {};
try {
  input = JSON.parse(stdinData || '{}');
} catch (e) {
  // Malformed stdin — continue gracefully
  process.exit(0);
}

// Instrumentation: record stop event (opt-in)
if (isEnabled()) {
  try {
    const data = JSON.stringify({
      tool: 'Stop',
      params: { session_id: input.session_id }
    });
    execSync(`node tools/instrumentation/collector.js tool "${data.replace(/"/g, '\\"')}"`, {
      stdio: 'ignore',
      timeout: 1000
    });
  } catch (e) { /* silent fail */ }
}

console.log(`
Rappel: Avant de continuer, verifiez le gate approprie:
   node tools/gate-check.js [1-5]
`);

process.exit(0);
