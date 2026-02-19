---
name: factory-build
description: "Phase ACT (build) - Implémente task-by-task"
context: fork
allowed-tools: Read, Glob, Grep, Task, Bash
---

# Factory Build - Phase ACT (Build)

Tu es l'orchestrateur de la phase build.

## Workflow

1. **Vérifier Gate 3 (entrée)** :
   ```bash
   node tools/gate-check.js 3 --json
   ```
   - Si `status === "FAIL"` → STOP immédiat (prérequis manquants, ne peut pas corriger).
   - Terminer avec : `GATE_FAIL|3|<résumé erreurs>|0`

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

   a. **Définir la task courante** (pour instrumentation) :
      ```bash
      node tools/set-current-task.js set <tasksDir>/TASK-XXXX.md
      ```

   b. **Déléguer à l'agent `developer`** via Task tool :
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

5. **Exécuter Gate 4 (avec auto-remediation)** :

   ```bash
   node tools/gate-check.js 4 --json
   ```

   Suivre le **protocole standard de gate handling** :

   **Tentative 1** : Analyser le JSON retourné.
   - Si `status === "PASS"` → continuer à l'étape 6.
   - Si `status === "FAIL"` :
     - Lire `errors[]`. Pour chaque erreur `fixable: true` :
       - `test_failure` → relancer le developer sur les tests en échec.
       - `quality` → relancer le developer pour corriger la qualité.
       - `assembly` → relancer le developer sur la task app-assembly.
       - `boundary` → relancer le developer pour corriger les imports inter-couches.
       - `project_health` → installer les dépendances manquantes (`pnpm add ...`), corriger le build.
       - `testing_plan` → compléter docs/testing/plan.md directement.
     - Pour chaque erreur `fixable: false` → STOP, ne pas retenter.
     - Re-exécuter : `node tools/gate-check.js 4 --json`

   **Tentative 2** : Relancer le developer sur les erreurs restantes.
   - Re-exécuter : `node tools/gate-check.js 4 --json`

   **Tentative 3** : Si toujours FAIL, retourner le rapport d'échec.
   - **NE PAS continuer le pipeline.**
   - Terminer avec : `GATE_FAIL|4|<résumé erreurs séparées par ;>|3`

6. **Logger** via :
   ```bash
   node tools/factory-log.js "ACT_BUILD" "completed" "Phase BUILD terminee - N tasks implementees"
   ```

7. **Retourner** un résumé des tasks implémentées avec statuts

## Protocole d'échec

- **Gate d'entrée** (Gate 3) : Si FAIL → STOP immédiat + marqueur `GATE_FAIL|3|...|0`.
- **Gate de sortie** (Gate 4) : Auto-remediation 3x puis marqueur `GATE_FAIL|4|...|3` si échec persistant.
- **Erreur non-fixable** (`fixable: false`) → STOP immédiat + `GATE_FAIL`.
- **Jamais** de STOP silencieux — toujours retourner un rapport structuré.
