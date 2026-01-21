#!/usr/bin/env node
/**
 * Validate Commit Message - Enforce TASK-XXXX format
 *
 * Usage: node tools/validate-commit-msg.js <commit-msg-file>
 *
 * This script validates that commit messages follow the factory convention:
 * - Must start with TASK-XXXX: (4 digits)
 * - Example: TASK-0001: Add user authentication
 *
 * Exit codes:
 *   0 = Valid commit message
 *   1 = Invalid format (blocked)
 *
 * Integration:
 * - Git hook: Copy to .git/hooks/commit-msg
 * - Husky: Add to .husky/commit-msg
 */

import fs from 'fs';

const commitMsgFile = process.argv[2];

if (!commitMsgFile) {
  console.error('Usage: node tools/validate-commit-msg.js <commit-msg-file>');
  process.exit(1);
}

if (!fs.existsSync(commitMsgFile)) {
  console.error(`Error: Commit message file not found: ${commitMsgFile}`);
  process.exit(1);
}

const message = fs.readFileSync(commitMsgFile, 'utf-8').trim();

// Skip merge commits and other special commits
if (message.startsWith('Merge ') || message.startsWith('Revert ')) {
  process.exit(0);
}

// Validate TASK-XXXX format
const taskPattern = /^TASK-\d{4}:/;
if (!taskPattern.test(message)) {
  console.error('');
  console.error('========================================');
  console.error('  COMMIT BLOCKED - Invalid format');
  console.error('========================================');
  console.error('');
  console.error('  Commit message must start with TASK-XXXX:');
  console.error('');
  console.error('  Examples:');
  console.error('    TASK-0001: Add user authentication');
  console.error('    TASK-0042: Fix validation bug in form');
  console.error('');
  console.error('  Your message:');
  console.error(`    "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
  console.error('');
  console.error('  See: .claude/rules/factory-invariants.md');
  console.error('========================================');
  console.error('');
  process.exit(1);
}

// Validate task number is not all zeros
const taskNumber = message.match(/TASK-(\d{4})/)[1];
if (taskNumber === '0000') {
  console.error('');
  console.error('  Warning: TASK-0000 is reserved for templates.');
  console.error('  Use a real task number (TASK-0001, TASK-0002, etc.)');
  console.error('');
  process.exit(1);
}

console.log(`Commit message validated: ${message.split('\n')[0]}`);
process.exit(0);
