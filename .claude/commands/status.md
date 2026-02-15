# /status

Affiche l'état actuel du pipeline avec dashboard détaillé.

## Workflow

### 1. Charger l'état machine-readable

```bash
node tools/factory-state.js get
```

Si le fichier n'existe pas, utiliser l'approche legacy (log.md + gate-check).

### 2. Vérifier chaque gate

Pour chaque gate de 1 à 5, exécuter :
```bash
node tools/gate-check.js [N]
```

Note : gate-check retourne exit code 0 (PASS) ou 2 (FAIL).

### 3. Compter les artefacts

Obtenir la version courante :
```bash
node tools/get-planning-version.js
# Retourne: { "tasksDir": "docs/planning/vN/tasks", "usDir": "docs/planning/vN/us", ... }
```

Utiliser Glob pour compter :
- `<tasksDir>/TASK-*.md` → nombre de tasks
- `<usDir>/US-*.md` → nombre de user stories
- `docs/adr/ADR-*.md` → nombre d'ADRs
- `tests/**/*.test.*` → nombre de tests

### 4. Afficher le dashboard

```
╔══════════════════════════════════════════════════════════════╗
║                    FACTORY PIPELINE STATUS                    ║
╠══════════════════════════════════════════════════════════════╣
║ Pipeline: [IDLE|RUNNING|PAUSED|COMPLETED|FAILED]             ║
║ Started:  [timestamp ou N/A]                                 ║
║ Current:  [phase name ou N/A]                                ║
╠══════════════════════════════════════════════════════════════╣
║ PHASES                                                        ║
╠══════════════════════════════════════════════════════════════╣
║ ┌─────────┬─────────┬─────────┬─────────┬─────────┐          ║
║ │  BREAK  │  MODEL  │  PLAN   │  BUILD  │ DEBRIEF │          ║
║ ├─────────┼─────────┼─────────┼─────────┼─────────┤          ║
║ │ [icon]  │ [icon]  │ [icon]  │ [icon]  │ [icon]  │          ║
║ └─────────┴─────────┴─────────┴─────────┴─────────┘          ║
║                                                               ║
║ Icons: ✅ completed  🔄 running  ⏳ pending  ❌ failed        ║
╠══════════════════════════════════════════════════════════════╣
║ GATES                                                         ║
╠══════════════════════════════════════════════════════════════╣
║ Gate 1 (BREAK→MODEL):  [✅|❌|⏳] [checked at]                ║
║ Gate 2 (MODEL→PLAN):   [✅|❌|⏳] [checked at]                ║
║ Gate 3 (PLAN→BUILD):   [✅|❌|⏳] [checked at]                ║
║ Gate 4 (BUILD→QA):     [✅|❌|⏳] [checked at]                ║
║ Gate 5 (QA→RELEASE):   [✅|❌|⏳] [checked at]                ║
╠══════════════════════════════════════════════════════════════╣
║ TASKS (Build Phase)                                           ║
╠══════════════════════════════════════════════════════════════╣
║ Total: [N]  Completed: [M]  Progress: [=====>    ] [M/N]     ║
║ Current: [TASK-XXXX ou N/A]                                  ║
╠══════════════════════════════════════════════════════════════╣
║ ARTIFACTS                                                     ║
╠══════════════════════════════════════════════════════════════╣
║ Specs:    [system.md] [domain.md] [api.md]                   ║
║ ADRs:     [N] decision records                               ║
║ Stories:  [N] user stories                                   ║
║ Tasks:    [N] implementation tasks                           ║
║ Tests:    [N] test files                                     ║
╠══════════════════════════════════════════════════════════════╣
║ NEXT ACTION                                                   ║
╠══════════════════════════════════════════════════════════════╣
║ [Description de la prochaine action recommandée]             ║
║ Commande: [/factory-* ou autre]                              ║
╚══════════════════════════════════════════════════════════════╝
```

### 5. Déterminer la prochaine action

Logique de décision :

| État | Prochaine action |
|------|------------------|
| Aucun artefact | `/factory` ou `/factory-intake` |
| Gate 1 FAIL | Corriger docs/brief.md, scope.md, acceptance.md |
| Gate 1 PASS, Gate 2 PENDING | `/factory-spec` |
| Gate 2 FAIL | Corriger specs ou ADRs |
| Gate 2 PASS, Gate 3 PENDING | `/factory-plan` |
| Gate 3 FAIL | Corriger tasks (DoD manquant) |
| Gate 3 PASS, Gate 4 PENDING | `/factory-build` |
| Gate 4 FAIL | Corriger les tests qui échouent |
| Gate 4 PASS, Gate 5 PENDING | `/factory-qa` |
| Gate 5 PASS | Pipeline complet, prêt pour release |

## Output Simplifié (fallback)

Si state.json n'existe pas, afficher la version simplifiée :

```
Pipeline Status
===============
Gate 1 (BREAK):  ✅ PASS | ❌ FAIL | ⏳ PENDING
Gate 2 (MODEL):  ✅ PASS | ❌ FAIL | ⏳ PENDING
Gate 3 (PLAN):   ✅ PASS | ❌ FAIL | ⏳ PENDING
Gate 4 (BUILD):  ✅ PASS | ❌ FAIL | ⏳ PENDING
Gate 5 (QA):     ✅ PASS | ❌ FAIL | ⏳ PENDING

Prochaine action: [description]
```
