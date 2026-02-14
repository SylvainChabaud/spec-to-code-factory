#!/usr/bin/env node
/**
 * Verify Pipeline - Verification post-pipeline complete
 *
 * Verifie que le pipeline a correctement genere tous les artefacts attendus,
 * y compris les nouvelles fonctionnalites (architecture, boundaries, instrumentation).
 *
 * Usage:
 *   node tools/verify-pipeline.js              # Verification complete
 *   node tools/verify-pipeline.js --json       # Output JSON
 *   node tools/verify-pipeline.js --verbose    # Details supplementaires
 *
 * Exit codes:
 *   0 = PASS (toutes verifications OK)
 *   1 = ERROR (erreur d'execution)
 *   2 = FAIL (verifications echouees)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getPlanningDir, getTasksDir, getUSDir } from './lib/factory-state.js';

const VERBOSE = process.argv.includes('--verbose');
const JSON_OUTPUT = process.argv.includes('--json');

// Chemins dynamiques versionnés
const PLANNING_DIR = getPlanningDir();
const TASKS_DIR = getTasksDir();
const US_DIR = getUSDir();

// Resultats
const results = {
  categories: {},
  summary: { pass: 0, fail: 0, skip: 0, warn: 0 }
};

function check(category, name, fn) {
  if (!results.categories[category]) {
    results.categories[category] = [];
  }

  try {
    const result = fn();
    if (result.skip) {
      results.categories[category].push({ name, status: 'SKIP', reason: result.reason });
      results.summary.skip++;
    } else if (result.pass) {
      results.categories[category].push({ name, status: 'PASS', detail: result.detail });
      results.summary.pass++;
    } else {
      results.categories[category].push({ name, status: 'FAIL', reason: result.reason });
      results.summary.fail++;
    }
  } catch (e) {
    results.categories[category].push({ name, status: 'FAIL', reason: e.message });
    results.summary.fail++;
  }
}

function warn(category, name, message) {
  if (!results.categories[category]) {
    results.categories[category] = [];
  }
  results.categories[category].push({ name, status: 'WARN', reason: message });
  results.summary.warn++;
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function fileContains(filePath, pattern) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  if (typeof pattern === 'string') return content.includes(pattern);
  return pattern.test(content);
}

function countFiles(dir, ext) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      count += countFiles(fullPath, ext);
    } else if (entry.name.endsWith(ext)) {
      count++;
    }
  }
  return count;
}

// ============================================================
// 1. PHASE BREAK — Artefacts de base
// ============================================================

check('Phase BREAK', 'brief.md existe', () => {
  return fileExists('docs/brief.md')
    ? { pass: true }
    : { pass: false, reason: 'docs/brief.md manquant' };
});

check('Phase BREAK', 'scope.md existe', () => {
  return fileExists('docs/scope.md')
    ? { pass: true }
    : { pass: false, reason: 'docs/scope.md manquant' };
});

check('Phase BREAK', 'acceptance.md existe', () => {
  return fileExists('docs/acceptance.md')
    ? { pass: true }
    : { pass: false, reason: 'docs/acceptance.md manquant' };
});

// ============================================================
// 2. PHASE MODEL — Specs et ADR
// ============================================================

check('Phase MODEL', 'system.md existe', () => {
  return fileExists('docs/specs/system.md')
    ? { pass: true }
    : { pass: false, reason: 'docs/specs/system.md manquant' };
});

check('Phase MODEL', 'domain.md existe', () => {
  return fileExists('docs/specs/domain.md')
    ? { pass: true }
    : { pass: false, reason: 'docs/specs/domain.md manquant' };
});

check('Phase MODEL', 'api.md existe', () => {
  return fileExists('docs/specs/api.md')
    ? { pass: true }
    : { pass: false, reason: 'docs/specs/api.md manquant' };
});

check('Phase MODEL', 'Au moins 1 ADR', () => {
  if (!fs.existsSync('docs/adr')) return { pass: false, reason: 'Dossier docs/adr/ manquant' };
  const adrs = fs.readdirSync('docs/adr').filter(f => f.startsWith('ADR-') && f.endsWith('.md'));
  return adrs.length > 0
    ? { pass: true, detail: `${adrs.length} ADR(s) : ${adrs.join(', ')}` }
    : { pass: false, reason: 'Aucun ADR trouve' };
});

// --- Nouvelles verifications architecture ---

check('Phase MODEL', 'domain.md contient section Architecture logicielle', () => {
  if (!fileExists('docs/specs/domain.md')) return { skip: true, reason: 'domain.md absent' };
  return fileContains('docs/specs/domain.md', 'Architecture logicielle')
    ? { pass: true }
    : { pass: false, reason: 'Section "Architecture logicielle" absente de domain.md' };
});

check('Phase MODEL', 'domain.md contient table des Layers', () => {
  if (!fileExists('docs/specs/domain.md')) return { skip: true, reason: 'domain.md absent' };
  return fileContains('docs/specs/domain.md', /Layer.*Dossier.*Responsabilit/i)
    ? { pass: true }
    : { pass: false, reason: 'Table des Layers absente de domain.md' };
});

check('Phase MODEL', 'domain.md contient regles de dependance', () => {
  if (!fileExists('docs/specs/domain.md')) return { skip: true, reason: 'domain.md absent' };
  return fileContains('docs/specs/domain.md', /[Rr][eè]gles de d[ée]pendance/)
    ? { pass: true }
    : { pass: false, reason: 'Section "Regles de dependance" absente de domain.md' };
});

check('Phase MODEL', 'ADR-0001 contient contraintes architecturales', () => {
  if (!fs.existsSync('docs/adr')) return { skip: true, reason: 'docs/adr/ absent' };
  const adrs = fs.readdirSync('docs/adr').filter(f => f.startsWith('ADR-0001'));
  if (adrs.length === 0) return { skip: true, reason: 'ADR-0001 absent' };
  const adrPath = path.join('docs/adr', adrs[0]);
  return fileContains(adrPath, /[Cc]ontraintes architecturales/)
    ? { pass: true, detail: adrs[0] }
    : { pass: false, reason: `ADR-0001 ne contient pas de section "Contraintes architecturales"` };
});

// ============================================================
// 3. PHASE ACT (Planning) — Epics, US, Tasks
// ============================================================

check('Phase ACT (Planning)', 'epics.md existe', () => {
  const epicsPath = `${PLANNING_DIR}/epics.md`;
  return fileExists(epicsPath)
    ? { pass: true }
    : { pass: false, reason: `${epicsPath} manquant` };
});

check('Phase ACT (Planning)', 'Au moins 1 User Story', () => {
  if (!fs.existsSync(US_DIR)) return { pass: false, reason: `Dossier ${US_DIR}/ manquant` };
  const uss = fs.readdirSync(US_DIR).filter(f => f.startsWith('US-'));
  return uss.length > 0
    ? { pass: true, detail: `${uss.length} US` }
    : { pass: false, reason: 'Aucune User Story trouvee' };
});

check('Phase ACT (Planning)', 'Au moins 1 Task', () => {
  if (!fs.existsSync(TASKS_DIR)) return { pass: false, reason: `Dossier ${TASKS_DIR}/ manquant` };
  const tasks = fs.readdirSync(TASKS_DIR).filter(f => f.startsWith('TASK-'));
  return tasks.length > 0
    ? { pass: true, detail: `${tasks.length} tasks` }
    : { pass: false, reason: 'Aucune task trouvee' };
});

check('Phase ACT (Planning)', 'Task app-assembly existe', () => {
  if (!fs.existsSync(TASKS_DIR)) return { pass: false, reason: `Dossier ${TASKS_DIR}/ manquant` };
  const tasks = fs.readdirSync(TASKS_DIR);
  const assembly = tasks.find(f => f.includes('app-assembly'));
  return assembly
    ? { pass: true, detail: assembly }
    : { pass: false, reason: 'Aucune task app-assembly trouvee' };
});

// --- Nouvelle verification : alignment architectural dans les tasks ---

check('Phase ACT (Planning)', 'Tasks contiennent Alignment architectural', () => {
  if (!fs.existsSync(TASKS_DIR)) return { skip: true, reason: 'Pas de tasks' };
  const tasks = fs.readdirSync(TASKS_DIR).filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
  if (tasks.length === 0) return { skip: true, reason: 'Aucune task' };

  let withAlignment = 0;
  let withoutAlignment = [];

  for (const task of tasks) {
    const content = fs.readFileSync(path.join(TASKS_DIR, task), 'utf-8');
    if (/[Aa]lignment architectural/i.test(content) || /Layer.*Concept/i.test(content)) {
      withAlignment++;
    } else {
      withoutAlignment.push(task);
    }
  }

  if (withoutAlignment.length === 0) {
    return { pass: true, detail: `${withAlignment}/${tasks.length} tasks avec alignment` };
  }

  // Tasks d'assembly peuvent ne pas avoir d'alignment
  const nonAssembly = withoutAlignment.filter(t => !t.includes('assembly'));
  if (nonAssembly.length === 0) {
    return { pass: true, detail: `${withAlignment}/${tasks.length} tasks avec alignment (assembly exclue)` };
  }

  return {
    pass: false,
    reason: `${nonAssembly.length} task(s) sans alignment architectural : ${nonAssembly.join(', ')}`
  };
});

check('Phase ACT (Planning)', 'Tasks contiennent DoD boundaries', () => {
  if (!fs.existsSync(TASKS_DIR)) return { skip: true, reason: 'Pas de tasks' };
  const tasks = fs.readdirSync(TASKS_DIR).filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
  if (tasks.length === 0) return { skip: true, reason: 'Aucune task' };

  let withBoundary = 0;
  for (const task of tasks) {
    const content = fs.readFileSync(path.join(TASKS_DIR, task), 'utf-8');
    if (/[Bb]oundar/i.test(content) || /inter-couches/i.test(content) || /d[ée]pendance/i.test(content)) {
      withBoundary++;
    }
  }

  return withBoundary > 0
    ? { pass: true, detail: `${withBoundary}/${tasks.length} tasks mentionnent boundaries/dependances` }
    : { pass: false, reason: 'Aucune task ne mentionne les boundaries ou dependances inter-couches' };
});

check('Phase ACT (Planning)', 'Plan de test existe', () => {
  return fileExists('docs/testing/plan.md')
    ? { pass: true }
    : { pass: false, reason: 'docs/testing/plan.md manquant' };
});

// ============================================================
// 4. PHASE ACT (Build) — Code genere
// ============================================================

check('Phase ACT (Build)', 'Dossier src/ existe', () => {
  return fileExists('src')
    ? { pass: true }
    : { pass: false, reason: 'Dossier src/ manquant' };
});

check('Phase ACT (Build)', 'Au moins 1 fichier source', () => {
  if (!fileExists('src')) return { pass: false, reason: 'Pas de src/' };
  const tsCount = countFiles('src', '.ts') + countFiles('src', '.tsx');
  const jsCount = countFiles('src', '.js') + countFiles('src', '.jsx');
  const total = tsCount + jsCount;
  return total > 0
    ? { pass: true, detail: `${total} fichiers (${tsCount} TS, ${jsCount} JS)` }
    : { pass: false, reason: 'Aucun fichier source dans src/' };
});

check('Phase ACT (Build)', 'Dossier tests/ ou fichiers .test.*', () => {
  const hasTestDir = fileExists('tests') || fileExists('test') || fileExists('__tests__');
  let testFileCount = 0;
  if (fileExists('src')) {
    testFileCount += countFiles('src', '.test.ts') + countFiles('src', '.test.tsx');
    testFileCount += countFiles('src', '.spec.ts') + countFiles('src', '.spec.tsx');
  }
  if (fileExists('tests')) testFileCount += countFiles('tests', '.ts') + countFiles('tests', '.tsx');
  if (fileExists('test')) testFileCount += countFiles('test', '.ts') + countFiles('test', '.tsx');

  return (hasTestDir || testFileCount > 0)
    ? { pass: true, detail: `${testFileCount} fichier(s) de test` }
    : { pass: false, reason: 'Aucun fichier de test trouve' };
});

// --- Verification des layers ---

check('Phase ACT (Build)', 'Layer domain/ existe', () => {
  if (!fileExists('src')) return { skip: true, reason: 'Pas de src/' };
  return fileExists('src/domain')
    ? { pass: true }
    : { pass: false, reason: 'src/domain/ manquant — architecture en couches non respectee' };
});

check('Phase ACT (Build)', 'Layer application/ existe', () => {
  if (!fileExists('src')) return { skip: true, reason: 'Pas de src/' };
  return fileExists('src/application')
    ? { pass: true }
    : { pass: false, reason: 'src/application/ manquant — architecture en couches non respectee' };
});

check('Phase ACT (Build)', 'Layer infrastructure/ existe', () => {
  if (!fileExists('src')) return { skip: true, reason: 'Pas de src/' };
  return (fileExists('src/infrastructure') || fileExists('src/infra'))
    ? { pass: true }
    : { pass: false, reason: 'src/infrastructure/ manquant — architecture en couches non respectee' };
});

check('Phase ACT (Build)', 'Layer UI existe', () => {
  if (!fileExists('src')) return { skip: true, reason: 'Pas de src/' };
  return (fileExists('src/ui') || fileExists('src/components') || fileExists('src/pages'))
    ? { pass: true }
    : { pass: false, reason: 'src/ui/ ou src/components/ manquant' };
});

// ============================================================
// 5. BOUNDARY CHECK — Validation architecturale
// ============================================================

check('Boundary Check', 'validate-boundaries.js fonctionne', () => {
  if (!fileExists('tools/validate-boundaries.js')) {
    return { pass: false, reason: 'tools/validate-boundaries.js manquant' };
  }
  if (!fileExists('src')) {
    return { skip: true, reason: 'Pas de src/ — boundary check non applicable' };
  }

  try {
    const output = execSync('node tools/validate-boundaries.js', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 30000
    });
    return { pass: true, detail: output.trim().split('\n').pop() };
  } catch (error) {
    if (error.status === 2) {
      return { pass: false, reason: `Violations de boundaries detectees:\n${error.stdout || error.stderr}` };
    }
    return { pass: false, reason: `Erreur: ${error.message}` };
  }
});

// ============================================================
// 6. GATES — Verification des gates
// ============================================================

for (const gate of [0, 1, 2, 3, 4, 5]) {
  check('Gates', `Gate ${gate} passe`, () => {
    try {
      const output = execSync(`node tools/gate-check.js ${gate}`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 60000
      });
      const passed = output.includes('PASS') || output.includes('pass');
      return passed
        ? { pass: true }
        : { pass: false, reason: `Gate ${gate} non passe` };
    } catch (error) {
      // Gate peut echouer legitimement si la phase n'est pas encore faite
      if (error.status === 2) {
        return { pass: false, reason: `Gate ${gate} FAIL:\n${(error.stdout || '').slice(0, 200)}` };
      }
      return { pass: false, reason: `Gate ${gate} erreur: ${error.message}` };
    }
  });
}

// ============================================================
// 7. INSTRUMENTATION — Coverage
// ============================================================

check('Instrumentation', 'instrumentation.json existe', () => {
  return fileExists('docs/factory/instrumentation.json')
    ? { pass: true }
    : { skip: true, reason: 'Instrumentation non activee (optionnel)' };
});

check('Instrumentation', 'Coverage > 0%', () => {
  if (!fileExists('docs/factory/instrumentation.json')) {
    return { skip: true, reason: 'Pas d\'instrumentation' };
  }

  try {
    const output = execSync('node tools/instrumentation/coverage.js --json', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 30000
    });
    const coverage = JSON.parse(output);
    return coverage.overall > 0
      ? { pass: true, detail: `Coverage: ${coverage.overall}% (${coverage.eventCount} events)` }
      : { pass: false, reason: 'Coverage a 0% — aucun evenement trace' };
  } catch (e) {
    return { skip: true, reason: `Erreur coverage: ${e.message}` };
  }
});

check('Instrumentation', 'validate-boundaries.js tracke dans coverage', () => {
  if (!fileExists('tools/instrumentation/coverage.js')) {
    return { skip: true, reason: 'coverage.js absent' };
  }
  return fileContains('tools/instrumentation/coverage.js', 'validate-boundaries.js')
    ? { pass: true }
    : { pass: false, reason: 'validate-boundaries.js absent de KNOWN_ITEMS dans coverage.js' };
});

// ============================================================
// 8. PHASE DEBRIEF — QA et release
// ============================================================

check('Phase DEBRIEF', 'QA report existe', () => {
  if (!fs.existsSync('docs/qa')) return { pass: false, reason: 'Dossier docs/qa/ manquant' };
  const qaFiles = fs.readdirSync('docs/qa').filter(f => f.endsWith('.md'));
  return qaFiles.length > 0
    ? { pass: true, detail: qaFiles.join(', ') }
    : { pass: false, reason: 'Aucun rapport QA' };
});

check('Phase DEBRIEF', 'CHANGELOG.md existe', () => {
  return fileExists('docs/qa/CHANGELOG.md') || fileExists('CHANGELOG.md')
    ? { pass: true }
    : { pass: false, reason: 'CHANGELOG.md manquant' };
});

check('Phase DEBRIEF', 'Release exportee', () => {
  return fileExists('release')
    ? { pass: true }
    : { pass: false, reason: 'Dossier release/ manquant' };
});

// ============================================================
// OUTPUT
// ============================================================

if (JSON_OUTPUT) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log('\n=== Verification Post-Pipeline ===\n');

  for (const [category, checks] of Object.entries(results.categories)) {
    console.log(`--- ${category} ---`);
    for (const c of checks) {
      const icon = c.status === 'PASS' ? 'OK' : c.status === 'FAIL' ? 'FAIL' : c.status === 'WARN' ? 'WARN' : 'SKIP';
      const suffix = c.detail ? ` (${c.detail})` : c.reason ? ` — ${c.reason}` : '';
      console.log(`  [${icon}] ${c.name}${suffix}`);
    }
    console.log('');
  }

  // Summary
  const total = results.summary.pass + results.summary.fail + results.summary.skip + results.summary.warn;
  console.log('=== Resume ===');
  console.log(`  PASS: ${results.summary.pass}/${total}`);
  console.log(`  FAIL: ${results.summary.fail}/${total}`);
  console.log(`  SKIP: ${results.summary.skip}/${total}`);
  if (results.summary.warn > 0) console.log(`  WARN: ${results.summary.warn}/${total}`);
  console.log('');

  if (results.summary.fail === 0) {
    console.log('Pipeline verification: ALL CHECKS PASSED');
  } else {
    console.log(`Pipeline verification: ${results.summary.fail} FAILURE(S)`);
  }
  console.log('');
}

// Exit code
process.exit(results.summary.fail > 0 ? 2 : 0);
