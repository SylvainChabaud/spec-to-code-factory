#!/usr/bin/env node
/**
 * Factory Log - Ajoute une entrée au journal
 * Usage: node tools/factory-log.js <phase> <agent> <status> [message]
 *
 * Also records to instrumentation (if enabled) for unified tracking.
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { isEnabled } from './instrumentation/config.js';

const LOG_FILE = 'docs/factory/log.md';

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 16);
}

function ensureLogFile() {
  if (!fs.existsSync('docs/factory')) {
    fs.mkdirSync('docs/factory', { recursive: true });
  }

  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, `# Factory Log — Journal de génération

> Ce fichier trace les actions du pipeline.

---

`);
  }
}

function addEntry(phase, agent, status, message = '') {
  ensureLogFile();

  const timestamp = getTimestamp();
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';

  const entry = `
## [${timestamp}] Phase ${phase.toUpperCase()}
- **Agent**: ${agent}
- **Status**: ${statusIcon} ${status}
${message ? `- **Message**: ${message}` : ''}

`;

  fs.appendFileSync(LOG_FILE, entry);
  console.log(`📝 Logged: ${phase} - ${agent} - ${status}`);

  // Also record to instrumentation (if enabled)
  if (isEnabled()) {
    try {
      // Record agent delegation
      if (agent && agent !== 'completed' && agent !== 'started') {
        const agentData = JSON.stringify({ agent: agent.toLowerCase(), source: `factory-${phase.toLowerCase()}` });
        execSync(`node tools/instrumentation/collector.js agent "${agentData.replace(/"/g, '\\"')}"`, {
          stdio: 'ignore',
          timeout: 1000
        });
      }

      // Record phase event based on status
      if (status === 'PASS' || agent === 'completed') {
        const phaseData = JSON.stringify({ phase: phase.toUpperCase(), status: 'PASS', message });
        execSync(`node tools/instrumentation/collector.js phase-end "${phaseData.replace(/"/g, '\\"')}"`, {
          stdio: 'ignore',
          timeout: 1000
        });
      } else if (status === 'FAIL') {
        const phaseData = JSON.stringify({ phase: phase.toUpperCase(), status: 'FAIL', message });
        execSync(`node tools/instrumentation/collector.js phase-end "${phaseData.replace(/"/g, '\\"')}"`, {
          stdio: 'ignore',
          timeout: 1000
        });
      } else if (agent === 'started') {
        const phaseData = JSON.stringify({ phase: phase.toUpperCase(), skill: `factory-${phase.toLowerCase()}` });
        execSync(`node tools/instrumentation/collector.js phase-start "${phaseData.replace(/"/g, '\\"')}"`, {
          stdio: 'ignore',
          timeout: 1000
        });
      }
    } catch (e) { /* silent fail */ }
  }
}

// Main
const [,, phase, agent, status, ...messageParts] = process.argv;

if (!phase || !agent || !status) {
  console.log('Usage: node tools/factory-log.js <phase> <agent> <status> [message]');
  console.log('');
  console.log('Exemples:');
  console.log('  node tools/factory-log.js BREAK Analyst PASS');
  console.log('  node tools/factory-log.js MODEL PM FAIL "Section manquante"');
  process.exit(0);
}

addEntry(phase, agent, status, messageParts.join(' '));
