# Rapport QA — {{NOM_PROJET}}

> Template pour `docs/qa/report.md`
> Généré par l'agent QA
> Phase DEBRIEF - Validation de la release

---

## Metadata

| Champ | Valeur |
|-------|--------|
| **Projet** | {{NOM_PROJET}} |
| **Version** | {{X.Y.Z}} |
| **Date** | {{YYYY-MM-DD}} |
| **Agent** | QA |
| **Statut global** | ✅ PASS / ❌ FAIL |

---

## Résumé exécutif

| Métrique | Valeur | Seuil | Statut |
|----------|--------|-------|--------|
| Tests passants | {{X}}/{{Y}} | 100% | ✅/❌ |
| Couverture code | {{X}}% | ≥80% | ✅/❌ |
| Issues critiques | {{X}} | 0 | ✅/❌ |
| Issues hautes | {{X}} | ≤2 | ✅/❌ |
| Vulnérabilités | {{X}} | 0 critiques | ✅/❌ |

### Verdict

| Critère | Résultat |
|---------|----------|
| **Prêt pour release** | ✅ OUI / ❌ NON |
| **Blockers** | {{Nombre}} |
| **Actions requises** | {{Liste ou "Aucune"}} |

---

## Tests exécutés

### Vue d'ensemble

| Type | Total | Pass | Fail | Skip | Durée |
|------|-------|------|------|------|-------|
| Unitaire | {{X}} | {{Y}} | {{Z}} | {{W}} | {{Xs}} |
| Intégration | {{X}} | {{Y}} | {{Z}} | {{W}} | {{Xs}} |
| E2E | {{X}} | {{Y}} | {{Z}} | {{W}} | {{Xs}} |
| Performance | {{X}} | {{Y}} | {{Z}} | {{W}} | {{Xs}} |
| **Total** | **{{X}}** | **{{Y}}** | **{{Z}}** | **{{W}}** | **{{Xs}}** |

### Tests unitaires

```
{{Sortie de npm run test:unit}}
```

### Tests d'intégration

```
{{Sortie de npm run test:integration}}
```

### Tests E2E

```
{{Sortie de npm run test:e2e}}
```

---

## Couverture de code

### Résumé

| Métrique | Valeur | Seuil | Statut |
|----------|--------|-------|--------|
| Lines | {{X}}% | ≥80% | ✅/❌ |
| Branches | {{X}}% | ≥75% | ✅/❌ |
| Functions | {{X}}% | ≥90% | ✅/❌ |
| Statements | {{X}}% | ≥80% | ✅/❌ |

### Fichiers sous le seuil

| Fichier | Lines | Branches | Raison |
|---------|-------|----------|--------|
| {{fichier}} | {{X}}% | {{Y}}% | {{Justification}} |

### Rapport détaillé

```
{{Sortie de npm run test:coverage}}
```

---

## Issues détectées

### Vue d'ensemble

| Sévérité | Nombre | Résolues | Ouvertes |
|----------|--------|----------|----------|
| 🔴 CRITIQUE | {{X}} | {{Y}} | {{Z}} |
| 🟠 HAUTE | {{X}} | {{Y}} | {{Z}} |
| 🟡 MOYENNE | {{X}} | {{Y}} | {{Z}} |
| 🔵 BASSE | {{X}} | {{Y}} | {{Z}} |

### Détail des issues

#### Issue #1 — {{Titre}}

| Champ | Valeur |
|-------|--------|
| **Sévérité** | 🔴 CRITIQUE |
| **Type** | Bug / Sécurité / Performance / UX |
| **Fichier** | `{{chemin/fichier.ts:ligne}}` |
| **Statut** | Ouvert / Résolu / Won't fix |

**Description** :
{{Description détaillée du problème}}

**Reproduction** :
1. {{Étape 1}}
2. {{Étape 2}}
3. {{Résultat observé}}

**Impact** :
{{Impact sur l'utilisateur ou le système}}

**Résolution** :
{{Comment résoudre ou justification si won't fix}}

---

## Validation des critères d'acceptation

> Référence : [docs/acceptance.md](../acceptance.md)

| # | Critère | Résultat | Preuve |
|---|---------|----------|--------|
| A1 | {{Critère}} | ✅ PASS / ❌ FAIL | {{Test ID ou observation}} |
| A2 | {{Critère}} | ✅ PASS / ❌ FAIL | {{Test ID ou observation}} |
| A3 | {{Critère}} | ✅ PASS / ❌ FAIL | {{Test ID ou observation}} |

### Scénarios BDD validés

| Scénario | Feature | Résultat |
|----------|---------|----------|
| {{Nom scénario}} | {{Feature}} | ✅/❌ |

---

## Audit de sécurité

### Dépendances

```
{{Sortie de npm audit}}
```

| Sévérité | Nombre | Action |
|----------|--------|--------|
| Critical | {{X}} | {{Résolu / À résoudre}} |
| High | {{X}} | {{Résolu / À résoudre}} |
| Moderate | {{X}} | {{Accepté / À résoudre}} |
| Low | {{X}} | {{Accepté}} |

### Scan secrets

```
{{Sortie de scan-secrets.js}}
```

Résultat : ✅ Aucun secret détecté / ❌ Secrets trouvés

---

## Performance

### Métriques clés

| Métrique | Valeur | Seuil | Statut |
|----------|--------|-------|--------|
| Time to First Byte | {{X}}ms | <200ms | ✅/❌ |
| Largest Contentful Paint | {{X}}ms | <2500ms | ✅/❌ |
| Bundle size | {{X}}KB | <500KB | ✅/❌ |

---

## Recommandations

### Actions bloquantes (avant release)

1. 🔴 {{Action 1 - critique}}
2. 🔴 {{Action 2 - critique}}

### Actions recommandées (post-release)

1. 🟡 {{Amélioration 1}}
2. 🟡 {{Amélioration 2}}

### Technical debt identifiée

| Item | Impact | Effort | Priorité |
|------|--------|--------|----------|
| {{Item}} | {{Haut/Moyen/Bas}} | {{S/M/L}} | {{P1/P2/P3}} |

---

## Checklist finale

### Gate 5 - Pré-release

- [ ] Tous les tests passent
- [ ] Couverture ≥ seuil minimum
- [ ] Aucune issue critique ouverte
- [ ] Audit sécurité OK
- [ ] Performance dans les seuils
- [ ] CHANGELOG mis à jour
- [ ] Documentation à jour

### Validation métier

- [ ] Critères d'acceptation validés
- [ ] Démo réalisée (si applicable)
- [ ] PO sign-off obtenu

---

## Références

- **Acceptance** : [docs/acceptance.md](../acceptance.md)
- **Test Plan** : [docs/testing/plan.md](../testing/plan.md)
- **Checklist** : [docs/release/checklist.md](../release/checklist.md)

---

## Historique

| Date | Auteur | Action |
|------|--------|--------|
| {{YYYY-MM-DD}} | QA | Création |

---

*Template v1.0 | Phase DEBRIEF | Spec-to-Code Factory*
