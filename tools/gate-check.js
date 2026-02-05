#!/usr/bin/env node
/**
 * Gate Check - Vérifie les prérequis d'un gate
 * Usage: node tools/gate-check.js [1-5]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { isEnabled } from './instrumentation/config.js';

const GATES = {
  0: {
    name: '→ BREAK (requirements.md)',
    files: ['input/requirements.md'],
    requirementsValidation: true // Valide les 12 sections obligatoires
  },
  1: {
    name: 'BREAK → MODEL',
    files: [
      'docs/brief.md',
      'docs/scope.md',
      'docs/acceptance.md'
    ],
    sections: {
      'docs/brief.md': ['## Résumé exécutif', '## Hypothèses explicites'],
      'docs/scope.md': ['## IN', '## OUT'],
      'docs/acceptance.md': ['## Critères globaux']
    },
    structureValidation: true // Vérifie la structure du projet
  },
  2: {
    name: 'MODEL → ACT',
    files: [
      'docs/specs/system.md',
      'docs/specs/domain.md',
      'docs/specs/api.md'
    ],
    patterns: [
      { glob: 'docs/adr/ADR-0001-*.md', min: 1 }
    ],
    sections: {
      'docs/specs/system.md': ['## Vue d\'ensemble', '## Contraintes non-fonctionnelles'],
      'docs/specs/domain.md': ['## Concepts clés', '## Entités'],
      'docs/specs/api.md': ['## Endpoints', '## Authentification']
    },
    secretsScan: true // Scanne les secrets avant de continuer
  },
  3: {
    name: 'Planning → Build',
    files: ['docs/planning/epics.md'],
    patterns: [
      { glob: 'docs/planning/us/US-*.md', min: 1 },
      { glob: 'docs/planning/tasks/TASK-*.md', min: 1 }
    ],
    taskValidation: true // Vérifie DoD dans chaque task
  },
  4: {
    name: 'Build → QA',
    files: ['docs/testing/plan.md'],
    patterns: [
      { glob: '{tests,src}/**/*.test.*', min: 1 }
    ],
    testsPass: true, // Vérifie que les tests passent
    codeQuality: true, // Vérifie conformité code/specs (mode STRICT)
    appAssembly: true, // Vérifie que App.tsx assemble les composants
    boundaryCheck: true // Vérifie les règles d'import inter-couches
  },
  5: {
    name: 'QA → Release',
    files: [
      'docs/qa/report.md',
      'docs/release/checklist.md',
      'CHANGELOG.md'
    ],
    sections: {
      'docs/qa/report.md': ['## Résumé', '## Tests exécutés'],
      'docs/release/checklist.md': ['## Pré-release'],
      'CHANGELOG.md': ['## [']
    },
    exportRelease: true // Export deliverable to release/ folder
  }
};

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function hasSection(filePath, section) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes(section);
}

function globFiles(pattern, sortNumerically = true) {
  // Handle brace expansion for patterns like {tests,src}/**/*.test.*
  if (pattern.includes('{') && pattern.includes('}')) {
    const match = pattern.match(/\{([^}]+)\}/);
    if (match) {
      const alternatives = match[1].split(',');
      let allFiles = [];
      for (const alt of alternatives) {
        const expandedPattern = pattern.replace(match[0], alt);
        allFiles = allFiles.concat(globFiles(expandedPattern, false));
      }
      // De-duplicate and sort
      allFiles = [...new Set(allFiles)];
      if (sortNumerically) {
        allFiles.sort((a, b) => {
          const numA = parseInt((path.basename(a).match(/(\d+)/) || ['0', '0'])[1], 10);
          const numB = parseInt((path.basename(b).match(/(\d+)/) || ['0', '0'])[1], 10);
          return numA - numB;
        });
      }
      return allFiles;
    }
  }

  // Handle ** glob patterns (recursive search)
  if (pattern.includes('**')) {
    const parts = pattern.split('**');
    const baseDir = parts[0].replace(/[/\\]$/, '') || '.';
    const filePattern = parts[1]?.replace(/^[/\\]/, '') || '*';

    if (!fs.existsSync(baseDir)) return [];

    const regex = new RegExp('^' + filePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');

    let files = [];
    function walkDir(dir) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (regex.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }
    walkDir(baseDir);

    if (sortNumerically) {
      files.sort((a, b) => {
        const numA = parseInt((path.basename(a).match(/(\d+)/) || ['0', '0'])[1], 10);
        const numB = parseInt((path.basename(b).match(/(\d+)/) || ['0', '0'])[1], 10);
        return numA - numB;
      });
    }
    return files;
  }

  // Simple glob implementation for Windows compatibility
  const dir = path.dirname(pattern);
  const filePattern = path.basename(pattern).replace(/\*/g, '.*');
  const regex = new RegExp(`^${filePattern}$`);

  if (!fs.existsSync(dir)) return [];

  let files = fs.readdirSync(dir, { recursive: true })
    .filter(f => regex.test(path.basename(f)))
    .map(f => path.join(dir, f));

  // Sort numerically by extracting number from filename (e.g., TASK-0001 → 1)
  if (sortNumerically) {
    files.sort((a, b) => {
      const numA = parseInt((path.basename(a).match(/(\d+)/) || ['0', '0'])[1], 10);
      const numB = parseInt((path.basename(b).match(/(\d+)/) || ['0', '0'])[1], 10);
      return numA - numB;
    });
  }

  return files;
}

function validateTask(taskPath) {
  const content = fs.readFileSync(taskPath, 'utf-8');
  const requiredSections = [
    '## Objectif technique',
    '## Definition of Done',
    '## Tests attendus'
  ];
  return requiredSections.every(s => content.includes(s));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTestsWithRetry(maxRetries = 3, delayMs = 2000) {
  // Check if package.json exists and has a test script
  const packageJsonPath = 'package.json';
  if (!fs.existsSync(packageJsonPath)) {
    return { success: false, error: 'package.json not found', retries: 0 };
  }

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    if (!packageJson.scripts?.test) {
      return { success: false, error: 'No test script defined in package.json', retries: 0 };
    }
  } catch (e) {
    return { success: false, error: 'Invalid package.json', retries: 0 };
  }

  let lastError = null;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    console.log(`  Running tests (attempt ${attempt}/${maxRetries})...`);

    try {
      execSync('npm test', { stdio: 'pipe', encoding: 'utf-8' });
      return { success: true, retries: attempt - 1 };
    } catch (error) {
      lastError = {
        message: error.message,
        stdout: error.stdout,
        stderr: error.stderr
      };

      if (attempt < maxRetries) {
        console.log(`  ⚠️ Tests failed, retrying in ${delayMs/1000}s...`);
        await sleep(delayMs);
      }
    }
  }

  return {
    success: false,
    error: `Tests failed after ${maxRetries} attempts: ${lastError?.message}`,
    stdout: lastError?.stdout,
    stderr: lastError?.stderr,
    retries: maxRetries - 1
  };
}

// Sync wrapper for backward compatibility
function runTests() {
  // For sync usage, use a simpler approach without retry
  const packageJsonPath = 'package.json';
  if (!fs.existsSync(packageJsonPath)) {
    return { success: false, error: 'package.json not found' };
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    if (!packageJson.scripts?.test) {
      return { success: false, error: 'No test script defined in package.json' };
    }

    console.log('  Running tests...');
    execSync('npm test', { stdio: 'pipe', encoding: 'utf-8' });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Tests failed: ${error.message}`,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

/**
 * Run requirements.md validation (Gate 0)
 * Validates that all 12 required sections are present and filled
 */
function runRequirementsValidation() {
  const validatorPath = 'tools/validate-requirements.js';

  if (!fs.existsSync(validatorPath)) {
    return { success: false, error: 'Validateur requirements non trouvé (tools/validate-requirements.js)' };
  }

  console.log('  Validating requirements.md (12 sections)...');

  try {
    execSync('node tools/validate-requirements.js', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 30000
    });
    return { success: true };
  } catch (error) {
    // Exit code 1 = file not found, 2 = sections missing/empty
    return {
      success: false,
      error: error.status === 1
        ? 'Fichier input/requirements.md non trouvé'
        : 'Sections manquantes ou vides dans requirements.md',
      stdout: error.stdout,
      stderr: error.stderr,
      exitCode: error.status
    };
  }
}

/**
 * Run structure validation (Gate 1)
 * Validates project structure and required directories/files
 */
function runStructureValidation() {
  const validatorPath = 'tools/validate-structure.js';

  if (!fs.existsSync(validatorPath)) {
    return { success: true, skipped: true };
  }

  console.log('  Validating project structure...');

  try {
    execSync('node tools/validate-structure.js', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 30000
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Structure validation failed',
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

/**
 * Run secrets scan (Gate 2)
 * Scans for exposed secrets and PII in code
 */
function runSecretsScan() {
  const scannerPath = 'tools/scan-secrets.js';

  if (!fs.existsSync(scannerPath)) {
    return { success: true, skipped: true };
  }

  console.log('  Scanning for secrets and PII...');

  try {
    execSync('node tools/scan-secrets.js', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 60000
    });
    return { success: true };
  } catch (error) {
    // Exit code 2 = critical secrets found
    if (error.status === 2) {
      return {
        success: false,
        error: 'CRITICAL: Secrets or PII detected in code',
        stdout: error.stdout,
        stderr: error.stderr
      };
    }
    return { success: true }; // Warnings only
  }
}

/**
 * Run code quality validation (STRICT mode)
 * Validates code against specs, checks types, coverage, etc.
 */
async function runCodeQualityValidation() {
  const validatorPath = 'tools/validate-code-quality.js';

  if (!fs.existsSync(validatorPath)) {
    return {
      success: false,
      error: 'Validateur code quality non trouvé (tools/validate-code-quality.js)',
      skipped: true
    };
  }

  console.log('  Running code quality validation (mode STRICT)...');

  try {
    const output = execSync('node tools/validate-code-quality.js --gate4', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 120000 // 2 minutes max
    });

    return { success: true, output };
  } catch (error) {
    // Exit code 2 = validation failed
    if (error.status === 2) {
      return {
        success: false,
        error: 'Code quality validation failed (mode STRICT)',
        stdout: error.stdout,
        stderr: error.stderr
      };
    }

    // Other errors
    return {
      success: false,
      error: `Code quality validation error: ${error.message}`,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

/**
 * Run app assembly validation
 * Validates that App.tsx properly assembles components and hooks
 */
function runAppAssemblyValidation() {
  const validatorPath = 'tools/validate-app-assembly.js';

  if (!fs.existsSync(validatorPath)) {
    return { success: true, skipped: true };
  }

  // Check if src/App.tsx exists first
  if (!fs.existsSync('src/App.tsx')) {
    return { success: true, skipped: true, reason: 'No src/App.tsx found' };
  }

  console.log('  Validating app assembly...');

  try {
    execSync('node tools/validate-app-assembly.js', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 60000
    });
    return { success: true };
  } catch (error) {
    // Exit code 1 = file error, 2 = validation failed
    if (error.status === 2) {
      return {
        success: false,
        error: 'App assembly validation failed - App.tsx is incomplete',
        stdout: error.stdout,
        stderr: error.stderr
      };
    }
    return {
      success: false,
      error: `App assembly validation error: ${error.message}`,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

/**
 * Run boundary validation (Gate 4)
 * Validates architectural layer import rules
 */
function runBoundaryValidation() {
  const validatorPath = 'tools/validate-boundaries.js';

  if (!fs.existsSync(validatorPath)) {
    return { success: true, skipped: true, reason: 'validate-boundaries.js not found' };
  }

  // Check if src/ exists
  if (!fs.existsSync('src')) {
    return { success: true, skipped: true, reason: 'No src/ directory found' };
  }

  console.log('  Validating architectural boundaries...');

  try {
    const output = execSync('node tools/validate-boundaries.js', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 60000
    });
    return { success: true, output };
  } catch (error) {
    // Exit code 2 = boundary violations found
    if (error.status === 2) {
      return {
        success: false,
        error: 'Architectural boundary violations detected',
        stdout: error.stdout,
        stderr: error.stderr
      };
    }
    return {
      success: false,
      error: `Boundary validation error: ${error.message}`,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

/**
 * Run export release (Gate 5)
 * Exports deliverable project to release/ folder
 */
function runExportRelease() {
  const exporterPath = 'tools/export-release.js';

  if (!fs.existsSync(exporterPath)) {
    return { success: true, skipped: true, reason: 'export-release.js not found' };
  }

  console.log('  Exporting release package...');

  try {
    const output = execSync('node tools/export-release.js', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 120000
    });
    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      error: `Export failed: ${error.message}`,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

async function checkGate(gateNum) {
  const gate = GATES[gateNum];
  if (!gate) {
    console.error(`❌ Gate ${gateNum} invalide. Utilisez 0-5.`);
    process.exit(1);
  }

  console.log(`\n🔍 Vérification Gate ${gateNum}: ${gate.name}\n`);

  const errors = [];

  // Check required files
  if (gate.files) {
    for (const file of gate.files) {
      if (!fileExists(file)) {
        errors.push(`Fichier manquant: ${file}`);
      }
    }
  }

  // Check patterns (glob)
  if (gate.patterns) {
    for (const p of gate.patterns) {
      const matches = globFiles(p.glob);
      if (matches.length < p.min) {
        errors.push(`Pattern ${p.glob}: ${matches.length} fichier(s), minimum ${p.min} requis`);
      }
    }
  }

  // Check sections
  if (gate.sections) {
    for (const [file, sections] of Object.entries(gate.sections)) {
      for (const section of sections) {
        if (!hasSection(file, section)) {
          errors.push(`Section manquante dans ${file}: ${section}`);
        }
      }
    }
  }

  // Requirements validation (Gate 0)
  if (gate.requirementsValidation) {
    const reqResult = runRequirementsValidation();
    if (!reqResult.success) {
      errors.push(`Requirements validation: ${reqResult.error}`);
      if (reqResult.stdout) {
        console.log('\n--- Requirements Validation Output ---');
        console.log(reqResult.stdout.substring(0, 1500));
        console.log('--------------------------------------\n');
      }
    } else {
      console.log('  ✅ requirements.md valide (12/12 sections)\n');
    }
  }

  // Structure validation (Gate 1)
  if (gate.structureValidation) {
    const structResult = runStructureValidation();
    if (!structResult.success && !structResult.skipped) {
      errors.push(`Structure validation: ${structResult.error}`);
      if (structResult.stdout) {
        console.log('\n--- Structure Validation Output ---');
        console.log(structResult.stdout.substring(0, 1000));
        console.log('-----------------------------------\n');
      }
    } else if (structResult.skipped) {
      console.log('  ⚠️  Structure validation skipped (validateur non trouvé)\n');
    } else {
      console.log('  ✅ Structure du projet valide\n');
    }
  }

  // Secrets scan (Gate 2)
  if (gate.secretsScan) {
    const secretsResult = runSecretsScan();
    if (!secretsResult.success && !secretsResult.skipped) {
      errors.push(`Secrets scan: ${secretsResult.error}`);
      if (secretsResult.stdout) {
        console.log('\n--- Secrets Scan Output ---');
        console.log(secretsResult.stdout.substring(0, 1000));
        console.log('---------------------------\n');
      }
    } else if (secretsResult.skipped) {
      console.log('  ⚠️  Secrets scan skipped (scanner non trouvé)\n');
    } else {
      console.log('  ✅ Aucun secret ou PII détecté\n');
    }
  }

  // Task validation (Gate 3)
  if (gate.taskValidation) {
    const tasks = globFiles('docs/planning/tasks/TASK-*.md');
    for (const task of tasks) {
      if (!validateTask(task)) {
        errors.push(`Task incomplète (DoD/Tests manquants): ${task}`);
      }
    }
  }

  // Tests validation (Gate 4) - with retry logic
  if (gate.testsPass) {
    const testResult = await runTestsWithRetry(3, 2000);
    if (!testResult.success) {
      errors.push(`Tests échoués: ${testResult.error}`);
      if (testResult.stderr) {
        console.log('\n--- Test Output ---');
        console.log(testResult.stderr.substring(0, 1000)); // Limit output
        console.log('-------------------\n');
      }
    } else {
      if (testResult.retries > 0) {
        console.log(`  ✅ Tests passent (après ${testResult.retries} retry(s))\n`);
      } else {
        console.log('  ✅ Tests passent\n');
      }
    }
  }

  // Code quality validation (Gate 4) - STRICT mode
  if (gate.codeQuality) {
    const qualityResult = await runCodeQualityValidation();
    if (!qualityResult.success && !qualityResult.skipped) {
      errors.push(`Code quality validation échouée: ${qualityResult.error}`);
      if (qualityResult.stdout) {
        console.log('\n--- Code Quality Output ---');
        console.log(qualityResult.stdout.substring(0, 2000)); // Limit output
        console.log('---------------------------\n');
      }
    } else if (qualityResult.skipped) {
      console.log('  ⚠️  Code quality validation skipped (validateur non trouvé)\n');
    } else {
      console.log('  ✅ Code quality validation PASS (mode STRICT)\n');
    }
  }

  // App assembly validation (Gate 4)
  if (gate.appAssembly) {
    const assemblyResult = runAppAssemblyValidation();
    if (!assemblyResult.success && !assemblyResult.skipped) {
      errors.push(`App assembly validation échouée: ${assemblyResult.error}`);
      if (assemblyResult.stdout) {
        console.log('\n--- App Assembly Output ---');
        console.log(assemblyResult.stdout.substring(0, 2000));
        console.log('---------------------------\n');
      }
    } else if (assemblyResult.skipped) {
      const reason = assemblyResult.reason || 'validateur non trouvé';
      console.log(`  ⚠️  App assembly validation skipped (${reason})\n`);
    } else {
      console.log('  ✅ App assembly validation PASS\n');
    }
  }

  // Boundary validation (Gate 4)
  if (gate.boundaryCheck) {
    const boundaryResult = runBoundaryValidation();
    if (!boundaryResult.success && !boundaryResult.skipped) {
      errors.push(`Boundary validation échouée: ${boundaryResult.error}`);
      if (boundaryResult.stdout) {
        console.log('\n--- Boundary Validation Output ---');
        console.log(boundaryResult.stdout.substring(0, 2000));
        console.log('----------------------------------\n');
      }
    } else if (boundaryResult.skipped) {
      const reason = boundaryResult.reason || 'validateur non trouvé';
      console.log(`  ⚠️  Boundary validation skipped (${reason})\n`);
    } else {
      console.log('  ✅ Boundary validation PASS\n');
    }
  }

  // Export release (Gate 5) - only if all validations passed
  if (gate.exportRelease && errors.length === 0) {
    const exportResult = runExportRelease();
    if (!exportResult.success && !exportResult.skipped) {
      errors.push(`Export release échoué: ${exportResult.error}`);
      if (exportResult.stdout) {
        console.log('\n--- Export Output ---');
        console.log(exportResult.stdout.substring(0, 2000));
        console.log('---------------------\n');
      }
    } else if (exportResult.skipped) {
      const reason = exportResult.reason || 'export-release.js non trouvé';
      console.log(`  ⚠️  Export release skipped (${reason})\n`);
    } else {
      console.log('  ✅ Release exported to release/ folder\n');
    }
  }

  // Instrumentation: record gate check result (opt-in)
  if (isEnabled()) {
    try {
      const status = errors.length === 0 ? 'PASS' : 'FAIL';
      const data = JSON.stringify({ gate: gateNum, status, errors });
      // Use double quotes for Windows compatibility
      execSync(`node tools/instrumentation/collector.js gate "${data.replace(/"/g, '\\"')}"`, {
        stdio: 'ignore',
        timeout: 1000
      });
    } catch (e) { /* silent fail */ }
  }

  // Report results
  if (errors.length === 0) {
    console.log(`✅ Gate ${gateNum} PASS\n`);
    process.exit(0);
  } else {
    console.log(`❌ Gate ${gateNum} FAIL\n`);
    console.log('Erreurs:');
    errors.forEach(e => console.log(`  - ${e}`));
    console.log('');
    process.exit(2);
  }
}

// Main
const gateNum = parseInt(process.argv[2], 10);
if (isNaN(gateNum) || gateNum < 0 || gateNum > 5) {
  console.log('Usage: node tools/gate-check.js [0-5]');
  console.log('');
  console.log('Gates:');
  Object.entries(GATES).forEach(([num, gate]) => {
    console.log(`  ${num}: ${gate.name}`);
  });
  process.exit(0);
}

// Run async checkGate
checkGate(gateNum).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
