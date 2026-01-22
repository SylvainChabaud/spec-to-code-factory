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

/**
 * Namespace claude avec env chargé depuis .claude/settings.json
 */
export const claude = {
  env: {}
};

// Charger les variables au démarrage
(function loadEnv() {
  if (!fs.existsSync(SETTINGS_PATH)) return;

  try {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    claude.env = { ...settings.env };
  } catch (e) {
    // Silent fail
  }
})();

/**
 * Check if instrumentation is enabled
 * @returns {boolean}
 */
export function isEnabled() {
  return claude.env.FACTORY_INSTRUMENTATION === 'true';
}
