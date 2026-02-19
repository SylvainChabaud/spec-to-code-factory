# Spec-to-Code Factory

Pipeline Claude Code qui transforme un `requirements.md` en projet livrable.

## Quick Start

1. Placez votre fichier de requirements dans `input/requirements.md`
2. Lancez le pipeline : `/factory`
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
| `/factory` | Pipeline complet (auto-detect greenfield V1 / brownfield V2+) |
| `/factory-quick` | Quick fix/tweak mineur (BMAD Quick Flow) |
| `/factory-intake` | Phase BREAK |
| `/factory-spec` | Phase MODEL |
| `/factory-plan` | Phase ACT (planning) |
| `/factory-build` | Phase ACT (build) |
| `/factory-qa` | Phase DEBRIEF |
| `/factory-resume` | Reprend après interruption |
| `/gate-check [0-5]` | Vérifie un gate |
| `/clean` | Remet le projet en état "starter" |
| `/status` | État du pipeline |
| `/reset [phase]` | Réinitialise une phase |
| `/help` | Aide complète |

### Quel workflow utiliser ?

| Situation | Commande | Description |
|-----------|----------|-------------|
| Nouveau projet | `/factory` | Pipeline complet greenfield (auto-detect) |
| Feature majeure (V2+) | `/factory` | Pipeline incremental brownfield (auto-detect) |
| Bug fix / tweak mineur | `/factory-quick` | Quick Flow avec detection conformite |

**Quick Flow** : Pour les modifications mineures qui ne changent pas le modele metier.
Si `/factory-quick` detecte que la modification impacte les specs, il propose automatiquement de generer un `requirements-N.md` et basculer vers `/factory`.

## Structure

```
├── input/              # Requirements (requirements.md, requirements-2.md...)
├── docs/               # Documentation générée
│   ├── specs/          # Spécifications (system, domain, api)
│   ├── adr/            # Architecture Decision Records
│   ├── planning/       # Structure versionnee
│   │   ├── v1/         # Version 1 (greenfield)
│   │   │   ├── epics.md
│   │   │   ├── us/     # User Stories
│   │   │   └── tasks/  # Tasks
│   │   └── v2/         # Version 2+ (brownfield)
│   ├── testing/        # Plan de tests
│   ├── qa/             # Rapports QA (report.md, report-v2.md...)
│   ├── release/        # Checklist release
│   └── factory/        # Logs du pipeline (state.json, log.md)
├── src/                # Code source généré (Clean Architecture supportée)
│   ├── domain/         # Entités, Value Objects (si Clean Arch)
│   ├── application/    # Use Cases, DTOs, Ports (si Clean Arch)
│   ├── infrastructure/ # Repositories, Adaptateurs (si Clean Arch)
│   └── ui/             # Composants React, Hooks (si Clean Arch)
├── tests/              # Tests générés
├── tools/              # Outils de validation
├── templates/
│   ├── claude-md/      # Templates memoire hierarchique CLAUDE.md
│   └── ...             # Autres templates (specs, planning, ADR)
└── .claude/            # Configuration Claude Code
    ├── skills/         # Skills du pipeline
    ├── agents/         # Définitions des agents
    ├── commands/       # Commands disponibles
    ├── rules/          # Règles de gouvernance
    └── hooks/          # Hooks de validation
```

## Evolution de projet (V2+)

Le pipeline supporte l'evolution incrementale via `/factory` (auto-detect greenfield/brownfield).
Creer `input/requirements-N.md` pour chaque nouvelle version. Voir `input/README.md` pour les conventions.

En V2+, les documents existants (brief, specs, ADR) sont edites, le planning est cree dans `docs/planning/vN/`.

## Invariants

1. **No Spec, No Code** : Pas de code sans specs validées
2. **No Task, No Commit** : Chaque commit référence TASK-XXXX

## Validation

```bash
node tools/validate-requirements.js  # Gate 0 : Valide requirements.md
node tools/validate-structure.js     # Gate 1 : Valide la structure projet
node tools/scan-secrets.js           # Gate 2 : Détecte secrets/PII
node tools/validate-code-quality.js  # Gate 4 : Valide code vs specs
node tools/validate-app-assembly.js  # Gate 4 : Valide assemblage App.tsx
node tools/validate-boundaries.js    # Gate 4 : Valide boundaries architecturales
node tools/export-release.js         # Gate 5 : Exporte le projet livrable
node tools/gate-check.js [0-5]       # Vérifie un gate complet (texte)
node tools/gate-check.js [0-5] --json # Vérifie un gate (JSON structuré)
node tools/verify-pipeline.js        # Vérification post-pipeline complète
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

Le pipeline peut tracer tous les evenements (9 types) pour debugging ou audit.

**Activation** dans `.claude/settings.json` : `"FACTORY_INSTRUMENTATION": "true"`

```bash
node tools/instrumentation/coverage.js            # Couverture pipeline
node tools/instrumentation/collector.js status     # Etat
node tools/instrumentation/reporter.js             # Rapport markdown
```

Output : `docs/factory/instrumentation.json` (append-only).

## Memoire hierarchique Claude Code

Guide et templates pour configurer la memoire hierarchique de Claude Code dans `templates/claude-md/`.
Voir `templates/claude-md/CLAUDE-MD-GUIDE.md` pour la documentation complete.

## License

MIT
