#!/usr/bin/env node
/**
 * Gate Check - Vérifie les prérequis d'un gate
 * Usage: node tools/gate-check.js [1-5]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { isEnabled } from './instrumentation/config.js';
import { findAppPath } from './lib/project-config.js';
import { getEvolutionVersion, getPlanningDir } from './lib/factory-state.js';

const GATES = {
  0: {
    name: '→ BREAK (requirements)',
    // Files are dynamic: detect latest requirements-N.md
    getDynamicConfig: () => {
      try {
        const result = execSync('node tools/detect-requirements.js', {
          stdio: 'pipe', encoding: 'utf-8', timeout: 5000
        });
        const detected = JSON.parse(result);
        return { files: [detected.file], detectedFile: detected.file };
      } catch {
        // Fallback to default if detect fails
        return { files: ['input/requirements.md'], detectedFile: 'input/requirements.md' };
      }
    },
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
      // project-config.json validé par projectConfigValidation (structure JSON + champs requis)
    ],
    patterns: [
      { glob: 'docs/adr/ADR-0001-*.md', min: 1 }
    ],
    sections: {
      'docs/specs/system.md': ['## Vue d\'ensemble', '## Contraintes non-fonctionnelles'],
      'docs/specs/domain.md': ['## Concepts clés', '## Entités'],
      'docs/specs/api.md': ['## Endpoints', '## Authentification']
    },
    secretsScan: true, // Scanne les secrets avant de continuer
    projectConfigValidation: true // Vérifie la validité du project-config.json
  },
  3: {
    name: 'Planning → Build',
    // Files and patterns are dynamic based on evolutionVersion
    getDynamicConfig: () => {
      const version = getEvolutionVersion();
      return {
        files: [`docs/planning/v${version}/epics.md`],
        patterns: [
          { glob: `docs/planning/v${version}/us/US-*.md`, min: 1 },
          { glob: `docs/planning/v${version}/tasks/TASK-*.md`, min: 1 }
        ]
      };
    },
    taskValidation: true, // Vérifie DoD dans chaque task
    taskUsReferences: true // Vérifie que chaque task référence une US valide
  },
  4: {
    name: 'Build → QA',
    // testing/plan.md validé par testingPlanContent (contenu + sections)
    files: [],
    patterns: [
      { glob: '{tests,src}/**/*.test.*', min: 1 }
    ],
    testsPass: true, // Vérifie que les tests passent
    codeQuality: true, // Vérifie conformité code/specs (mode STRICT)
    appAssembly: true, // Vérifie que App.tsx assemble les composants
    boundaryCheck: true, // Vérifie les règles d'import inter-couches
    testingPlanContent: true // Vérifie le contenu de testing/plan.md (pas juste existence)
  },
  5: {
    name: 'QA → Release',
    // Files and sections are dynamic based on evolutionVersion
    getDynamicConfig: () => {
      const version = getEvolutionVersion();
      if (version === 1) {
        return {
          files: [
            'docs/qa/report.md',
            'docs/release/checklist.md',
            'CHANGELOG.md'
          ],
          sections: {
            'docs/qa/report.md': ['## Résumé', '## Tests exécutés'],
            'docs/release/checklist.md': ['## Pré-release'],
            'CHANGELOG.md': ['## [']
          }
        };
      }
      // Brownfield (V2+): versioned filenames
      // Sections use regex to tolerate accented/non-accented variants
      return {
        files: [
          `docs/qa/report-v${version}.md`,
          `docs/release/checklist-v${version}.md`,
          'CHANGELOG.md'
        ],
        sections: {
          [`docs/qa/report-v${version}.md`]: [/## R[ée]sum[ée]/, /## Tests ex[ée]cut[ée]s/],
          [`docs/release/checklist-v${version}.md`]: [/## Pr[ée]-release/],
          'CHANGELOG.md': ['## [']
        }
      };
    },
    files: [],
    sections: {},
    testsExecution: true, // Vérifie que les tests documentés ont été exécutés
    exportRelease: true // Export deliverable to release/ folder
  }
};

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function hasSection(filePath, section) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  if (section instanceof RegExp) return section.test(content);
  return content.includes(section);
}

/**
 * Convert glob pattern to RegExp (native implementation, no dependencies)
 * Supports: *, **, {a,b}
 */
function globToRegex(pattern) {
  // Normalize separators
  let regexStr = pattern.replace(/\\/g, '/');

  // Escape regex special chars except our glob chars
  regexStr = regexStr.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // Handle {a,b} patterns (convert to regex alternation)
  regexStr = regexStr.replace(/\\\{([^}]+)\\\}/g, (_, group) => {
    const alternatives = group.split(',').map(s => s.trim());
    return `(${alternatives.join('|')})`;
  });

  // Handle ** (match any path including subdirs)
  regexStr = regexStr.replace(/\*\*/g, '{{GLOBSTAR}}');

  // Handle * (match any chars except /)
  regexStr = regexStr.replace(/\*/g, '[^/]*');

  // Restore ** as .*
  regexStr = regexStr.replace(/\{\{GLOBSTAR\}\}/g, '.*');

  return new RegExp(`^${regexStr}$`);
}

/**
 * Glob files using native Node.js (no external dependencies)
 * Supports: *, **, {a,b}
 */
function globFiles(pattern, sortNumerically = true) {
  const files = [];
  const regex = globToRegex(pattern);

  // Determine base directory from pattern
  const patternParts = pattern.split(/[*?{[]/);
  const rawBase = patternParts[0].replace(/[/\\]$/, '') || '.';
  // Strip back to last directory separator to get actual directory
  const lastSep = Math.max(rawBase.lastIndexOf('/'), rawBase.lastIndexOf('\\'));
  const baseDir = lastSep > 0 ? rawBase.substring(0, lastSep) : rawBase;

  if (!fs.existsSync(baseDir)) return [];

  // Recursively collect all files from base directory
  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        // Skip node_modules and .git
        if (entry.name === 'node_modules' || entry.name === '.git') continue;

        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else {
          // Normalize path separators for matching
          const normalizedPath = fullPath.replace(/\\/g, '/');
          if (regex.test(normalizedPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (e) {
      // Ignore permission errors
    }
  }

  walkDir(baseDir);

  // Sort numerically by extracting number from filename (e.g., TASK-0001 → 1)
  if (sortNumerically) {
    files.sort((a, b) => {
      const numA = parseInt((path.basename(a).match(/(?:TASK|US|ADR)-(\d+)/) || path.basename(a).match(/(\d+)/) || ['0', '0'])[1], 10);
      const numB = parseInt((path.basename(b).match(/(?:TASK|US|ADR)-(\d+)/) || path.basename(b).match(/(\d+)/) || ['0', '0'])[1], 10);
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

/**
 * Validate project-config.json (Gate 2)
 * Checks that the file exists and has valid JSON structure with required fields
 */
function runProjectConfigValidation() {
  const configPath = 'docs/factory/project-config.json';

  if (!fs.existsSync(configPath)) {
    return {
      success: false,
      error: 'project-config.json non trouvé - l\'agent architect doit le générer'
    };
  }

  console.log('  Validating project-config.json...');

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);

    // Check required fields
    const requiredFields = ['projectName', 'architecture'];
    const missingFields = requiredFields.filter(f => !config[f]);

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Champs manquants dans project-config.json: ${missingFields.join(', ')}`
      };
    }

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: `project-config.json invalide: ${e.message}`
    };
  }
}

/**
 * Validate task references to US (Gate 3)
 * Checks that each task references a valid US file
 */
function validateTaskUsReferences(planningDir) {
  const tasksDir = `${planningDir}/tasks`;
  const usDir = `${planningDir}/us`;

  if (!fs.existsSync(tasksDir)) {
    return { success: true, skipped: true, reason: 'Dossier tasks non trouvé' };
  }

  console.log('  Validating task → US references...');

  const tasks = globFiles(`${tasksDir}/TASK-*.md`);
  const usFiles = globFiles(`${usDir}/US-*.md`);

  // Extract US IDs from filenames (e.g., US-0001-title.md → US-0001)
  const validUsIds = usFiles.map(f => {
    const match = path.basename(f).match(/^(US-\d{4})/);
    return match ? match[1] : null;
  }).filter(Boolean);

  const errors = [];

  for (const taskFile of tasks) {
    const content = fs.readFileSync(taskFile, 'utf-8');
    const taskName = path.basename(taskFile);

    // Look for US reference in task content
    // Supports: "US parent: US-0001", "| **US Parent** | US-0001 |", etc.
    const usRefPatterns = [
      /\|\s*\*\*US Parent\*\*\s*\|\s*(US-\d{4})/i,  // Tableau Markdown: | **US Parent** | US-0001 |
      /US parent\s*[:\|]\s*(US-\d{4})/i,            // US parent: US-0001 ou US parent | US-0001
      /Rattachée à\s*:\s*(US-\d{4})/i,
      /Parent US\s*:\s*(US-\d{4})/i,
      /\*\*US\*\*\s*:\s*(US-\d{4})/i,
      /## Contexte[\s\S]*?(US-\d{4})/i
    ];

    let foundUsRef = null;
    for (const pattern of usRefPatterns) {
      const match = content.match(pattern);
      if (match) {
        foundUsRef = match[1];
        break;
      }
    }

    if (!foundUsRef) {
      errors.push(`${taskName}: Aucune référence US trouvée`);
    } else if (!validUsIds.includes(foundUsRef)) {
      errors.push(`${taskName}: Référence à ${foundUsRef} invalide (fichier US non trouvé)`);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: `${errors.length} task(s) avec références US invalides`,
      details: errors
    };
  }

  return { success: true, count: tasks.length };
}

/**
 * Validate testing/plan.md content (Gate 4)
 * Checks that the test plan has meaningful content, not just a stub
 */
function validateTestingPlanContent() {
  const planPath = 'docs/testing/plan.md';

  if (!fs.existsSync(planPath)) {
    return { success: false, error: 'docs/testing/plan.md non trouvé' };
  }

  console.log('  Validating testing/plan.md content...');

  const content = fs.readFileSync(planPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);

  // Check minimum content (not a stub)
  if (lines.length < 15) {
    return {
      success: false,
      error: `testing/plan.md trop court (${lines.length} lignes, minimum 15)`
    };
  }

  // Check required sections with human-readable labels
  // Patterns are flexible to support multiple naming conventions
  const requiredSections = [
    {
      pattern: /##.*(Strat[ée]gi|Strategy)/i,
      label: 'Stratégie/Strategy'
    },
    {
      // Accept: "## Tests unitaires", "## Unit", "| Unit |" in table, or "Cas de test"
      pattern: /##.*Tests?\s*(unitaires|unit)|##.*Unit|\|\s*Unit\s*\||##.*Cas de test/i,
      label: 'Tests unitaires/Unit'
    },
    {
      // Accept: "## Tests intégration", "## Integration", "| Integration |" in table
      pattern: /##.*Tests?\s*(int[ée]gration|integration)|##.*Integration|\|\s*Integration\s*\|/i,
      label: 'Tests intégration/Integration'
    }
  ];

  const missingSections = [];
  for (const { pattern, label } of requiredSections) {
    if (!pattern.test(content)) {
      missingSections.push(label);
    }
  }

  if (missingSections.length > 0) {
    return {
      success: false,
      error: `Sections manquantes dans testing/plan.md: ${missingSections.join(', ')}`
    };
  }

  return { success: true };
}

/**
 * Validate documented tests were executed (Gate 5)
 * Cross-references QA report with actual test files
 */
function validateTestsExecution() {
  // Support versioned QA reports (brownfield)
  const version = getEvolutionVersion();
  const qaReportPath = version > 1
    ? `docs/qa/report-v${version}.md`
    : 'docs/qa/report.md';

  if (!fs.existsSync(qaReportPath)) {
    return { success: false, error: `${qaReportPath} non trouvé` };
  }

  console.log('  Validating tests execution coverage...');

  const qaContent = fs.readFileSync(qaReportPath, 'utf-8');

  // Check that QA report contains test results section (tolerate accented/non-accented)
  if (!/## Tests ex[ée]cut[ée]s/i.test(qaContent) && !qaContent.includes('## Test Results')) {
    return {
      success: false,
      error: 'Section "Tests exécutés" manquante dans le rapport QA'
    };
  }

  // Check for pass/fail indicators
  const hasPassIndicator = /✅|PASS|passed|réussi/i.test(qaContent);
  const hasTestCount = /\d+\s*(tests?|specs?)/i.test(qaContent);

  if (!hasPassIndicator || !hasTestCount) {
    return {
      success: false,
      error: 'Le rapport QA ne contient pas de résultats de tests valides'
    };
  }

  // Verify actual test files exist
  const testFiles = globFiles('{tests,src}/**/*.test.*');
  if (testFiles.length === 0) {
    return {
      success: false,
      error: 'Aucun fichier de test trouvé mais rapport QA mentionne des tests'
    };
  }

  return { success: true, testFilesCount: testFiles.length };
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
    // Detect npm placeholder test script
    const testScript = packageJson.scripts.test;
    if (testScript.includes('echo "Error: no test specified"') || testScript.includes("echo 'Error: no test specified'")) {
      return {
        success: false,
        error: 'Test script is npm placeholder ("echo Error: no test specified"). Configure a real test runner (e.g. vitest) in package.json.',
        retries: 0
      };
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

/**
 * Run requirements.md validation (Gate 0)
 * Validates that all 12 required sections are present and filled
 */
function runRequirementsValidation(requirementsFile) {
  const validatorPath = 'tools/validate-requirements.js';

  if (!fs.existsSync(validatorPath)) {
    return { success: false, error: 'Validateur requirements non trouvé (tools/validate-requirements.js)' };
  }

  const targetFile = requirementsFile || 'input/requirements.md';
  console.log(`  Validating ${targetFile} (12 sections)...`);

  try {
    execSync(`node tools/validate-requirements.js "${targetFile}"`, {
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
        ? `Fichier ${targetFile} non trouvé`
        : `Sections manquantes ou vides dans ${targetFile}`,
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
    // Exit codes:
    // 1 = PII warnings (bloquant pour garantir la conformite RGPD)
    // 2 = Secrets critiques (toujours bloquant)
    if (error.status === 2) {
      return {
        success: false,
        error: 'CRITICAL: Secrets detectes dans le code',
        stdout: error.stdout,
        stderr: error.stderr,
        severity: 'critical'
      };
    } else if (error.status === 1) {
      return {
        success: false,
        error: 'WARNING: PII potentiels detectes - verifier conformite RGPD',
        stdout: error.stdout,
        stderr: error.stderr,
        severity: 'warning'
      };
    }
    return { success: false, error: `Scan error: ${error.message}` };
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
      success: true,
      skipped: true,
      reason: 'validate-code-quality.js non trouvé'
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

  // Check if App.tsx exists (paths from project-config.json or defaults)
  const appPath = findAppPath();
  if (!appPath) {
    return { success: true, skipped: true, reason: 'No App.tsx found (check docs/factory/project-config.json)' };
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

  // Get dynamic config if available (for versioned gates like Gate 0, 3, 5)
  let files = gate.files || [];
  let patterns = gate.patterns || [];
  let sections = gate.sections || {};
  let dynamicConfig = {};
  if (gate.getDynamicConfig) {
    dynamicConfig = gate.getDynamicConfig();
    files = dynamicConfig.files || files;
    patterns = dynamicConfig.patterns || patterns;
    sections = dynamicConfig.sections || sections;
  }

  // Check required files
  if (files.length > 0) {
    for (const file of files) {
      if (!fileExists(file)) {
        errors.push(`Fichier manquant: ${file}`);
      }
    }
  }

  // Check patterns (glob)
  if (patterns.length > 0) {
    for (const p of patterns) {
      const matches = globFiles(p.glob);
      if (matches.length < p.min) {
        errors.push(`Pattern ${p.glob}: ${matches.length} fichier(s), minimum ${p.min} requis`);
      }
    }
  }

  // Check sections (uses merged dynamic+static config)
  if (Object.keys(sections).length > 0) {
    for (const [file, sectionList] of Object.entries(sections)) {
      for (const section of sectionList) {
        if (!hasSection(file, section)) {
          errors.push(`Section manquante dans ${file}: ${section}`);
        }
      }
    }
  }

  // Requirements validation (Gate 0)
  if (gate.requirementsValidation) {
    const reqFile = dynamicConfig.detectedFile;
    const reqResult = runRequirementsValidation(reqFile);
    if (!reqResult.success) {
      errors.push(`Requirements validation: ${reqResult.error}`);
      if (reqResult.stdout) {
        console.log('\n--- Requirements Validation Output ---');
        console.log(reqResult.stdout.substring(0, 1500));
        console.log('--------------------------------------\n');
      }
    } else {
      const displayName = reqFile ? path.basename(reqFile) : 'requirements.md';
      console.log(`  ✅ ${displayName} valide (12/12 sections)\n`);
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

  // Project config validation (Gate 2)
  if (gate.projectConfigValidation) {
    const configResult = runProjectConfigValidation();
    if (!configResult.success) {
      errors.push(`Project config validation: ${configResult.error}`);
    } else {
      console.log('  ✅ project-config.json valide\n');
    }
  }

  // Task validation (Gate 3)
  if (gate.taskValidation) {
    const planningDir = getPlanningDir();
    const tasks = globFiles(`${planningDir}/tasks/TASK-*.md`);
    const invalidTasks = [];
    for (const task of tasks) {
      if (!validateTask(task)) {
        invalidTasks.push(path.basename(task));
      }
    }
    if (invalidTasks.length > 0) {
      errors.push(`Task(s) incomplète(s) (DoD/Tests manquants): ${invalidTasks.join(', ')}`);
    } else if (tasks.length > 0) {
      console.log(`  ✅ ${tasks.length} task(s) avec DoD et Tests valides\n`);
    }
  }

  // Task US references validation (Gate 3)
  if (gate.taskUsReferences) {
    const planningDir = getPlanningDir();
    const usRefResult = validateTaskUsReferences(planningDir);
    if (!usRefResult.success && !usRefResult.skipped) {
      errors.push(`Task US references: ${usRefResult.error}`);
      if (usRefResult.details) {
        console.log('\n--- Task US References Errors ---');
        usRefResult.details.slice(0, 10).forEach(d => console.log(`  - ${d}`));
        if (usRefResult.details.length > 10) {
          console.log(`  ... et ${usRefResult.details.length - 10} autres`);
        }
        console.log('---------------------------------\n');
      }
    } else if (usRefResult.skipped) {
      console.log(`  ⚠️  Task US references skipped (${usRefResult.reason})\n`);
    } else {
      console.log(`  ✅ ${usRefResult.count} task(s) avec références US valides\n`);
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
    if (!qualityResult.success) {
      errors.push(`Code quality validation échouée: ${qualityResult.error}`);
      if (qualityResult.stdout) {
        console.log('\n--- Code Quality Output ---');
        console.log(qualityResult.stdout.substring(0, 2000)); // Limit output
        console.log('---------------------------\n');
      }
    } else if (qualityResult.skipped) {
      const reason = qualityResult.reason || 'validateur non trouvé';
      console.log(`  ⚠️  Code quality validation skipped (${reason})\n`);
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

  // App Assembly is last task check (Gate 4)
  if (gate.appAssembly) {
    const planningDir = getPlanningDir();
    const tasksDir = `${planningDir}/tasks`;
    if (fs.existsSync(tasksDir)) {
      const taskFiles = fs.readdirSync(tasksDir)
        .filter(f => f.match(/^TASK-\d{4}/))
        .sort((a, b) => {
          const numA = parseInt((a.match(/TASK-(\d+)/) || ['0', '0'])[1], 10);
          const numB = parseInt((b.match(/TASK-(\d+)/) || ['0', '0'])[1], 10);
          return numA - numB;
        });
      if (taskFiles.length > 0) {
        const lastTask = taskFiles[taskFiles.length - 1];
        if (!lastTask.includes('app-assembly')) {
          errors.push(`La task d'assemblage doit etre la derniere numeriquement. Derniere task: ${lastTask}`);
        } else {
          console.log(`  ✅ Task app-assembly est la derniere task (${lastTask})\n`);
        }
      }
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

  // Testing plan content validation (Gate 4)
  if (gate.testingPlanContent) {
    const planContentResult = validateTestingPlanContent();
    if (!planContentResult.success) {
      errors.push(`Testing plan content: ${planContentResult.error}`);
    } else {
      console.log('  ✅ testing/plan.md contenu valide\n');
    }
  }

  // Tests execution validation (Gate 5)
  if (gate.testsExecution) {
    const execResult = validateTestsExecution();
    if (!execResult.success) {
      errors.push(`Tests execution: ${execResult.error}`);
    } else {
      console.log(`  ✅ Tests exécutés (${execResult.testFilesCount} fichiers de test)\n`);
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
    } catch (e) {
      if (process.env.FACTORY_DEBUG) console.warn('Instrumentation error:', e.message);
    }
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
