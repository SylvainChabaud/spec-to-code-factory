#!/usr/bin/env node
/**
 * Tests fonctionnels pour gate-check.js
 *
 * Verifie :
 * - Mode --json : structure, categories, fixable/blocking
 * - Mode texte : retro-compatibilite
 * - Exit codes : 0 (PASS), 2 (FAIL)
 * - Classification des erreurs par categorie
 * - Decisions pipeline : quand PASS/FAIL, que recoit l'orchestrateur
 *
 * Usage : node tools/__tests__/gate-check.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Helpers
function runGate(gate, { json = false } = {}) {
  const cmd = `node tools/gate-check.js ${gate}${json ? ' --json' : ''}`;
  try {
    const stdout = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', timeout: 30000 });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (e) {
    return { exitCode: e.status, stdout: e.stdout || '', stderr: e.stderr || '' };
  }
}

function parseJson(result) {
  return JSON.parse(result.stdout.trim());
}

// Sauvegarde/restauration de fichiers pour simuler des echecs
function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, filePath + '.test-bak');
    return true;
  }
  return false;
}

function restoreFile(filePath) {
  const bak = filePath + '.test-bak';
  if (fs.existsSync(bak)) {
    fs.copyFileSync(bak, filePath);
    fs.unlinkSync(bak);
  }
}

function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// ============================================================
// 1. Structure JSON
// ============================================================
describe('gate-check --json : structure de sortie', () => {

  it('PASS retourne un JSON valide avec tous les champs requis', () => {
    const result = runGate(1, { json: true });
    assert.equal(result.exitCode, 0, 'Exit code doit etre 0 pour PASS');

    const json = parseJson(result);
    assert.equal(typeof json.gate, 'number', 'gate doit etre un nombre');
    assert.equal(typeof json.name, 'string', 'name doit etre une string');
    assert.equal(json.status, 'PASS', 'status doit etre PASS');
    assert.ok(Array.isArray(json.errors), 'errors doit etre un array');
    assert.equal(json.errors.length, 0, 'errors doit etre vide pour PASS');
    assert.equal(typeof json.summary, 'object', 'summary doit etre un objet');
    assert.equal(json.summary.total, 0);
    assert.equal(json.summary.fixable, 0);
    assert.equal(json.summary.blocking, 0);
  });

  it('le champ gate correspond au numero demande', () => {
    for (const g of [0, 1, 2, 3]) {
      const json = parseJson(runGate(g, { json: true }));
      assert.equal(json.gate, g, `gate doit etre ${g}`);
    }
  });

  it('le champ name est non-vide pour chaque gate (gates rapides 0-3)', () => {
    // Gates 4-5 lancent npm test / build qui peuvent depasser le timeout
    for (const g of [0, 1, 2, 3]) {
      const result = runGate(g, { json: true });
      const json = JSON.parse(result.stdout.trim());
      assert.ok(json.name.length > 0, `name doit etre non-vide pour gate ${g}`);
    }
  });
});

// ============================================================
// 2. Retro-compatibilite mode texte
// ============================================================
describe('gate-check mode texte : retro-compatibilite', () => {

  it('mode texte ne retourne PAS du JSON', () => {
    const result = runGate(1);
    assert.equal(result.exitCode, 0);
    // Ne doit pas etre du JSON parsable sur la premiere ligne
    assert.throws(() => JSON.parse(result.stdout.trim()), 'La sortie texte ne doit pas etre du JSON');
  });

  it('mode texte contient les emojis de statut', () => {
    const result = runGate(1);
    assert.ok(
      result.stdout.includes('✅') || result.stdout.includes('❌'),
      'La sortie texte doit contenir des emojis de statut'
    );
  });

  it('PASS en mode texte contient "PASS"', () => {
    const result = runGate(1);
    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes('PASS'), 'Doit contenir PASS');
  });
});

// ============================================================
// 3. Exit codes
// ============================================================
describe('gate-check : exit codes', () => {

  it('exit code 0 quand PASS (json)', () => {
    const result = runGate(1, { json: true });
    assert.equal(result.exitCode, 0);
  });

  it('exit code 0 quand PASS (texte)', () => {
    const result = runGate(1);
    assert.equal(result.exitCode, 0);
  });

  it('exit code 2 quand FAIL (json) - fichier manquant', () => {
    const target = 'docs/specs/api.md';
    const backed = backupFile(target);
    try {
      removeFile(target);
      const result = runGate(2, { json: true });
      assert.equal(result.exitCode, 2, 'Exit code doit etre 2 pour FAIL');
    } finally {
      if (backed) restoreFile(target);
    }
  });

  it('exit code 2 quand FAIL (texte) - fichier manquant', () => {
    const target = 'docs/specs/api.md';
    const backed = backupFile(target);
    try {
      removeFile(target);
      const result = runGate(2);
      assert.equal(result.exitCode, 2, 'Exit code doit etre 2 pour FAIL');
    } finally {
      if (backed) restoreFile(target);
    }
  });

  it('exit code identique entre mode json et texte', () => {
    const target = 'docs/specs/api.md';
    const backed = backupFile(target);
    try {
      removeFile(target);
      const jsonResult = runGate(2, { json: true });
      // Restaurer puis re-supprimer pour avoir le meme etat
      if (backed) restoreFile(target);
      const backed2 = backupFile(target);
      removeFile(target);
      const textResult = runGate(2);
      assert.equal(jsonResult.exitCode, textResult.exitCode, 'Exit codes doivent etre identiques');
      if (backed2) restoreFile(target);
    } finally {
      if (fs.existsSync(target + '.test-bak')) restoreFile(target);
    }
  });
});

// ============================================================
// 4. Classification des erreurs
// ============================================================
describe('gate-check --json : classification des erreurs', () => {

  it('fichier manquant → category "missing_file", fixable true', () => {
    const target = 'docs/specs/api.md';
    const backed = backupFile(target);
    try {
      removeFile(target);
      const json = parseJson(runGate(2, { json: true }));
      assert.equal(json.status, 'FAIL');
      const fileError = json.errors.find(e => e.category === 'missing_file');
      assert.ok(fileError, 'Doit avoir une erreur missing_file');
      assert.equal(fileError.fixable, true, 'missing_file doit etre fixable');
      assert.ok(fileError.message.includes('api.md'), 'Le message doit mentionner le fichier');
    } finally {
      if (backed) restoreFile(target);
    }
  });

  it('section manquante → category "missing_section", fixable true', () => {
    const target = 'docs/specs/api.md';
    const backed = backupFile(target);
    try {
      // Ecrire un fichier vide (existe mais sans sections)
      fs.writeFileSync(target, '# API\n\nContenu sans sections requises.\n');
      const json = parseJson(runGate(2, { json: true }));
      assert.equal(json.status, 'FAIL');
      const sectionError = json.errors.find(e => e.category === 'missing_section');
      assert.ok(sectionError, 'Doit avoir une erreur missing_section');
      assert.equal(sectionError.fixable, true, 'missing_section doit etre fixable');
    } finally {
      if (backed) restoreFile(target);
    }
  });

  it('summary compte correctement fixable vs blocking', () => {
    const target = 'docs/specs/api.md';
    const backed = backupFile(target);
    try {
      removeFile(target);
      const json = parseJson(runGate(2, { json: true }));
      assert.equal(json.summary.total, json.errors.length, 'total = nombre d\'erreurs');
      assert.equal(
        json.summary.fixable + json.summary.blocking,
        json.summary.total,
        'fixable + blocking = total'
      );
      // Toutes les erreurs de fichier/section sont fixable
      const fixableCount = json.errors.filter(e => e.fixable).length;
      assert.equal(json.summary.fixable, fixableCount);
    } finally {
      if (backed) restoreFile(target);
    }
  });

  it('chaque erreur a les 3 champs obligatoires (message, category, fixable)', () => {
    const target = 'docs/specs/api.md';
    const backed = backupFile(target);
    try {
      removeFile(target);
      const json = parseJson(runGate(2, { json: true }));
      for (const err of json.errors) {
        assert.equal(typeof err.message, 'string', 'message doit etre string');
        assert.equal(typeof err.category, 'string', 'category doit etre string');
        assert.equal(typeof err.fixable, 'boolean', 'fixable doit etre boolean');
      }
    } finally {
      if (backed) restoreFile(target);
    }
  });
});

// ============================================================
// 5. Decisions pipeline : PASS
// ============================================================
describe('pipeline decision : cas PASS', () => {

  it('Gate 1 PASS → orchestrateur recoit status PASS, 0 erreurs', () => {
    const json = parseJson(runGate(1, { json: true }));
    assert.equal(json.status, 'PASS');
    assert.equal(json.errors.length, 0);
    // L'orchestrateur ne doit PAS declencher le protocole d'echec
    assert.equal(json.summary.blocking, 0);
  });

  it('Gate 2 PASS → orchestrateur peut continuer vers PLAN', () => {
    const json = parseJson(runGate(2, { json: true }));
    assert.equal(json.status, 'PASS');
    // Aucune action corrective necessaire
    assert.equal(json.summary.total, 0);
  });

  it('Gate 3 PASS → orchestrateur peut continuer vers BUILD', () => {
    const json = parseJson(runGate(3, { json: true }));
    assert.equal(json.status, 'PASS');
    assert.equal(json.summary.total, 0);
  });
});

// ============================================================
// 6. Decisions pipeline : cas FAIL
// ============================================================
describe('pipeline decision : cas FAIL', () => {

  it('FAIL avec erreurs fixable uniquement → phase peut auto-remedier', () => {
    const target = 'docs/specs/api.md';
    const backed = backupFile(target);
    try {
      removeFile(target);
      const json = parseJson(runGate(2, { json: true }));
      assert.equal(json.status, 'FAIL');
      // Toutes les erreurs sont fixable → la phase PEUT retenter
      assert.equal(json.summary.blocking, 0, 'Aucune erreur blocking');
      assert.ok(json.summary.fixable > 0, 'Au moins une erreur fixable');
      // Decision attendue : la phase retente (auto-remediation)
    } finally {
      if (backed) restoreFile(target);
    }
  });

  it('FAIL avec erreurs blocking → phase doit STOP et remonter GATE_FAIL', () => {
    // Simuler un echec Gate 0 (requirements) qui est non-fixable
    const target = 'input/requirements.md';
    const backed = backupFile(target);
    try {
      // Ecrire un fichier presque vide (manque les 12 sections)
      fs.writeFileSync(target, '# Requirements\n\nJuste un titre.\n');
      const json = parseJson(runGate(0, { json: true }));
      assert.equal(json.status, 'FAIL');
      // L'erreur requirements est non-fixable
      const reqError = json.errors.find(e => e.category === 'requirements');
      assert.ok(reqError, 'Doit avoir une erreur requirements');
      assert.equal(reqError.fixable, false, 'requirements doit etre non-fixable');
      assert.ok(json.summary.blocking > 0, 'Au moins une erreur blocking');
      // Decision attendue : STOP immediat, GATE_FAIL remonté à l'orchestrateur
    } finally {
      if (backed) restoreFile(target);
    }
  });

  it('le format GATE_FAIL attendu par l orchestrateur peut etre construit depuis le JSON', () => {
    const target = 'docs/specs/api.md';
    const backed = backupFile(target);
    try {
      removeFile(target);
      const json = parseJson(runGate(2, { json: true }));
      // Simuler la construction du marqueur GATE_FAIL comme le ferait un skill
      const errSummary = json.errors.map(e => e.message).join(';');
      const marker = `GATE_FAIL|${json.gate}|${errSummary}|3`;
      // Verifier le format
      const parts = marker.split('|');
      assert.equal(parts[0], 'GATE_FAIL', 'Premier segment = GATE_FAIL');
      assert.equal(parts[1], '2', 'Deuxieme segment = numero de gate');
      assert.ok(parts[2].length > 0, 'Troisieme segment = erreurs non-vide');
      assert.equal(parts[3], '3', 'Quatrieme segment = nombre de tentatives');
    } finally {
      if (backed) restoreFile(target);
    }
  });
});

// ============================================================
// 7. validate-structure.js : fix --gate4
// ============================================================
describe('validate-structure.js : flag --gate4', () => {

  it('sans --gate4, ne verifie PAS les tests co-localises', () => {
    const result = (() => {
      try {
        const stdout = execSync('node tools/validate-structure.js', {
          encoding: 'utf-8', stdio: 'pipe', timeout: 10000
        });
        return { exitCode: 0, stdout };
      } catch (e) {
        return { exitCode: e.status, stdout: e.stdout || '' };
      }
    })();
    // Ne doit PAS mentionner __tests__ ni "Tests manquants"
    assert.ok(
      !result.stdout.includes('Tests manquants'),
      'Sans --gate4, ne doit pas verifier les tests'
    );
  });

  it('avec --gate4, verifie les tests co-localises (*.test.*)', () => {
    const result = (() => {
      try {
        const stdout = execSync('node tools/validate-structure.js --gate4', {
          encoding: 'utf-8', stdio: 'pipe', timeout: 10000
        });
        return { exitCode: 0, stdout };
      } catch (e) {
        return { exitCode: e.status, stdout: e.stdout || '' };
      }
    })();
    // Doit mentionner la verification des tests
    assert.ok(
      result.stdout.includes('tests co-localisés'),
      'Avec --gate4, doit verifier les tests co-localises'
    );
  });

  it('avec --gate4, detecte les fichiers *.test.* (pas les dossiers __tests__)', () => {
    const result = (() => {
      try {
        const stdout = execSync('node tools/validate-structure.js --gate4', {
          encoding: 'utf-8', stdio: 'pipe', timeout: 10000
        });
        return { exitCode: 0, stdout };
      } catch (e) {
        return { exitCode: e.status, stdout: e.stdout || '' };
      }
    })();
    // Doit passer (les .test.ts existent dans src/)
    assert.equal(result.exitCode, 0, 'Doit passer car les *.test.* existent');
    // Ne doit PAS exiger __tests__
    assert.ok(
      !result.stdout.includes('__tests__'),
      'Ne doit pas exiger de dossiers __tests__'
    );
  });
});

// ============================================================
// 8. Coherence JSON mode silencieux
// ============================================================
describe('gate-check --json : mode silencieux', () => {

  it('JSON PASS ne contient pas de logs humains sur stdout', () => {
    const result = runGate(1, { json: true });
    const lines = result.stdout.trim().split('\n');
    // En mode JSON, stdout ne doit contenir QUE le JSON (1 ligne)
    assert.equal(lines.length, 1, 'stdout doit contenir exactement 1 ligne (le JSON)');
    // La ligne doit etre du JSON valide
    assert.doesNotThrow(() => JSON.parse(lines[0]), 'La ligne doit etre du JSON valide');
  });

  it('JSON FAIL ne contient pas de logs humains sur stdout', () => {
    const target = 'docs/specs/api.md';
    const backed = backupFile(target);
    try {
      removeFile(target);
      const result = runGate(2, { json: true });
      const lines = result.stdout.trim().split('\n');
      assert.equal(lines.length, 1, 'stdout doit contenir exactement 1 ligne (le JSON)');
      assert.doesNotThrow(() => JSON.parse(lines[0]), 'La ligne doit etre du JSON valide');
    } finally {
      if (backed) restoreFile(target);
    }
  });
});
