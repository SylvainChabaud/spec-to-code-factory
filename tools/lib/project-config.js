#!/usr/bin/env node
/**
 * Project Config Reader
 * Lit la configuration projet depuis docs/factory/project-config.json
 * Utilisé par tous les tools de validation (gate-check, validate-*, etc.)
 */

import fs from 'fs';
import { loadState } from './factory-state.js';

const CONFIG_PATH = 'docs/factory/project-config.json';

// Cache to avoid multiple loads and repeated warnings
let _cachedProjectConfig = null;

const DEFAULT_CONFIG = {
  project: {
    name: 'Unknown',
    version: '1.0.0',
    type: 'web-spa'
  },
  architecture: {
    style: 'simple',
    layers: {}
  },
  paths: {
    // Fallback: chemins standards + Clean Architecture
    app: ['src/App.tsx', 'src/ui/App.tsx', 'src/main.tsx'],
    components: ['src/components/', 'src/ui/components/'],
    hooks: ['src/hooks/', 'src/application/'],
    constants: ['src/constants.ts', 'src/domain/constants.ts'],
    tests: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/']
  },
  validation: {
    appAssembly: {
      enabled: true,
      minLines: 10,
      minComponentCoverage: 0.5,
      minHookCoverage: 0.5
    },
    boundaries: {
      enabled: true
    },
    codeQuality: {
      testCoverage: 80,
      branchCoverage: 75,
      functionCoverage: 85,
      typescriptStrict: true,
      noMagicNumbers: true
    }
  }
};

/**
 * Charge la configuration projet
 * @returns {object} Configuration projet (merged avec defaults)
 */
export function loadProjectConfig() {
  // Return cached config if available
  if (_cachedProjectConfig) {
    return _cachedProjectConfig;
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    // Only warn if Gate 2 is already passed (config should exist after MODEL phase)
    const state = loadState(true);
    const gate2Passed = state.gates?.['2']?.status === 'PASS';
    if (gate2Passed) {
      console.warn(`⚠️  ${CONFIG_PATH} non trouve, utilisation des valeurs par defaut`);
    }
    _cachedProjectConfig = DEFAULT_CONFIG;
    return _cachedProjectConfig;
  }

  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content);

    // Deep merge avec defaults
    _cachedProjectConfig = deepMerge(DEFAULT_CONFIG, config);
    return _cachedProjectConfig;
  } catch (e) {
    console.error(`❌ Erreur lecture ${CONFIG_PATH}: ${e.message}`);
    _cachedProjectConfig = DEFAULT_CONFIG;
    return _cachedProjectConfig;
  }
}

/**
 * Trouve le chemin App.tsx depuis la config
 * @returns {string|null} Chemin vers App.tsx ou null si non trouve
 */
export function findAppPath() {
  const config = loadProjectConfig();
  const appPaths = Array.isArray(config.paths.app)
    ? config.paths.app
    : [config.paths.app];

  for (const p of appPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

/**
 * Trouve les chemins des composants depuis la config
 * @returns {string[]} Liste des chemins existants
 */
export function findComponentPaths() {
  const config = loadProjectConfig();
  const paths = Array.isArray(config.paths.components)
    ? config.paths.components
    : [config.paths.components];

  return paths.filter(p => fs.existsSync(p));
}

/**
 * Trouve les chemins des hooks depuis la config
 * @returns {string[]} Liste des chemins existants
 */
export function findHookPaths() {
  const config = loadProjectConfig();
  const paths = Array.isArray(config.paths.hooks)
    ? config.paths.hooks
    : [config.paths.hooks];

  return paths.filter(p => fs.existsSync(p));
}

/**
 * Invalide le cache pour forcer un rechargement
 */
export function invalidateProjectConfigCache() {
  _cachedProjectConfig = null;
}

/**
 * Retourne les seuils de validation
 * @returns {object} Seuils de validation
 */
export function getValidationThresholds() {
  const config = loadProjectConfig();
  return config.validation;
}

/**
 * Deep merge deux objets
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// CLI mode
if (process.argv[1]?.endsWith('project-config.js')) {
  const cmd = process.argv[2];

  switch (cmd) {
    case 'get':
      console.log(JSON.stringify(loadProjectConfig(), null, 2));
      break;
    case 'app':
      console.log(findAppPath() || 'Not found');
      break;
    case 'components':
      console.log(findComponentPaths().join('\n') || 'Not found');
      break;
    case 'hooks':
      console.log(findHookPaths().join('\n') || 'Not found');
      break;
    case 'thresholds':
      console.log(JSON.stringify(getValidationThresholds(), null, 2));
      break;
    default:
      console.log('Usage: node tools/lib/project-config.js <get|app|components|hooks|thresholds>');
  }
}
