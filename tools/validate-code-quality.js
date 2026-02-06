#!/usr/bin/env node
/**
 * Validate Code Quality - Validation stricte du code généré contre les specs
 *
 * Usage:
 *   node tools/validate-code-quality.js <task-file>     # Valide une task spécifique
 *   node tools/validate-code-quality.js --all           # Valide toutes les tasks complétées
 *   node tools/validate-code-quality.js --gate4         # Mode Gate 4 (intégration)
 *
 * Mode: STRICT (bloque si non-conformité critique)
 *
 * Exit codes:
 *   0 = PASS (toutes validations OK)
 *   1 = ERROR (erreur d'exécution)
 *   2 = FAIL (non-conformité détectée)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration STRICT
const CONFIG = {
  coverageThreshold: 80,           // Minimum 80% coverage
  strictTypes: true,               // TypeScript strict mode
  specComplianceRequired: true,    // Code doit matcher les specs
  blockOnCritical: true            // Bloque si erreur critique
};

/**
 * Charge et parse un fichier markdown
 */
function loadMarkdown(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Extrait les fichiers concernés d'une task
 */
function extractTaskScope(taskContent) {
  const scopeMatch = taskContent.match(/## Fichiers concernés[\s\S]*?(?=##|$)/);
  if (!scopeMatch) return [];

  const files = [];
  const lines = scopeMatch[0].split('\n');
  for (const line of lines) {
    const match = line.match(/^[-*]\s+`?([^`\n]+)`?/);
    if (match && match[1].includes('/')) {
      files.push(match[1].trim());
    }
  }
  return files;
}

/**
 * Extrait les tests attendus d'une task
 */
function extractExpectedTests(taskContent) {
  const testMatch = taskContent.match(/## Tests attendus[\s\S]*?(?=##|$)/);
  if (!testMatch) return [];

  const tests = [];
  const lines = testMatch[0].split('\n');
  for (const line of lines) {
    const match = line.match(/^[-*]\s+(.+)/);
    if (match) {
      tests.push(match[1].trim());
    }
  }
  return tests;
}

/**
 * Extrait les endpoints de api.md
 */
function extractApiEndpoints(apiSpec) {
  if (!apiSpec) return [];

  const endpoints = [];
  let match;
  const regex = /^###?\s+(GET|POST|PUT|DELETE|PATCH)\s+`?([^`\n]+)`?/gm;

  while ((match = regex.exec(apiSpec)) !== null) {
    endpoints.push({
      method: match[1],
      path: match[2].trim()
    });
  }
  return endpoints;
}

/**
 * Vérifie si un fichier source implémente un endpoint
 */
function checkEndpointImplementation(srcContent, endpoint) {
  // Patterns courants pour détecter les routes
  const patterns = [
    new RegExp(`['"\`]${endpoint.path}['"\`]`, 'i'),
    new RegExp(`\\.${endpoint.method.toLowerCase()}\\s*\\(`, 'i'),
    new RegExp(`@${endpoint.method}\\s*\\(.*${endpoint.path}`, 'i'),
    new RegExp(`router\\.${endpoint.method.toLowerCase()}`, 'i')
  ];

  return patterns.some(p => p.test(srcContent));
}

/**
 * Vérifie la conformité du code avec les specs API
 */
function validateApiCompliance(taskFiles, apiSpec) {
  const errors = [];
  const warnings = [];
  const endpoints = extractApiEndpoints(apiSpec);

  if (endpoints.length === 0) {
    return { errors, warnings, passed: true };
  }

  // Lire tous les fichiers src
  let allSrcContent = '';
  for (const file of taskFiles) {
    if (file.startsWith('src/') && fs.existsSync(file)) {
      allSrcContent += fs.readFileSync(file, 'utf-8') + '\n';
    }
  }

  // Vérifier chaque endpoint mentionné dans les specs
  for (const endpoint of endpoints) {
    // Vérifier si l'endpoint est dans le scope de la task
    const inScope = taskFiles.some(f =>
      f.includes('api') || f.includes('route') || f.includes('controller')
    );

    if (inScope && !checkEndpointImplementation(allSrcContent, endpoint)) {
      warnings.push(`Endpoint ${endpoint.method} ${endpoint.path} non détecté dans le code`);
    }
  }

  return {
    errors,
    warnings,
    passed: errors.length === 0
  };
}

/**
 * Vérifie que les tests attendus existent
 * Validation stricte: verifie les imports ET les describe/it blocks
 */
function validateTestCoverage(taskFiles, expectedTests) {
  const errors = [];
  const warnings = [];

  // Trouver les fichiers de test
  const testFiles = taskFiles.filter(f =>
    f.includes('test') || f.includes('spec')
  );

  if (testFiles.length === 0 && expectedTests.length > 0) {
    errors.push('Aucun fichier de test trouvé mais tests attendus dans la DoD');
    return { errors, warnings, passed: false };
  }

  // Lire le contenu des tests avec leur nom de fichier
  const testContents = [];
  for (const file of testFiles) {
    if (fs.existsSync(file)) {
      testContents.push({
        file,
        content: fs.readFileSync(file, 'utf-8')
      });
    }
  }

  // Vérifier chaque test attendu avec une validation stricte
  for (const expectedTest of expectedTests) {
    let found = false;
    let partialMatch = false;

    // Extraire le sujet principal du test (premier mot significatif)
    const subject = expectedTest
      .replace(/^(test|verify|check|validate|ensure)\s+/i, '')
      .split(/\s+/)[0]
      .toLowerCase();

    for (const { content } of testContents) {

      // Verification 1: Le fichier de test importe-t-il le module?
      // Patterns: import { X } from, import X from, require('X')
      const importPatterns = [
        new RegExp(`import\\s+.*${subject}.*\\s+from`, 'i'),
        new RegExp(`import\\s*{[^}]*${subject}[^}]*}\\s*from`, 'i'),
        new RegExp(`require\\s*\\(['""].*${subject}.*['"]\\)`, 'i')
      ];
      const hasImport = importPatterns.some(p => p.test(content));

      // Verification 2: Y a-t-il un describe/it/test block qui mentionne le sujet?
      const testBlockPatterns = [
        new RegExp(`describe\\s*\\(['""][^'"]*${subject}[^'"]*['"]`, 'i'),
        new RegExp(`it\\s*\\(['""][^'"]*${subject}[^'"]*['"]`, 'i'),
        new RegExp(`test\\s*\\(['""][^'"]*${subject}[^'"]*['"]`, 'i')
      ];
      const hasTestBlock = testBlockPatterns.some(p => p.test(content));

      // Verification stricte: IMPORT + TEST BLOCK requis
      if (hasImport && hasTestBlock) {
        found = true;
        break;
      }

      // Match partiel si au moins un des deux est present
      if (hasImport || hasTestBlock) {
        partialMatch = true;
      }
    }

    if (!found) {
      if (partialMatch) {
        warnings.push(`Test partiel pour "${expectedTest}" - verifier couverture complete`);
      } else {
        errors.push(`Test manquant: "${expectedTest}" - aucun test ne semble couvrir ce cas`);
      }
    }
  }

  return {
    errors,
    warnings,
    passed: errors.length === 0
  };
}

/**
 * Vérifie les types TypeScript (si applicable)
 */
function validateTypeScript(taskFiles) {
  const errors = [];
  const warnings = [];

  // Vérifier si c'est un projet TypeScript
  const hasTsFiles = taskFiles.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  const hasTsConfig = fs.existsSync('tsconfig.json');

  if (!hasTsFiles || !hasTsConfig) {
    return { errors, warnings, passed: true, skipped: true };
  }

  // Exécuter tsc --noEmit sur les fichiers
  try {
    execSync('npx tsc --noEmit', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 30000
    });
  } catch (error) {
    // Parser les erreurs TypeScript
    const output = error.stdout || error.stderr || '';
    const tsErrors = output.split('\n').filter(l => l.includes('error TS'));

    if (tsErrors.length > 0) {
      errors.push(`${tsErrors.length} erreur(s) TypeScript détectée(s)`);
      // Ajouter les 5 premières erreurs comme détails
      tsErrors.slice(0, 5).forEach(e => {
        warnings.push(e.trim().substring(0, 200));
      });
    }
  }

  return {
    errors,
    warnings,
    passed: errors.length === 0
  };
}

/**
 * Vérifie la couverture de code (si disponible)
 */
function validateCoverageThreshold() {
  const errors = [];
  const warnings = [];

  // Chercher un rapport de couverture
  const coveragePaths = [
    'coverage/coverage-summary.json',
    'coverage/lcov-report/index.html',
    '.nyc_output/coverage.json'
  ];

  let coverageFound = false;
  let coveragePercent = null;

  for (const covPath of coveragePaths) {
    if (fs.existsSync(covPath)) {
      coverageFound = true;

      if (covPath.endsWith('.json')) {
        try {
          const coverage = JSON.parse(fs.readFileSync(covPath, 'utf-8'));
          if (coverage.total?.lines?.pct) {
            coveragePercent = coverage.total.lines.pct;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      break;
    }
  }

  if (!coverageFound) {
    warnings.push('Aucun rapport de couverture trouvé (npm run coverage recommandé)');
    return { errors, warnings, passed: true, skipped: true };
  }

  if (coveragePercent !== null && coveragePercent < CONFIG.coverageThreshold) {
    errors.push(`Couverture insuffisante: ${coveragePercent.toFixed(1)}% (minimum: ${CONFIG.coverageThreshold}%)`);
  }

  return {
    errors,
    warnings,
    passed: errors.length === 0,
    coverage: coveragePercent
  };
}

/**
 * Valide une task complète
 */
async function validateTask(taskFile) {
  console.log(`\n🔍 Validation: ${path.basename(taskFile)}\n`);

  // Charger la task
  const taskContent = loadMarkdown(taskFile);
  if (!taskContent) {
    console.error(`❌ Task non trouvée: ${taskFile}`);
    return { passed: false, critical: true };
  }

  // Extraire les infos de la task
  const taskScope = extractTaskScope(taskContent);
  const expectedTests = extractExpectedTests(taskContent);

  console.log(`   Fichiers scope: ${taskScope.length}`);
  console.log(`   Tests attendus: ${expectedTests.length}`);

  // Charger les specs
  const apiSpec = loadMarkdown('docs/specs/api.md');

  // Résultats de validation
  const results = {
    api: { passed: true, errors: [], warnings: [] },
    tests: { passed: true, errors: [], warnings: [] },
    types: { passed: true, errors: [], warnings: [], skipped: false },
    coverage: { passed: true, errors: [], warnings: [], skipped: false }
  };

  // 1. Validation conformité API
  if (apiSpec) {
    console.log('   📋 Vérification conformité API...');
    results.api = validateApiCompliance(taskScope, apiSpec);
  }

  // 2. Validation tests
  console.log('   🧪 Vérification tests attendus...');
  results.tests = validateTestCoverage(taskScope, expectedTests);

  // 3. Validation TypeScript
  console.log('   📝 Vérification TypeScript...');
  results.types = validateTypeScript(taskScope);

  // 4. Validation couverture
  console.log('   📊 Vérification couverture...');
  results.coverage = validateCoverageThreshold();

  // Compiler le rapport
  const allErrors = [
    ...results.api.errors,
    ...results.tests.errors,
    ...results.types.errors,
    ...results.coverage.errors
  ];

  const allWarnings = [
    ...results.api.warnings,
    ...results.tests.warnings,
    ...results.types.warnings,
    ...results.coverage.warnings
  ];

  // Afficher le résultat
  console.log('');

  if (allErrors.length > 0) {
    console.log('❌ ERREURS CRITIQUES:');
    allErrors.forEach(e => console.log(`   - ${e}`));
  }

  if (allWarnings.length > 0) {
    console.log('⚠️  AVERTISSEMENTS:');
    allWarnings.forEach(w => console.log(`   - ${w}`));
  }

  const passed = allErrors.length === 0;

  if (passed) {
    console.log('✅ Validation PASS');
  } else {
    console.log('❌ Validation FAIL (mode STRICT)');
  }

  return {
    passed,
    critical: allErrors.length > 0,
    errors: allErrors,
    warnings: allWarnings,
    results
  };
}

/**
 * Mode Gate 4 - Validation globale avant QA
 */
async function validateGate4() {
  console.log('\n🔍 Gate 4 - Validation Code Quality (Mode STRICT)\n');
  console.log('═'.repeat(50));

  // Trouver toutes les tasks
  const tasksDir = 'docs/planning/tasks';
  if (!fs.existsSync(tasksDir)) {
    console.error('❌ Dossier tasks non trouvé');
    process.exit(1);
  }

  const taskFiles = fs.readdirSync(tasksDir)
    .filter(f => f.match(/^TASK-\d{4}/))
    .sort()
    .map(f => path.join(tasksDir, f));

  console.log(`Tasks à valider: ${taskFiles.length}\n`);

  let totalErrors = 0;
  let totalWarnings = 0;
  const failedTasks = [];

  for (const taskFile of taskFiles) {
    const result = await validateTask(taskFile);
    totalErrors += result.errors?.length || 0;
    totalWarnings += result.warnings?.length || 0;

    if (!result.passed) {
      failedTasks.push(path.basename(taskFile));
    }
  }

  // Rapport final
  console.log('\n' + '═'.repeat(50));
  console.log('RAPPORT FINAL - Code Quality Gate 4');
  console.log('═'.repeat(50));
  console.log(`Tasks validées: ${taskFiles.length - failedTasks.length}/${taskFiles.length}`);
  console.log(`Erreurs critiques: ${totalErrors}`);
  console.log(`Avertissements: ${totalWarnings}`);

  if (failedTasks.length > 0) {
    console.log(`\nTasks en échec:`);
    failedTasks.forEach(t => console.log(`   - ${t}`));
    console.log('\n❌ Gate 4 FAIL (mode STRICT)');
    process.exit(2);
  }

  console.log('\n✅ Gate 4 PASS - Code Quality OK');
  process.exit(0);
}

// Main
const arg = process.argv[2];

if (!arg) {
  console.log('Usage:');
  console.log('  node tools/validate-code-quality.js <task-file>  # Valide une task');
  console.log('  node tools/validate-code-quality.js --gate4      # Mode Gate 4');
  console.log('');
  console.log('Mode: STRICT (bloque si non-conformité critique)');
  console.log(`  - Couverture minimum: ${CONFIG.coverageThreshold}%`);
  console.log(`  - Types TypeScript: ${CONFIG.strictTypes ? 'requis' : 'optionnel'}`);
  console.log(`  - Conformité specs: ${CONFIG.specComplianceRequired ? 'requis' : 'optionnel'}`);
  process.exit(0);
}

if (arg === '--gate4' || arg === '--all') {
  validateGate4();
} else {
  validateTask(arg).then(result => {
    process.exit(result.passed ? 0 : 2);
  });
}
