#!/usr/bin/env node
/**
 * PostToolUse Hook - Instrumentation des fichiers écrits
 * Exit codes:
 *   0 = OK (toujours — ce hook ne bloque jamais)
 *
 * Role: Enregistre les ecritures de fichiers pour l'instrumentation.
 * La validation metier est effectuee par les gates (tools/gate-check.js).
 *
 * Input: JSON via stdin (Claude Code hooks spec)
 */

import fs from 'fs';
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
  // Malformed stdin — allow tool to proceed
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

// Instrumentation: record file write (opt-in)
function recordFileWrite(filePath, tool) {
  if (isEnabled()) {
    try {
      const currentTask = fs.existsSync('docs/factory/current-task.txt')
        ? fs.readFileSync('docs/factory/current-task.txt', 'utf-8').trim()
        : null;
      const data = JSON.stringify({ filePath, tool, task: currentTask });
      execSync(`node tools/instrumentation/collector.js file "${data.replace(/"/g, '\\"')}"`, {
        stdio: 'ignore',
        timeout: 1000
      });
    } catch (e) { /* silent fail */ }
  }
}

// Main - use tool_name and tool_input (Claude Code hooks spec)
if (input.tool_name === 'Write' || input.tool_name === 'Edit') {
  const filePath = input.tool_input?.file_path || input.tool_input?.path;
  if (filePath) {
    recordFileWrite(filePath, input.tool_name);
  }
}

// Toujours continuer — la validation metier est dans les gates
console.log(JSON.stringify({
  continue: true,
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    validated: true
  }
}));
process.exit(0);
