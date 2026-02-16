#!/usr/bin/env node
/**
 * Validate Structure - Vérifie la structure du projet
 */

import fs from 'fs';
import path from 'path';
import { getEvolutionVersion } from './lib/factory-state.js';

// Base directories (required for Gate 1 - before code generation)
const REQUIRED_DIRS_GATE1 = [
  'input',
  'docs',
  'docs/specs',
  'docs/adr',
  'docs/planning',
  'docs/testing',
  'docs/qa',
  'docs/release',
  'docs/factory',
  '.claude',
  '.claude/skills',
  '.claude/agents',
  '.claude/commands',
  '.claude/rules',
  '.claude/hooks',
  'tools'
];

// Additional directories (required for Gate 4 - after code generation)
const REQUIRED_DIRS_GATE4 = [
  'src'
];

// Get versioned planning directories based on state
function getVersionedPlanningDirs() {
  const evolutionVersion = getEvolutionVersion();

  // Return planning dirs for all versions up to current
  const dirs = [];
  for (let v = 1; v <= evolutionVersion; v++) {
    dirs.push(`docs/planning/v${v}`);
    dirs.push(`docs/planning/v${v}/us`);
    dirs.push(`docs/planning/v${v}/tasks`);
  }
  return dirs;
}

// Determine which gate we're validating for
// Gate 1: Basic structure (no src/tests yet)
// Gate 4: Full structure (with src/tests)
function getRequiredDirs(includeCodeDirs = false) {
  const dirs = [...REQUIRED_DIRS_GATE1, ...getVersionedPlanningDirs()];
  if (includeCodeDirs) {
    dirs.push(...REQUIRED_DIRS_GATE4);
  }
  return dirs;
}

const REQUIRED_FILES = [
  'CLAUDE.md',
  'package.json',
  '.claude/settings.json',
  '.claude/rules/factory-invariants.md',
  '.claude/rules/security-baseline.md'
];

// Get naming conventions for versioned planning dirs
function getNamingConventions() {
  const conventions = [
    { dir: 'docs/adr', pattern: /^ADR-\d{4}/, description: 'ADR-XXXX' }
  ];

  // Add conventions for each version
  const versionDirs = fs.readdirSync('docs/planning').filter(d => /^v\d+$/.test(d));
  for (const vDir of versionDirs) {
    conventions.push({
      dir: `docs/planning/${vDir}/us`,
      pattern: /^US-\d{4}/,
      description: 'US-XXXX'
    });
    conventions.push({
      dir: `docs/planning/${vDir}/tasks`,
      pattern: /^TASK-\d{4}/,
      description: 'TASK-XXXX'
    });
  }

  return conventions;
}

const NAMING_CONVENTIONS = getNamingConventions();

function validate() {
  console.log('🔍 Validation de la structure du projet\n');

  const errors = [];
  const warnings = [];

  // Determine if we should check for code directories (src/)
  // These only exist after Gate 4 (code generation)
  const srcExists = fs.existsSync('src');

  // Check directories
  console.log('📁 Vérification des dossiers...');
  const requiredDirs = getRequiredDirs(srcExists);
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      errors.push(`Dossier manquant: ${dir}`);
    }
  }

  // Check co-located tests: each source layer in src/ must have __tests__/
  if (srcExists) {
    console.log('🧪 Vérification des tests co-localisés...');
    const srcEntries = fs.readdirSync('src', { withFileTypes: true });
    const sourceLayers = srcEntries
      .filter(e => e.isDirectory() && !e.name.startsWith('__'))
      .map(e => e.name);
    for (const layer of sourceLayers) {
      const testsDir = path.join('src', layer, '__tests__');
      if (!fs.existsSync(testsDir)) {
        errors.push(`Tests manquants pour la couche ${layer}: ${testsDir}`);
      }
    }
  }

  // Check files
  console.log('📄 Vérification des fichiers...');
  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(file)) {
      errors.push(`Fichier manquant: ${file}`);
    }
  }

  // Check minimal content in key documents
  console.log('📄 Vérification du contenu minimal...');
  const minContentChecks = [
    { file: 'docs/brief.md', minLines: 20, label: 'brief.md' },
    { file: 'docs/scope.md', minLines: 10, label: 'scope.md' },
    { file: 'docs/acceptance.md', minLines: 10, label: 'acceptance.md' }
  ];
  for (const { file, minLines, label } of minContentChecks) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      const nonEmptyLines = content.split('\n').filter(l => l.trim().length > 0).length;
      if (nonEmptyLines < minLines) {
        warnings.push(`${label}: contenu insuffisant (${nonEmptyLines} lignes non-vides, minimum ${minLines})`);
      }
    }
  }

  // Check naming conventions
  console.log('📝 Vérification des conventions de nommage...');
  for (const conv of NAMING_CONVENTIONS) {
    if (fs.existsSync(conv.dir)) {
      const files = fs.readdirSync(conv.dir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        if (file.includes('template')) continue; // Skip templates
        if (!conv.pattern.test(file)) {
          warnings.push(`Convention ${conv.description} non respectée: ${path.join(conv.dir, file)}`);
        }
      }
    }
  }

  // Report
  console.log('');
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Structure valide\n');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.log('❌ Erreurs:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  if (warnings.length > 0) {
    console.log('⚠️ Avertissements:');
    warnings.forEach(w => console.log(`  - ${w}`));
  }

  console.log('');
  process.exit(errors.length > 0 ? 1 : 0);
}

validate();
