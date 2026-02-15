# CLAUDE.md — Spec-to-Code Factory

## Vision
Pipeline automatisé qui transforme un requirements.md en projet livrable.

## Workflow obligatoire
```
       BREAK → MODEL → ACT → DEBRIEF
  │      │        │       │       │
Gate 0  Gate 1  Gate 2  Gate 3+4  Gate 5
```

### Validations par Gate
| Gate | Phase | Validations |
|------|-------|-------------|
| 0 | →BREAK | **requirements.md complet** (12 sections obligatoires) |
| 1 | BREAK→MODEL | Fichiers brief/scope/acceptance + **structure projet** |
| 2 | MODEL→ACT | Specs + ADR + **scan secrets/PII** |
| 3 | PLAN→BUILD | Epics + US + Tasks avec DoD |
| 4 | BUILD→QA | Tests passants + **code quality strict** + **app assembly** + **boundary check** |
| 5 | QA→RELEASE | QA report + checklist + CHANGELOG + **export release** |

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
- Epics : `EPIC-XXX` (dans `docs/planning/epics.md`)
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
- `/factory` : Pipeline complet (auto-detect greenfield V1 / brownfield V2+)
- `/factory-quick` : Quick fix/tweak sans pipeline complet (BMAD Quick Flow)
- `/factory-resume` : Reprend le pipeline apres interruption
- `/gate-check [0-5]` : Verifie un gate
- `/clean` : Remet le projet en état "starter" (supprime tous les artefacts)

### Commands
- `/status` : État du pipeline (dashboard détaillé)
- `/reset [phase]` : Réinitialise une phase
- `/help` : Affiche l'aide

## Outils de support
- `tools/validate-requirements.js` : Validation requirements.md complet (Gate 0)
- `tools/factory-state.js` : Gestion de l'etat machine-readable + compteurs
- `tools/factory-reset.js` : Reset des phases
- `tools/detect-requirements.js` : Detection automatique du dernier requirements-N.md
- `tools/get-planning-version.js` : Obtenir le repertoire planning actif (vN)
- `tools/set-current-task.js` : Tracking de la task courante
- `tools/validate-file-scope.js` : Validation anti-derive
- `tools/validate-code-quality.js` : Validation code vs specs (mode STRICT)
- `tools/validate-structure.js` : Validation structure projet (Gate 1)
- `tools/scan-secrets.js` : Scan secrets et PII (Gate 2)
- `tools/validate-app-assembly.js` : Validation assemblage App.tsx (Gate 4) - **supporte Clean Arch**
- `tools/validate-boundaries.js` : Validation des regles d'import inter-couches (Gate 4)
- `tools/export-release.js` : Export du projet livrable (Gate 5)
- `tools/verify-pipeline.js` : Verification post-pipeline complete (toutes phases)

## Permissions simplifiées

Les permissions dans `.claude/settings.json` ont été simplifiées pour réduire les prompts :

```json
"permissions": {
  "allow": ["Read(*)", "Write(*)", "Edit(*)", "Glob(*)", "Grep(*)", "Bash(node tools/*)", ...],
  "ask": ["Bash(git add:*)", "Bash(git commit:*)"],
  "deny": ["Read(.env)", "Write(.env)", ...]
}
```

Seuls les commits git demandent confirmation. Les opérations Read/Write/Edit sont autorisées par défaut.

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

## Instrumentation (optionnel)

Le pipeline peut tracer tous les événements pour debugging ou audit.

**Activation** dans `.claude/settings.json` :
```json
"env": {
  "FACTORY_INSTRUMENTATION": "true"
}
```

**Événements trackés** :
| Type | Description | Source |
|------|-------------|--------|
| `tool_invocation` | Invocation d'un tool | Hooks PreToolUse |
| `file_written` | Fichier écrit | Hooks PostToolUse |
| `template_used` | Template lu depuis templates/ | Hooks PreToolUse (Read) |
| `gate_checked` | Vérification gate (0-5) | gate-check.js |
| `skill_invoked` | Skill invoquée | Skills factory-* |
| `agent_delegated` | Délégation agent | Skills factory-* |
| `phase_started` | Début de phase | Skills factory-* |
| `phase_completed` | Fin de phase | factory-log.js |
| `task_completed` | Tâche implémentée | set-current-task.js |

**Commandes** :
```bash
node tools/instrumentation/collector.js status       # État
node tools/instrumentation/collector.js summary      # Résumé
node tools/instrumentation/collector.js reset        # Réinitialiser
node tools/instrumentation/collector.js template     # Enregistrer usage template
node tools/instrumentation/coverage.js               # Couverture pipeline
node tools/instrumentation/reporter.js               # Rapport markdown
```

**Output** :
- `docs/factory/instrumentation.json` - Événements (append-only)
- `docs/factory/coverage-report.md` - Rapport de couverture

**Configuration centralisée** : `tools/instrumentation/config.js`
- Namespace `claude.env` pour toutes les variables factory
- Chargé automatiquement depuis `.claude/settings.json`

## Validation Code Quality (Gate 4)

Le pipeline inclut une validation stricte du code généré contre les specs :

| Critère | Seuil | Bloquant |
|---------|-------|----------|
| Couverture de tests | ≥ 80% | Oui |
| Types TypeScript | Strict (erreurs bloquantes) | Oui |
| Conformité API specs | 100% | Oui |
| Conformité Domain specs | 100% | Oui |
| App assembly (composants/hooks) | ≥ 50% | Oui |
| Boundaries architecturales | 0 violation | Oui |

**Support Clean Architecture** : Les chemins sont lus depuis `docs/factory/project-config.json`.
Si le fichier n'existe pas, les valeurs par défaut incluent `src/App.tsx` et `src/ui/App.tsx`.

Usage : `node tools/validate-code-quality.js --gate4`

## Configuration Projet (project-config.json)

Fichier généré par l'agent Architect pendant la phase MODEL.
Centralise les chemins et seuils de validation pour le projet.

**Emplacement** : `docs/factory/project-config.json`
**Template** : `templates/specs/project-config.json`
**Lib** : `tools/lib/project-config.js`

```json
{
  "paths": {
    "app": "src/ui/App.tsx",
    "components": "src/ui/components/",
    "hooks": "src/application/",
    "constants": "src/domain/constants.ts"
  },
  "validation": {
    "appAssembly": { "minLines": 10, "minComponentCoverage": 0.5 },
    "codeQuality": { "testCoverage": 80, "noMagicNumbers": true }
  }
}
```

Les tools (`gate-check.js`, `validate-*.js`) lisent cette config au lieu d'avoir des valeurs hardcodées.

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

## Export Release (Gate 5)

Le pipeline sépare automatiquement le **projet livrable** de l'**infrastructure factory**.

**Exécution** :
```bash
node tools/export-release.js [--output <dir>] [--dry-run] [--validate]
```

**Méthode** : Exclusion-based (auto-découverte)
- Tout ce qui n'est PAS factory est exporté automatiquement
- Pas de liste hardcodée = générique pour tout projet

**Exclusions factory** (toujours exclues) :
| Type | Contenu |
|------|---------|
| Config CC | `.claude/` (agents, skills, rules, settings) |
| Specs | `docs/` (specs, planning, ADR, QA) |
| Outils | `tools/`, `templates/`, `input/` |
| Fichiers | `CLAUDE.md`, `.env`, `package-lock.json` |
| Générés | `node_modules/`, `dist/`, `coverage/`, `release/` |

**README enrichi** : Généré automatiquement depuis les specs :
- `docs/brief.md` → Section "À propos"
- `docs/specs/api.md` → Section "API"
- `docs/specs/domain.md` → Section "Architecture"
- `docs/adr/*.md` → Section "Décisions techniques"

**Output** :
- `release/` : Dossier contenant le projet livrable
- `docs/factory/release-manifest.json` : Traçabilité de l'export

## Evolution de projet (V2+)

Le pipeline supporte l'evolution incrementale d'un projet existant.

### Modes
| Mode | Commande | Usage |
|------|----------|-------|
| **Greenfield** | `/factory` | Nouveau projet (V1) — auto-detect |
| **Brownfield** | `/factory` | Evolution (V2, V3...) — auto-detect |

### Structure versionnee
```
docs/planning/
  v1/           # Cree par /factory
    epics.md
    us/
    tasks/
  v2/           # Cree par /factory
    epics.md
    us/
    tasks/
```

### Requirements multiples
```
input/
  requirements.md      # V1 (initial)
  requirements-2.md    # V2 (evolution)
  requirements-3.md    # V3 (evolution)
```

### Strategie par type de document
| Document | V1 | V2+ |
|----------|----|----|
| brief, scope, acceptance | CREATE | EDIT (enrichir) |
| specs (system, domain, api) | CREATE | EDIT (mettre a jour) |
| planning | CREATE v1/ | CREATE v2/ |
| ADR | CREATE | CREATE (nouveau) + EDIT status ancien |
| QA reports | CREATE | CREATE (report-vN.md) |
| CHANGELOG | CREATE | EDIT (prepend) |

### Compteurs continus
Les compteurs US/TASK sont **continus** entre versions :
- V1 : TASK-0001 a TASK-0005
- V2 : TASK-0006 a TASK-0010

```bash
node tools/factory-state.js counter task next  # Incremente et retourne
node tools/factory-state.js counter task get   # Valeur actuelle
```

## Quick Flow (BMAD)

Pour les modifications mineures sans repasser par le pipeline complet.

### Quand utiliser Quick vs Evolve

| Critere | `/factory-quick` | `/factory` |
|---------|------------------|-----------|
| Fichiers impactes | <= 3 | > 3 |
| Nouveau concept metier | Non | Oui |
| Nouvel endpoint API | Non | Oui |
| Nouvelle regle business | Non | Oui |
| Modification specs | Non | Oui |

### Detection automatique

Si `/factory-quick` detecte que la modification necessite une mise a jour des specs :

1. **Option A** : Generer `requirements-N.md` automatiquement (recommande)
2. **Option B** : Creer manuellement puis `/factory`
3. **Option C** : Forcer Quick (risque de derive)

### Workflow Quick

```
Demande utilisateur
       │
       v
  Analyse conformite specs
       │
       ├── Conforme → TASK directe → Implement → Gate 4 light → CHANGELOG
       │
       └── Non-conforme → Proposer options A/B/C
                              │
                              └── Option A → Generer requirements-N.md → /factory
```

## Limites
- Stack-agnostic (projet cible defini par ADR)
- Pas de CI/CD integre (GitHub Actions a ajouter manuellement)

## Templates de structure

Les agents utilisent ces templates pour générer des documents conformes :

### Phase BREAK (Analyst)
| Template | Output |
|----------|--------|
| `templates/break/brief-template.md` | `docs/brief.md` |
| `templates/break/scope-template.md` | `docs/scope.md` |
| `templates/break/acceptance-template.md` | `docs/acceptance.md` |
| `templates/break/questions-template.md` | `docs/factory/questions.md` |

### Phase MODEL (PM, Architect, Rules-Memory)
| Template | Agent | Output |
|----------|-------|--------|
| `templates/specs/system.md` | PM | `docs/specs/system.md` |
| `templates/specs/domain.md` | PM | `docs/specs/domain.md` |
| `templates/specs/api.md` | Architect | `docs/specs/api.md` |
| `templates/specs/project-config.json` | Architect | `docs/factory/project-config.json` |
| `templates/adr/ADR-template.md` | Architect | `docs/adr/ADR-*.md` |
| `templates/rule.md` | Rules-Memory | `.claude/rules/*.md` |

### Phase ACT-PLAN (Scrum Master)
| Template | Output |
|----------|--------|
| `templates/planning/epics-template.md` | `docs/planning/vN/epics.md` |
| `templates/planning/US-template.md` | `docs/planning/vN/us/US-*.md` |
| `templates/planning/task-template.md` | `docs/planning/vN/tasks/TASK-*.md` |
| `templates/planning/task-assembly-template.md` | `docs/planning/vN/tasks/TASK-*-app-assembly.md` |
| `templates/testing/plan.md` | `docs/testing/plan.md` |

> **Note** : `vN` = version courante (`v1`, `v2`...). Utiliser `node tools/get-planning-version.js` pour obtenir le chemin.

### Phase DEBRIEF (QA)
| Template | Output |
|----------|--------|
| `templates/qa/report-template.md` | `docs/qa/report.md` |
| `templates/release/checklist-template.md` | `docs/release/checklist.md` |
| `templates/release/CHANGELOG-template.md` | `CHANGELOG.md` |
| `templates/release/README.template.md` | `release/README.md` |

## Règles par domaine
- `.claude/rules/factory-invariants.md` : Invariants pipeline
- `.claude/rules/security-baseline.md` : Sécurité baseline
- `.claude/rules/*.md` : Règles générées selon projet (basées sur requirements.md)
