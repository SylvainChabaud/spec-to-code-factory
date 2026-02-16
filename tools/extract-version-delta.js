#!/usr/bin/env node
/**
 * Extract Version Delta — Extrait les ajouts/modifications d'une version donnée depuis les specs
 *
 * Scan les fichiers spec (system.md, domain.md, api.md) et les fichiers BREAK (brief.md, scope.md, acceptance.md)
 * pour extraire uniquement les lignes taguées avec une version spécifique.
 *
 * Deux modes de détection :
 *   1. Marqueurs de bloc : <!-- VN:START --> ... <!-- VN:END --> (recommandé pour V14+)
 *   2. Annotations inline : (VN), **VN**, V9 : ..., SUPPRIME VN, MODIFIE VN, "En VN,"
 *      + Sections avec "VN" dans le heading (### UC-15 : ... (V13))
 *
 * Usage:
 *   node tools/extract-version-delta.js                    # Delta version courante, tous fichiers
 *   node tools/extract-version-delta.js --version 13       # Delta V13
 *   node tools/extract-version-delta.js --version 13 --file system  # Un seul fichier
 *   node tools/extract-version-delta.js --version 13 --file domain --file api
 *   node tools/extract-version-delta.js --version 13 --context 2    # +2 lignes contexte
 *   node tools/extract-version-delta.js --version 13 --output delta-v13.md  # Écrire dans un fichier
 *   node tools/extract-version-delta.js --version 13 --json          # Output JSON
 *   node tools/extract-version-delta.js --stats                      # Statistiques par version
 *
 * Exit codes:
 *   0 = Success
 *   1 = Error (file not found, invalid args)
 *   2 = No matches found
 */

import fs from 'fs';
import path from 'path';
import { getEvolutionVersion } from './lib/factory-state.js';

// --- Configuration ---

const SPEC_FILES = {
  system: 'docs/specs/system.md',
  domain: 'docs/specs/domain.md',
  api: 'docs/specs/api.md',
  brief: 'docs/brief.md',
  scope: 'docs/scope.md',
  acceptance: 'docs/acceptance.md'
};

const DEFAULT_CONTEXT_LINES = 1;

// --- Version patterns ---

/**
 * Crée les regex de détection pour une version donnée
 * @param {number} version - Numéro de version
 * @returns {Object} Patterns compilés
 */
function buildVersionPatterns(version) {
  const v = `V${version}`;
  const vEscaped = v.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');

  return {
    // Marqueurs de bloc (priorité haute)
    blockStart: new RegExp(`^\\s*<!--\\s*${vEscaped}:START\\s*-->`, 'i'),
    blockEnd: new RegExp(`^\\s*<!--\\s*${vEscaped}:END\\s*-->`, 'i'),

    // Annotations inline (détection souple)
    inline: [
      // (V13) — le plus courant
      new RegExp(`\\(${vEscaped}\\)`, 'i'),
      // **V13** ou **MODIFIE V13** ou **SUPPRIME V13**
      new RegExp(`\\*\\*(?:MODIFIE|SUPPRIME)?\\s*${vEscaped}\\*\\*`, 'i'),
      // SUPPRIME V13 ou MODIFIE V13 (sans bold)
      new RegExp(`(?:SUPPRIME|MODIFIE)\\s+${vEscaped}\\b`, 'i'),
      // "En V13," dans les blocs narratifs (Vue d'ensemble)
      new RegExp(`^En\\s+${vEscaped}[,\\s]`, 'i'),
      // Section heading : ### ... (V13) ou ### ... V13
      new RegExp(`^#{1,4}\\s+.*\\b${vEscaped}\\b`, 'i'),
      // Colonne de tableau avec juste VN comme tag de version
      new RegExp(`\\|[^|]*\\b${vEscaped}\\b[^|]*\\|`, 'i'),
      // ajout V13, depuis V13, modifie V13
      new RegExp(`(?:ajout|depuis|modifie|introduit|cree|supprime)\\s+${vEscaped}\\b`, 'i'),
      // V13 : description (début de ligne après tiret)
      new RegExp(`^\\s*-\\s+.*\\b${vEscaped}\\s*:`, 'i'),
    ],

    // Pattern pour le heading de section (capture le bloc complet)
    sectionHeading: new RegExp(`^(#{1,4})\\s+.*\\b${vEscaped}\\b`, 'i'),
  };
}

/**
 * Vérifie si une ligne est un heading markdown
 * @param {string} line
 * @returns {number|null} Niveau du heading (1-4) ou null
 */
function getHeadingLevel(line) {
  const match = line.match(/^(#{1,6})\s/);
  return match ? match[1].length : null;
}

// --- Extraction ---

/**
 * Extrait le delta d'une version depuis un fichier
 * @param {string} filePath - Chemin du fichier
 * @param {number} version - Numéro de version
 * @param {number} contextLines - Lignes de contexte avant/après
 * @returns {Object} { file, matches: [{lineNum, line, type, context}], blockMatches: [{startLine, endLine, lines}] }
 */
function extractDelta(filePath, version, contextLines = DEFAULT_CONTEXT_LINES) {
  if (!fs.existsSync(filePath)) {
    return { file: filePath, error: `File not found: ${filePath}`, matches: [], blockMatches: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const patterns = buildVersionPatterns(version);

  const matches = [];
  const blockMatches = [];
  const matchedLineNums = new Set();

  // Pass 1: Marqueurs de bloc <!-- VN:START --> ... <!-- VN:END -->
  let inBlock = false;
  let blockStartLine = -1;
  let blockLines = [];

  for (let i = 0; i < lines.length; i++) {
    if (patterns.blockStart.test(lines[i])) {
      inBlock = true;
      blockStartLine = i + 1; // 1-based
      blockLines = [];
      continue;
    }
    if (inBlock && patterns.blockEnd.test(lines[i])) {
      blockMatches.push({
        startLine: blockStartLine,
        endLine: i + 1,
        lines: blockLines,
        type: 'block'
      });
      for (let j = blockStartLine - 1; j < i; j++) {
        matchedLineNums.add(j);
      }
      inBlock = false;
      blockStartLine = -1;
      blockLines = [];
      continue;
    }
    if (inBlock) {
      blockLines.push(lines[i]);
    }
  }

  // Warn about unclosed blocks
  if (inBlock) {
    blockMatches.push({
      startLine: blockStartLine,
      endLine: lines.length,
      lines: blockLines,
      type: 'block-unclosed',
      warning: `Unclosed block marker at line ${blockStartLine}`
    });
  }

  // Pass 2: Annotations inline (skip lines already in blocks)
  for (let i = 0; i < lines.length; i++) {
    if (matchedLineNums.has(i)) continue;

    const line = lines[i];
    let matched = false;
    let matchType = 'inline';

    for (const pattern of patterns.inline) {
      if (pattern.test(line)) {
        matched = true;
        // Déterminer le type plus précis
        if (/SUPPRIME/i.test(line)) matchType = 'supprime';
        else if (/MODIFIE/i.test(line)) matchType = 'modifie';
        else if (/^En\s+V/i.test(line)) matchType = 'narrative';
        else if (/^#{1,4}\s/.test(line)) matchType = 'section-heading';
        break;
      }
    }

    if (matched) {
      // Collecter le contexte
      const contextBefore = [];
      const contextAfter = [];

      for (let j = Math.max(0, i - contextLines); j < i; j++) {
        contextBefore.push(lines[j]);
      }
      for (let j = i + 1; j <= Math.min(lines.length - 1, i + contextLines); j++) {
        contextAfter.push(lines[j]);
      }

      // Si c'est un heading de section, capturer le contenu de la section
      let sectionContent = null;
      const headingLevel = getHeadingLevel(line);
      if (matchType === 'section-heading' && headingLevel) {
        sectionContent = [];
        for (let j = i + 1; j < lines.length; j++) {
          const nextLevel = getHeadingLevel(lines[j]);
          if (nextLevel !== null && nextLevel <= headingLevel) break;
          sectionContent.push(lines[j]);
        }
      }

      matches.push({
        lineNum: i + 1, // 1-based
        line: line,
        type: matchType,
        contextBefore,
        contextAfter,
        sectionContent
      });

      matchedLineNums.add(i);
    }
  }

  return { file: filePath, matches, blockMatches };
}

// --- Statistics ---

/**
 * Calcule les statistiques de versions pour un fichier
 * @param {string} filePath - Chemin du fichier
 * @returns {Object} { file, versions: { V1: count, V2: count, ... }, total, totalLines }
 */
function computeStats(filePath) {
  if (!fs.existsSync(filePath)) {
    return { file: filePath, error: `File not found`, versions: {}, total: 0, totalLines: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const versions = {};

  // Détection de V1 à V99
  for (let v = 1; v <= 99; v++) {
    const patterns = buildVersionPatterns(v);
    let count = 0;

    for (const line of lines) {
      for (const pattern of patterns.inline) {
        if (pattern.test(line)) {
          count++;
          break; // Une seule correspondance par ligne
        }
      }

      // Aussi compter les marqueurs de bloc
      if (patterns.blockStart.test(line)) count++;
    }

    if (count > 0) {
      versions[`V${v}`] = count;
    }
  }

  return {
    file: filePath,
    versions,
    total: Object.values(versions).reduce((a, b) => a + b, 0),
    totalLines: lines.length,
    sizeKo: Math.round(Buffer.byteLength(content, 'utf-8') / 1024)
  };
}

// --- Formatting ---

/**
 * Formate un résultat delta en markdown
 * @param {Object} result - Résultat de extractDelta
 * @param {number} version
 * @returns {string} Markdown formaté
 */
function formatMarkdown(result, version) {
  const parts = [];
  const fileName = path.basename(result.file);

  if (result.error) {
    parts.push(`### ⚠️ ${fileName}\n\n${result.error}\n`);
    return parts.join('\n');
  }

  const totalMatches = result.matches.length + result.blockMatches.length;
  if (totalMatches === 0) {
    parts.push(`### ${fileName} — aucun delta V${version}\n`);
    return parts.join('\n');
  }

  parts.push(`### ${fileName} — ${totalMatches} correspondance(s) V${version}\n`);

  // Bloc matches d'abord
  for (const block of result.blockMatches) {
    parts.push(`#### 📦 Bloc V${version} (lignes ${block.startLine}–${block.endLine})\n`);
    if (block.warning) {
      parts.push(`> ⚠️ ${block.warning}\n`);
    }
    parts.push('```markdown');
    parts.push(block.lines.join('\n'));
    parts.push('```\n');
  }

  // Inline matches
  for (const match of result.matches) {
    const typeLabel = {
      'inline': '📌',
      'supprime': '🗑️',
      'modifie': '✏️',
      'narrative': '📝',
      'section-heading': '📑'
    }[match.type] || '📌';

    parts.push(`#### ${typeLabel} Ligne ${match.lineNum} (${match.type})\n`);

    // Contexte avant
    if (match.contextBefore.length > 0) {
      for (const ctx of match.contextBefore) {
        parts.push(`    ${ctx}`);
      }
    }

    // Ligne matchée (highlight)
    parts.push(`>>> ${match.line}`);

    // Contexte après
    if (match.contextAfter.length > 0) {
      for (const ctx of match.contextAfter) {
        parts.push(`    ${ctx}`);
      }
    }

    // Section content (si heading)
    if (match.sectionContent && match.sectionContent.length > 0) {
      const preview = match.sectionContent.slice(0, 15);
      parts.push('\n<details><summary>Contenu de la section (' + match.sectionContent.length + ' lignes)</summary>\n');
      parts.push('```markdown');
      parts.push(preview.join('\n'));
      if (match.sectionContent.length > 15) {
        parts.push(`\n... (+${match.sectionContent.length - 15} lignes)`);
      }
      parts.push('```');
      parts.push('</details>');
    }

    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Formate les statistiques en markdown
 * @param {Object[]} stats - Résultats de computeStats
 * @returns {string}
 */
function formatStats(stats) {
  const parts = [];
  parts.push('## 📊 Statistiques de versioning des specs\n');

  // Collecter toutes les versions
  const allVersions = new Set();
  for (const stat of stats) {
    if (stat.versions) {
      Object.keys(stat.versions).forEach(v => allVersions.add(v));
    }
  }
  const sortedVersions = [...allVersions].sort((a, b) => {
    const na = parseInt(a.substring(1));
    const nb = parseInt(b.substring(1));
    return na - nb;
  });

  // Tableau
  const header = `| Fichier | Lignes | Taille | ${sortedVersions.join(' | ')} | Total tags |`;
  const separator = `|---------|--------|--------|${sortedVersions.map(() => '---').join('|')}|------------|`;

  parts.push(header);
  parts.push(separator);

  let grandTotal = 0;
  for (const stat of stats) {
    if (stat.error) {
      parts.push(`| ${path.basename(stat.file)} | ⚠️ | — | ${sortedVersions.map(() => '—').join(' | ')} | — |`);
      continue;
    }

    const counts = sortedVersions.map(v => stat.versions[v] || '·');
    grandTotal += stat.total;
    parts.push(`| ${path.basename(stat.file)} | ${stat.totalLines} | ${stat.sizeKo} Ko | ${counts.join(' | ')} | ${stat.total} |`);
  }

  parts.push(`| **Total** | | | ${sortedVersions.map(() => '').join(' | ')} | **${grandTotal}** |`);
  parts.push('');

  // Résumé
  const totalSize = stats.reduce((sum, s) => sum + (s.sizeKo || 0), 0);
  const totalLines = stats.reduce((sum, s) => sum + (s.totalLines || 0), 0);
  parts.push(`**Total** : ${totalLines} lignes, ${totalSize} Ko, ${sortedVersions.length} versions détectées`);

  return parts.join('\n');
}

// --- CLI ---

function parseArgs(argv) {
  const args = {
    version: null,
    files: [],
    contextLines: DEFAULT_CONTEXT_LINES,
    output: null,
    json: false,
    stats: false,
    help: false
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--version':
      case '-v':
        args.version = parseInt(argv[++i], 10);
        break;
      case '--file':
      case '-f':
        args.files.push(argv[++i]);
        break;
      case '--context':
      case '-c':
        args.contextLines = parseInt(argv[++i], 10);
        break;
      case '--output':
      case '-o':
        args.output = argv[++i];
        break;
      case '--json':
        args.json = true;
        break;
      case '--stats':
        args.stats = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        // Argument positionnel = version
        if (!isNaN(parseInt(argv[i], 10)) && !args.version) {
          args.version = parseInt(argv[i], 10);
        }
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Extract Version Delta — Extrait les ajouts d'une version depuis les specs

Usage:
  node tools/extract-version-delta.js [options] [version]

Options:
  --version, -v <N>     Version à extraire (défaut: version courante)
  --file, -f <name>     Fichier(s) cible : system, domain, api, brief, scope, acceptance
                        (défaut: system + domain + api)
  --context, -c <N>     Lignes de contexte avant/après (défaut: ${DEFAULT_CONTEXT_LINES})
  --output, -o <file>   Écrire dans un fichier au lieu de stdout
  --json                Output au format JSON
  --stats               Statistiques de versioning (toutes versions, tous fichiers)
  --help, -h            Afficher cette aide

Exemples:
  node tools/extract-version-delta.js 13                    # Delta V13 (specs)
  node tools/extract-version-delta.js --stats               # Stats toutes versions
  node tools/extract-version-delta.js -v 13 -f domain       # Delta V13 domain seul
  node tools/extract-version-delta.js -v 13 -o delta.md     # Écrire dans un fichier
  node tools/extract-version-delta.js -v 13 --json          # Output JSON

Détection supportée:
  <!-- V13:START --> / <!-- V13:END -->   Marqueurs de bloc (recommandé V14+)
  (V13)                                   Annotation inline parenthèses
  **MODIFIE V13** / SUPPRIME V13          Modifications/Suppressions
  En V13, ...                             Bloc narratif (Vue d'ensemble)
  ### UC-15 : ... (V13)                   Section heading versionné
`);
}

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Mode stats
  if (args.stats) {
    const fileKeys = args.files.length > 0 ? args.files : Object.keys(SPEC_FILES);
    const stats = fileKeys.map(key => {
      const filePath = SPEC_FILES[key] || key;
      return computeStats(filePath);
    });

    if (args.json) {
      console.log(JSON.stringify(stats, null, 2));
    } else {
      const output = formatStats(stats);
      if (args.output) {
        fs.writeFileSync(args.output, output, 'utf-8');
        console.log(`✅ Statistiques écrites dans ${args.output}`);
      } else {
        console.log(output);
      }
    }
    process.exit(0);
  }

  // Mode delta
  const version = args.version || getEvolutionVersion();
  if (!version || isNaN(version)) {
    console.error('❌ Version invalide. Utiliser --version <N> ou avoir un state.json valide.');
    process.exit(1);
  }

  // Fichiers cibles (par défaut: specs seulement)
  const fileKeys = args.files.length > 0
    ? args.files
    : ['system', 'domain', 'api'];

  const results = [];
  for (const key of fileKeys) {
    const filePath = SPEC_FILES[key];
    if (!filePath) {
      console.error(`❌ Fichier inconnu: "${key}". Valeurs valides: ${Object.keys(SPEC_FILES).join(', ')}`);
      process.exit(1);
    }
    results.push(extractDelta(filePath, version, args.contextLines));
  }

  // Output
  if (args.json) {
    const jsonOutput = {
      version: `V${version}`,
      extractedAt: new Date().toISOString(),
      files: results.map(r => ({
        file: r.file,
        error: r.error || null,
        blockMatches: r.blockMatches.length,
        inlineMatches: r.matches.length,
        totalMatches: r.blockMatches.length + r.matches.length,
        blocks: r.blockMatches,
        inlines: r.matches.map(m => ({
          lineNum: m.lineNum,
          type: m.type,
          line: m.line,
          sectionLines: m.sectionContent ? m.sectionContent.length : 0
        }))
      }))
    };
    const out = JSON.stringify(jsonOutput, null, 2);
    if (args.output) {
      fs.writeFileSync(args.output, out, 'utf-8');
      console.log(`✅ Delta V${version} (JSON) écrit dans ${args.output}`);
    } else {
      console.log(out);
    }
  } else {
    const parts = [`# Delta V${version}\n`];
    parts.push(`> Extrait le ${new Date().toISOString().split('T')[0]}`);
    parts.push(`> Fichiers analysés : ${fileKeys.join(', ')}\n`);

    let totalMatches = 0;
    for (const result of results) {
      parts.push(formatMarkdown(result, version));
      totalMatches += result.matches.length + result.blockMatches.length;
    }

    // Résumé
    parts.push('---');
    parts.push(`\n**Total** : ${totalMatches} correspondance(s) trouvée(s) pour V${version}`);

    const output = parts.join('\n');

    if (args.output) {
      fs.writeFileSync(args.output, output, 'utf-8');
      console.log(`✅ Delta V${version} écrit dans ${args.output} (${totalMatches} correspondances)`);
    } else {
      console.log(output);
    }

    if (totalMatches === 0) {
      process.exit(2);
    }
  }

  process.exit(0);
}

main();
