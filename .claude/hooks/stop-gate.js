#!/usr/bin/env node
/**
 * Stop Hook - Rappelle de vérifier les gates
 */

import { execSync } from 'child_process';
import { isEnabled } from '../../tools/instrumentation/config.js';

// Instrumentation: record stop event (opt-in)
if (isEnabled()) {
  try {
    execSync('node tools/instrumentation/collector.js tool "{\\"tool\\":\\"Stop\\",\\"params\\":{}}"', {
      stdio: 'ignore',
      timeout: 1000
    });
  } catch (e) { /* silent fail */ }
}

console.log(`
💡 Rappel: Avant de continuer, vérifiez le gate approprié:
   node tools/gate-check.js [1-5]
`);

process.exit(0);
