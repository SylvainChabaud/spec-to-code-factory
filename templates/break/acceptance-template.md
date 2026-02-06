# Critères d'acceptation — {{NOM_PROJET}}

> Template pour `docs/acceptance.md`
> Généré par l'agent Analyst
> Définit les critères globaux de validation du projet

---

## Metadata

| Champ | Valeur |
|-------|--------|
| **Projet** | {{NOM_PROJET}} |
| **Version** | V1 |
| **Date** | {{YYYY-MM-DD}} |
| **Agent** | Analyst |

---

## Critères globaux

> Critères de haut niveau pour valider le projet dans son ensemble.

| # | Critère | Mesure | Cible | Seuil minimum |
|---|---------|--------|-------|---------------|
| A1 | {{Critère}} | {{Comment mesurer}} | {{Valeur cible}} | {{Minimum acceptable}} |
| A2 | {{Critère}} | {{Comment mesurer}} | {{Valeur cible}} | {{Minimum acceptable}} |
| A3 | {{Critère}} | {{Comment mesurer}} | {{Valeur cible}} | {{Minimum acceptable}} |

### Critères de qualité

| # | Aspect | Critère | Validation |
|---|--------|---------|------------|
| Q1 | Performance | Temps de réponse < {{X}}ms (p95) | Tests de charge |
| Q2 | Fiabilité | Disponibilité > {{X}}% | Monitoring |
| Q3 | Sécurité | Pas de vulnérabilité critique | Audit OWASP |
| Q4 | Accessibilité | WCAG {{AA/AAA}} | Audit a11y |

### Critères techniques

| # | Aspect | Critère | Validation |
|---|--------|---------|------------|
| T1 | Couverture tests | ≥ {{80}}% | npm run test:coverage |
| T2 | TypeScript | Mode strict, 0 erreurs | tsc --noEmit |
| T3 | Linting | 0 erreurs, 0 warnings | npm run lint |
| T4 | Build | Build réussi | npm run build |

---

## Scénarios de validation

> Scénarios BDD (Given/When/Then) pour valider les fonctionnalités clés.

### Scénario 1 — {{Nom du scénario}}

**Contexte** : {{Description du contexte}}

```gherkin
Feature: {{Nom de la feature}}

  Scenario: {{Nom du scénario}}
    Given {{État initial}}
      And {{Condition additionnelle}}
    When {{Action utilisateur}}
      And {{Action additionnelle}}
    Then {{Résultat attendu}}
      And {{Vérification additionnelle}}
```

**Données de test** :
```json
{
  "input": "{{valeur}}",
  "expected": "{{valeur attendue}}"
}
```

---

### Scénario 2 — {{Nom du scénario}}

**Contexte** : {{Description du contexte}}

```gherkin
Feature: {{Nom de la feature}}

  Scenario: {{Nom du scénario}}
    Given {{État initial}}
    When {{Action utilisateur}}
    Then {{Résultat attendu}}
```

---

### Scénario 3 — Cas d'erreur

**Contexte** : Validation du comportement en cas d'erreur

```gherkin
Feature: Gestion des erreurs

  Scenario: {{Nom du scénario d'erreur}}
    Given {{État initial}}
    When {{Action qui provoque l'erreur}}
    Then {{Message d'erreur attendu}}
      And {{État final attendu}}
```

---

## Edge cases

> Cas limites à valider explicitement.

| # | Cas limite | Entrée | Comportement attendu |
|---|------------|--------|---------------------|
| E1 | Champ vide | `""` | {{Message d'erreur}} |
| E2 | Valeur maximale | `{{MAX}}` | {{Comportement}} |
| E3 | Caractères spéciaux | `{{<script>}}` | {{Échappé / Rejeté}} |
| E4 | Timeout réseau | {{Simulation timeout}} | {{Message + retry}} |

---

## Critères de non-régression

> Ce qui ne doit PAS changer ou casser.

| # | Comportement à préserver | Test de validation |
|---|-------------------------|-------------------|
| NR1 | {{Comportement existant}} | {{Test ID}} |
| NR2 | {{Comportement existant}} | {{Test ID}} |

---

## Matrice de validation

> Mapping critères → tests automatisés.

| Critère | Type de test | Fichier/Suite | Automatisé |
|---------|--------------|---------------|------------|
| A1 | E2E | `tests/e2e/{{file}}.spec.ts` | Oui |
| A2 | Integration | `tests/integration/{{file}}.test.ts` | Oui |
| Q1 | Performance | `tests/perf/{{file}}.test.ts` | Oui |
| T1 | Coverage | - | Oui (CI) |

---

## Checklist de validation finale

> À cocher avant de passer au Gate 5.

### Fonctionnel
- [ ] Tous les scénarios de validation passent
- [ ] Tous les edge cases sont gérés
- [ ] Pas de régression détectée

### Technique
- [ ] Couverture de tests ≥ seuil
- [ ] Build réussi sans warnings
- [ ] TypeScript strict sans erreurs
- [ ] Pas de vulnérabilités critiques

### UX/UI
- [ ] Responsive sur tous les breakpoints
- [ ] Accessibilité validée
- [ ] Messages d'erreur clairs et utiles

---

## Références

- **Brief** : [docs/brief.md](brief.md)
- **Scope** : [docs/scope.md](scope.md)
- **Test Plan** : [docs/testing/plan.md](testing/plan.md)

---

## Historique

| Date | Auteur | Action |
|------|--------|--------|
| {{YYYY-MM-DD}} | Analyst | Création |

---

*Template v1.0 | Phase BREAK | Spec-to-Code Factory*
