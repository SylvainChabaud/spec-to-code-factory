#!/usr/bin/env node
/**
 * Instrumentation Collector - Collects pipeline events (append-only)
 *
 * Usage:
 *   node tools/instrumentation/collector.js <event_type> <json_data>
 *
 * Event types:
 *   - tool_invocation: Tool was invoked (PreToolUse)
 *   - file_written: File was written (PostToolUse)
 *   - gate_checked: Gate check completed
 *   - skill_invoked: Skill was invoked
 *   - agent_delegated: Agent delegation via Task tool
 *
 * Activation:
 *   export FACTORY_INSTRUMENTATION=true
 *
 * Output: docs/factory/instrumentation.json
 */

import fs from 'fs';
import path from 'path';
import { isEnabled } from './config.js';

const INSTRUMENTATION_FILE = 'docs/factory/instrumentation.json';
const INSTRUMENTATION_DIR = path.dirname(INSTRUMENTATION_FILE);

/**
 * Initialize instrumentation file if it doesn't exist
 */
function initFile() {
  if (!fs.existsSync(INSTRUMENTATION_DIR)) {
    fs.mkdirSync(INSTRUMENTATION_DIR, { recursive: true });
  }

  if (!fs.existsSync(INSTRUMENTATION_FILE)) {
    const initialData = {
      version: '1.0.0',
      startedAt: new Date().toISOString(),
      events: []
    };
    fs.writeFileSync(INSTRUMENTATION_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

/**
 * Load existing instrumentation data
 */
function loadData() {
  initFile();
  try {
    return JSON.parse(fs.readFileSync(INSTRUMENTATION_FILE, 'utf-8'));
  } catch (e) {
    return {
      version: '1.0.0',
      startedAt: new Date().toISOString(),
      events: []
    };
  }
}

/**
 * Save instrumentation data
 */
function saveData(data) {
  initFile();
  fs.writeFileSync(INSTRUMENTATION_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Append a new event to the instrumentation log
 * @param {string} eventType - Type of event
 * @param {object} eventData - Event-specific data
 */
function appendEvent(eventType, eventData) {
  if (!isEnabled()) {
    return; // Silent no-op when disabled
  }

  const data = loadData();

  const event = {
    id: data.events.length + 1,
    timestamp: new Date().toISOString(),
    type: eventType,
    data: eventData
  };

  data.events.push(event);
  saveData(data);

  return event;
}

/**
 * Record a tool invocation (PreToolUse hook)
 * @param {string} tool - Tool name
 * @param {object} params - Tool parameters
 * @param {string} agent - Current agent (if any)
 */
function recordToolInvocation(tool, params, agent = null) {
  return appendEvent('tool_invocation', {
    tool,
    command: params?.command?.substring(0, 200), // Truncate for readability
    filePath: params?.file_path || params?.path,
    agent
  });
}

/**
 * Record a file write operation (PostToolUse hook)
 * @param {string} filePath - Written file path
 * @param {string} tool - Tool used (Write/Edit)
 * @param {string} task - Current task ID
 */
function recordFileWritten(filePath, tool, task = null) {
  return appendEvent('file_written', {
    filePath,
    tool,
    task
  });
}

/**
 * Record a gate check result
 * @param {number} gateNum - Gate number (1-5)
 * @param {string} status - PASS or FAIL
 * @param {string[]} errors - Errors if any
 */
function recordGateCheck(gateNum, status, errors = []) {
  return appendEvent('gate_checked', {
    gate: gateNum,
    status,
    errors
  });
}

/**
 * Record a skill invocation
 * @param {string} skill - Skill name
 * @param {string} parentSkill - Parent skill if nested
 */
function recordSkillInvocation(skill, parentSkill = null) {
  return appendEvent('skill_invoked', {
    skill,
    parentSkill
  });
}

/**
 * Record an agent delegation (Task tool)
 * @param {string} agent - Agent type
 * @param {string} source - Calling context
 * @param {string} prompt - Task description
 */
function recordAgentDelegation(agent, source = null, prompt = null) {
  return appendEvent('agent_delegated', {
    agent,
    source,
    promptPreview: prompt?.substring(0, 100) // Truncate for readability
  });
}

/**
 * Reset instrumentation data (for new pipeline run)
 */
function reset() {
  const data = {
    version: '1.0.0',
    startedAt: new Date().toISOString(),
    events: []
  };
  saveData(data);
  console.log('Instrumentation data reset');
}

/**
 * Get summary of collected events
 */
function getSummary() {
  if (!fs.existsSync(INSTRUMENTATION_FILE)) {
    return { total: 0, byType: {} };
  }

  const data = loadData();
  const byType = {};

  for (const event of data.events) {
    byType[event.type] = (byType[event.type] || 0) + 1;
  }

  return {
    total: data.events.length,
    startedAt: data.startedAt,
    byType
  };
}

// CLI interface
const command = process.argv[2];
const arg1 = process.argv[3];

switch (command) {
  case 'tool':
    // node collector.js tool '{"tool":"Bash","params":{"command":"npm test"}}'
    try {
      const data = JSON.parse(arg1 || '{}');
      recordToolInvocation(data.tool, data.params, data.agent);
    } catch (e) {
      console.error('Invalid JSON data');
      process.exit(1);
    }
    break;

  case 'file':
    // node collector.js file '{"filePath":"src/app.ts","tool":"Write","task":"TASK-0001"}'
    try {
      const data = JSON.parse(arg1 || '{}');
      recordFileWritten(data.filePath, data.tool, data.task);
    } catch (e) {
      console.error('Invalid JSON data');
      process.exit(1);
    }
    break;

  case 'gate':
    // node collector.js gate '{"gate":1,"status":"PASS","errors":[]}'
    try {
      const data = JSON.parse(arg1 || '{}');
      recordGateCheck(data.gate, data.status, data.errors || []);
    } catch (e) {
      console.error('Invalid JSON data');
      process.exit(1);
    }
    break;

  case 'skill':
    // node collector.js skill '{"skill":"factory-run","parentSkill":null}'
    try {
      const data = JSON.parse(arg1 || '{}');
      recordSkillInvocation(data.skill, data.parentSkill);
    } catch (e) {
      console.error('Invalid JSON data');
      process.exit(1);
    }
    break;

  case 'agent':
    // node collector.js agent '{"agent":"developer","source":"factory-build"}'
    try {
      const data = JSON.parse(arg1 || '{}');
      recordAgentDelegation(data.agent, data.source, data.prompt);
    } catch (e) {
      console.error('Invalid JSON data');
      process.exit(1);
    }
    break;

  case 'reset':
    reset();
    break;

  case 'summary':
    console.log(JSON.stringify(getSummary(), null, 2));
    break;

  case 'status':
    console.log(`Instrumentation: ${isEnabled() ? 'ENABLED' : 'DISABLED'}`);
    if (isEnabled()) {
      console.log(JSON.stringify(getSummary(), null, 2));
    }
    break;

  default:
    if (command) {
      console.error(`Unknown command: ${command}`);
    }
    console.log('Usage: node tools/instrumentation/collector.js <command> [data]');
    console.log('');
    console.log('Commands:');
    console.log('  tool <json>    Record tool invocation');
    console.log('  file <json>    Record file write');
    console.log('  gate <json>    Record gate check');
    console.log('  skill <json>   Record skill invocation');
    console.log('  agent <json>   Record agent delegation');
    console.log('  reset          Reset instrumentation data');
    console.log('  summary        Show event summary');
    console.log('  status         Show instrumentation status');
    console.log('');
    console.log('Activation: export FACTORY_INSTRUMENTATION=true');
    process.exit(command ? 1 : 0);
}

// Export functions for programmatic use
export {
  isEnabled,
  appendEvent,
  recordToolInvocation,
  recordFileWritten,
  recordGateCheck,
  recordSkillInvocation,
  recordAgentDelegation,
  reset,
  getSummary,
  loadData
};
