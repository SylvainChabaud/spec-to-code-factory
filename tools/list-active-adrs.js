#!/usr/bin/env node
/**
 * List Active ADRs - Scanne les ADR, filtre par statut et version
 *
 * Usage:
 *   node tools/list-active-adrs.js              # ADR actifs (defaut)
 *   node tools/list-active-adrs.js --current    # ADR de la version courante
 *   node tools/list-active-adrs.js --all        # Tous (y compris superseded)
 *   node tools/list-active-adrs.js --superseded # Seulement les superseded
 *   node tools/list-active-adrs.js --summary    # Paths uniquement (compact)
 *
 * Exit codes:
 *   0 = Success
 *   1 = Error (no docs/adr/ directory)
 */

import fs from 'fs';
import path from 'path';
import { getEvolutionVersion } from './lib/factory-state.js';

const ADR_DIR = 'docs/adr';

/**
 * Parse le statut d'un ADR (tolerant aux variantes)
 * Variantes connues: "Accepte", "Accepted", "Accepte",
 *   "**SUPERSEDED** par [ADR-0010 ...]", "Superseded by ADR-0011 ..."
 */
function parseStatus(statusLine) {
  const lower = statusLine.toLowerCase().replace(/\*\*/g, '').trim();

  if (lower.includes('superseded') || lower.includes('remplace') || lower.includes('remplacé')) {
    const match = statusLine.match(/ADR-(\d{4})/);
    return {
      status: 'superseded',
      supersededBy: match ? `ADR-${match[1]}` : null
    };
  }
  if (lower.includes('deprec') || lower.includes('déprécié')) {
    return { status: 'deprecated', supersededBy: null };
  }
  if (lower.includes('propos') || lower.includes('proposed')) {
    return { status: 'proposed', supersededBy: null };
  }
  // Defaut: accepted (couvre "Accepte", "Accepted", "Accepte")
  return { status: 'accepted', supersededBy: null };
}

/**
 * Infere la version d'un ADR (backward-compatible)
 * Priorite: champ explicite > references > subtitle > fallback
 */
function inferVersion(lines, content) {
  // 1. Champ explicite ## Version
  const versionIdx = lines.findIndex(l => /^## Version/i.test(l));
  if (versionIdx >= 0) {
    for (let i = versionIdx + 1; i < Math.min(versionIdx + 5, lines.length); i++) {
      const match = lines[i].trim().match(/^V(\d+)/i);
      if (match) return `V${match[1]}`;
    }
  }

  // 2. Blockquote subtitle: "> ... (V9)" (lignes 1-5)
  for (const line of lines.slice(0, 6)) {
    const match = line.match(/^>\s+.*\(V(\d+)/);
    if (match) return `V${match[1]}`;
  }

  // 3. Section References: "Requirements V9" ou "requirements V9"
  const refMatch = content.match(/[Rr]equirements\s+V(\d+)/);
  if (refMatch) return `V${refMatch[1]}`;

  // 4. Fallback
  return 'unknown';
}

/**
 * Parse un fichier ADR complet
 */
function parseAdr(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // ID et titre: "# ADR-XXXX: Titre" ou "# ADR-XXXX — Titre"
  const titleMatch = lines[0]?.match(/^# (ADR-\d{4})[:\s—-]+(.+)/);
  const id = titleMatch ? titleMatch[1] : path.basename(filePath, '.md').match(/ADR-\d{4}/)?.[0] || '';
  const title = titleMatch ? titleMatch[2].trim() : '';

  // Statut (apres "## Statut")
  const statusIdx = lines.findIndex(l => /^## Statut/i.test(l));
  let statusLine = '';
  if (statusIdx >= 0) {
    for (let i = statusIdx + 1; i < Math.min(statusIdx + 5, lines.length); i++) {
      if (lines[i].trim().length > 0) {
        statusLine = lines[i].trim();
        break;
      }
    }
  }
  const { status, supersededBy } = parseStatus(statusLine);

  // Date (apres "## Date")
  const dateIdx = lines.findIndex(l => /^## Date/i.test(l));
  let date = '';
  if (dateIdx >= 0) {
    for (let i = dateIdx + 1; i < Math.min(dateIdx + 5, lines.length); i++) {
      if (lines[i].trim().match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = lines[i].trim();
        break;
      }
    }
  }

  // Version
  const version = inferVersion(lines, content);

  return {
    id,
    file: filePath,
    title,
    status,
    version,
    date,
    lines: lines.length,
    supersededBy
  };
}

/**
 * Scanne tous les ADR et retourne le resultat filtre
 */
function listAdrs(mode) {
  if (!fs.existsSync(ADR_DIR)) {
    console.error(JSON.stringify({ error: `Directory not found: ${ADR_DIR}` }));
    process.exit(1);
  }

  const files = fs.readdirSync(ADR_DIR)
    .filter(f => /^ADR-\d{4}.*\.md$/.test(f))
    .sort()
    .map(f => path.join(ADR_DIR, f));

  const adrs = files.map(f => parseAdr(f));
  const active = adrs.filter(a => a.status === 'accepted' || a.status === 'proposed');
  const superseded = adrs.filter(a => a.status === 'superseded' || a.status === 'deprecated');

  const currentVersion = getEvolutionVersion();

  const result = {
    totalCount: adrs.length,
    activeCount: active.length,
    supersededCount: superseded.length,
    currentVersion
  };

  switch (mode) {
    case 'all':
      result.active = active;
      result.superseded = superseded;
      break;
    case 'superseded':
      result.superseded = superseded;
      break;
    case 'current':
      result.active = active.filter(a => a.version === `V${currentVersion}`);
      result.activeCount = result.active.length;
      break;
    case 'summary':
      result.active = active.map(a => a.file);
      break;
    default: // 'active' (defaut)
      result.active = active;
      break;
  }

  return result;
}

// Main
const arg = process.argv[2] || '';
let mode = 'active';

if (arg === '--current') mode = 'current';
else if (arg === '--all') mode = 'all';
else if (arg === '--superseded') mode = 'superseded';
else if (arg === '--summary') mode = 'summary';

const result = listAdrs(mode);
console.log(JSON.stringify(result, null, 2));
