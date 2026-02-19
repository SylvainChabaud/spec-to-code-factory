#!/usr/bin/env node
/**
 * SubagentStart Hook - Track agent delegations
 * Records when Claude Code delegates to a subagent (Task tool)
 *
 * Input: JSON via stdin (Claude Code hooks spec)
 * Fields: session_id, agent_id, agent_type
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
  // Malformed stdin — allow subagent to proceed
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

// Instrumentation: record agent delegation (opt-in)
if (isEnabled()) {
  try {
    const data = JSON.stringify({
      agent: input.agent_type,
      source: 'subagent-spawn',
      agentId: input.agent_id,
      description: input.description || null
    });
    execSync(`node tools/instrumentation/collector.js agent "${data.replace(/"/g, '\\"')}"`, {
      stdio: 'ignore',
      timeout: 1000
    });
  } catch (e) { /* silent fail */ }
}

// Allow subagent to proceed
console.log(JSON.stringify({
  continue: true,
  hookSpecificOutput: {
    hookEventName: "SubagentStart",
    tracked: true
  }
}));
process.exit(0);
