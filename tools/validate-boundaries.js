#!/usr/bin/env node
/**
 * Validate Architectural Boundaries - Vérifie les règles d'import inter-couches
 *
 * Usage:
 *   node tools/validate-boundaries.js           # Valide src/
 *   node tools/validate-boundaries.js --verbose  # Avec détails des imports
 *
 * Layers (par convention de dossiers) :
 *   - domain/         → Aucune dépendance externe autorisée
 *   - application/    → Dépend de domain uniquement
 *   - infrastructure/ → Dépend de domain + application
 *   - ui/ | components/ → Dépend de application (DTOs)
 *
 * Exit codes:
 *   0 = PASS (aucune violation)
 *   1 = ERROR (erreur d'exécution, pas de src/)
 *   2 = FAIL (violations détectées)
 */

import fs from 'fs';
import path from 'path';

// Layers et leurs dépendances autorisées
const LAYER_RULES = {
  domain: {
    name: 'Domain',
    patterns: [/[/\\]domain[/\\]/],
    allowedImports: ['domain'],
    description: 'Entités, Value Objects, Domain Services, Events'
  },
  application: {
    name: 'Application',
    patterns: [/[/\\]application[/\\]/],
    allowedImports: ['domain', 'application', 'infrastructure'],
    description: 'Use Cases, DTOs, Ports (interfaces). Exception ADR-0009: usePersistence importe infrastructure.'
  },
  infrastructure: {
    name: 'Infrastructure',
    patterns: [/[/\\]infrastructure[/\\]/, /[/\\]infra[/\\]/],
    allowedImports: ['domain', 'application', 'infrastructure'],
    description: 'Repositories, APIs externes, DB'
  },
  ui: {
    name: 'UI/Presentation',
    patterns: [/[/\\]ui[/\\]/, /[/\\]components[/\\]/, /[/\\]pages[/\\]/],
    allowedImports: ['domain', 'application', 'ui'],
    description: 'Composants, Controllers, Pages'
  }
};

// Patterns de layer dans les imports (détecte le layer cible d'un import)
const LAYER_IMPORT_PATTERNS = {
  domain: [/['"].*[/\\]?domain[/\\]/, /from\s+['"]@?[^'"]*domain/],
  application: [/['"].*[/\\]?application[/\\]/, /from\s+['"]@?[^'"]*application/],
  infrastructure: [/['"].*[/\\]?infrastructure[/\\]/, /['"].*[/\\]?infra[/\\]/, /from\s+['"]@?[^'"]*infrastructure/, /from\s+['"]@?[^'"]*infra/],
  ui: [/['"].*[/\\]?ui[/\\]/, /['"].*[/\\]?components[/\\]/, /['"].*[/\\]?pages[/\\]/, /from\s+['"]@?[^'"]*components/, /from\s+['"]@?[^'"]*pages/]
};

/**
 * Détermine la layer d'un fichier d'après son chemin
 */
function getFileLayer(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  for (const [layerName, rule] of Object.entries(LAYER_RULES)) {
    if (rule.patterns.some(p => p.test(normalized))) {
      return layerName;
    }
  }
  return null; // Fichier hors layers (racine src/, etc.)
}

/**
 * Extrait les imports d'un fichier TypeScript/JavaScript
 * Supporte: import X, import { X }, import * as X, import type, require, dynamic import
 */
function extractImports(content) {
  const imports = [];

  // Fonction helper pour calculer le numero de ligne
  const getLineNumber = (index) => content.substring(0, index).split('\n').length;

  // 1. import default: import X from '...'
  // 2. import named: import { X, Y } from '...'
  // 3. import namespace: import * as X from '...'
  // 4. import type: import type { X } from '...'
  // 5. import side-effect: import '...'
  const importRegex = /import\s+(?:type\s+)?(?:(?:[\w*{}\s,]+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push({ path: match[1], line: getLineNumber(match.index), type: 'import' });
  }

  // 6. require('...') - CommonJS
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push({ path: match[1], line: getLineNumber(match.index), type: 'require' });
  }

  // 7. require.resolve('...') - Path resolution
  const requireResolveRegex = /require\.resolve\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireResolveRegex.exec(content)) !== null) {
    imports.push({ path: match[1], line: getLineNumber(match.index), type: 'require.resolve' });
  }

  // 8. Dynamic import: import('...')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push({ path: match[1], line: getLineNumber(match.index), type: 'dynamic' });
  }

  // 9. export ... from '...' (re-exports)
  const reExportRegex = /export\s+(?:[\w*{}\s,]+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = reExportRegex.exec(content)) !== null) {
    imports.push({ path: match[1], line: getLineNumber(match.index), type: 'reexport' });
  }

  return imports;
}

/**
 * Détermine la layer cible d'un import
 * @param {string} importPath - Le chemin d'import (peut être relatif ou absolu)
 * @param {string} sourceFilePath - Le fichier source contenant l'import (pour résoudre les chemins relatifs)
 */
function getImportTargetLayer(importPath, sourceFilePath = null) {
  // D'abord, essayer la détection par patterns (pour les imports absolus et alias)
  for (const [layerName, patterns] of Object.entries(LAYER_IMPORT_PATTERNS)) {
    if (patterns.some(p => p.test(`'${importPath}'`))) {
      return layerName;
    }
  }

  // Si c'est un import relatif et qu'on a le fichier source, résoudre le chemin
  if (sourceFilePath && (importPath.startsWith('./') || importPath.startsWith('../'))) {
    const sourceDir = path.dirname(sourceFilePath);
    const resolvedPath = path.resolve(sourceDir, importPath);
    const normalizedResolved = resolvedPath.replace(/\\/g, '/');

    // Vérifier si le chemin résolu pointe vers un layer
    for (const [layerName, rule] of Object.entries(LAYER_RULES)) {
      if (rule.patterns.some(p => p.test(normalizedResolved))) {
        return layerName;
      }
    }
  }

  return null; // Import externe (npm) ou non-layer
}

/**
 * Scanne récursivement un dossier
 */
function walkDir(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      files.push(...walkDir(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Valide les boundaries d'un fichier
 */
function validateFile(filePath, verbose = false) {
  const layer = getFileLayer(filePath);
  if (!layer) return []; // Fichier hors layers, pas de règle

  const rule = LAYER_RULES[layer];
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = extractImports(content);
  const violations = [];

  for (const imp of imports) {
    const targetLayer = getImportTargetLayer(imp.path, filePath);
    if (!targetLayer) continue; // Import npm ou non-layer

    if (!rule.allowedImports.includes(targetLayer)) {
      violations.push({
        file: filePath,
        line: imp.line,
        sourceLayer: layer,
        targetLayer: targetLayer,
        importPath: imp.path,
        message: `${rule.name} (${layer}) ne peut pas importer ${LAYER_RULES[targetLayer].name} (${targetLayer})`
      });
    }
  }

  return violations;
}

/**
 * Point d'entrée principal
 */
function main() {
  const verbose = process.argv.includes('--verbose');
  const srcDir = 'src';

  if (!fs.existsSync(srcDir)) {
    console.log('  Aucun dossier src/ trouvé - boundary check skipped');
    process.exit(0);
  }

  // Détection des layers existants
  const existingLayers = [];
  for (const [name] of Object.entries(LAYER_RULES)) {
    const dirs = [name];
    if (name === 'ui') dirs.push('components', 'pages');
    if (name === 'infrastructure') dirs.push('infra');
    for (const dir of dirs) {
      if (fs.existsSync(path.join(srcDir, dir))) {
        existingLayers.push(name);
        break;
      }
    }
  }

  if (existingLayers.length < 2) {
    console.log(`  Layers détectés: ${existingLayers.length < 1 ? 'aucun' : existingLayers.join(', ')}`);
    console.log('  Boundary check non applicable (< 2 layers) - skipped');
    process.exit(0);
  }

  console.log(`  Layers détectés: ${existingLayers.join(', ')}`);

  // Scanner tous les fichiers
  const files = walkDir(srcDir);
  console.log(`  Fichiers à analyser: ${files.length}`);

  const allViolations = [];

  for (const file of files) {
    const violations = validateFile(file, verbose);
    allViolations.push(...violations);
  }

  // Rapport
  if (allViolations.length === 0) {
    console.log(`\n  ✅ Boundary check PASS (${files.length} fichiers, ${existingLayers.length} layers)`);
    process.exit(0);
  }

  console.log(`\n  ❌ ${allViolations.length} violation(s) de boundaries détectée(s):\n`);

  for (const v of allViolations) {
    const relativePath = path.relative('.', v.file).replace(/\\/g, '/');
    console.log(`    ${relativePath}:${v.line}`);
    console.log(`      ${v.message}`);
    console.log(`      Import: ${v.importPath}`);
    console.log('');
  }

  // Résumé par layer
  const bySource = {};
  for (const v of allViolations) {
    const key = `${v.sourceLayer} → ${v.targetLayer}`;
    bySource[key] = (bySource[key] || 0) + 1;
  }

  console.log('  Résumé des violations:');
  for (const [key, count] of Object.entries(bySource)) {
    console.log(`    ${key}: ${count} violation(s)`);
  }

  process.exit(2);
}

main();
