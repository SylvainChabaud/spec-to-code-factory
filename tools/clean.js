#!/usr/bin/env node
/**
 * Clean - Remet le projet en etat "starter" propre.
 *
 * Strategie ALLOWLIST : seuls les elements proteges sont conserves.
 * Tout le reste (genere par le pipeline) est supprime automatiquement.
 *
 * Usage:
 *   node tools/clean.js           # Avec confirmation interactive
 *   node tools/clean.js --force   # Sans confirmation
 *   node tools/clean.js --dry-run # Affiche ce qui serait supprime
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const args = process.argv.slice(2);
const force = args.includes('--force');
const dryRun = args.includes('--dry-run');

// ─── ALLOWLIST : elements proteges a la racine ─────────────
// Tout ce qui n'est PAS dans cette liste sera supprime.
const PROTECTED_ROOT = new Set([
  '.git',
  '.gitignore',
  '.claude',
  'CLAUDE.md',
  'README.md',
  'package.json',
  'input',
  'templates',
  'tools',
  'docs',
  'originalPlan (\u00e0 conserver)',
]);

// ─── Sous-elements proteges dans docs/ ─────────────────────
// docs/ est protege a la racine mais son contenu est nettoye
// sauf ces fichiers/dossiers specifiques.
const PROTECTED_DOCS = new Set([
  'CLAUDE-CODE-ARCHITECTURE.md',
]);

// ─── Sous-elements proteges dans .claude/rules/ ────────────
// Les rules generees par le pipeline sont nettoyees,
// seules les rules baseline sont conservees.
const PROTECTED_RULES = new Set([
  'factory-invariants.md',
  'security-baseline.md',
]);

// ─── Structure minimale a recreer apres nettoyage ──────────
const RECREATE_DIRS = [
  'docs',
  'docs/factory',
  'docs/adr',
  'docs/specs',
];

const STARTER_STATE = {
  evolutionVersion: 1,
  evolutionMode: 'greenfield',
  phase: null,
  counters: { epic: 0, us: 0, task: 0, adr: 0 },
};

const STARTER_PACKAGE = {
  name: 'spec-to-code-factory',
  version: '1.0.0',
  description: 'Pipeline Claude Code: requirements.md \u2192 projet livrable',
  type: 'module',
  scripts: {
    'clean': 'node tools/clean.js',
    'gate:check': 'node tools/gate-check.js',
    'test:tools': 'node --test tools/__tests__/*.test.js',
    'validate': 'node tools/validate-structure.js',
    'scan:secrets': 'node tools/scan-secrets.js',
    'verify': 'node tools/verify-pipeline.js',
  },
  keywords: ['claude-code', 'pipeline', 'spec-to-code', 'factory'],
  license: 'MIT',
};

// ─── Helpers ────────────────────────────────────────────────

function rmSafe(target) {
  if (!fs.existsSync(target)) return false;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    fs.rmSync(target, { recursive: true, force: true });
  } else {
    fs.unlinkSync(target);
  }
  return true;
}

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * Scan la racine du projet et retourne tout ce qui n'est pas protege.
 */
function scanRoot() {
  const toRemove = [];
  for (const entry of fs.readdirSync('.')) {
    if (!PROTECTED_ROOT.has(entry)) {
      const stat = fs.statSync(entry);
      toRemove.push({ path: entry, type: stat.isDirectory() ? 'dir' : 'file' });
    }
  }
  return toRemove;
}

/**
 * Scan docs/ et retourne le contenu genere (hors fichiers proteges).
 */
function scanDocs() {
  const toRemove = [];
  const docsDir = 'docs';
  if (!fs.existsSync(docsDir)) return toRemove;

  for (const entry of fs.readdirSync(docsDir)) {
    if (!PROTECTED_DOCS.has(entry)) {
      const fullPath = path.join(docsDir, entry);
      const stat = fs.statSync(fullPath);
      toRemove.push({ path: fullPath, type: stat.isDirectory() ? 'dir' : 'file' });
    }
  }
  return toRemove;
}

/**
 * Scan .claude/rules/ et retourne les rules generees (hors baseline).
 */
function scanRules() {
  const toRemove = [];
  const rulesDir = '.claude/rules';
  if (!fs.existsSync(rulesDir)) return toRemove;

  for (const entry of fs.readdirSync(rulesDir)) {
    if (!PROTECTED_RULES.has(entry)) {
      toRemove.push({ path: path.join(rulesDir, entry), type: 'file' });
    }
  }
  return toRemove;
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  console.log('\n\ud83e\uddf9 Clean \u2014 Reset projet en etat starter (allowlist)\n');

  // 1. Inventaire : tout ce qui n'est pas protege
  const toRemove = [
    ...scanRoot(),
    ...scanDocs(),
    ...scanRules(),
  ];

  if (toRemove.length === 0) {
    console.log('\u2705 Projet deja propre \u2014 rien a supprimer.\n');
    process.exit(0);
  }

  // 2. Afficher l'inventaire
  console.log(`${toRemove.length} element(s) a supprimer :\n`);
  for (const item of toRemove) {
    const icon = item.type === 'dir' ? '\ud83d\udcc1' : '\ud83d\udcc4';
    console.log(`  ${icon} ${item.path}`);
  }
  console.log('');

  // 3. Dry run ?
  if (dryRun) {
    console.log('(--dry-run) Aucune suppression effectuee.\n');
    console.log('Allowlist (protege) :');
    for (const entry of PROTECTED_ROOT) {
      console.log(`  \u2705 ${entry}`);
    }
    console.log('');
    process.exit(0);
  }

  // 4. Confirmation
  if (!force) {
    const answer = await confirm('Confirmer la suppression ? (y/N) ');
    if (answer !== 'y' && answer !== 'yes' && answer !== 'oui') {
      console.log('Annule.\n');
      process.exit(0);
    }
    console.log('');
  }

  // 5. Suppression
  let removed = 0;
  for (const item of toRemove) {
    if (rmSafe(item.path)) {
      removed++;
    }
  }
  console.log(`\u2705 ${removed} element(s) supprime(s)`);

  // 6. Recreer structure minimale
  for (const dir of RECREATE_DIRS) {
    fs.mkdirSync(dir, { recursive: true });
  }
  console.log('\u2705 Structure minimale recree (docs/factory, docs/adr, docs/specs)');

  // 7. Reinitialiser state.json
  STARTER_STATE.lastUpdated = new Date().toISOString();
  fs.writeFileSync(
    'docs/factory/state.json',
    JSON.stringify(STARTER_STATE, null, 2) + '\n'
  );
  console.log('\u2705 State reinitialise (docs/factory/state.json)');

  // 8. Reinitialiser package.json
  fs.writeFileSync('package.json', JSON.stringify(STARTER_PACKAGE, null, 2) + '\n');
  console.log('\u2705 package.json reinitialise (starter)');

  // 9. Reinitialiser instrumentation
  try {
    const { execSync } = await import('child_process');
    execSync('node tools/instrumentation/collector.js reset', { stdio: 'pipe' });
    console.log('\u2705 Instrumentation reinitialise');
  } catch {
    // Pas grave si l'instrumentation n'existe pas
  }

  // 10. Resume
  console.log(`
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Projet nettoye.

Protege (allowlist) :
  .git/                    (repo)
  .claude/                 (config Claude Code)
  CLAUDE.md                (instructions projet)
  README.md                (doc projet)
  package.json             (reset starter)
  input/                   (requirements source)
  templates/               (templates workflow)
  tools/                   (outils workflow)

Pret pour : /factory
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
`);
}

main().catch((err) => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
