#!/usr/bin/env node
/**
 * Validate Requirements - Vérifie que toutes les sections de requirements.md sont remplies
 * Usage: node tools/validate-requirements.js [path]
 *
 * Exit codes:
 *   0 = OK (toutes sections valides)
 *   1 = Fichier non trouvé
 *   2 = Sections manquantes ou vides (bloquant)
 */

import fs from 'fs';
import path from 'path';

const DEFAULT_PATH = 'input/requirements.md';

// Sections obligatoires avec leurs titres attendus
const REQUIRED_SECTIONS = [
  { num: 1, title: 'Contexte & Problème', pattern: /^##\s*1\.\s*Contexte\s*[&e]\s*Probl[èe]me/im },
  { num: 2, title: 'Objectifs métier', pattern: /^##\s*2\.\s*Objectifs\s*m[ée]tier/im },
  { num: 3, title: 'Utilisateurs / Personas', pattern: /^##\s*3\.\s*Utilisateurs/im },
  { num: 4, title: 'Parcours utilisateurs', pattern: /^##\s*4\.\s*Parcours\s*utilisateurs/im },
  { num: 5, title: 'Fonctionnalités attendues', pattern: /^##\s*5\.\s*Fonctionnalit[ée]s\s*attendues/im },
  { num: 6, title: 'Données manipulées', pattern: /^##\s*6\.\s*Donn[ée]es\s*manipul[ée]es/im },
  { num: 7, title: 'Contraintes non-fonctionnelles', pattern: /^##\s*7\.\s*Contraintes\s*non-fonctionnelles/im },
  { num: 8, title: 'Hors-scope explicite', pattern: /^##\s*8\.\s*Hors-scope/im },
  { num: 9, title: 'Critères d\'acceptation', pattern: /^##\s*9\.\s*Crit[èe]res\s*d'acceptation/im },
  { num: 10, title: 'Intégrations externes', pattern: /^##\s*10\.\s*Int[ée]grations\s*externes/im },
  { num: 11, title: 'Stack / Préférences techniques', pattern: /^##\s*11\.\s*Stack/im },
  { num: 12, title: 'Qualité attendue', pattern: /^##\s*12\.\s*Qualit[ée]\s*attendue/im }
];

// Contenu considéré comme "vide" (placeholders du template)
const EMPTY_PATTERNS = [
  /^<!--.*-->$/,           // Commentaires HTML seuls
  /^\s*$/,                 // Lignes vides
  /^1\.\s*$/,              // Numéros sans contenu
  /^2\.\s*$/,
  /^-\s*$/,                // Tirets sans contenu
];

/**
 * Extrait le contenu d'une section entre son titre et le titre suivant
 */
function extractSectionContent(content, sectionPattern, nextSectionPattern = null) {
  const match = content.match(sectionPattern);
  if (!match) return null;

  const startIndex = match.index + match[0].length;

  // Chercher la prochaine section ## ou la fin du fichier
  const remainingContent = content.substring(startIndex);
  const nextMatch = remainingContent.match(/^##\s*\d+\./m);

  const endIndex = nextMatch ? startIndex + nextMatch.index : content.length;
  const sectionContent = content.substring(startIndex, endIndex).trim();

  return sectionContent;
}

/**
 * Vérifie si le contenu d'une section est "vide" (template non rempli)
 */
function isSectionEmpty(sectionContent) {
  if (!sectionContent) return true;

  // Supprimer les commentaires HTML
  const withoutComments = sectionContent.replace(/<!--[\s\S]*?-->/g, '').trim();

  // Supprimer les lignes vides et les placeholders
  const lines = withoutComments.split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false;
      return !EMPTY_PATTERNS.some(pattern => pattern.test(line));
    });

  return lines.length === 0;
}

/**
 * Valide le fichier requirements.md
 */
function validate(filePath) {
  console.log(`\n🔍 Validation de ${filePath}\n`);

  // Vérifier existence du fichier
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}\n`);
    console.log('💡 Créez le fichier à partir du template:');
    console.log('   cp input/requirements.template.md input/requirements.md\n');
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  const errors = [];      // Sections manquantes
  const warnings = [];    // Sections vides
  const valid = [];       // Sections OK

  for (const section of REQUIRED_SECTIONS) {
    const sectionContent = extractSectionContent(content, section.pattern);

    if (sectionContent === null) {
      errors.push({
        num: section.num,
        title: section.title,
        issue: 'section manquante'
      });
    } else if (isSectionEmpty(sectionContent)) {
      errors.push({
        num: section.num,
        title: section.title,
        issue: 'section vide (contient uniquement le template)'
      });
    } else {
      valid.push({
        num: section.num,
        title: section.title
      });
    }
  }

  // Rapport
  if (valid.length > 0) {
    console.log(`✅ Sections valides (${valid.length}/${REQUIRED_SECTIONS.length}):`);
    valid.forEach(s => console.log(`   §${s.num} ${s.title}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log(`❌ Sections à compléter (${errors.length}):\n`);
    errors.forEach(e => {
      console.log(`   §${e.num} ${e.title}`);
      console.log(`      └─ ${e.issue}\n`);
    });

    console.log('━'.repeat(60));
    console.log('\n💡 ACTION REQUISE:\n');
    console.log('   Complétez les sections ci-dessus dans:');
    console.log(`   ${path.resolve(filePath)}\n`);
    console.log('   Puis relancez la commande.\n');

    process.exit(2);
  }

  console.log(`✅ requirements.md valide (${valid.length}/${REQUIRED_SECTIONS.length} sections)\n`);
  process.exit(0);
}

// Main
const filePath = process.argv[2] || DEFAULT_PATH;
validate(filePath);
