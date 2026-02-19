#!/usr/bin/env node
/**
 * Set Current Task - Manage active task state for instrumentation
 *
 * Usage:
 *   node tools/set-current-task.js set <task-file>   # Set current task
 *   node tools/set-current-task.js get               # Get current task path
 *   node tools/set-current-task.js clear             # Clear current task
 *
 * The current task is stored in docs/factory/current-task.txt
 * This file is read by posttooluse-validate.js for instrumentation tracking.
 *
 * Exit codes:
 *   0 = Success
 *   1 = Error
 */

import fs from 'fs';
import path from 'path';

const STATE_FILE = 'docs/factory/current-task.txt';
const STATE_DIR = path.dirname(STATE_FILE);

function ensureDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

function setTask(taskFile) {
  if (!fs.existsSync(taskFile)) {
    console.error(`Task file not found: ${taskFile}`);
    process.exit(1);
  }

  ensureDir();
  fs.writeFileSync(STATE_FILE, taskFile.trim(), 'utf-8');
  console.log(`Current task set: ${taskFile}`);
  process.exit(0);
}

function getTask() {
  if (!fs.existsSync(STATE_FILE)) {
    console.log('');  // No current task
    process.exit(0);
  }

  const task = fs.readFileSync(STATE_FILE, 'utf-8').trim();
  console.log(task);
  process.exit(0);
}

function clearTask() {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
    console.log('Current task cleared');
  } else {
    console.log('No current task to clear');
  }
  process.exit(0);
}

// Main
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'set':
    if (!arg) {
      console.error('Usage: node tools/set-current-task.js set <task-file>');
      process.exit(1);
    }
    setTask(arg);
    break;

  case 'get':
    getTask();
    break;

  case 'clear':
    clearTask();
    break;

  default:
    console.log('Usage:');
    console.log('  node tools/set-current-task.js set <task-file>   # Set current task');
    console.log('  node tools/set-current-task.js get               # Get current task');
    console.log('  node tools/set-current-task.js clear             # Clear current task');
    process.exit(command ? 1 : 0);
}
