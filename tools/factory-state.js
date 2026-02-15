#!/usr/bin/env node
/**
 * Factory State - Machine-readable pipeline state management
 *
 * Usage:
 *   node tools/factory-state.js get                     # Get full state as JSON
 *   node tools/factory-state.js get <key>               # Get specific key
 *   node tools/factory-state.js set <key> <value>       # Set a value
 *   node tools/factory-state.js phase <name> <status>   # Update phase status
 *   node tools/factory-state.js task <id> <status>      # Update task status
 *   node tools/factory-state.js counter <type> get      # Get counter value
 *   node tools/factory-state.js counter <type> next     # Increment and get next counter
 *   node tools/factory-state.js init                    # Initialize state file
 *   node tools/factory-state.js reset                   # Reset to initial state
 *
 * State file: docs/factory/state.json
 *
 * Exit codes:
 *   0 = Success
 *   1 = Error
 */

import fs from 'fs';
import path from 'path';

const STATE_FILE = 'docs/factory/state.json';
const STATE_DIR = path.dirname(STATE_FILE);

const INITIAL_STATE = {
  version: '1.0.0',
  // Evolution tracking
  evolutionVersion: 1,                    // 1 = V1, 2 = V2, etc.
  evolutionMode: 'greenfield',            // 'greenfield' | 'brownfield'
  // Counters for continuous numbering across versions
  counters: {
    epic: 0,
    us: 0,
    task: 0,
    adr: 0
  },
  pipeline: {
    status: 'idle', // idle, running, paused, completed, failed
    startedAt: null,
    completedAt: null,
    currentPhase: null
  },
  phases: {
    break: { status: 'pending', gate: null, startedAt: null, completedAt: null },
    model: { status: 'pending', gate: null, startedAt: null, completedAt: null },
    plan: { status: 'pending', gate: null, startedAt: null, completedAt: null },
    build: { status: 'pending', gate: null, startedAt: null, completedAt: null },
    debrief: { status: 'pending', gate: null, startedAt: null, completedAt: null }
  },
  gates: {
    0: { status: 'pending', checkedAt: null, errors: [] },
    1: { status: 'pending', checkedAt: null, errors: [] },
    2: { status: 'pending', checkedAt: null, errors: [] },
    3: { status: 'pending', checkedAt: null, errors: [] },
    4: { status: 'pending', checkedAt: null, errors: [] },
    5: { status: 'pending', checkedAt: null, errors: [] }
  },
  tasks: {
    total: 0,
    completed: 0,
    current: null,
    items: {}
  },
  lastUpdated: null
};

function ensureDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch (e) {
    console.error('Warning: Invalid state file, returning initial state');
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }
}

function saveState(state) {
  ensureDir();
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function getNestedValue(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function timestamp() {
  return new Date().toISOString();
}

// Commands
function cmdGet(key) {
  const state = loadState();
  if (!key) {
    console.log(JSON.stringify(state, null, 2));
  } else {
    const value = getNestedValue(state, key);
    if (typeof value === 'object') {
      console.log(JSON.stringify(value, null, 2));
    } else {
      console.log(value);
    }
  }
}

function cmdSet(key, value) {
  if (!key || value === undefined) {
    console.error('Usage: node tools/factory-state.js set <key> <value>');
    process.exit(1);
  }

  const state = loadState();

  // Try to parse value as JSON
  let parsedValue = value;
  try {
    parsedValue = JSON.parse(value);
  } catch (e) {
    // Keep as string
  }

  setNestedValue(state, key, parsedValue);
  saveState(state);
  console.log(`Set ${key} = ${JSON.stringify(parsedValue)}`);
}

function cmdPhase(name, status) {
  const validPhases = ['break', 'model', 'plan', 'build', 'debrief'];
  const validStatuses = ['pending', 'running', 'completed', 'failed', 'skipped'];

  if (!validPhases.includes(name)) {
    console.error(`Invalid phase: ${name}. Valid: ${validPhases.join(', ')}`);
    process.exit(1);
  }

  if (!validStatuses.includes(status)) {
    console.error(`Invalid status: ${status}. Valid: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  const state = loadState();

  // Ensure phases and pipeline structures exist (backward compat)
  if (!state.phases) {
    state.phases = {};
  }
  if (!state.phases[name]) {
    state.phases[name] = { status: 'pending', gate: null, startedAt: null, completedAt: null };
  }
  if (!state.pipeline) {
    state.pipeline = { status: 'idle', startedAt: null, completedAt: null, currentPhase: null };
  }

  state.phases[name].status = status;

  if (status === 'running') {
    state.phases[name].startedAt = timestamp();
    state.pipeline.currentPhase = name;
    state.pipeline.status = 'running';
  } else if (status === 'completed') {
    state.phases[name].completedAt = timestamp();
  } else if (status === 'failed') {
    state.phases[name].completedAt = timestamp();
    state.pipeline.status = 'failed';
  }

  saveState(state);
  console.log(`Phase ${name} → ${status}`);
}

function cmdTask(taskId, status) {
  const validStatuses = ['pending', 'running', 'completed', 'failed', 'skipped'];

  if (!validStatuses.includes(status)) {
    console.error(`Invalid status: ${status}. Valid: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  const state = loadState();

  // Ensure tasks structure exists (backward compat)
  if (!state.tasks) {
    state.tasks = { total: 0, completed: 0, current: null, items: {} };
  }
  if (!state.tasks.items) {
    state.tasks.items = {};
  }

  // Initialize task if not exists
  if (!state.tasks.items[taskId]) {
    state.tasks.items[taskId] = {
      status: 'pending',
      startedAt: null,
      completedAt: null
    };
    state.tasks.total++;
  }

  state.tasks.items[taskId].status = status;

  if (status === 'running') {
    state.tasks.items[taskId].startedAt = timestamp();
    state.tasks.current = taskId;
  } else if (status === 'completed') {
    state.tasks.items[taskId].completedAt = timestamp();
    state.tasks.completed++;
    if (state.tasks.current === taskId) {
      state.tasks.current = null;
    }
  } else if (status === 'failed') {
    state.tasks.items[taskId].completedAt = timestamp();
    if (state.tasks.current === taskId) {
      state.tasks.current = null;
    }
  }

  saveState(state);
  console.log(`Task ${taskId} → ${status}`);
}

function cmdGate(gateNum, status, errors = []) {
  const validStatuses = ['pending', 'PASS', 'FAIL', 'skipped'];

  if (!validStatuses.includes(status)) {
    console.error(`Invalid gate status: ${status}. Valid: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  const state = loadState();

  // Ensure gates structure exists (backward compat with old state files)
  if (!state.gates) {
    state.gates = {};
  }
  if (!state.gates[gateNum]) {
    if (gateNum < 0 || gateNum > 5) {
      console.error(`Invalid gate: ${gateNum}. Valid: 0-5`);
      process.exit(1);
    }
    state.gates[gateNum] = { status: 'pending', checkedAt: null, errors: [] };
  }

  state.gates[gateNum].status = status;
  state.gates[gateNum].checkedAt = timestamp();
  state.gates[gateNum].errors = errors;

  saveState(state);
  console.log(`Gate ${gateNum} → ${status}`);
}

function cmdInit() {
  const state = JSON.parse(JSON.stringify(INITIAL_STATE));
  state.pipeline.startedAt = timestamp();
  saveState(state);
  console.log('State initialized');
  console.log(JSON.stringify(state, null, 2));
}

function cmdReset() {
  saveState(JSON.parse(JSON.stringify(INITIAL_STATE)));
  console.log('State reset to initial');
}

function cmdTasksList() {
  const state = loadState();
  const planningDir = `docs/planning/v${state.evolutionVersion || 1}`;
  const tasksDir = `${planningDir}/tasks`;

  // Collect actual TASK-*.md files from disk
  const diskTasks = [];
  if (fs.existsSync(tasksDir)) {
    const files = fs.readdirSync(tasksDir).filter(f => f.match(/^TASK-\d{4}/));
    for (const f of files) {
      const match = f.match(/^(TASK-\d{4})/);
      if (match) {
        diskTasks.push(match[1]);
      }
    }
  }

  // Merge state.tasks.items with disk files
  const result = {};
  for (const taskId of diskTasks) {
    const stateEntry = state.tasks?.items?.[taskId];
    result[taskId] = {
      status: stateEntry?.status || 'pending',
      startedAt: stateEntry?.startedAt || null,
      completedAt: stateEntry?.completedAt || null,
      file: `${tasksDir}/${taskId}`
    };
  }

  // Add tasks from state that are not on disk (orphans)
  if (state.tasks?.items) {
    for (const [taskId, entry] of Object.entries(state.tasks.items)) {
      if (!result[taskId]) {
        result[taskId] = { ...entry, orphan: true };
      }
    }
  }

  console.log(JSON.stringify({
    planningDir,
    current: state.tasks?.current || null,
    total: Object.keys(result).length,
    completed: Object.values(result).filter(t => t.status === 'completed').length,
    pending: Object.values(result).filter(t => t.status === 'pending').length,
    tasks: result
  }, null, 2));
}

function cmdCounter(counterType, action) {
  const validTypes = ['epic', 'us', 'task', 'adr'];
  const validActions = ['get', 'next'];

  if (!validTypes.includes(counterType)) {
    console.error(`Invalid counter type: ${counterType}. Valid: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  if (!validActions.includes(action)) {
    console.error(`Invalid action: ${action}. Valid: ${validActions.join(', ')}`);
    process.exit(1);
  }

  const state = loadState();

  // Ensure counters object exists with all types (for backward compatibility)
  if (!state.counters) {
    state.counters = { epic: 0, us: 0, task: 0, adr: 0 };
  } else {
    // Ensure each counter type exists (handles partial counters from older versions)
    for (const type of validTypes) {
      if (state.counters[type] === undefined) {
        state.counters[type] = 0;
      }
    }
  }

  if (action === 'get') {
    console.log(state.counters[counterType]);
  } else if (action === 'next') {
    state.counters[counterType]++;
    saveState(state);
    // Format with leading zeros: EPIC-001, US-0001, TASK-0001, ADR-0001
    const padLength = counterType === 'epic' ? 3 : 4;
    const formatted = String(state.counters[counterType]).padStart(padLength, '0');
    console.log(formatted);
  }
}

// Main
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (command) {
  case 'get':
    cmdGet(arg1);
    break;

  case 'set':
    cmdSet(arg1, arg2);
    break;

  case 'phase':
    if (!arg1 || !arg2) {
      console.error('Usage: node tools/factory-state.js phase <name> <status>');
      process.exit(1);
    }
    cmdPhase(arg1, arg2);
    break;

  case 'task':
    if (!arg1 || !arg2) {
      console.error('Usage: node tools/factory-state.js task <id> <status>');
      process.exit(1);
    }
    cmdTask(arg1, arg2);
    break;

  case 'gate':
    if (!arg1 || !arg2) {
      console.error('Usage: node tools/factory-state.js gate <num> <status>');
      process.exit(1);
    }
    cmdGate(parseInt(arg1, 10), arg2);
    break;

  case 'init':
    cmdInit();
    break;

  case 'reset':
    cmdReset();
    break;

  case 'counter':
    if (!arg1 || !arg2) {
      console.error('Usage: node tools/factory-state.js counter <type> <action>');
      console.error('Types: epic, us, task, adr');
      console.error('Actions: get, next');
      process.exit(1);
    }
    cmdCounter(arg1, arg2);
    break;

  case 'tasks':
    if (arg1 === 'list') {
      cmdTasksList();
    } else {
      console.error('Usage: node tools/factory-state.js tasks list');
      process.exit(1);
    }
    break;

  default:
    console.log('Usage: node tools/factory-state.js <command> [args]');
    console.log('');
    console.log('Commands:');
    console.log('  get [key]              Get state (or specific key)');
    console.log('  set <key> <value>      Set a value');
    console.log('  phase <name> <status>  Update phase (break|model|plan|build|debrief)');
    console.log('  task <id> <status>     Update task (pending|running|completed|failed)');
    console.log('  gate <num> <status>    Update gate (0-5)');
    console.log('  counter <type> <action> Get/increment counter (epic|us|task|adr)');
    console.log('  tasks list             List all tasks with statuses (state + disk)');
    console.log('  init                   Initialize state file');
    console.log('  reset                  Reset to initial state');
    process.exit(command ? 1 : 0);
}
