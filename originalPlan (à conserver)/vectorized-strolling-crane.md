# Plan V1 — Spec-to-Code Factory (Boîte Noire)

> Basé sur les **meilleures pratiques officielles Claude Code** + inspiration [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)

## Décisions validées

| Décision | Choix |
|----------|-------|
| Orchestration | **Skills** (avec `context: fork`) + **Agents** (subagents) |
| Validation | Gate bloquante à chaque phase (hooks + tools Node.js) |
| Priorité V1 | Templates + Structure d'abord |
| Stack outils | **Node.js** |
| Méthodologie | **BMAD-METHOD** adapté + **Claude Code best practices** |

## Sources officielles

- [Claude Code Memory Management](https://code.claude.com/docs/en/memory)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [Claude Code Settings](https://code.claude.com/docs/en/settings)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents)

---

## Configuration settings.json (best practices Anthropic)

### Structure officielle

```json
{
  "permissions": {
    "allow": [],      // Autorisé sans confirmation
    "ask": [],        // Demande confirmation
    "deny": []        // Bloqué (⚠️ utiliser hooks pour fiabilité)
  },
  "sandbox": {
    "enabled": true,
    "network": {},
    "autoAllowBashIfSandboxed": true
  },
  "hooks": {},
  "env": {}
}
```

### Ordre de précédence (du plus fort au plus faible)

1. **Managed** (`C:\Program Files\ClaudeCode\managed-settings.json`) — Admin
2. **CLI arguments**
3. **Local** (`.claude/settings.local.json`) — Gitignored
4. **Project** (`.claude/settings.json`) — Versionné
5. **User** (`~/.claude/settings.json`) — Personnel

### settings.json recommandé pour la Factory

```json
{
  "permissions": {
    "allow": [
      "Read(docs/**)",
      "Read(input/**)",
      "Read(.claude/**)",
      "Read(src/**)",
      "Read(tests/**)",
      "Glob(*)",
      "Grep(*)",
      "Bash(node tools/*)",
      "Bash(npm run:*)",
      "Bash(npm test:*)"
    ],
    "ask": [
      "Write(*)",
      "Edit(*)",
      "Bash(git *)"
    ],
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(./secrets/**)",
      "Bash(rm -rf:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "WebFetch"
    ]
  },
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "network": {
      "allowLocalBinding": false
    }
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "node .claude/hooks/pretooluse-security.js"
      }
    ],
    "Stop": [
      {
        "command": "node tools/gate-check.js"
      }
    ]
  },
  "env": {
    "NODE_ENV": "development"
  }
}
```

### settings.local.json (gitignored)

```json
{
  "permissions": {
    "allow": [
      "Bash(code *)"
    ]
  },
  "env": {
    "DEBUG": "true"
  }
}
```

### ⚠️ Note importante sur deny

> Les patterns `deny` ont des [bugs connus](https://github.com/anthropics/claude-code/issues/6699).
> Pour une sécurité fiable, utiliser des **hooks PreToolUse** qui retournent exit code 2.

---

## Invocation automatique : mot-clé PROACTIVELY

### Principe

Le mot-clé `PROACTIVELY` (ou `MUST BE USED`) dans la description d'un agent/skill déclenche son **invocation automatique** par Claude.

### Syntaxe

```yaml
---
name: security-reviewer
description: "PROACTIVELY reviews code for security vulnerabilities when modifying auth or data handling."
---
```

### Règles pour les agents de la Factory

| Agent | Invocation | Description |
|-------|------------|-------------|
| **Orchestrator** | Manuelle (`/factory-*`) | Pas de PROACTIVELY |
| **Analyst** | Déléguée | Appelé par Orchestrator |
| **PM, Architect, etc.** | Déléguée | Appelés par Orchestrator |
| **Developer** | PROACTIVELY possible | "PROACTIVELY implements TASK-*.md files when found" |
| **QA** | PROACTIVELY possible | "PROACTIVELY runs tests when src/ files are modified" |

### Exemple pour Developer agent

```yaml
---
name: developer
description: "PROACTIVELY implements tasks from docs/planning/tasks/TASK-*.md. Writes code in src/ and tests in tests/. Follows specs and ADR."
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---
```

### L'agent Rules/Memory doit gérer cela

L'agent **Rules/Memory** doit décider pour chaque agent généré :
- Faut-il `PROACTIVELY` ? (basé sur le workflow du projet)
- Quels `allowed-tools` ?
- Quels `paths` conditionnels pour les rules ?

---

## Phase 0 : Nettoyage du starter (NOUVEAU)

### Fichiers à SUPPRIMER

| Fichier/Dossier | Raison |
|-----------------|--------|
| `prompts/` (tout le dossier) | Remplacé par agents + commands |
| `tasks/` (tout le dossier) | Remplacé par `docs/planning/` |
| `.claude/hooks/*.py` | Migrés vers Node.js |
| `tools/quality_gate.py` | Migré vers Node.js |
| `CLAUDE.local.md.template` | Sera régénéré proprement |
| `docs/requirements.md` | Déplacé vers `input/` |
| `docs/runbooks/` | Intégré dans `docs/qa/` |
| `CAHIER DES CHARGES` | Document source, pas dans la boîte noire |

### Fichiers à CONSERVER et MODIFIER

| Fichier | Action |
|---------|--------|
| `.claude/settings.json` | Modifier (chemins Node.js) |
| `.claude/rules/*.md` | Conserver (enrichir si besoin) |
| `CLAUDE.md` | Modifier (ajouter workflow BMAD) |
| `docs/adr/` | Conserver structure |
| `.gitignore` | Conserver |
| `README.md` | Modifier (nouvelle doc) |

---

## Hiérarchie mémoire Claude Code (officielle)

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTERPRISE (organisation)                                        │
│ C:\Program Files\ClaudeCode\CLAUDE.md                           │
│ → Standards, sécurité, compliance (tous les utilisateurs)       │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER (personnel)                                                 │
│ ~/.claude/CLAUDE.md + ~/.claude/rules/                          │
│ → Préférences personnelles (tous les projets)                   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PROJECT (équipe)                                                 │
│ ./CLAUDE.md + .claude/rules/ + .claude/skills/ + .claude/agents/│
│ → Conventions projet (versionné Git)                            │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ LOCAL (individuel)                                               │
│ ./CLAUDE.local.md                                               │
│ → Notes perso projet (auto-gitignored)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Structure cible finale (basée sur Claude Code best practices)

```
spec-to-code-factory/
│
├─ CLAUDE.md                           # Mémoire projet (constitution)
├─ CLAUDE.local.md.template            # Template mémoire locale
├─ package.json                        # Node.js (outils)
├─ README.md                           # Documentation
├─ CHANGELOG.md                        # Historique releases
│
├─ input/
│  ├─ requirements.template.md         # Template entrée utilisateur
│  ├─ adr-initial.md                   # OPTIONNEL : stack/décisions imposées
│  ├─ wireframes/                      # OPTIONNEL : maquettes
│  └─ api-examples/                    # OPTIONNEL : contrats existants
│
├─ docs/                               # Artefacts générés par le pipeline
│  ├─ brief.md
│  ├─ scope.md
│  ├─ acceptance.md
│  ├─ specs/
│  │  ├─ system.md
│  │  ├─ domain.md
│  │  └─ api.md
│  ├─ adr/
│  │  └─ ADR-0001-template.md
│  ├─ planning/
│  │  ├─ epics.md
│  │  ├─ us/
│  │  │  └─ US-template.md
│  │  └─ tasks/
│  │     └─ TASK-template.md
│  ├─ testing/
│  │  └─ plan.md
│  ├─ qa/
│  │  └─ report.md
│  ├─ release/
│  │  └─ checklist.md
│  └─ factory/                         # Traçabilité pipeline
│     ├─ log.md                        # Journal de génération
│     └─ questions.md                  # Questions non résolues
│
├─ .claude/
│  │
│  ├─ settings.json                    # Hooks + permissions
│  ├─ settings.local.json              # Surcharges locales (gitignored)
│  │
│  ├─ skills/                          # SKILLS = Workflows invocables
│  │  │
│  │  ├─ factory-intake/               # /factory-intake
│  │  │  └─ SKILL.md                   # context: fork, agent: general-purpose
│  │  │
│  │  ├─ factory-spec/                 # /factory-spec
│  │  │  └─ SKILL.md
│  │  │
│  │  ├─ factory-plan/                 # /factory-plan
│  │  │  └─ SKILL.md
│  │  │
│  │  ├─ factory-build/                # /factory-build
│  │  │  └─ SKILL.md
│  │  │
│  │  ├─ factory-qa/                   # /factory-qa
│  │  │  └─ SKILL.md
│  │  │
│  │  └─ gate-check/                   # /gate-check [1-5]
│  │     └─ SKILL.md
│  │
│  ├─ agents/                          # AGENTS = Rôles spécialisés (subagents)
│  │  ├─ orchestrator.md               # Master : délègue aux autres
│  │  ├─ analyst.md                    # BREAK : normalise besoin
│  │  ├─ pm.md                         # MODEL : specs fonctionnelles
│  │  ├─ architect.md                  # MODEL : specs techniques + ADR
│  │  ├─ rules-memory.md               # MODEL : génère rules + CLAUDE.md
│  │  ├─ scrum-master.md               # ACT : planning (epics/US/tasks)
│  │  ├─ developer.md                  # ACT : implémente task-by-task
│  │  └─ qa.md                         # DEBRIEF : tests + release
│  │
│  ├─ commands/                        # COMMANDS = Actions simples
│  │  ├─ status.md                     # /status : état du pipeline
│  │  ├─ reset.md                      # /reset : réinitialise une phase
│  │  └─ help.md                       # /help : affiche l'aide
│  │
│  ├─ rules/                           # RULES = Contraintes (noms LIBRES)
│  │  │
│  │  ├─ factory-invariants.md         # FIXE : No Spec No Code, No Task No Commit
│  │  ├─ security-baseline.md          # FIXE : secrets, PII, réseau
│  │  │
│  │  └─ [générées par Rules/Memory]   # DYNAMIQUE : selon projet
│  │     # Exemples :
│  │     # - checkout-flow.md (e-commerce)
│  │     # - api-versioning.md (API)
│  │     # - offline-sync.md (mobile)
│  │     #
│  │     # Avec paths conditionnels si pertinent :
│  │     # ---
│  │     # paths:
│  │     #   - "src/payments/**"
│  │     # ---
│  │
│  └─ hooks/                           # HOOKS = Scripts déterministes
│     ├─ pretooluse-security.js        # Bloque commandes dangereuses
│     ├─ stop-gate.js                  # Vérifie gate à chaque fin
│     └─ userpromptsubmit-validate.js  # Valide format prompt
│
├─ tools/                              # Outils Node.js
│  ├─ gate-check.js                    # Vérifie un gate (1-5)
│  ├─ validate-structure.js            # Vérifie présence fichiers
│  └─ scan-secrets.js                  # Détecte secrets/PII
│
├─ src/                                # Code généré par Developer
└─ tests/                              # Tests générés par Developer
```

---

## Différence Skills vs Agents vs Commands

| Composant | Format | Invocation | Contexte | Usage Factory |
|-----------|--------|------------|----------|---------------|
| **Skills** | `SKILL.md` avec YAML frontmatter | `/skill-name` ou auto | `context: fork` = isolé | Phases (intake, spec, plan, build, qa) |
| **Agents** | `.md` simple | Délégation par skill/agent | Toujours isolé | Rôles (Analyst, PM, Architect...) |
| **Commands** | `.md` simple | `/command-name` | Contexte actuel | Actions simples (status, reset, help) |

### Exemple de SKILL.md (factory-intake)

```yaml
---
name: factory-intake
description: Phase BREAK - Normalise les requirements en brief/scope/acceptance
context: fork
agent: general-purpose
allowed-tools: Read, Write, Glob, Grep, Task
argument-hint: [requirements-file]
hooks:
  on-invoke: |
    node tools/gate-check.js 0
---

# Factory Intake - Phase BREAK

Tu es l'Orchestrator de la phase BREAK.

## Ta mission
1. Lire @input/requirements.md (ou le fichier passé en argument)
2. Déléguer à l'agent Analyst (@.claude/agents/analyst.md)
3. Vérifier que les outputs sont générés :
   - docs/brief.md
   - docs/scope.md
   - docs/acceptance.md
4. Exécuter Gate 1 : `node tools/gate-check.js 1`
5. Retourner un résumé au contexte principal

## Document Sharding
L'Analyst reçoit UNIQUEMENT :
- input/requirements.md
- docs/brief.md (template)

## Outputs attendus
$ARGUMENTS
```

### Exemple de Rule avec paths (backend.md)

```yaml
---
paths:
  - "src/api/**/*.ts"
  - "src/services/**/*.ts"
---

# Backend Rules

Ces règles s'appliquent UNIQUEMENT aux fichiers backend.

- Valider systématiquement les entrées (types/champs requis)
- Erreurs explicites et traçables, sans données sensibles dans les logs
- Préférer des fonctions pures et isoler les effets de bord
- Utiliser les patterns définis dans @docs/adr/ADR-0001-*.md
```

---

## Agents (8 agents — Orchestrateur + 7 spécialisés)

### Principe clé : Gestion du contexte via subagents

> *"Each subagent runs in its own context window [...] This keeps your main conversation clean and focused on the big picture"* — [Claude Code Docs](https://code.claude.com/docs/en/sub-agents)

> *"Let the main agent decide when and how to delegate work to copies of itself. This gives all the context-saving benefits without the drawbacks"* — [Shrivu Shankar](https://blog.sshh.io/p/how-i-use-every-claude-code-feature)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Master)                     │
│  - Garde le contexte "big picture" propre                   │
│  - Délègue chaque phase à un subagent dédié                 │
│  - Récupère uniquement le résumé/outputs de chaque agent    │
│  - Vérifie les gates avant de passer à la phase suivante    │
└─────────────────────────────────────────────────────────────┘
         │
         ├──► Analyst (contexte isolé)
         ├──► PM (contexte isolé)
         ├──► Architect (contexte isolé)
         ├──► Rules/Memory (contexte isolé)
         ├──► Scrum Master (contexte isolé)
         ├──► Developer (contexte isolé) ──► peut lancer N subagents pour N tasks
         └──► QA (contexte isolé)
```

### Mapping final (8 agents)

| # | Agent | Fichier | Rôle | Inputs | Outputs |
|---|-------|---------|------|--------|---------|
| 0 | **Orchestrator** | `.claude/agents/orchestrator.md` | **Orchestre le pipeline, délègue aux subagents, vérifie les gates** | Commande utilisateur | Délègue + résumés |
| 1 | **Analyst** | `.claude/agents/analyst.md` | BREAK : Normalise le besoin | `input/requirements.md` | `docs/brief.md`, `docs/scope.md`, `docs/acceptance.md` |
| 2 | **PM** | `.claude/agents/pm.md` | MODEL : Specs fonctionnelles | `docs/brief.md`, `docs/scope.md` | `docs/specs/system.md`, `docs/specs/domain.md` |
| 3 | **Architect** | `.claude/agents/architect.md` | MODEL : Specs techniques + ADR | `docs/specs/system.md`, `docs/specs/domain.md` | `docs/specs/api.md`, `docs/adr/ADR-*.md` |
| 4 | **Rules/Memory** | `.claude/agents/rules-memory.md` | MODEL : Génère rules + mémoire | `docs/adr/*`, `docs/specs/*` | `.claude/rules/*`, `CLAUDE.md` (enrichi) |
| 5 | **Scrum Master** | `.claude/agents/scrum-master.md` | ACT : Planning | `docs/specs/*`, `docs/adr/*` | `docs/planning/epics.md`, `docs/planning/us/*`, `docs/planning/tasks/*` |
| 6 | **Developer** | `.claude/agents/developer.md` | ACT : Implémente task-by-task | `docs/planning/tasks/TASK-*.md` | `src/*`, `tests/*` |
| 7 | **QA** | `.claude/agents/qa.md` | DEBRIEF : Tests + release | `tests/*`, `src/*`, `docs/*` | `docs/qa/report.md`, `docs/release/checklist.md`, `CHANGELOG.md` |

### Principe BMAD : Document Sharding

Chaque agent reçoit uniquement les documents nécessaires à sa tâche (pas tout le contexte) :
- Évite les hallucinations
- Optimise les tokens
- Maintient la cohérence

---

## Workflow complet (Orchestrator + 7 subagents)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR (Master)                       │
│  - Contexte principal propre (big picture)                      │
│  - Délègue à chaque subagent (contexte isolé)                   │
│  - Récupère résumés, vérifie gates, passe à la phase suivante   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    BREAK      │    │    MODEL      │    │     ACT       │    ...
│  (Analyst)    │───►│ (PM+Arch+Rul) │───►│ (SM+Dev)      │───► QA
│  Gate 1       │    │  Gate 2       │    │  Gate 3+4     │    Gate 5
└───────────────┘    └───────────────┘    └───────────────┘

Détail des phases :

BREAK ──────────────────────────────────────────────────────────────
  Orchestrator ──► délègue à Analyst (subagent, contexte isolé)
  Analyst : input/requirements.md ──► brief + scope + acceptance
  Orchestrator : récupère résumé, vérifie Gate 1

MODEL ──────────────────────────────────────────────────────────────
  Orchestrator ──► délègue à PM (subagent)
  PM : brief ──► specs/system + domain
  Orchestrator ──► délègue à Architect (subagent)
  Architect : specs ──► api + ADR
  Orchestrator ──► délègue à Rules/Memory (subagent)
  Rules/Memory : ADR + specs ──► .claude/rules/* + CLAUDE.md
  Orchestrator : récupère résumés, vérifie Gate 2

ACT ────────────────────────────────────────────────────────────────
  Orchestrator ──► délègue à Scrum Master (subagent)
  Scrum Master : specs + ADR ──► epics + US + tasks
  Orchestrator : vérifie Gate 3

  Pour chaque TASK :
    Orchestrator ──► délègue à Developer (subagent)
    Developer : TASK-*.md ──► src/* + tests/*
  Orchestrator : vérifie Gate 4

DEBRIEF ────────────────────────────────────────────────────────────
  Orchestrator ──► délègue à QA (subagent)
  QA : tests + src ──► qa/report + release/checklist + CHANGELOG
  Orchestrator : vérifie Gate 5

                        ✅ LIVRABLE
```

---

## Plan d'implémentation V1

### Phase 0 : Nettoyage (PRIORITAIRE)

```
0.1 Supprimer : prompts/, tasks/, CAHIER DES CHARGES
0.2 Supprimer : .claude/hooks/*.py, tools/quality_gate.py
0.3 Supprimer : docs/requirements.md, docs/runbooks/
0.4 Créer structure vide : input/, docs/specs/, docs/planning/, docs/qa/, docs/release/, docs/testing/
```

### Phase 1 : Templates + Structure

```
1.1 Créer input/requirements.template.md
1.2 Créer docs/brief.md (enrichi)
1.3 Créer docs/scope.md
1.4 Créer docs/acceptance.md
1.5 Créer docs/specs/system.md
1.6 Créer docs/specs/domain.md
1.7 Créer docs/specs/api.md
1.8 Créer docs/planning/epics.md
1.9 Créer docs/planning/us/US-template.md
1.10 Créer docs/planning/tasks/TASK-template.md
1.11 Créer docs/testing/plan.md
1.12 Créer docs/qa/report.md
1.13 Créer docs/release/checklist.md
1.14 Créer docs/factory/log.md (template journal)
1.15 Créer docs/factory/questions.md (template questions)
```

### Phase 2 : Skills (6) + Agents (8) + Commands (3)

**Skills** (workflows avec `context: fork`) :
```
2.1 Créer .claude/skills/factory-intake/SKILL.md (BREAK → Analyst)
2.2 Créer .claude/skills/factory-spec/SKILL.md (MODEL → PM + Architect + Rules/Memory)
2.3 Créer .claude/skills/factory-plan/SKILL.md (ACT → Scrum Master)
2.4 Créer .claude/skills/factory-build/SKILL.md (ACT → Developer)
2.5 Créer .claude/skills/factory-qa/SKILL.md (DEBRIEF → QA)
2.6 Créer .claude/skills/factory-run/SKILL.md (pipeline complet)
2.7 Créer .claude/skills/gate-check/SKILL.md (vérifie gate 1-5)
```

**Agents** (subagents spécialisés) :
```
2.7 Créer .claude/agents/orchestrator.md (MASTER - orchestre tout)
2.8 Créer .claude/agents/analyst.md (BREAK)
2.9 Créer .claude/agents/pm.md (MODEL - specs fonctionnelles)
2.10 Créer .claude/agents/architect.md (MODEL - specs techniques)
2.11 Créer .claude/agents/rules-memory.md (MODEL - rules + CLAUDE.md)
2.12 Créer .claude/agents/scrum-master.md (ACT - planning)
2.13 Créer .claude/agents/developer.md (ACT - implémentation)
2.14 Créer .claude/agents/qa.md (DEBRIEF)
```

**Commands** (actions simples) :
```
2.15 Créer .claude/commands/status.md (/status)
2.16 Créer .claude/commands/reset.md (/reset)
2.17 Créer .claude/commands/help.md (/help)
```

**Rules** (générées dynamiquement par l'agent Rules/Memory) :
```
NOTE : Les rules ne sont PAS prédéfinies.
L'agent Rules/Memory les génère en fonction du projet (specs + ADR).

Exemples possibles selon le projet :
- E-commerce : checkout-flow.md, payment-security.md, product-catalog.md
- API REST : api-versioning.md, error-handling.md, rate-limiting.md
- App mobile : offline-sync.md, push-notifications.md, deep-linking.md

Seules règles fixes (boîte noire) :
2.18 Créer .claude/rules/factory-invariants.md (No Spec No Code, No Task No Commit)
2.19 Créer .claude/rules/security-baseline.md (secrets, PII, réseau)
```

### Phase 3 : Outils Node.js + Hooks

```
3.1 npm init -y
3.2 Créer tools/gate-check.js
3.3 Créer tools/validate-structure.js
3.4 Créer tools/scan-secrets.js
3.5 Créer .claude/hooks/pretooluse-security.js
3.6 Créer .claude/hooks/stop-gate.js
3.7 Mettre à jour .claude/settings.json
3.8 Mettre à jour CLAUDE.md
3.9 Mettre à jour README.md
```

### Phase 4 : Test end-to-end

```
4.1 Créer un input/requirements.md de test
4.2 Exécuter /factory:intake → vérifier Gate 1
4.3 Exécuter /factory:spec → vérifier Gate 2
4.4 Exécuter /factory:plan → vérifier Gate 3
4.5 Exécuter /factory:build (1 task) → vérifier Gate 4
4.6 Exécuter /factory:qa → vérifier Gate 5
4.7 Valider que le livrable est complet
```

---

## Gates (5 bloquantes)

| Gate | Phase | Vérifie |
|------|-------|---------|
| **Gate 1** | BREAK → MODEL | `docs/brief.md` + `docs/scope.md` + `docs/acceptance.md` existent et sections OK |
| **Gate 2** | MODEL → ACT | `docs/specs/system.md` + `docs/specs/domain.md` + `docs/adr/ADR-0001-*.md` existent |
| **Gate 3** | Planning → Build | `docs/planning/epics.md` + ≥1 US + ≥1 TASK avec DoD |
| **Gate 4** | Build → QA | Tests critiques présents et passants |
| **Gate 5** | QA → Release | `docs/qa/report.md` + `docs/release/checklist.md` + `CHANGELOG.md` existent |

---

## Améliorations pour maximiser le déterminisme

### 1. Journal de génération (traçabilité)
Ajouter `docs/factory/log.md` — historique des actions du pipeline :
```markdown
# Factory Log

## [2026-01-21 14:30] Phase BREAK
- Agent: Analyst
- Input: input/requirements.md (v1)
- Outputs: brief.md, scope.md, acceptance.md
- Hypothèses générées: 3 (voir brief.md#hypotheses)
- Gate 1: ✅ PASS
```

### 2. Gestion explicite des questions/hypothèses
L'agent **Analyst** doit :
1. Lire requirements.md
2. Identifier les manques
3. Générer **max 10 questions** (dans `docs/factory/questions.md`)
4. Si pas de réponse utilisateur → générer **hypothèses explicites** (dans `docs/brief.md#hypotheses`)
5. JAMAIS d'hypothèse implicite

### 3. Validation sections (pas juste présence fichiers)
Le tool `validate-structure.js` doit vérifier :
- Fichier existe ✅
- Sections obligatoires présentes ✅
- Sections non vides ✅

Exemple pour US-*.md :
```javascript
const requiredSections = [
  '## Contexte',
  '## Description',
  '## Critères d\'acceptation',
  '## Edge cases',
  '## Stratégie de tests',
  '## Impacts',
  '## Références'
];
```

### 4. Conventions de nommage strictes
Enforcer dans tools/validate-structure.js :
- `docs/planning/us/US-XXXX-*.md` (regex: `/^US-\d{4}/`)
- `docs/planning/tasks/TASK-XXXX-*.md` (regex: `/^TASK-\d{4}/`)
- `docs/adr/ADR-XXXX-*.md` (regex: `/^ADR-\d{4}/`)

### 5. Entrées optionnelles gérées
```
input/
├─ requirements.md              # OBLIGATOIRE
├─ requirements.template.md     # Template
├─ adr-initial.md               # OPTIONNEL : stack imposée
├─ wireframes/                  # OPTIONNEL : maquettes
│  └─ *.png, *.pdf, *.md
└─ api-examples/                # OPTIONNEL : contrats existants
   └─ *.json, *.yaml
```
L'agent Analyst doit vérifier ces entrées et les intégrer.

### 6. Hook PostToolUse (validation post-écriture)
```json
"hooks": {
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "command": "node .claude/hooks/posttooluse-validate.js"
    }
  ]
}
```
Ce hook vérifie que le fichier écrit respecte le format attendu.

### 7. Anti-dérive agentique (règle absolue)
Dans `factory-invariants.md` :
```markdown
# Invariants Factory (ABSOLUS)

## No Spec, No Code
Aucun code dans src/ sans :
- docs/specs/*.md validés
- docs/planning/tasks/TASK-*.md avec DoD

## No Task, No Commit
Chaque commit référence une TASK-XXXX

## Anti-dérive
- INTERDIT : ajouter fonctionnalités non demandées
- INTERDIT : refactor hors task dédiée
- INTERDIT : "amélioration" non planifiée
- OBLIGATOIRE : implémentation strictement alignée au plan
```

Dans chaque agent, ajouter :
```markdown
## Règles anti-dérive
Tu ne dois JAMAIS :
- Ajouter du code/fonctionnalités non prévus dans la task
- Modifier des fichiers hors scope de la task
- Proposer des "améliorations" non demandées
```

### 8. Traçabilité explicite TASK → US → EPIC
Template TASK-template.md :
```markdown
# TASK-XXXX — [Titre]

## Références
- **EPIC**: [EPIC-XXX](../../../docs/planning/epics.md#epic-xxx)
- **US**: [US-XXXX](../us/US-XXXX.md)
- **Specs**: [system.md](../../specs/system.md), [domain.md](../../specs/domain.md)
- **ADR**: [ADR-0001](../../adr/ADR-0001-*.md)
```

### 9. Classification des données (dans specs/system.md)
```markdown
## Classification des données

| Donnée | Sensibilité | RGPD | Chiffrement |
|--------|-------------|------|-------------|
| Email utilisateur | HAUTE | Oui | En transit + repos |
| Préférences UI | FAIBLE | Non | Non requis |
| Mot de passe | CRITIQUE | Oui | Hashé (bcrypt) |
```

### 10. Skill /factory:run (pipeline complet)
Ajouter `.claude/skills/factory-run/SKILL.md` :
```yaml
---
name: factory-run
description: Exécute le pipeline complet requirements → release
context: fork
agent: general-purpose
---
# Factory Run - Pipeline complet

1. /factory-intake → Gate 1
2. /factory-spec → Gate 2
3. /factory-plan → Gate 3
4. /factory-build (toutes les tasks) → Gate 4
5. /factory-qa → Gate 5
6. Rapport final
```

### 11. CLAUDE.md enrichi
Le CLAUDE.md de la factory doit contenir :
```markdown
# CLAUDE.md — Spec-to-Code Factory

## Vision
Pipeline automatisé requirements → livrable

## Workflow obligatoire
BREAK → MODEL → ACT → DEBRIEF (5 gates)

## Conventions
- Nommage : US-XXXX, TASK-XXXX, ADR-XXXX
- Pas de code sans task
- Pas de commit sans référence task

## Limites
- Stack-agnostic (projet cible défini par ADR)
- Pas d'UI dashboard (V1)
- Pas de CI/CD (V2)

## Commands disponibles
- /factory-intake, /factory-spec, /factory-plan, /factory-build, /factory-qa
- /factory-run (pipeline complet)
- /gate-check [1-5]
- /status, /reset, /help
```

---

## Definition of Done V1 (MISE À JOUR)

- [ ] Projet nettoyé (pas de fichiers obsolètes)
- [ ] Structure conforme au schéma cible (hiérarchie mémoire Claude Code)
- [ ] **14 templates** créés avec sections obligatoires
- [ ] **7 Skills** fonctionnels avec `context: fork` :
  - [ ] /factory-intake, /factory-spec, /factory-plan, /factory-build, /factory-qa, /factory-run, /gate-check
- [ ] **8 Agents** fonctionnels avec règles anti-dérive :
  - [ ] Orchestrator (master qui délègue)
  - [ ] Analyst (+ gestion questions/hypothèses)
  - [ ] PM, Architect, Rules/Memory, Scrum Master, Developer, QA
- [ ] **3 Commands** simples : /status, /reset, /help
- [ ] **2 Rules fixes** (factory-invariants, security-baseline) + rules dynamiques
- [ ] **5 gates** bloquantes avec validation sections (pas juste présence)
- [ ] **3 Hooks** Node.js : PreToolUse (sécurité), PostToolUse (validation), Stop (gate)
- [ ] **4 Outils** Node.js : gate-check, validate-structure, scan-secrets, + factory-log
- [ ] Conventions nommage enforced (US-/TASK-/ADR-)
- [ ] Journal de génération (`docs/factory/log.md`)
- [ ] Entrées optionnelles gérées (adr-initial, wireframes, api-examples)
- [ ] CLAUDE.md enrichi avec vision/workflow/conventions/limites
- [ ] Cycle complet testé sur projet démo (mini API ou CLI)

---

## Références

- [BMAD-METHOD (officiel)](https://github.com/bmad-code-org/BMAD-METHOD)
- [BMAD-AT-CLAUDE (port Claude Code)](https://github.com/24601/BMAD-AT-CLAUDE)
- [Claude Code Subagents Docs](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
