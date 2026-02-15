---
name: factory-qa
description: "Phase DEBRIEF - Tests + QA + Release"
context: fork
allowed-tools: Read, Glob, Grep, Task, Bash
---

# Factory QA - Phase DEBRIEF

Tu es l'orchestrateur de la phase DEBRIEF.

## Workflow

0. **Instrumentation** (si activée) - Enregistrer le début de phase :
   ```bash
   node tools/instrumentation/collector.js phase-start "{\"phase\":\"DEBRIEF\",\"skill\":\"factory-qa\"}"
   node tools/instrumentation/collector.js skill "{\"skill\":\"factory-qa\"}"
   ```

1. **Vérifier Gate 4** : `node tools/gate-check.js 4`

2. **Détecter la version** :
   ```bash
   node tools/get-planning-version.js
   # Retourne: { "version": N, ... }
   ```

3. **Déléguer à l'agent `qa`** via Task tool :
   ```bash
   # Instrumentation (si activée)
   node tools/instrumentation/collector.js agent "{\"agent\":\"qa\",\"source\":\"factory-qa\"}"
   ```
   - Si version = 1 (V1) :
     ```
     Task(
       subagent_type: "qa",
       prompt: "Exécute les tests, génère docs/qa/report.md, docs/release/checklist.md et CHANGELOG.md",
       description: "QA - Phase DEBRIEF"
     )
     ```
   - Si version > 1 (V2+, brownfield) :
     ```
     Task(
       subagent_type: "qa",
       prompt: "Exécute les tests, génère docs/qa/report-vN.md, docs/release/checklist-vN.md et met à jour CHANGELOG.md (prepend). N = version courante.",
       description: "QA - Phase DEBRIEF (brownfield VN)"
     )
     ```

4. **Vérifier les outputs QA** :
   - V1 : `docs/qa/report.md` et `docs/release/checklist.md` existent
   - V2+ : `docs/qa/report-vN.md` et `docs/release/checklist-vN.md` existent
   - `CHANGELOG.md` existe et est à jour

5. **Exporter le projet livrable** :
   ```bash
   node tools/export-release.js
   ```
   Cette commande:
   - Copie les fichiers du projet (hors infrastructure factory) vers `release/`
   - Genere un README.md enrichi depuis les specs
   - Cree un manifest de traçabilite (`docs/factory/release-manifest.json`)

6. **Exécuter Gate 5** : `node tools/gate-check.js 5`

7. **Logger** via :
   ```bash
   node tools/factory-log.js "DEBRIEF" "completed" "Phase QA terminée"
   ```

8. **Retourner** le rapport final de release avec :
   - Résultat des tests
   - Couverture
   - Issues détectées
   - Checklist release validée

## Anti-dérive

Si des bugs critiques sont détectés → les documenter dans le rapport, NE PAS les corriger (sauf bloquants).

## En cas d'échec

Si Gate 5 échoue → STOP et rapport des éléments manquants.
