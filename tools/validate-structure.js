#!/usr/bin/env node
/**
 * Validate Structure - Vérifie la structure du projet
 */

import fs from 'fs';
import path from 'path';

const REQUIRED_DIRS = [
  'input',
  'docs',
  'docs/specs',
  'docs/adr',
  'docs/planning',
  'docs/planning/us',
  'docs/planning/tasks',
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
  'tools',
  'src',
  'tests'
];

const REQUIRED_FILES = [
  'CLAUDE.md',
  'package.json',
  '.claude/settings.json',
  '.claude/rules/factory-invariants.md',
  '.claude/rules/security-baseline.md'
];

const NAMING_CONVENTIONS = [
  { dir: 'docs/planning/us', pattern: /^US-\d{4}/, description: 'US-XXXX' },
  { dir: 'docs/planning/tasks', pattern: /^TASK-\d{4}/, description: 'TASK-XXXX' },
  { dir: 'docs/adr', pattern: /^ADR-\d{4}/, description: 'ADR-XXXX' }
];

function validate() {
  console.log('🔍 Validation de la structure du projet\n');

  const errors = [];
  const warnings = [];

  // Check directories
  console.log('📁 Vérification des dossiers...');
  for (const dir of REQUIRED_DIRS) {
    if (!fs.existsSync(dir)) {
      errors.push(`Dossier manquant: ${dir}`);
    }
  }

  // Check files
  console.log('📄 Vérification des fichiers...');
  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(file)) {
      errors.push(`Fichier manquant: ${file}`);
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
