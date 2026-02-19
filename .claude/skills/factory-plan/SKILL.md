---
name: factory-plan
description: "Phase ACT (planning) - Génère epics/US/tasks"
context: fork
allowed-tools: Read, Glob, Grep, Task, Bash
---

# Factory Plan - Phase ACT (Planning)

Tu es l'orchestrateur de la phase planning.

## Workflow

0. **Obtenir la version** :
   ```bash
   # Obtenir la version courante
   node tools/get-planning-version.js
   # Retourne: { "dir": "docs/planning/vN", "version": N, ... }

   # Creer le repertoire si necessaire (evolution)
   mkdir -p docs/planning/v<N>/us
   mkdir -p docs/planning/v<N>/tasks
   ```

1. **Verifier Gate 2 (entrée)** :
   ```bash
   node tools/gate-check.js 2 --json
   ```
   - Si `status === "FAIL"` → STOP immédiat (prérequis manquants, ne peut pas corriger).
   - Terminer avec : `GATE_FAIL|2|<résumé erreurs>|0`

2. **Déléguer à l'agent `scrum-master`** via Task tool :
   ```bash
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

3. **Exécuter Gate 3 (avec auto-remediation)** :

   ```bash
   node tools/gate-check.js 3 --json
   ```

   Suivre le **protocole standard de gate handling** :

   **Tentative 1** : Analyser le JSON retourné.
   - Si `status === "PASS"` → continuer à l'étape 4.
   - Si `status === "FAIL"` :
     - Lire `errors[]`. Pour chaque erreur `fixable: true` :
       - `missing_file` / `missing_pattern` → relancer le scrum-master avec prompt ciblé.
       - `task_incomplete` → relancer le scrum-master pour compléter les DoD/Tests.
       - `task_references` → corriger les références US directement dans les fichiers task.
     - Re-exécuter : `node tools/gate-check.js 3 --json`

   **Tentative 2** : Relancer le scrum-master complet.
   - Re-exécuter : `node tools/gate-check.js 3 --json`

   **Tentative 3** : Si toujours FAIL, retourner le rapport d'échec.
   - **NE PAS continuer le pipeline.**
   - Terminer avec : `GATE_FAIL|3|<résumé erreurs séparées par ;>|3`

4. **Logger** via :
   ```bash
   node tools/factory-log.js "ACT_PLAN" "completed" "Phase planning terminee"
   ```

5. **Retourner** un résumé avec liste des tasks créées (numérotées)

## Protocole d'échec

- **Gate d'entrée** (Gate 2) : Si FAIL → STOP immédiat + marqueur `GATE_FAIL|2|...|0`.
- **Gate de sortie** (Gate 3) : Auto-remediation 3x puis marqueur `GATE_FAIL|3|...|3` si échec persistant.
- **Jamais** de STOP silencieux — toujours retourner un rapport structuré.
