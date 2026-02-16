#!/usr/bin/env node
/**
 * Factory State Reader
 * Lit l'etat du pipeline depuis docs/factory/state.json
 * Utilise par tous les tools (gate-check, validate-*, factory-reset, etc.)
 */

import fs from 'fs';
import path from 'path';

export const STATE_FILE = 'docs/factory/state.json';
const STATE_DIR = path.dirname(STATE_FILE);

// Cache to avoid multiple loads
let _cachedState = null;

const DEFAULT_STATE = {
  evolutionVersion: 1,
  evolutionMode: 'greenfield',
  phase: null,
  counters: {
    epic: 0,
    us: 0,
    task: 0,
    adr: 0
  },
  pipeline: { status: 'pending', startedAt: null, completedAt: null, currentPhase: null },
  phases: {
    break: { status: 'pending', startedAt: null, completedAt: null },
    model: { status: 'pending', startedAt: null, completedAt: null },
    plan: { status: 'pending', startedAt: null, completedAt: null },
    build: { status: 'pending', startedAt: null, completedAt: null },
    debrief: { status: 'pending', startedAt: null, completedAt: null }
  },
  gates: {
    0: { status: 'pending', checkedAt: null, errors: [] },
    1: { status: 'pending', checkedAt: null, errors: [] },
    2: { status: 'pending', checkedAt: null, errors: [] },
    3: { status: 'pending', checkedAt: null, errors: [] },
    4: { status: 'pending', checkedAt: null, errors: [] },
    5: { status: 'pending', checkedAt: null, errors: [] }
  },
  tasks: { total: 0, completed: 0, current: null, items: {} }
};

/**
 * Charge l'etat du pipeline
 * @param {boolean} useCache - Utiliser le cache (default: true)
 * @returns {object} Etat du pipeline
 */
export function loadState(useCache = true) {
  if (useCache && _cachedState) {
    return _cachedState;
  }

  if (!fs.existsSync(STATE_FILE)) {
    return DEFAULT_STATE;
  }

  try {
    const content = fs.readFileSync(STATE_FILE, 'utf-8');
    _cachedState = JSON.parse(content);
    return _cachedState;
  } catch (e) {
    return DEFAULT_STATE;
  }
}

/**
 * Sauvegarde l'etat du pipeline
 * @param {object} state - Etat a sauvegarder
 */
export function saveState(state) {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  _cachedState = state;
}

/**
 * Retourne la version d'evolution courante
 * @returns {number} Version (1, 2, 3...)
 */
export function getEvolutionVersion() {
  const state = loadState();
  return state.evolutionVersion || 1;
}

/**
 * Retourne le mode d'evolution courant
 * @returns {string} Mode ('greenfield' ou 'brownfield')
 */
export function getEvolutionMode() {
  const state = loadState();
  return state.evolutionMode || 'greenfield';
}

/**
 * Retourne le chemin du dossier planning versionne
 * @returns {string} Chemin (ex: docs/planning/v1)
 */
export function getPlanningDir() {
  const version = getEvolutionVersion();
  return `docs/planning/v${version}`;
}

/**
 * Retourne le chemin du dossier tasks versionne
 * @returns {string} Chemin (ex: docs/planning/v1/tasks)
 */
export function getTasksDir() {
  return `${getPlanningDir()}/tasks`;
}

/**
 * Retourne le chemin du dossier US versionne
 * @returns {string} Chemin (ex: docs/planning/v1/us)
 */
export function getUSDir() {
  return `${getPlanningDir()}/us`;
}

/**
 * Invalide le cache (pour forcer un rechargement)
 */
export function invalidateCache() {
  _cachedState = null;
}

// CLI mode
if (process.argv[1]?.endsWith('factory-state.js')) {
  const cmd = process.argv[2];

  switch (cmd) {
    case 'version':
      console.log(getEvolutionVersion());
      break;
    case 'planning-dir':
      console.log(getPlanningDir());
      break;
    case 'tasks-dir':
      console.log(getTasksDir());
      break;
    case 'us-dir':
      console.log(getUSDir());
      break;
    case 'get':
      console.log(JSON.stringify(loadState(), null, 2));
      break;
    default:
      console.log('Usage: node tools/lib/factory-state.js <version|planning-dir|tasks-dir|us-dir|get>');
  }
}
