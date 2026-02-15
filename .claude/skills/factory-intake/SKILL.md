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

0. **Detection et instrumentation** - Detecter le mode et enregistrer :
   ```bash
   # Detecter le fichier requirements le plus recent
   node tools/detect-requirements.js
   # Retourne: { "file": "input/requirements-N.md", "version": N, "isEvolution": true/false }

   node tools/instrumentation/collector.js phase-start "{\"phase\":\"BREAK\",\"skill\":\"factory-intake\"}"
   node tools/instrumentation/collector.js skill "{\"skill\":\"factory-intake\"}"
   ```

1. **Verifier Gate 0** : Valider le fichier requirements detecte
   ```bash
   node tools/gate-check.js 0
   ```
   - Si exit code = 1 → Fichier manquant, STOP
   - Si exit code = 2 → Sections manquantes/vides, STOP avec rapport
   - L'utilisateur DOIT completer toutes les sections avant de continuer

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
   ```bash
   # Instrumentation (si activee)
   node tools/instrumentation/collector.js agent "{\"agent\":\"analyst\",\"source\":\"factory-intake\",\"mode\":\"analyse\"}"
   ```
   ```
   Task(
     subagent_type: "analyst",
     prompt: "MODE DELEGATION - PHASE ANALYSE UNIQUEMENT.
     Execute detect-requirements.js pour trouver le fichier requirements.
     Analyse le requirements, identifie les ambiguites et questions.
     Ecris le fichier questions : docs/factory/questions.md (V1) ou questions-vN.md (V2+).
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
   ```bash
   # Instrumentation (si activee)
   node tools/instrumentation/collector.js agent "{\"agent\":\"analyst\",\"source\":\"factory-intake\",\"mode\":\"generation\"}"
   ```
   ```
   Task(
     subagent_type: "analyst",
     prompt: "MODE DELEGATION - PHASE GENERATION.
     Execute detect-requirements.js pour trouver le fichier requirements.
     Lis le fichier questions mis a jour avec les reponses utilisateur :
     docs/factory/questions.md (V1) ou docs/factory/questions-vN.md (V2+).
     Les reponses de l'utilisateur sont dans la colonne 'Reponse' du tableau.
     Si isEvolution=false (V1): CREATE docs/brief.md, scope.md, acceptance.md
     Si isEvolution=true (V2+): EDIT les docs existants pour les enrichir.
     Integre les reponses de l'utilisateur dans les documents generes.
     IMPORTANT:
     - NE PAS utiliser AskUserQuestion (les reponses sont deja dans le fichier questions)
     - Lire le fichier questions AVANT de generer les documents
     - Les hypotheses acceptees doivent etre marquees comme telles dans brief.md",
     description: "Analyst - Phase GENERATION (delegation)"
   )
   ```

4. **Vérifier les outputs** :
   - `docs/factory/questions.md` contient les questions posées et réponses
   - `docs/brief.md` existe et contient section "Hypothèses" (si questions non répondues)
   - `docs/scope.md` existe et contient sections "IN" et "OUT"
   - `docs/acceptance.md` existe et contient "Critères globaux"

5. **Exécuter Gate 1** : `node tools/gate-check.js 1`

6. **Logger** via :
   ```bash
   node tools/factory-log.js "BREAK" "completed" "Phase BREAK terminée - X questions posées, Y répondues"
   ```

7. **Retourner** un résumé avec :
   - Liste des artefacts créés
   - Nombre de questions posées/répondues
   - Hypothèses générées (si applicable)

## Gestion des questions

| Situation | Action |
|-----------|--------|
| Questions bloquantes non répondues | STOP - Demander réponse |
| Questions optionnelles non répondues | Continuer avec hypothèse explicite |
| Utilisateur veut répondre plus tard | Pause - Expliquer comment reprendre |

## En cas d'échec

Si Gate 1 échoue → STOP et rapport des sections manquantes.
