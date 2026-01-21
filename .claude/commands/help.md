# /help

Affiche l'aide du pipeline Spec-to-Code Factory.

## Commands disponibles

### Skills (workflows)
- `/factory-intake` : Phase BREAK (requirements → brief)
- `/factory-spec` : Phase MODEL (brief → specs + ADR)
- `/factory-plan` : Phase ACT (specs → planning)
- `/factory-build` : Phase ACT (tasks → code)
- `/factory-qa` : Phase DEBRIEF (code → release)
- `/factory-run` : Pipeline complet
- `/gate-check [1-5]` : Vérifie un gate

### Commands
- `/status` : État du pipeline
- `/reset [phase]` : Réinitialise une phase
- `/help` : Cette aide

## Workflow
```
requirements.md
     │
     ▼ /factory-intake
brief + scope + acceptance
     │ Gate 1
     ▼ /factory-spec
specs + ADR + rules
     │ Gate 2
     ▼ /factory-plan
epics + US + tasks
     │ Gate 3
     ▼ /factory-build
src + tests
     │ Gate 4
     ▼ /factory-qa
QA report + checklist + CHANGELOG
     │ Gate 5
     ▼
   RELEASE
```
