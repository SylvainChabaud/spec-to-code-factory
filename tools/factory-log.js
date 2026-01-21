#!/usr/bin/env node
/**
 * Factory Log - Ajoute une entrée au journal
 * Usage: node tools/factory-log.js <phase> <agent> <status> [message]
 */

import fs from 'fs';

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
