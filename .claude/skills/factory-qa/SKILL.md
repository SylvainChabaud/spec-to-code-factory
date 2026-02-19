---
name: factory-qa
description: "Phase DEBRIEF - Tests + QA + Release"
context: fork
allowed-tools: Read, Glob, Grep, Task, Bash
---

# Factory QA - Phase DEBRIEF

Tu es l'orchestrateur de la phase DEBRIEF.

> Cette phase DOIT produire **TOUS** les artefacts listés ci-dessous.
> La validation est assurée par Gate 5 (avec auto-remediation 3x).

## Artefacts obligatoires (TOUS requis)

| # | Artefact (V1) | Artefact (V2+) | Vérification |
|---|--------------|----------------|-------------|
| 1 | `docs/qa/report.md` | `docs/qa/report-vN.md` | Sections: `## Résumé exécutif`, `## Tests exécutés` |
| 2 | `docs/release/checklist.md` | `docs/release/checklist-vN.md` | Section: `## Pré-release` |
| 3 | `CHANGELOG.md` | `CHANGELOG.md` (prepend) | Section: "## [" (version entry) |
| 4 | `release/` (dossier) | `release/` (dossier) | Export via `node tools/export-release.js` |

## Workflow

1. **Vérifier Gate 4 (entrée)** :
   ```bash
   node tools/gate-check.js 4 --json
   ```
   - Si `status === "FAIL"` → STOP immédiat (prérequis manquants, ne peut pas corriger).
   - Terminer avec : `GATE_FAIL|4|<résumé erreurs>|0`

2. **Détecter la version** :
   ```bash
   node tools/get-planning-version.js
   # Retourne: { "version": N, ... }
   ```

3. **Déléguer à l'agent `qa`** via Task tool :
   - Si version = 1 (V1) :
     ```
     Task(
       subagent_type: "qa",
       prompt: "Tu DOIS produire EXACTEMENT 3 fichiers (TOUS obligatoires) :
       1. docs/qa/report.md - Rapport QA complet. Lis le template templates/qa/report-template.md d'abord.
          SECTIONS OBLIGATOIRES (exact match avec le template) : '## Résumé exécutif', '## Tests exécutés'
       2. docs/release/checklist.md - Checklist de release. Lis le template templates/release/checklist-template.md d'abord.
          SECTIONS OBLIGATOIRES (exact match avec le template) : '## Pré-release'
       3. CHANGELOG.md - Changelog. Lis le template templates/release/CHANGELOG-template.md d'abord.
          SECTION OBLIGATOIRE : '## [1.0.0]' (ou version appropriée)
       Lance les tests via 'npm test' et documente les résultats.
       NE RETOURNE PAS avant d'avoir créé les 3 fichiers.",
       description: "QA - Phase DEBRIEF"
     )
     ```
   - Si version > 1 (V2+, brownfield) :
     ```
     Task(
       subagent_type: "qa",
       prompt: "Tu DOIS produire EXACTEMENT 3 fichiers (TOUS obligatoires) :
       1. docs/qa/report-vN.md - Rapport QA version N. Lis le template templates/qa/report-template.md.
          SECTIONS OBLIGATOIRES (exact match avec le template) : '## Résumé exécutif', '## Tests exécutés'
       2. docs/release/checklist-vN.md - Checklist version N. Lis le template templates/release/checklist-template.md.
          SECTIONS OBLIGATOIRES (exact match avec le template) : '## Pré-release'
       3. CHANGELOG.md - Prepend la nouvelle version. Lis le fichier existant d'abord.
          SECTION OBLIGATOIRE : '## [N.0.0]' au-dessus des entrées existantes.
       N = version courante (utilise node tools/get-planning-version.js).
       NE RETOURNE PAS avant d'avoir créé les 3 fichiers.",
       description: "QA - Phase DEBRIEF (brownfield VN)"
     )
     ```

4. **Exporter le projet livrable** :
   ```bash
   node tools/export-release.js
   ```
   Cette commande:
   - Copie les fichiers du projet (hors infrastructure factory) vers `release/`
   - Genere un README.md enrichi depuis les specs
   - Cree un manifest de traçabilite (`docs/factory/release-manifest.json`)

5. **Exécuter Gate 5 (avec auto-remediation)** :

   ```bash
   node tools/gate-check.js 5 --json
   ```

   Suivre le **protocole standard de gate handling** :

   **Tentative 1** : Analyser le JSON retourné.
   - Si `status === "PASS"` → continuer à l'étape 6.
   - Si `status === "FAIL"` :
     - Lire `errors[]`. Pour chaque erreur `fixable: true` :
       - `missing_file` / `missing_section` → relancer l'agent QA avec prompt ciblé sur les fichiers manquants.
       - `test_execution` → relancer les tests et documenter les résultats.
       - `export` → relancer `node tools/export-release.js`.
     - Re-exécuter : `node tools/gate-check.js 5 --json`

   **Tentative 2** : Relancer l'agent QA complet.
   - Re-exécuter : `node tools/gate-check.js 5 --json`

   **Tentative 3** : Si toujours FAIL, retourner le rapport d'échec.
   - **NE PAS continuer le pipeline.**
   - Terminer avec : `GATE_FAIL|5|<résumé erreurs séparées par ;>|3`

6. **Logger** via :
   ```bash
   node tools/factory-log.js "DEBRIEF" "completed" "Phase QA terminée"
   ```

7. **Retourner** le rapport final de release avec :
   - Résultat des tests
   - Couverture
   - Issues détectées
   - Checklist release validée

## Protocole d'échec

- **Gate d'entrée** (Gate 4) : Si FAIL → STOP immédiat + marqueur `GATE_FAIL|4|...|0`.
- **Gate de sortie** (Gate 5) : Auto-remediation 3x puis marqueur `GATE_FAIL|5|...|3` si échec persistant.
- **Jamais** de STOP silencieux — toujours retourner un rapport structuré.
