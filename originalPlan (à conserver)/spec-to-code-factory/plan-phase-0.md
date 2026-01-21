# Phase 0 — Nettoyage du starter

> Lire ce fichier UNIQUEMENT pour la Phase 0.
> Objectif : Supprimer les fichiers obsolètes, préparer la structure.

## Fichiers à SUPPRIMER

| Fichier/Dossier | Raison |
|-----------------|--------|
| `prompts/` (tout le dossier) | Remplacé par agents + commands |
| `tasks/` (tout le dossier) | Remplacé par `docs/planning/` |
| `.claude/hooks/*.py` | Migrés vers Node.js |
| `tools/quality_gate.py` | Migré vers Node.js |
| `CLAUDE.local.md.template` | Sera régénéré proprement |
| `docs/requirements.md` | Déplacé vers `input/` |
| `docs/runbooks/` | Intégré dans `docs/qa/` |
| `CAHIER DES CHARGES` | Document source, archiver hors boîte noire |

## Fichiers à CONSERVER et MODIFIER

| Fichier | Action |
|---------|--------|
| `.claude/settings.json` | Modifier (chemins Node.js) |
| `.claude/rules/*.md` | Conserver (enrichir si besoin) |
| `CLAUDE.md` | Modifier (ajouter workflow BMAD) |
| `docs/adr/` | Conserver structure |
| `.gitignore` | Conserver |
| `README.md` | Modifier (nouvelle doc) |

## Dossiers à CRÉER (vides)

```
input/
input/wireframes/
input/api-examples/
docs/specs/
docs/planning/
docs/planning/us/
docs/planning/tasks/
docs/testing/
docs/qa/
docs/release/
docs/factory/
.claude/skills/
.claude/agents/
.claude/commands/
tools/
src/
tests/
```

## Commandes d'exécution

```bash
# Supprimer les dossiers obsolètes
rmdir /s /q prompts
rmdir /s /q tasks
rmdir /s /q docs\runbooks

# Supprimer les fichiers obsolètes
del /q .claude\hooks\*.py
del /q tools\quality_gate.py
del /q CLAUDE.local.md.template
del /q docs\requirements.md
del /q "CAHIER DES CHARGES"

# Créer les nouveaux dossiers
mkdir input input\wireframes input\api-examples
mkdir docs\specs docs\planning docs\planning\us docs\planning\tasks
mkdir docs\testing docs\qa docs\release docs\factory
mkdir .claude\skills .claude\agents .claude\commands
mkdir tools src tests
```

## Vérification Phase 0

- [ ] Aucun fichier .py dans `.claude/hooks/`
- [ ] Aucun fichier .py dans `tools/`
- [ ] Dossiers `prompts/` et `tasks/` supprimés
- [ ] Tous les nouveaux dossiers créés
