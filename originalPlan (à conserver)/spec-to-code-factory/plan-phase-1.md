# Phase 1 — Templates + Structure

> Lire ce fichier UNIQUEMENT pour la Phase 1.
> Objectif : Créer tous les templates avec leurs sections obligatoires.

## Templates à créer (15 fichiers)

### 1. input/requirements.template.md

```markdown
# Requirements — [Nom du projet]

## 1. Contexte & Problème
<!-- Décrivez le contexte métier et le problème à résoudre -->

## 2. Objectifs métier (priorisés)
<!-- Liste numérotée par priorité -->
1.
2.

## 3. Utilisateurs / Personas
<!-- Qui utilisera le système ? -->

## 4. Parcours utilisateurs (User Journeys)
<!-- Scénarios d'utilisation principaux -->

## 5. Fonctionnalités attendues (priorisées)
<!-- Liste des features avec priorité P0/P1/P2 -->

## 6. Données manipulées
<!-- Types de données, sensibilité, volumes -->

## 7. Contraintes non-fonctionnelles
<!-- Sécurité, RGPD, performance, budget, délais -->

## 8. Hors-scope explicite
<!-- Ce qui n'est PAS inclus -->

## 9. Critères d'acceptation mesurables
<!-- KPIs, métriques de succès -->

## 10. Intégrations externes
<!-- APIs, services tiers (si applicable) -->

## 11. Stack / Préférences techniques (optionnel)
<!-- Langages, frameworks souhaités -->

## 12. Qualité attendue
<!-- Tests, lint, typecheck, doc -->
```

### 2. docs/brief.md

```markdown
# Brief — [Nom du projet]

> Généré par l'agent Analyst depuis input/requirements.md

## Résumé exécutif
<!-- 2-3 phrases max -->

## Problème reformulé
<!-- Clarification sans ambiguïté -->

## Objectifs principaux
1.
2.
3.

## Hypothèses explicites
<!-- OBLIGATOIRE : lister toutes les hypothèses faites -->
| # | Hypothèse | Justification |
|---|-----------|---------------|
| H1 | | |
| H2 | | |

## Questions en suspens
<!-- Renvoi vers docs/factory/questions.md si applicable -->

## Références
- Source : [input/requirements.md](../input/requirements.md)
```

### 3. docs/scope.md

```markdown
# Scope — [Nom du projet]

## IN (inclus dans V1)
<!-- Liste exhaustive -->
-
-

## OUT (explicitement exclu)
<!-- Éviter les ambiguïtés -->
-
-

## Limites connues
<!-- Contraintes techniques ou business -->

## Dépendances externes
<!-- Services, APIs, équipes -->
```

### 4. docs/acceptance.md

```markdown
# Critères d'acceptation — [Nom du projet]

## Critères globaux
| # | Critère | Mesure | Cible |
|---|---------|--------|-------|
| A1 | | | |
| A2 | | | |

## Scénarios de validation
### Scénario 1 : [Nom]
**Given** :
**When** :
**Then** :

### Scénario 2 : [Nom]
**Given** :
**When** :
**Then** :
```

### 5. docs/specs/system.md

```markdown
# Specs Système — [Nom du projet]

## Vue d'ensemble
<!-- Architecture haut niveau -->

## Composants principaux
<!-- Liste des modules/services -->

## Contraintes non-fonctionnelles

### Performance
| Métrique | Cible |
|----------|-------|
| Temps de réponse API | < 200ms p95 |
| | |

### Sécurité
<!-- Exigences sécurité -->

### Disponibilité
<!-- SLA, uptime -->

## Classification des données
| Donnée | Sensibilité | RGPD | Chiffrement |
|--------|-------------|------|-------------|
| | | | |

## Références
- [brief.md](../brief.md)
- [scope.md](../scope.md)
```

### 6. docs/specs/domain.md

```markdown
# Specs Domaine — [Nom du projet]

## Concepts clés (Ubiquitous Language)
| Terme | Définition |
|-------|------------|
| | |

## Entités
### [Entité 1]
- Attributs :
- Règles métier :

## Règles métier
| # | Règle | Condition | Action |
|---|-------|-----------|--------|
| R1 | | | |

## Modèle de données (conceptuel)
<!-- Diagramme ou description -->

## Références
- [system.md](system.md)
```

### 7. docs/specs/api.md

```markdown
# Specs API — [Nom du projet]

## Vue d'ensemble
- Base URL :
- Authentification :
- Format : JSON

## Endpoints

### [Resource 1]
#### GET /resource
**Description** :
**Réponse** :
```json
{
  "example": "value"
}
```

#### POST /resource
**Description** :
**Body** :
```json
{
  "field": "value"
}
```

## Codes d'erreur
| Code | Signification |
|------|---------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

## Références
- [domain.md](domain.md)
- ADR : [ADR-0001](../adr/ADR-0001-stack.md)
```

### 8. docs/adr/ADR-0001-template.md

```markdown
# ADR-0001 — [Titre de la décision]

## Statut
PROPOSÉ | ACCEPTÉ | DÉPRÉCIÉ | REMPLACÉ

## Contexte
<!-- Pourquoi cette décision est nécessaire -->

## Décision
<!-- Ce qui a été décidé -->

## Alternatives considérées
| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| A | | |
| B | | |

## Conséquences
### Positives
-

### Négatives
-

## Références
- Specs : [system.md](../specs/system.md)
```

### 9. docs/planning/epics.md

```markdown
# EPICs — [Nom du projet]

## EPIC-001 — [Titre]
**Objectif** :
**Valeur métier** :
**US associées** : US-0001, US-0002

## EPIC-002 — [Titre]
**Objectif** :
**Valeur métier** :
**US associées** :
```

### 10. docs/planning/us/US-template.md

```markdown
# US-XXXX — [Titre User Story]

## Contexte / Valeur
<!-- Pourquoi cette US est importante -->

## Description
**En tant que** [persona],
**je veux** [action],
**afin de** [bénéfice].

## Critères d'acceptation
- [ ]
- [ ]

## Edge cases
| Cas | Comportement attendu |
|-----|---------------------|
| | |

## Stratégie de tests
- Tests unitaires :
- Tests intégration :
- Tests E2E :

## Impacts
- Sécurité :
- RGPD :
- Performance :

## Références
- **EPIC** : [EPIC-XXX](../epics.md#epic-xxx)
- **Specs** : [system.md](../../specs/system.md)
- **ADR** : [ADR-0001](../../adr/ADR-0001-stack.md)
```

### 11. docs/planning/tasks/TASK-template.md

```markdown
# TASK-XXXX — [Titre technique]

## Objectif technique
<!-- Ce que cette task doit accomplir -->

## Contexte
- **US parent** : [US-XXXX](../us/US-XXXX.md)
- **EPIC** : [EPIC-XXX](../epics.md#epic-xxx)

## Fichiers/modules concernés
- `src/...`
- `tests/...`

## Plan d'implémentation
1.
2.
3.

## Definition of Done
- [ ] Code implémenté selon specs
- [ ] Tests écrits et passants
- [ ] Pas de régression
- [ ] Review (si applicable)

## Tests attendus
- [ ] Test unitaire :
- [ ] Test intégration :

## Risques / Points d'attention
<!-- Difficultés anticipées -->

## Références
- **Specs** : [system.md](../../specs/system.md), [domain.md](../../specs/domain.md)
- **ADR** : [ADR-0001](../../adr/ADR-0001-stack.md)
```

### 12. docs/testing/plan.md

```markdown
# Plan de tests — [Nom du projet]

## Stratégie globale
| Type | Couverture cible | Outils |
|------|------------------|--------|
| Unitaire | 80% | |
| Intégration | critiques | |
| E2E | parcours clés | |

## Tests critiques (bloquants)
| # | Test | Fichier | US |
|---|------|---------|-----|
| T1 | | | |

## Données de test
<!-- Fixtures, mocks -->

## Environnements
| Env | URL | Usage |
|-----|-----|-------|
| Local | localhost:3000 | Dev |
| | | |
```

### 13. docs/qa/report.md

```markdown
# Rapport QA — [Nom du projet]

> Généré par l'agent QA

## Résumé
- Date : YYYY-MM-DD
- Version :
- Statut : ✅ PASS | ❌ FAIL

## Tests exécutés
| Type | Total | Pass | Fail |
|------|-------|------|------|
| Unitaire | | | |
| Intégration | | | |
| E2E | | | |

## Issues détectées
| # | Sévérité | Description | Statut |
|---|----------|-------------|--------|
| | CRITIQUE/HAUTE/MOYENNE/BASSE | | |

## Couverture
<!-- Rapport de couverture -->

## Recommandations
<!-- Actions suggérées -->
```

### 14. docs/release/checklist.md

```markdown
# Checklist Release — [Nom du projet]

## Pré-release
- [ ] Tous les tests passent
- [ ] Couverture ≥ cible
- [ ] Pas de vulnérabilités critiques
- [ ] Documentation à jour
- [ ] CHANGELOG mis à jour
- [ ] Version taggée

## Validation métier
- [ ] Critères d'acceptation validés
- [ ] Démo réalisée (si applicable)

## Déploiement
- [ ] Build réussi
- [ ] Déploiement staging OK
- [ ] Smoke tests OK
- [ ] Déploiement production OK

## Post-release
- [ ] Monitoring vérifié
- [ ] Communication faite
```

### 15. docs/factory/log.md

```markdown
# Factory Log — Journal de génération

> Ce fichier trace les actions du pipeline.

## Format d'entrée
```
## [YYYY-MM-DD HH:MM] Phase [NOM]
- Agent: [nom]
- Input: [fichiers lus]
- Outputs: [fichiers générés]
- Hypothèses: [nombre] (voir brief.md#hypotheses)
- Gate [N]: ✅ PASS | ❌ FAIL [raison]
```

---
<!-- Entrées ci-dessous -->
```

### 16. docs/factory/questions.md (BONUS)

```markdown
# Questions non résolues

> L'agent Analyst génère max 10 questions ici.
> L'utilisateur peut y répondre avant de continuer.

## Questions ouvertes
| # | Question | Réponse | Statut |
|---|----------|---------|--------|
| Q1 | | | EN ATTENTE |
| Q2 | | | RÉPONDU |

## Impact
Si non répondu, l'agent génère des hypothèses explicites dans docs/brief.md#hypotheses.
```

## Vérification Phase 1

- [ ] 15 templates créés (16 avec questions.md)
- [ ] Chaque template a ses sections obligatoires
- [ ] Pas de contenu placeholder vide
