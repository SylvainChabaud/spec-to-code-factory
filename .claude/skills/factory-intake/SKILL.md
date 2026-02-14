---
name: factory-intake
description: "Phase BREAK - Normalise les requirements en brief/scope/acceptance"
context: fork
allowed-tools: Read, Glob, Grep, Task, Bash
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

3. **Deleguer a l'agent `analyst`** via Task tool :
   ```bash
   # Instrumentation (si activee)
   node tools/instrumentation/collector.js agent "{\"agent\":\"analyst\",\"source\":\"factory-intake\"}"
   ```
   ```
   Task(
     subagent_type: "analyst",
     prompt: "Execute detect-requirements.js pour trouver le fichier requirements.
     Si isEvolution=false (V1): CREATE docs/brief.md, scope.md, acceptance.md
     Si isEvolution=true (V2+): EDIT les docs existants pour les enrichir.
     Pose les questions via AskUserQuestion.
     Documente les Q/R dans docs/factory/questions.md (V1) ou questions-vN.md (V2+).",
     description: "Analyst - Phase BREAK (auto-detect mode)"
   )
   ```

3b. **Fallback questions-vN.md** (si le fichier n'existe pas apres retour de l'analyst) :
   Verifier si `docs/factory/questions-vN.md` existe (ou `docs/factory/questions.md` en V1).
   Si absent, creer un fichier minimal :
   ```markdown
   # Questions V<N>
   > Fichier auto-genere — l'agent analyst n'a pas eu le temps de documenter les Q/R.
   > Les reponses ont ete integrees directement dans brief.md et scope.md.
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
