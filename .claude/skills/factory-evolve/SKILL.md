---
name: factory-evolve
description: "Pipeline evolution V2+ (brownfield) - incremental requirements"
allowed-tools: Read, Glob, Grep, Bash, Task, Skill
---

# Factory Evolve - Pipeline Evolution (Brownfield)

Tu es l'orchestrateur du pipeline d'evolution pour les projets existants (V2, V3...).

## Prerequis

Ce skill ne peut etre invoque que si :
1. Un projet V1 existe deja (code fonctionnel dans `src/`)
2. Un nouveau fichier `requirements-N.md` existe dans `input/`

### Validation des prerequis (OBLIGATOIRE)

Avant de continuer, verifier :

```bash
# 1. Verifier que src/ existe et contient du code
ls src/
# Si vide ou absent → STOP: "Pas de projet existant. Utiliser /factory-run pour V1"

# 2. Verifier les docs de base existent
ls docs/brief.md docs/scope.md docs/acceptance.md docs/specs/
# Si absents → STOP: "Documents V1 manquants. Pipeline V1 incomplet."

# 3. Verifier le fichier requirements-N.md
node tools/detect-requirements.js
# Si isEvolution=false → STOP: "Pas de requirements-N.md. Creer input/requirements-2.md"
```

## Detection automatique

```bash
# Detecter le fichier requirements le plus recent
node tools/detect-requirements.js
# Retourne: { "file": "input/requirements-2.md", "version": 2, "isEvolution": true }

# Si isEvolution: false → Erreur: utiliser /factory-run pour V1
```

## Initialisation

```bash
# Mettre a jour la version dans state.json
node tools/factory-state.js set evolutionVersion <N>
node tools/factory-state.js set evolutionMode brownfield

# Creer le repertoire planning pour cette version
mkdir -p docs/planning/v<N>/us
mkdir -p docs/planning/v<N>/tasks

# Reset instrumentation pour un timeline propre
node tools/instrumentation/collector.js reset

# Instrumentation (si activee)
node tools/instrumentation/collector.js skill "{\"skill\":\"factory-evolve\",\"version\":<N>}"

# Log demarrage
node tools/factory-log.js "PIPELINE" "evolve-started" "Demarrage evolution V<N>"
```

## Workflow

> ⚠️ **SÉQUENTIEL OBLIGATOIRE** : Invoquer UNE SEULE skill/phase à la fois.
> Attendre sa completion AVANT de passer à la suivante. JAMAIS en parallèle.

Les phases sont les memes que `/factory-run` mais en mode **BROWNFIELD**.

### Strategie par type de document

| Document | Action V2+ | Details |
|----------|------------|---------|
| brief, scope, acceptance | **EDIT** | Enrichir avec nouveaux besoins |
| specs (system, domain, api) | **EDIT** | Mettre a jour etat actuel |
| planning | **CREATE** | Nouveau dossier `v<N>/` |
| ADR | **CREATE** | Nouveau fichier + marquer ancien SUPERSEDED |
| QA reports | **CREATE** | `report-v<N>.md`, `checklist-v<N>.md` |
| CHANGELOG | **EDIT** | Prepend nouvelle section |
| Factory logs | **APPEND** | `log.md`, `instrumentation.json` |

### Phase 1 - BREAK (mode evolution)

L'agent analyst detecte automatiquement le mode brownfield via `detect-requirements.js`.

- **brief.md** : Enrichir avec les nouveaux besoins (EDIT)
- **scope.md** : Ajouter les nouvelles features (EDIT)
- **acceptance.md** : Ajouter les nouveaux criteres (EDIT)
- **questions-v<N>.md** : Nouvelles questions/reponses (CREATE)

Invoque `/factory-intake` (le mode est auto-detecte).
Si Gate 1 echoue → STOP.

### Phase 2 - MODEL (mode evolution)

- **system.md** : Mettre a jour avec nouveaux composants (EDIT)
- **domain.md** : Mettre a jour modele domaine (EDIT)
- **api.md** : Ajouter nouveaux endpoints (EDIT)
- **ADR-XXXX-*.md** : Nouveaux fichiers pour nouvelles decisions (CREATE)
- ADR existants impactes : Changer status vers SUPERSEDED (EDIT)

Invoque `/factory-spec`.
Si Gate 2 echoue → STOP.

### Phase 3 - ACT Planning (mode evolution)

L'agent scrum-master genere dans `docs/planning/v<N>/`.

- **Compteurs CONTINUS** : Si V1 finit a TASK-0005, V2 commence a TASK-0006
- Les compteurs sont geres par `factory-state.js counter <type> next`

Invoque `/factory-plan`.
Si Gate 3 echoue → STOP.

### Phase 4 - ACT Build (mode evolution)

Le code existant est modifie/enrichi selon les nouvelles tasks.

Invoque `/factory-build`.
Si Gate 4 echoue → STOP.

### Phase 5 - DEBRIEF (mode evolution)

- **report-v<N>.md** : Nouveau rapport QA (CREATE)
- **checklist-v<N>.md** : Nouvelle checklist (CREATE)
- **CHANGELOG.md** : Prepend nouvelle section V<N> (EDIT)

Invoque `/factory-qa`.
Si Gate 5 echoue → STOP.

## Finalisation

```bash
node tools/factory-log.js "PIPELINE" "evolve-completed" "Evolution V<N> terminee"
```

## Rapport final

A la fin du pipeline, produire un resume complet :

### Resume evolution
- Version precedente : V<N-1>
- Nouvelle version : V<N>
- Fichier source : `input/requirements-<N>.md`

### Documents modifies (EDIT)
- Liste des fichiers edites avec resume des changements

### Documents crees (CREATE)
- Nouveau dossier planning: `docs/planning/v<N>/`
- Nouveaux ADR (si applicable)
- Nouveaux rapports QA

### Compteurs
- Dernier EPIC: EPIC-XXX
- Derniere US: US-XXXX
- Derniere TASK: TASK-XXXX

### Prochaines etapes
- Commandes de verification
- Options pour exporter le projet mis a jour

## Verification post-evolution

```bash
# Verifier la coherence
node tools/verify-pipeline.js

# Valider que les compteurs sont continus
node tools/factory-state.js counter task get

# Couverture instrumentation
node tools/instrumentation/coverage.js
```

## Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `isEvolution: false` | Pas de requirements-N.md | Creer `requirements-2.md` |
| Gate 1 fail | brief/scope/acceptance non enrichis | Verifier EDIT mode |
| Compteurs discontinus | Oubli `counter next` | Reset compteurs manuellement |
| `src/` vide | Pas de projet V1 | Executer `/factory-run` d'abord |
| Docs V1 manquants | Pipeline V1 incomplet | Completer le pipeline V1 |

## Rollback en cas d'echec

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
