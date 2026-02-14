# /reset [phase]

Réinitialise une phase du pipeline.

## Usage
- `/reset intake` : Supprime brief, scope, acceptance
- `/reset spec` : Supprime specs/*, adr/*, .claude/rules/* (sauf factory-invariants.md et security-baseline.md)
- `/reset plan` : Supprime planning/*
- `/reset build` : Supprime src/*, tests/*
- `/reset qa` : Supprime qa/report, release/checklist, CHANGELOG
- `/reset all` : Remet tout à zéro (garde requirements.md et règles de base)

## Workflow

1. **Valider l'argument** : Vérifier que la phase est valide (intake|spec|plan|build|qa|all)

2. **Demander confirmation** via AskUserQuestion :
   ```
   Vous allez réinitialiser la phase [phase].
   Les fichiers suivants seront supprimés : [liste]
   Êtes-vous sûr ?
   ```

3. **Exécuter le reset** via l'outil dédié :
   ```bash
   node tools/factory-reset.js [phase]
   ```

4. **Logger** l'action :
   ```bash
   node tools/factory-log.js "RESET" "[phase]" "Phase réinitialisée"
   ```

5. **Effacer l'état** si nécessaire :
   ```bash
   node tools/set-current-task.js clear
   ```

## Fichiers par phase

| Phase | Fichiers supprimés |
|-------|-------------------|
| `intake` | docs/brief.md, docs/scope.md, docs/acceptance.md, docs/factory/questions.md |
| `spec` | docs/specs/*.md, docs/adr/*.md (sauf template), .claude/rules/*.md (sauf baseline) |
| `plan` | docs/planning/vN/epics.md, docs/planning/vN/us/*.md, docs/planning/vN/tasks/*.md (toutes versions) |
| `build` | src/*, tests/*, docs/factory/current-task.txt |
| `qa` | docs/qa/report.md, docs/release/checklist.md, CHANGELOG.md |
| `all` | Tous les fichiers ci-dessus |

> **Note** : La phase `plan` supprime tous les dossiers versionnés (v1, v2, etc.).

## Protection

Les fichiers suivants ne sont JAMAIS supprimés :
- `input/requirements.md` (source)
- `CLAUDE.md` (mémoire projet)
- `.claude/rules/factory-invariants.md` (règle de base)
- `.claude/rules/security-baseline.md` (règle de base)
- `docs/adr/ADR-template.md` (template)
- `package.json`, `README.md` (config projet)
