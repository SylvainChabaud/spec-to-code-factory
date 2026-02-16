---
name: factory-plan
description: "Phase ACT (planning) - Génère epics/US/tasks"
context: fork
allowed-tools: Read, Glob, Grep, Task, Bash
---

# Factory Plan - Phase ACT (Planning)

Tu es l'orchestrateur de la phase planning.

## Workflow

0. **Instrumentation et version** - Enregistrer le debut de phase et obtenir la version :
   ```bash
   # Obtenir la version courante
   node tools/get-planning-version.js
   # Retourne: { "dir": "docs/planning/vN", "version": N, ... }

   # Creer le repertoire si necessaire (evolution)
   mkdir -p docs/planning/v<N>/us
   mkdir -p docs/planning/v<N>/tasks

   node tools/instrumentation/collector.js phase-start "{\"phase\":\"ACT\",\"skill\":\"factory-plan\"}"
   node tools/instrumentation/collector.js skill "{\"skill\":\"factory-plan\"}"
   ```

1. **Verifier Gate 2** : `node tools/gate-check.js 2`

2. **Déléguer à l'agent `scrum-master`** via Task tool :
   ```bash
   # Instrumentation (si activée)
   node tools/instrumentation/collector.js agent "{\"agent\":\"scrum-master\",\"source\":\"factory-plan\"}"

   # Pré-filtrage : lister uniquement les ADR actifs (exclut SUPERSEDED)
   node tools/list-active-adrs.js --summary
   # Retourne les paths des ADR actifs, à passer dans le prompt ci-dessous

   # Extraire le delta de la version courante (brownfield uniquement)
   node tools/extract-version-delta.js -f system -f domain -f api
   # Retourne les ajouts/modifications de la version courante — passer dans le prompt
   ```
   ```
   Task(
     subagent_type: "scrum-master",
     prompt: "Décompose les specs en epics/US/tasks.
     ADR ACTIFS : <liste des paths retournés par list-active-adrs.js --summary>
     DELTA VERSION COURANTE : <output de extract-version-delta.js ci-dessus>
     IMPORTANT : NE PAS charger les ADR au statut SUPERSEDED.

     IMPORTANT - Tasks auto-suffisantes (principe BMAD):
     Chaque TASK doit être 100% indépendante avec:
     - Template: templates/planning/task-template.md
     - Contexte complet: références specs avec résumés
     - Code existant pertinent: extraits avec lignes
     - Aucune dépendance à la task précédente

     Le développeur doit pouvoir implémenter la task
     SANS connaître les autres tasks.",
     description: "Scrum Master - Planning BMAD"
   )
   ```

3. **Verifier les outputs** (chemins versionnes) :
   - `docs/planning/v<N>/epics.md` existe
   - Au moins 1 fichier `docs/planning/v<N>/us/US-*.md`
   - Au moins 1 fichier `docs/planning/v<N>/tasks/TASK-*.md`
   - Chaque TASK contient TOUTES ces sections (auto-suffisance BMAD):
     * Objectif technique
     * Contexte complet (règles métier applicables, extraites des specs)
     * Fichiers concernes (liste exhaustive)
     * Definition of Done
     * Tests attendus
     * Criteres de validation automatique

4. **Exécuter Gate 3** : `node tools/gate-check.js 3`

5. **Logger** via :
   ```bash
   node tools/factory-log.js "ACT" "completed" "Phase planning terminee"
   ```

6. **Retourner** un résumé avec liste des tasks créées (numérotées)

## En cas d'échec

Si Gate 3 échoue → STOP et rapport des éléments manquants.
