---
name: factory-build
description: "Phase ACT (build) - Implémente task-by-task"
context: fork
allowed-tools: Read, Glob, Grep, Task, Bash
---

# Factory Build - Phase ACT (Build)

Tu es l'orchestrateur de la phase build.

## Workflow

0. **Instrumentation** (si activée) - Enregistrer le début de phase :
   ```bash
   node tools/instrumentation/collector.js phase-start "{\"phase\":\"ACT\",\"skill\":\"factory-build\"}"
   node tools/instrumentation/collector.js skill "{\"skill\":\"factory-build\"}"
   ```

1. **Vérifier Gate 3** : `node tools/gate-check.js 3`

2. **Obtenir le répertoire planning actif** :
   ```bash
   node tools/get-planning-version.js
   # Retourne: { "tasksDir": "docs/planning/v1/tasks", ... }
   ```

3. **Lister les tasks** : Glob `<tasksDir>/TASK-*.md`
   - **OBLIGATOIRE** : Trier par numéro (TASK-0001 avant TASK-0002, etc.)
   - Utiliser tri numérique : extraire le numéro XXXX et trier par valeur entière
   - Exemple ordre correct : TASK-0001, TASK-0002, TASK-0010, TASK-0100
   - Exemple ordre INCORRECT : TASK-0001, TASK-0010, TASK-0002 (tri alphabétique)

4. **Pour chaque TASK** (dans l'ordre numérique strict, **UNE À LA FOIS**) :
   > ⚠️ **SÉQUENTIEL OBLIGATOIRE** : Exécuter UN SEUL Task à la fois. Attendre sa completion avant le suivant.

   a. **Définir la task courante** (pour anti-dérive automatique) :
      ```bash
      node tools/set-current-task.js set <tasksDir>/TASK-XXXX.md
      ```

   b. **Déléguer à l'agent `developer`** via Task tool :
      ```bash
      # Instrumentation (si activée)
      node tools/instrumentation/collector.js agent "{\"agent\":\"developer\",\"source\":\"factory-build\"}"
      ```
      ```
      Task(
        subagent_type: "developer",
        prompt: "Implémente la task <tasksDir>/TASK-XXXX.md",
        description: "Developer - TASK-XXXX"
      )
      ```

   c. **Vérifier la DoD** de la task (lire le fichier task et vérifier chaque critère)

   d. **Effacer la task courante** :
      ```bash
      node tools/set-current-task.js clear
      ```

   e. **Logger** via :
      ```bash
      node tools/factory-log.js "ACT-BUILD" "task-done" "TASK-XXXX implémentée"
      ```

5. **Exécuter Gate 4** : `node tools/gate-check.js 4`

6. **Logger** via :
   ```bash
   node tools/factory-log.js "ACT" "completed" "Phase BUILD terminee - N tasks implementees"
   ```

7. **Retourner** un résumé des tasks implémentées avec statuts

## Règle anti-dérive

Si l'agent `developer` tente de modifier des fichiers hors scope → STOP immédiat et rapport.

## En cas d'échec

Si Gate 4 échoue → STOP et rapport des tests/fichiers manquants.
