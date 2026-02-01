# Spec-to-Code Factory

Pipeline Claude Code qui transforme un `requirements.md` en projet livrable.

## Quick Start

1. Placez votre fichier de requirements dans `input/requirements.md`
2. Lancez le pipeline : `/factory-run`
3. Récupérez votre projet livrable dans `release/`

## Workflow

```
requirements.md (Gate 0)
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
src + tests + app assembly
     │
     ▼ /factory-qa (Gate 5)
QA report + checklist + CHANGELOG + export release
     │
     ▼
release/  ← Projet livrable (sans infrastructure factory)
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
| `/factory-resume` | Reprend après interruption |
| `/gate-check [0-5]` | Vérifie un gate |
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
node tools/validate-requirements.js  # Gate 0 : Valide requirements.md
node tools/validate-structure.js     # Gate 1 : Valide la structure projet
node tools/scan-secrets.js           # Gate 2 : Détecte secrets/PII
node tools/validate-code-quality.js  # Gate 4 : Valide code vs specs
node tools/validate-app-assembly.js  # Gate 4 : Valide assemblage App.tsx
node tools/export-release.js         # Gate 5 : Exporte le projet livrable
node tools/gate-check.js [0-5]       # Vérifie un gate complet
```

## Export Release

Le Gate 5 sépare automatiquement le **projet livrable** de l'**infrastructure factory**.

> **Note** : Le code existe en double (racine + `release/`). C'est intentionnel :
> - **Racine** : Environnement de travail avec l'infrastructure factory
> - **`release/`** : Projet livrable propre, prêt à être copié vers votre repo final

### Récupérer votre projet

```bash
# Option 1 : Copier vers un nouveau repo
cp -r release/ ../mon-projet/
cd ../mon-projet && git init && npm install

# Option 2 : Exporter vers un dossier spécifique
node tools/export-release.js --output ~/projets/mon-app
```

### Contenu de release/

- Code source (`src/`, `tests/`, configs)
- README enrichi (généré depuis les specs)
- `.env.example` (configuration)
- **Sans** : `.claude/`, `docs/`, `tools/`, `templates/`, `CLAUDE.md`

## Instrumentation (optionnel)

Le pipeline peut tracer tous les événements pour debugging ou audit.

### Activation

Dans `.claude/settings.json` :
```json
"env": {
  "FACTORY_INSTRUMENTATION": "true"
}
```

### Événements trackés

| Type | Description |
|------|-------------|
| `tool_invocation` | Invocation d'un tool |
| `file_written` | Fichier écrit |
| `gate_checked` | Vérification gate (0-5) |
| `skill_invoked` | Skill invoquée |
| `agent_delegated` | Délégation agent |
| `phase_started` | Début de phase |
| `phase_completed` | Fin de phase |

### Commandes

```bash
node tools/instrumentation/collector.js status   # État
node tools/instrumentation/collector.js summary  # Résumé
node tools/instrumentation/collector.js reset    # Réinitialiser
node tools/instrumentation/coverage.js           # Couverture pipeline
node tools/instrumentation/reporter.js           # Rapport markdown
```

### Output

- `docs/factory/instrumentation.json` - Événements (append-only)
- `docs/factory/coverage-report.md` - Rapport de couverture

## License

MIT
