---
name: factory
description: "Pipeline complet requirements → release (auto-detect greenfield V1 / brownfield V2+)"
allowed-tools: Read, Glob, Grep, Bash, Task, Skill
---

# Factory - Pipeline Complet (Unifie)

Tu es l'orchestrateur master du pipeline complet requirements → release.
Le mode (greenfield V1 / brownfield V2+) est detecte automatiquement.

## Workflow

> ⚠️ **SEQUENTIEL OBLIGATOIRE** : Invoquer UNE SEULE skill/phase a la fois.
> Attendre sa completion AVANT de passer a la suivante. JAMAIS en parallele.

### 0. Detection automatique du mode

```bash
node tools/detect-requirements.js
# Retourne: { "file": "input/requirements.md", "version": 1, "isEvolution": false }
# ou:       { "file": "input/requirements-N.md", "version": N, "isEvolution": true }
```

- Si `isEvolution === false` → mode **greenfield** (V1)
- Si `isEvolution === true` → mode **brownfield** (VN)

### 1. Prerequisites (brownfield seulement)

> Ignorer cette etape si mode greenfield.

Verifier que le projet V1+ existe :

```bash
# 1. Verifier que src/ existe et contient du code
ls src/
# Si vide ou absent → STOP: "Pas de projet existant. Creer requirements.md pour V1"

# 2. Verifier les docs de base existent
ls docs/brief.md docs/scope.md docs/acceptance.md docs/specs/
# Si absents → STOP: "Documents V1 manquants. Pipeline V1 incomplet."
```

### 2. Initialisation (mode-aware)

```bash
# Reset instrumentation pour un timeline propre
node tools/instrumentation/collector.js reset

# Initialiser state.json avec la version detectee
node tools/factory-state.js set evolutionVersion <N>
node tools/factory-state.js set evolutionMode <greenfield|brownfield>

# Creer la structure versionnee
mkdir -p docs/planning/v<N>/us
mkdir -p docs/planning/v<N>/tasks

# Instrumentation (si activee)
node tools/instrumentation/collector.js skill "{\"skill\":\"factory\",\"version\":<N>,\"mode\":\"<greenfield|brownfield>\"}"

# Log demarrage
node tools/factory-log.js "PIPELINE" "started" "Demarrage du pipeline V<N> (<greenfield|brownfield>)"
```

### 3. Pipeline 5 phases (identique pour les deux modes)

Les skills de phase gerent leur propre delegation d'agent.
Note : `factory-intake` tourne inline (pas de fork) pour permettre `AskUserQuestion`.

#### Phase 1 - BREAK
Invoque `/factory-intake` et attends le resultat.
Si Gate 1 echoue → STOP et rapport d'erreur.

#### Phase 2 - MODEL
Invoque `/factory-spec` et attends le resultat.
Si Gate 2 echoue → STOP et rapport d'erreur.

#### Phase 3 - ACT (planning)
Invoque `/factory-plan` et attends le resultat.
Si Gate 3 echoue → STOP et rapport d'erreur.

#### Phase 4 - ACT (build)
Invoque `/factory-build` et attends le resultat.
Si Gate 4 echoue → STOP et rapport d'erreur.

#### Phase 5 - DEBRIEF
Invoque `/factory-qa` et attends le resultat.
Si Gate 5 echoue → STOP et rapport d'erreur.

### 4. Finalisation (mode-aware)

```bash
node tools/factory-log.js "PIPELINE" "completed" "Pipeline V<N> (<greenfield|brownfield>) termine avec succes"
```

A la fin du pipeline, produire un resume complet selon le mode.

#### Rapport greenfield (V1)

- Phases completees avec statuts
- Artefacts generes (liste des fichiers crees)
- Issues detectees (si applicable)

**Projet livrable** :
- Le projet livrable se trouve dans **`release/`**
- Le code existe en double (racine + `release/`) — c'est **intentionnel** :
  - **Racine** : environnement de travail avec l'infrastructure factory
  - **`release/`** : projet livrable propre, pret a etre copie
- Commandes pour recuperer le projet :
```bash
# Option 1 : Copier vers un nouveau repo
cp -r release/ ../mon-projet/
cd ../mon-projet && git init && npm install

# Option 2 : Tester localement
cd release && npm install && npm test && npm run build
```

#### Rapport brownfield (VN)

- **Resume evolution** :
  - Version precedente : V<N-1>
  - Nouvelle version : V<N>
  - Fichier source : `input/requirements-<N>.md`
- **Documents modifies (EDIT)** : Liste des fichiers edites avec resume des changements
- **Documents crees (CREATE)** :
  - Nouveau dossier planning: `docs/planning/v<N>/`
  - Nouveaux ADR (si applicable)
  - Nouveaux rapports QA
- **Compteurs** :
  - Dernier EPIC: EPIC-XXX
  - Derniere US: US-XXXX
  - Derniere TASK: TASK-XXXX

#### Commandes post-pipeline (a suggerer a l'utilisateur)

```bash
# Verification complete du pipeline (38 checks)
node tools/verify-pipeline.js

# Couverture de l'instrumentation
node tools/instrumentation/coverage.js

# Rapport detaille instrumentation (markdown)
node tools/instrumentation/reporter.js

# Valider que les compteurs sont continus (brownfield)
node tools/factory-state.js counter task get
```

## Strategie par type de document (brownfield)

| Document | Action V1 | Action V2+ |
|----------|-----------|------------|
| brief, scope, acceptance | CREATE | EDIT (enrichir) |
| specs (system, domain, api) | CREATE | EDIT (mettre a jour) |
| planning | CREATE v1/ | CREATE vN/ |
| ADR | CREATE | CREATE (nouveau) + EDIT status ancien SUPERSEDED |
| QA reports | CREATE | CREATE (report-vN.md, checklist-vN.md) |
| CHANGELOG | CREATE | EDIT (prepend) |
| Factory logs | CREATE | APPEND |

## Rollback en cas d'echec (brownfield)

Si une phase echoue et necessite un rollback :

```bash
# 1. Restaurer la version precedente
node tools/factory-state.js set evolutionVersion <N-1>
node tools/factory-state.js set evolutionMode greenfield  # ou brownfield si N-1 > 1

# 2. Supprimer le dossier planning cree
rm -rf docs/planning/v<N>/

# 3. Git restore des docs edites (si commits existants)
git checkout -- docs/brief.md docs/scope.md docs/acceptance.md
git checkout -- docs/specs/

# 4. Re-verifier l'etat
node tools/factory-state.js get
```

> **Note** : Le rollback est manuel. Il est recommande de committer avant de lancer une evolution.

## Regles critiques

- **Sequentiel strict** : Chaque phase DOIT reussir (gate OK) avant la suivante
- **Si un gate echoue** → STOP immediat, logger l'erreur, retourner rapport
- **Pas de nesting** : Invoquer les skills directement, ils gerent leur propre fork

## Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| Gate 0 fail | requirements.md incomplet | Completer les 12 sections |
| Gate 1 fail | brief/scope/acceptance non generes | Verifier phase BREAK |
| Gate 1 fail (brownfield) | brief/scope/acceptance non enrichis | Verifier mode EDIT |
| Gate 2 fail | Specs manquantes ou secrets detectes | Verifier phase MODEL + scan |
| Gate 3 fail | Tasks sans DoD | Verifier phase PLAN |
| Gate 4 fail | Tests ou boundaries | Verifier phase BUILD |
| Gate 5 fail | QA report incomplet | Verifier phase DEBRIEF |
| `isEvolution: false` avec V2+ | Pas de requirements-N.md | Creer `requirements-N.md` |
| Compteurs discontinus | Oubli `counter next` | Reset compteurs manuellement |
| `src/` vide (brownfield) | Pas de projet V1 | Executer `/factory` avec requirements.md d'abord |
| Docs V1 manquants (brownfield) | Pipeline V1 incomplet | Completer le pipeline V1 |
