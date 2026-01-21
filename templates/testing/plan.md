# Test Plan

> Template pour docs/testing/plan.md
> Ce fichier est requis pour Gate 4 (Build → QA)
> Remplacer {{PLACEHOLDER}} par les valeurs du projet

## Vue d'ensemble

**Projet** : {{Nom du projet}}
**Version** : {{X.Y.Z}}
**Date** : {{YYYY-MM-DD}}

## Stratégie de test

### Niveaux de test

| Niveau | Scope | Responsable | Automatisé |
|--------|-------|-------------|------------|
| Unit | Fonctions/Classes | Developer | Oui |
| Integration | Modules/Services | Developer | Oui |
| E2E | User flows | QA | Oui/Non |
| Performance | Load/Stress | QA | Oui |

### Couverture cible

| Métrique | Cible | Minimum acceptable |
|----------|-------|-------------------|
| Line coverage | {{80%}} | {{70%}} |
| Branch coverage | {{75%}} | {{65%}} |
| Function coverage | {{90%}} | {{80%}} |

## Environnements de test

| Env | URL | Données | Usage |
|-----|-----|---------|-------|
| Local | localhost:{{PORT}} | Mock/Seed | Dev |
| CI | - | Seed | Automated |
| Staging | {{URL}} | Anonymized | Pre-prod |

## Cas de test par fonctionnalité

### {{Feature 1}}

| ID | Description | Priorité | Automatisé |
|----|-------------|----------|------------|
| TC-001 | {{Description du test}} | Haute | Oui |
| TC-002 | {{Description du test}} | Moyenne | Oui |

**Préconditions** :
- {{Précondition 1}}

**Données de test** :
```json
{
  "{{input}}": "{{value}}"
}
```

### {{Feature 2}}

{{Répéter le pattern ci-dessus}}

## Tests de non-régression

| Suite | Fichiers | Déclencheur |
|-------|----------|-------------|
| Smoke | tests/smoke/*.test.* | Chaque commit |
| Full | tests/**/*.test.* | PR merge |

## Tests de performance

| Scénario | Utilisateurs | Durée | Seuil acceptable |
|----------|--------------|-------|-----------------|
| Load | {{100}} | {{5 min}} | p95 < {{200ms}} |
| Stress | {{500}} | {{10 min}} | No errors |
| Soak | {{50}} | {{1h}} | Memory stable |

## Tests de sécurité

| Type | Outil | Fréquence |
|------|-------|-----------|
| SAST | {{Tool}} | Chaque commit |
| DAST | {{Tool}} | Hebdomadaire |
| Dependency | npm audit | Chaque build |

## Critères d'acceptation

### Pour Gate 4 (Build → QA)

- [ ] Tous les tests unitaires passent
- [ ] Couverture minimum atteinte
- [ ] Pas de tests ignorés sans justification
- [ ] Temps d'exécution < {{5 min}}

### Pour release

- [ ] Tests E2E passent sur staging
- [ ] Tests de performance dans les seuils
- [ ] Audit de sécurité sans critique

## Données de test

### Seed data

```bash
npm run db:seed
```

### Fixtures

| Fixture | Fichier | Usage |
|---------|---------|-------|
| {{Nom}} | tests/fixtures/{{file}} | {{Description}} |

## Exécution

### Commandes

```bash
# Tous les tests
npm test

# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Couverture
npm run test:coverage

# Watch mode
npm run test:watch
```

### CI/CD

```yaml
# Extrait de la configuration CI
test:
  script:
    - npm test
  coverage: '/Coverage: (\d+)%/'
```

## Reporting

| Rapport | Format | Destination |
|---------|--------|-------------|
| Résultats | JUnit XML | CI artifacts |
| Couverture | HTML/LCOV | CI artifacts |
| Performance | JSON | Grafana |

## Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Flaky tests | Faux positifs | Retry policy + investigation |
| Données corrompues | Tests échouent | Reset DB avant suite |
| Timeout CI | Builds longs | Parallélisation |

---

*Plan de test généré le {{YYYY-MM-DD}}*
