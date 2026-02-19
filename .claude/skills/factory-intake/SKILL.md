---
name: factory-intake
description: "Phase BREAK - Normalise les requirements en brief/scope/acceptance"
allowed-tools: Read, Glob, Grep, Task, Bash, AskUserQuestion
---

# Factory Intake - Phase BREAK

Tu es l'orchestrateur de la phase BREAK.

> **⚠️ Phase CRITIQUE** : Le cadrage du besoin détermine la qualité de tout le projet.
> L'interaction avec l'utilisateur pour clarifier les ambiguïtés est ESSENTIELLE.

## Workflow

0. **Lire le state** :
   ```bash
   node tools/factory-state.js get
   # Retourne: { "evolutionMode": "greenfield|brownfield", "evolutionVersion": N, "requirementsFile": "input/requirements-N.md", ... }
   ```
   Extraire : `evolutionMode`, `evolutionVersion`, `requirementsFile`.

1. **Verifier Gate 0 (entrée)** : Valider le fichier requirements
   ```bash
   node tools/gate-check.js 0 --json
   ```
   - Si `status === "FAIL"` → STOP immédiat (prérequis manquants, ne peut pas corriger).
   - Les erreurs de type `requirements` sont `fixable: false` — l'utilisateur DOIT compléter les sections.
   - Terminer avec : `GATE_FAIL|0|<résumé erreurs>|0`

2. **Informer l'utilisateur** :
   ```
   "Phase BREAK - Cadrage du besoin

   Je vais analyser vos requirements et vous poser des questions de clarification.
   Vos réponses seront stockées dans docs/factory/questions.md

   Vous pouvez répondre :
   - Directement dans le terminal (recommandé)
   - Ou en éditant docs/factory/questions.md puis relancer /factory-intake"
   ```

3a. **Phase ANALYSE** - Deleguer a l'agent `analyst` (analyse seule) :
   ```
   Task(
     subagent_type: "analyst",
     prompt: "MODE DELEGATION - PHASE ANALYSE UNIQUEMENT.
     Fichier requirements: <requirementsFile>. Mode: <evolutionMode>. Version: <evolutionVersion>.
     Analyse le requirements, identifie les ambiguites et questions.
     Ecris le fichier questions : docs/factory/questions.md (V1) ou questions-v<evolutionVersion>.md (V2+).
     IMPORTANT:
     - NE PAS utiliser AskUserQuestion (le skill s'en charge)
     - NE PAS generer brief.md, scope.md, acceptance.md
     - Retourne dans ta reponse la LISTE des questions identifiees avec leur priorite (bloquante/optionnelle) et les hypotheses proposees.",
     description: "Analyst - Phase ANALYSE (delegation)"
   )
   ```

3b. **Poser les questions a l'utilisateur** (fait par le skill, PAS par le subagent) :
   1. Lire le fichier questions genere par l'analyst (`docs/factory/questions.md` ou `docs/factory/questions-vN.md`)
   2. Extraire les questions identifiees (depuis le fichier ou la reponse de l'analyst)
   3. Poser les questions **bloquantes en premier** via `AskUserQuestion` :
      - Regrouper par lot de 1 a 4 questions (limite du tool)
      - Proposer les hypotheses de l'analyst comme options par defaut
      - Ajouter toujours une option pour que l'utilisateur precise sa reponse
   4. Pour les questions optionnelles, poser egalement via `AskUserQuestion`
      mais accepter l'hypothese si l'utilisateur ne precise pas
   5. Mettre a jour le fichier questions avec les reponses recues :
      - Statut → `REPONDU` avec la reponse
      - Ou statut → `HYPOTHESE` si l'utilisateur accepte l'hypothese par defaut

   > **IMPORTANT** : Cette etape est executee par le skill lui-meme (pas un subagent)
   > car les subagents ne posent pas les questions de maniere fiable.

3c. **Phase GENERATION** - Deleguer a l'agent `analyst` (generation des documents) :
   ```
   Task(
     subagent_type: "analyst",
     prompt: "MODE DELEGATION - PHASE GENERATION.
     Fichier requirements: <requirementsFile>. Mode: <evolutionMode>. Version: <evolutionVersion>.
     Lis le fichier questions mis a jour avec les reponses utilisateur :
     docs/factory/questions.md (V1) ou docs/factory/questions-v<evolutionVersion>.md (V2+).
     Les reponses de l'utilisateur sont dans la colonne 'Reponse' du tableau.
     Si mode=greenfield: CREATE docs/brief.md, scope.md, acceptance.md.
     Si mode=brownfield: EDIT les docs existants pour les enrichir.
     Integre les reponses de l'utilisateur dans les documents generes.
     IMPORTANT:
     - NE PAS utiliser AskUserQuestion (les reponses sont deja dans le fichier questions)
     - Lire le fichier questions AVANT de generer les documents
     - Les hypotheses acceptees doivent etre marquees comme telles dans brief.md",
     description: "Analyst - Phase GENERATION (delegation)"
   )
   ```

4. **Exécuter Gate 1 (avec auto-remediation)** :

   ```bash
   node tools/gate-check.js 1 --json
   ```

   Suivre le **protocole standard de gate handling** :

   **Tentative 1** : Analyser le JSON retourné.
   - Si `status === "PASS"` → continuer à l'étape 5.
   - Si `status === "FAIL"` :
     - Lire `errors[]` et identifier les erreurs `fixable: true`.
     - Pour chaque erreur fixable : corriger directement (créer fichier/section manquante)
       ou relancer l'agent analyst en phase GENERATION avec un prompt ciblé sur les erreurs.
     - Re-exécuter : `node tools/gate-check.js 1 --json`

   **Tentative 2** : Si toujours FAIL, relancer l'agent analyst complet (phase GENERATION).
   - Re-exécuter : `node tools/gate-check.js 1 --json`

   **Tentative 3** : Si toujours FAIL après 3 tentatives, retourner le rapport d'échec.
   - **NE PAS continuer le pipeline.**
   - Terminer avec ce message EXACT en fin de réponse :
     ```
     GATE_FAIL|1|<résumé des erreurs séparées par ;>|3
     ```
     Exemple : `GATE_FAIL|1|Fichier manquant: docs/brief.md;Section manquante: ## IN|3`

5. **Logger** via :
   ```bash
   node tools/factory-log.js "BREAK" "completed" "Phase BREAK terminée - X questions posées, Y répondues"
   ```

6. **Retourner** un résumé avec :
   - Liste des artefacts créés
   - Nombre de questions posées/répondues
   - Hypothèses générées (si applicable)

## Gestion des questions

| Situation | Action |
|-----------|--------|
| Questions bloquantes non répondues | STOP - Demander réponse |
| Questions optionnelles non répondues | Continuer avec hypothèse explicite |
| Utilisateur veut répondre plus tard | Pause - Expliquer comment reprendre |

## Protocole d'échec

- **Gate d'entrée** (Gate 0) : Si FAIL → STOP immédiat (prérequis manquants, ne peut pas corriger).
- **Gate de sortie** (Gate 1) : Auto-remediation 3x puis marqueur `GATE_FAIL` si échec persistant.
- **Jamais** de STOP silencieux — toujours retourner un rapport structuré.
