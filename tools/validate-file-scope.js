#!/usr/bin/env node
/**
 * Validate File Scope - Vérifie que les fichiers modifiés sont dans le scope de la task
 * Usage: node tools/validate-file-scope.js <task-file> <modified-file> [<modified-file>...]
 *
 * Exit codes:
 *   0 = OK (tous les fichiers sont dans le scope)
 *   1 = Erreur d'usage
 *   2 = BLOCK (fichier(s) hors scope)
 */

import fs from 'fs';
import path from 'path';
import { minimatch } from 'minimatch';

function extractScope(taskContent) {
  // Patterns possibles pour définir le scope dans une task
  const scopePatterns = [
    /## Fichiers concernés\s*\n([\s\S]*?)(?=\n##|$)/i,
    /## Scope\s*\n([\s\S]*?)(?=\n##|$)/i,
    /## Files\s*\n([\s\S]*?)(?=\n##|$)/i,
    /### Fichiers à modifier\s*\n([\s\S]*?)(?=\n##|$)/i,
    /### Fichiers à créer\s*\n([\s\S]*?)(?=\n##|$)/i,
  ];

  const scopeFiles = new Set();

  for (const pattern of scopePatterns) {
    const match = taskContent.match(pattern);
    if (match) {
      // Extraire les chemins de fichiers (lignes avec - ou *)
      const lines = match[1].split('\n');
      for (const line of lines) {
        // Match patterns like "- src/file.ts" or "* `src/file.ts`" or "- `src/file.ts`"
        const fileMatch = line.match(/^[\s]*[-*]\s*`?([^`\n]+)`?\s*$/);
        if (fileMatch) {
          const filePath = fileMatch[1].trim();
          if (filePath && !filePath.startsWith('#')) {
            scopeFiles.add(normalizePath(filePath));
          }
        }
      }
    }
  }

  // Also check for inline file references in "Objectif technique" section
  const objectifMatch = taskContent.match(/## Objectif technique\s*\n([\s\S]*?)(?=\n##|$)/i);
  if (objectifMatch) {
    // Look for file patterns like src/*, tests/*, etc.
    const patterns = objectifMatch[1].match(/`([^`]+\.[a-z]+)`/gi);
    if (patterns) {
      for (const p of patterns) {
        scopeFiles.add(normalizePath(p.replace(/`/g, '')));
      }
    }
  }

  return scopeFiles;
}

function normalizePath(filePath) {
  return filePath
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^[A-Za-z]:/, '')
    .replace(/^\//, '')
    .trim();
}

function isInScope(modifiedFile, scopeFiles) {
  const normalizedModified = normalizePath(modifiedFile);

  // Direct match
  if (scopeFiles.has(normalizedModified)) {
    return true;
  }

  // Check if any scope pattern matches using minimatch
  // Supports: *, **, {a,b}, [abc], ?(pattern), etc.
  for (const scopeFile of scopeFiles) {
    // Use minimatch for robust pattern matching
    if (minimatch(normalizedModified, scopeFile, { matchBase: false })) {
      return true;
    }

    // Also try with leading ./ removed from pattern
    const cleanPattern = scopeFile.replace(/^\.\//, '');
    if (minimatch(normalizedModified, cleanPattern, { matchBase: false })) {
      return true;
    }
  }

  return false;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node tools/validate-file-scope.js <task-file> <modified-file> [<modified-file>...]');
    console.error('');
    console.error('Example:');
    console.error('  node tools/validate-file-scope.js docs/planning/tasks/TASK-0001.md src/auth.ts');
    process.exit(1);
  }

  const taskFile = args[0];
  const modifiedFiles = args.slice(1);

  // Read task file
  if (!fs.existsSync(taskFile)) {
    console.error(`❌ Task file not found: ${taskFile}`);
    process.exit(1);
  }

  const taskContent = fs.readFileSync(taskFile, 'utf-8');
  const scopeFiles = extractScope(taskContent);

  if (scopeFiles.size === 0) {
    console.warn(`⚠️ Aucun scope défini dans ${taskFile}`);
    console.warn('   Ajoutez une section "## Fichiers concernés" à la task.');
    console.warn('   Validation ignorée.');
    process.exit(0);
  }

  console.log(`\n🔍 Validation du scope pour: ${path.basename(taskFile)}\n`);
  console.log('Fichiers autorisés:');
  scopeFiles.forEach(f => console.log(`  ✅ ${f}`));
  console.log('');

  const outOfScope = [];

  for (const file of modifiedFiles) {
    if (isInScope(file, scopeFiles)) {
      console.log(`  ✅ ${file} - dans le scope`);
    } else {
      console.log(`  ❌ ${file} - HORS SCOPE`);
      outOfScope.push(file);
    }
  }

  console.log('');

  if (outOfScope.length > 0) {
    console.error('❌ BLOQUÉ: Fichiers hors scope détectés');
    console.error('');
    console.error('   Les fichiers suivants ne sont pas autorisés par la task:');
    outOfScope.forEach(f => console.error(`     - ${f}`));
    console.error('');
    console.error('   Solutions:');
    console.error('     1. Retirez ces modifications');
    console.error('     2. Ou ajoutez ces fichiers au scope de la task');
    console.error('     3. Ou créez une task dédiée pour ces fichiers');
    process.exit(2);
  }

  console.log('✅ Tous les fichiers sont dans le scope\n');
  process.exit(0);
}

main();
