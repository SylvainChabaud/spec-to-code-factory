/**
 * Configuration centralisée Factory
 *
 * Usage:
 *   import { claude, isEnabled } from './config.js';
 *
 *   claude.env.FACTORY_INSTRUMENTATION  // 'true' ou 'false'
 *   isEnabled()                          // boolean
 *
 * Configuration: .claude/settings.json > "env"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SETTINGS_PATH = path.join(PROJECT_ROOT, '.claude', 'settings.json');
const SETTINGS_LOCAL_PATH = path.join(PROJECT_ROOT, '.claude', 'settings.local.json');

/**
 * Namespace claude avec env chargé depuis .claude/settings.json et settings.local.json
 */
export const claude = {
  env: {}
};

// Charger les variables au démarrage (settings.json puis settings.local.json override)
(function loadEnv() {
  // Load settings.json (base)
  if (fs.existsSync(SETTINGS_PATH)) {
    try {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
      claude.env = { ...settings.env };
    } catch (e) { /* Silent fail */ }
  }

  // Load settings.local.json (override)
  if (fs.existsSync(SETTINGS_LOCAL_PATH)) {
    try {
      const local = JSON.parse(fs.readFileSync(SETTINGS_LOCAL_PATH, 'utf-8'));
      if (local.env) {
        claude.env = { ...claude.env, ...local.env };
      }
    } catch (e) { /* Silent fail */ }
  }
})();

/**
 * Check if instrumentation is enabled
 * @returns {boolean}
 */
export function isEnabled() {
  return claude.env.FACTORY_INSTRUMENTATION === 'true';
}
