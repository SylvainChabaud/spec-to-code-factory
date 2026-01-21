# Invariants Factory (ABSOLUS)

> ⚠️ **Rule GLOBALE** (pas de `paths`) : s'applique à TOUS les fichiers du projet.
>
> Justification : Architecture pipeline Spec-to-Code Factory

## No Spec, No Code
Aucun code dans src/ sans :
- docs/specs/*.md validés (Gate 2 passé)
- docs/planning/tasks/TASK-*.md avec DoD

## No Task, No Commit
Chaque commit DOIT référencer une TASK-XXXX.
Format : `TASK-XXXX: description`

## Anti-dérive agentique
- **INTERDIT** : ajouter fonctionnalités non demandées
- **INTERDIT** : refactor hors task dédiée
- **INTERDIT** : "amélioration" non planifiée
- **INTERDIT** : modifier fichiers hors scope task
- **OBLIGATOIRE** : implémentation strictement alignée au plan

## Traçabilité
Chaque TASK référence :
- Son US parent
- Son EPIC
- Les specs concernées
- Les ADR applicables
