# CLAUDE.md — Spec-to-Code Factory

## Vision
Pipeline automatisé qui transforme un requirements.md en projet livrable.

## Workflow obligatoire
```
BREAK → MODEL → ACT → DEBRIEF
  │        │       │       │
Gate 1  Gate 2  Gate 3+4  Gate 5
```

### Validations par Gate
| Gate | Phase | Validations |
|------|-------|-------------|
| 1 | BREAK→MODEL | Fichiers brief/scope/acceptance + **structure projet** |
| 2 | MODEL→ACT | Specs + ADR + **scan secrets/PII** |
| 3 | PLAN→BUILD | Epics + US + Tasks avec DoD |
| 4 | BUILD→QA | Tests passants + **code quality strict** |
| 5 | QA→RELEASE | QA report + checklist + CHANGELOG |

## Phases
1. **BREAK** : Normaliser le besoin → brief + scope + acceptance
2. **MODEL** : Spécifier → specs + ADR + rules
3. **ACT** : Planifier + Construire → epics + US + tasks + code + tests
4. **DEBRIEF** : Valider + Livrer → QA + checklist + CHANGELOG

## Invariants (ABSOLUS)
- **No Spec, No Code** : Pas de code sans specs validées
- **No Task, No Commit** : Chaque commit référence TASK-XXXX
- **Anti-dérive** : Implémentation strictement alignée au plan
- **Tasks auto-suffisantes** : Chaque task est 100% indépendante (principe BMAD)

## Conventions de nommage
- User Stories : `US-XXXX-titre.md`
- Tasks : `TASK-XXXX-titre.md`
- ADR : `ADR-XXXX-titre.md`

## Commands disponibles
### Skills (workflows)
- `/factory-intake` : Phase BREAK
- `/factory-spec` : Phase MODEL
- `/factory-plan` : Phase ACT (planning)
- `/factory-build` : Phase ACT (build)
- `/factory-qa` : Phase DEBRIEF
- `/factory-run` : Pipeline complet
- `/factory-resume` : Reprend le pipeline après interruption
- `/gate-check [1-5]` : Vérifie un gate

### Commands
- `/status` : État du pipeline (dashboard détaillé)
- `/reset [phase]` : Réinitialise une phase
- `/help` : Affiche l'aide

## Outils de support
- `tools/factory-state.js` : Gestion de l'état machine-readable
- `tools/factory-reset.js` : Reset des phases
- `tools/set-current-task.js` : Tracking de la task courante
- `tools/validate-file-scope.js` : Validation anti-dérive
- `tools/validate-code-quality.js` : Validation code vs specs (mode STRICT)
- `tools/validate-structure.js` : Validation structure projet (Gate 1)
- `tools/scan-secrets.js` : Scan secrets et PII (Gate 2)

## Hook Git optionnel

`tools/validate-commit-msg.js` valide le format des commits (TASK-XXXX: description).

**Installation (optionnel)** :
```bash
# Avec Husky
npx husky add .husky/commit-msg "node tools/validate-commit-msg.js $1"

# Ou manuellement
echo 'node tools/validate-commit-msg.js "$1"' > .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

## Validation Code Quality (Gate 4)

Le pipeline inclut une validation stricte du code généré contre les specs :

| Critère | Seuil | Bloquant |
|---------|-------|----------|
| Couverture de tests | ≥ 80% | Oui |
| Types TypeScript | Strict | Oui |
| Conformité API specs | 100% | Oui |
| Conformité Domain specs | 100% | Oui |

Usage : `node tools/validate-code-quality.js --gate4`

## Indépendance des Tasks (BMAD)

Chaque task est **100% auto-suffisante** selon le principe BMAD "hyper-detailed story files".

Une task contient :
- **Contexte complet** : Specs référencées avec résumés
- **Code existant** : Extraits pertinents (fichier:lignes)
- **Fichiers concernés** : Liste exhaustive (anti-dérive)
- **Tests attendus** : Pour validation automatique

Le développeur peut implémenter une task SANS connaître les autres tasks.
Le seul lien entre tasks = les artefacts partagés (specs, code généré).

Template : `templates/planning/task-template.md`

## Limites (V1)
- Stack-agnostic (projet cible défini par ADR)
- Pas de CI/CD intégré (GitHub Actions à ajouter manuellement)

## Templates de structure

Les agents utilisent ces templates pour générer des documents conformes :

| Template | Agent | Output |
|----------|-------|--------|
| `templates/specs/system.md` | PM | `docs/specs/system.md` |
| `templates/specs/domain.md` | PM | `docs/specs/domain.md` |
| `templates/specs/api.md` | Architect | `docs/specs/api.md` |
| `templates/adr/ADR-template.md` | Architect | `docs/adr/ADR-*.md` |
| `templates/testing/plan.md` | Scrum Master | `docs/testing/plan.md` |
| `templates/planning/task-template.md` | Scrum Master | `docs/planning/tasks/TASK-*.md` |
| `templates/rule.md` | Rules-Memory | `.claude/rules/*.md` |

## Règles par domaine
- `.claude/rules/factory-invariants.md` : Invariants pipeline
- `.claude/rules/security-baseline.md` : Sécurité baseline
- `.claude/rules/*.md` : Règles générées selon projet
