---
name: factory-spec
description: "Phase MODEL - Génère specs + ADR + rules"
context: fork
allowed-tools: Read, Glob, Grep, Task, Bash
---

# Factory Spec - Phase MODEL

Tu es l'orchestrateur de la phase MODEL.

## Workflow

> ⚠️ **SYNCHRONISATION OBLIGATOIRE** : Exécuter les agents UN PAR UN, JAMAIS en parallèle.
> Les agents ont des dépendances strictes :
> - `architect` DÉPEND de `pm` (lit system.md et domain.md)
> - `rules-memory` DÉPEND de `architect` (lit api.md et ADR)
>
> **IMPORTANT** : N'envoyer qu'UN SEUL appel Task à la fois. Attendre son résultat avant le suivant.

0. **Detection et instrumentation** - Detecter le mode et enregistrer :
   ```bash
   # Detecter le mode (greenfield ou brownfield)
   node tools/detect-requirements.js
   # Retourne: { "version": N, "isEvolution": true/false }

   node tools/instrumentation/collector.js phase-start "{\"phase\":\"MODEL\",\"skill\":\"factory-spec\"}"
   node tools/instrumentation/collector.js skill "{\"skill\":\"factory-spec\"}"
   ```

1. **Vérifier Gate 1** : `node tools/gate-check.js 1`
   - Si exit code ≠ 0 → STOP immédiat

2. **Déléguer à l'agent `pm`** via Task tool :
   ```bash
   # Instrumentation (si activée)
   node tools/instrumentation/collector.js agent "{\"agent\":\"pm\",\"source\":\"factory-spec\"}"
   ```
   ```
   Task(
     subagent_type: "pm",
     prompt: "Execute detect-requirements.js pour determiner le mode.
     Si isEvolution=false (V1): CREATE docs/specs/system.md et domain.md
     Si isEvolution=true (V2+): EDIT les specs existantes pour les mettre a jour.
     Source: docs/brief.md et docs/scope.md",
     description: "PM - Specs fonctionnelles (auto-detect mode)"
   )
   ```
   **⏳ ATTENDRE que le Task soit terminé avant de continuer.**
   **✅ Vérifier** : `docs/specs/system.md` ET `docs/specs/domain.md` existent.

3. **Déléguer à l'agent `architect`** via Task tool :
   ```bash
   # Instrumentation (si activée)
   node tools/instrumentation/collector.js agent "{\"agent\":\"architect\",\"source\":\"factory-spec\"}"
   ```
   ```
   Task(
     subagent_type: "architect",
     prompt: "Execute detect-requirements.js pour determiner le mode.
     Si isEvolution=false (V1): CREATE docs/specs/api.md et ADR-0001-stack.md
     Si isEvolution=true (V2+): EDIT api.md + CREATE nouveaux ADR + marquer anciens SUPERSEDED.
     Source: docs/specs/system.md et docs/specs/domain.md",
     description: "Architect - Specs techniques (auto-detect mode)"
   )
   ```
   **⏳ ATTENDRE que le Task soit terminé avant de continuer.**
   **✅ Vérifier** : `docs/specs/api.md` ET `docs/adr/ADR-0001-*.md` existent.

   **Synchroniser le compteur ADR** (l'architect n'a pas acces a Bash) :
   ```bash
   # Compter les ADR sur disque et synchroniser le compteur
   ADR_COUNT=$(ls docs/adr/ADR-*.md 2>/dev/null | wc -l)
   CURRENT=$(node tools/factory-state.js counter adr get)
   if [ "$CURRENT" != "$ADR_COUNT" ]; then
     while [ "$(node tools/factory-state.js counter adr get)" -lt "$ADR_COUNT" ]; do
       node tools/factory-state.js counter adr next > /dev/null
     done
     echo "ADR counter synchronized: $ADR_COUNT"
   fi
   ```

4. **Déléguer à l'agent `rules-memory`** via Task tool :
   ```bash
   # Instrumentation (si activée)
   node tools/instrumentation/collector.js agent "{\"agent\":\"rules-memory\",\"source\":\"factory-spec\"}"
   ```
   ```
   Task(
     subagent_type: "rules-memory",
     prompt: "Génère les rules dans .claude/rules/ et enrichis CLAUDE.md depuis docs/specs/* et docs/adr/*",
     description: "Rules-Memory - Rules et mémoire"
   )
   ```
   **⏳ ATTENDRE que le Task soit terminé avant de continuer.**

5. **Brownfield uniquement : Pruner les rules obsolètes** :
   Si mode brownfield (isEvolution=true), vérifier la cohérence des rules existantes :
   ```bash
   # Lister les rules existantes
   ls .claude/rules/
   ```
   Pour chaque rule dans `.claude/rules/` (hors `factory-invariants.md` et `security-baseline.md`) :
   - Comparer avec les specs mises à jour (`docs/specs/*`)
   - Si une rule contredit les nouvelles specs → la mettre à jour ou la supprimer
   - Si une rule référence des concepts supprimés → la supprimer
   - Logger les modifications dans le résumé final

6. **Vérifier les outputs** :
   - `docs/specs/system.md` existe
   - `docs/specs/domain.md` existe
   - `docs/specs/api.md` existe
   - `docs/adr/ADR-0001-*.md` existe

7. **Exécuter Gate 2** : `node tools/gate-check.js 2`
   - Si exit code ≠ 0 → STOP immédiat avec rapport des erreurs

8. **Logger** via :
   ```bash
   node tools/factory-log.js "MODEL" "completed" "Phase MODEL terminée"
   ```

9. **Retourner** un résumé avec liste des specs générées

## En cas d'échec

Si Gate 2 échoue → STOP et rapport des fichiers manquants.
