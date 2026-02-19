#!/usr/bin/env node
/**
 * PreToolUse Hook for Skill tool - Track skill invocations
 * Records when a skill is invoked (factory-intake, factory-spec, etc.)
 *
 * Input: JSON via stdin (Claude Code hooks spec)
 * Fields: tool_name, tool_input (skill, args)
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
  // Malformed stdin — allow tool to proceed
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

// Instrumentation: record skill invocation + phase-start (opt-in)
if (isEnabled() && input.tool_input?.skill) {
  const skillName = input.tool_input.skill;

  // Reset instrumentation for a clean timeline when starting a new pipeline
  if (skillName === 'factory') {
    try {
      execSync('node tools/instrumentation/collector.js reset', {
        stdio: 'ignore', timeout: 1000
      });
    } catch (e) { /* silent fail */ }
  }

  // Record skill invocation
  try {
    const data = JSON.stringify({ skill: skillName, parentSkill: null });
    execSync(`node tools/instrumentation/collector.js skill "${data.replace(/"/g, '\\"')}"`, {
      stdio: 'ignore',
      timeout: 1000
    });
  } catch (e) { /* silent fail */ }

  // Record phase-start for phase skills (replaces manual calls in SKILL.md)
  const SKILL_PHASE_MAP = {
    'factory-intake': 'BREAK',
    'factory-spec': 'MODEL',
    'factory-plan': 'ACT_PLAN',
    'factory-build': 'ACT_BUILD',
    'factory-qa': 'DEBRIEF'
  };
  const phase = SKILL_PHASE_MAP[skillName];
  if (phase) {
    try {
      const data = JSON.stringify({ phase, skill: skillName });
      execSync(`node tools/instrumentation/collector.js phase-start "${data.replace(/"/g, '\\"')}"`, {
        stdio: 'ignore',
        timeout: 1000
      });
    } catch (e) { /* silent fail */ }
  }
}

// Allow skill to proceed
console.log(JSON.stringify({
  continue: true,
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "allow"
  }
}));
process.exit(0);
