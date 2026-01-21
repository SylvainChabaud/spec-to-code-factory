# Plan V1 — Spec-to-Code Factory (Vue d'ensemble)

> Ce fichier contient les décisions validées et la structure cible.
> Pour les détails d'implémentation, voir les fichiers plan-phase-*.md

## Décisions validées

| Décision | Choix |
|----------|-------|
| Orchestration | **Skills** (avec `context: fork`) + **Agents** (subagents) |
| Validation | Gate bloquante à chaque phase (hooks + tools Node.js) |
| Priorité V1 | Templates + Structure d'abord |
| Stack outils | **Node.js** |
| Méthodologie | **BMAD-METHOD** adapté + **Claude Code best practices** |
| **Pattern Agents** | **Persona BMAD** (Identity, Style, Principles) + **Actions Critiques** |
| **Format Rules** | **Spec Anthropic** : `paths` avec guillemets, globales sans `paths` |

## Structure cible finale

```
spec-to-code-factory/
├─ CLAUDE.md                           # Mémoire projet
├─ package.json                        # Node.js (outils)
├─ README.md
├─ CHANGELOG.md
│
├─ input/
│  ├─ requirements.template.md
│  ├─ adr-initial.md                   # OPTIONNEL
│  ├─ wireframes/                      # OPTIONNEL
│  └─ api-examples/                    # OPTIONNEL
│
├─ docs/
│  ├─ brief.md, scope.md, acceptance.md
│  ├─ specs/ (system.md, domain.md, api.md)
│  ├─ adr/
│  ├─ planning/ (epics.md, us/, tasks/)
│  ├─ testing/, qa/, release/
│  └─ factory/ (log.md, questions.md)
│
├─ .claude/
│  ├─ settings.json
│  ├─ skills/ (7 skills)
│  ├─ agents/ (7 agents)              # orchestrator supprimé
│  ├─ commands/ (3 commands)
│  ├─ rules/ (2 fixes + dynamiques)
│  └─ hooks/ (3 hooks Node.js)
│
├─ tools/ (4 outils Node.js)
├─ src/
└─ tests/
```

## Architecture Skills ↔ Agents (sans nesting)

> **Contrainte Anthropic** : Les subagents ne peuvent pas spawner d'autres subagents.
> Solution : factory-run invoque les skills directement, chaque skill gère son propre fork.

```
/factory-run (PAS de fork, orchestration simple)
    │
    ├── Invoque /factory-intake
    │       └── context: fork → Task(subagent_type: "analyst")
    │
    ├── Invoque /factory-spec
    │       └── context: fork → Task(pm) + Task(architect) + Task(rules-memory)
    │
    ├── Invoque /factory-plan
    │       └── context: fork → Task(subagent_type: "scrum-master")
    │
    ├── Invoque /factory-build
    │       └── context: fork → Task(subagent_type: "developer") × N
    │
    └── Invoque /factory-qa
            └── context: fork → Task(subagent_type: "qa")
```

**Agents (7)** : analyst, pm, architect, rules-memory, scrum-master, developer, qa

## Gates (5 bloquantes)

| Gate | Phase | Vérifie |
|------|-------|---------|
| **Gate 1** | BREAK → MODEL | brief.md + scope.md + acceptance.md (sections OK) |
| **Gate 2** | MODEL → ACT | specs/*.md + ADR-0001-*.md |
| **Gate 3** | Planning → Build | epics.md + ≥1 US + ≥1 TASK avec DoD |
| **Gate 4** | Build → QA | Tests critiques passants |
| **Gate 5** | QA → Release | qa/report.md + release/checklist.md + CHANGELOG.md |

## Invariants (ABSOLUS)

1. **No Spec, No Code** : Aucun code sans specs + tasks validés
2. **No Task, No Commit** : Chaque commit référence une TASK-XXXX
3. **Anti-dérive** : Implémentation strictement alignée au plan

## Definition of Done V1

- [ ] Projet nettoyé (pas de fichiers obsolètes)
- [ ] Structure conforme au schéma cible
- [ ] **14 templates** créés avec sections obligatoires
- [ ] **7 Skills** fonctionnels (6 avec `context: fork`, 1 orchestrateur)
- [ ] **7 Agents** avec **Persona BMAD** + **Actions Critiques** + anti-dérive
- [ ] **3 Commands** simples
- [ ] **2 Rules fixes** + template `templates/rule.md` (spec Anthropic)
- [ ] **5 gates** bloquantes avec validation sections
- [ ] **3 Hooks** Node.js
- [ ] **4 Outils** Node.js
- [ ] CLAUDE.md enrichi
- [ ] Cycle complet testé sur projet démo

## Phases d'implémentation

| Phase | Fichier détail | Description |
|-------|----------------|-------------|
| 0 | `plan-phase-0.md` | Nettoyage du starter |
| 1 | `plan-phase-1.md` | Templates + Structure |
| 2 | `plan-phase-2.md` | Skills + Agents + Commands |
| 3 | `plan-phase-3.md` | Outils Node.js + Hooks |
| 4 | `plan-phase-4.md` | Test end-to-end |
