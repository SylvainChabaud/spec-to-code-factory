# Spec-to-Code Factory

Pipeline Claude Code qui transforme un `requirements.md` en projet livrable.

## Quick Start

1. Placez votre fichier de requirements dans `input/requirements.md`
2. Lancez le pipeline : `/factory-run`
3. Récupérez votre projet dans `src/` et `tests/`

## Workflow

```
requirements.md
     │
     ▼ /factory-intake (Gate 1)
brief + scope + acceptance
     │
     ▼ /factory-spec (Gate 2)
specs + ADR + rules
     │
     ▼ /factory-plan (Gate 3)
epics + US + tasks
     │
     ▼ /factory-build (Gate 4)
src + tests
     │
     ▼ /factory-qa (Gate 5)
QA report + checklist + CHANGELOG
     │
     ▼
   RELEASE
```

## Commands

| Command | Description |
|---------|-------------|
| `/factory-run` | Pipeline complet |
| `/factory-intake` | Phase BREAK |
| `/factory-spec` | Phase MODEL |
| `/factory-plan` | Phase ACT (planning) |
| `/factory-build` | Phase ACT (build) |
| `/factory-qa` | Phase DEBRIEF |
| `/gate-check [1-5]` | Vérifie un gate |
| `/status` | État du pipeline |
| `/reset [phase]` | Réinitialise une phase |
| `/help` | Aide complète |

## Structure

```
├── input/              # Requirements + ressources
├── docs/               # Documentation générée
│   ├── specs/          # Spécifications
│   ├── adr/            # Architecture Decision Records
│   ├── planning/       # Epics, US, Tasks
│   ├── testing/        # Plan de tests
│   ├── qa/             # Rapports QA
│   ├── release/        # Checklist release
│   └── factory/        # Logs du pipeline
├── src/                # Code source généré
├── tests/              # Tests générés
├── tools/              # Outils de validation
└── .claude/            # Configuration Claude Code
    ├── skills/         # Skills du pipeline
    ├── agents/         # Définitions des agents
    ├── commands/       # Commands disponibles
    ├── rules/          # Règles de gouvernance
    └── hooks/          # Hooks de validation
```

## Invariants

1. **No Spec, No Code** : Pas de code sans specs validées
2. **No Task, No Commit** : Chaque commit référence TASK-XXXX
3. **Anti-dérive** : Implémentation strictement alignée au plan

## Validation

```bash
node tools/validate-structure.js   # Valide la structure
node tools/scan-secrets.js         # Détecte secrets/PII
node tools/gate-check.js [1-5]     # Vérifie un gate
```

## License

MIT
