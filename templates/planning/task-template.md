# TASK-XXXX — [Titre descriptif]

> **Principe BMAD** : Cette task est 100% auto-suffisante.
> Tout le contexte nécessaire est inclus ci-dessous.

---

## Metadata

| Champ | Valeur |
|-------|--------|
| **ID** | TASK-XXXX |
| **US Parent** | US-XXXX |
| **EPIC** | EPIC-XXX |
| **Priorité** | P1/P2/P3 |
| **Estimation** | 1-2h max |
| **Statut** | pending / in_progress / completed |

---

## Objectif technique

[Description claire et concise de ce que cette task doit accomplir techniquement]

### Ce qui est attendu
- [ ] ...
- [ ] ...

### Ce qui n'est PAS attendu (hors scope)
- ...

---

## Contexte complet

> Cette section contient TOUT le contexte nécessaire pour implémenter la task.
> Aucune connaissance de la task précédente n'est requise.

### Specs référencées

| Document | Section | Résumé pertinent |
|----------|---------|------------------|
| `docs/specs/system.md` | #section-xxx | [Résumé de ce qui s'applique] |
| `docs/specs/domain.md` | #entité-xxx | [Résumé des règles métier] |
| `docs/specs/api.md` | #endpoint-xxx | [Signature de l'API concernée] |

### ADR applicables

| ADR | Décision | Impact sur cette task |
|-----|----------|----------------------|
| `ADR-0001` | [Stack technique] | [Comment cela impacte l'implémentation] |

### Code existant pertinent

> Extraits du code existant que le développeur doit connaître.

```typescript
// Fichier: src/xxx.ts (lignes XX-YY)
// Description: [Pourquoi ce code est pertinent]

[Extrait de code pertinent]
```

### Dépendances

| Type | Élément | Statut |
|------|---------|--------|
| Task prérequise | TASK-XXXX | completed |
| Module externe | xxx | disponible |
| API externe | xxx | documentée |

---

## Fichiers concernés

> Liste exhaustive des fichiers à créer/modifier.
> L'anti-dérive bloquera toute modification hors de cette liste.

### Fichiers à créer
- `src/xxx/nouveau-fichier.ts`
- `tests/xxx/nouveau-fichier.test.ts`

### Fichiers à modifier
- `src/xxx/existant.ts` (lignes ~XX-YY)

---

## Plan d'implémentation

> Ordre des étapes à suivre. Chaque étape est atomique.

1. **[Étape 1]** : [Description]
   - Fichier: `src/xxx.ts`
   - Action: [créer/modifier/ajouter]

2. **[Étape 2]** : [Description]
   - ...

3. **Tests** : Écrire les tests AVANT ou AVEC le code (TDD)

---

## Definition of Done

> Checklist de validation. TOUS les critères doivent être cochés.

- [ ] Code implémenté selon le plan
- [ ] Tests unitaires écrits et passants
- [ ] Pas de régression sur les tests existants
- [ ] Code conforme aux specs référencées
- [ ] Pas de fichiers hors scope modifiés
- [ ] TypeScript compile sans erreur (si applicable)
- [ ] Linting passe (si applicable)

---

## Tests attendus

> Liste des tests à implémenter. Utilisée par le validateur code quality.

### Tests unitaires
- [ ] Test: [Description du test 1]
- [ ] Test: [Description du test 2]

### Tests d'intégration (si applicable)
- [ ] Test: [Description]

### Cas limites à couvrir
- [ ] [Cas limite 1]
- [ ] [Cas limite 2]

---

## Critères de validation automatique

> Utilisés par `tools/validate-code-quality.js`

| Critère | Seuil | Obligatoire |
|---------|-------|-------------|
| Couverture de tests | ≥ 80% | Oui |
| Types TypeScript | Strict | Oui |
| Conformité API specs | 100% | Oui |
| Conformité Domain specs | 100% | Oui |

---

## Notes d'implémentation

> Instructions spécifiques ou warnings pour le développeur.

### Attention
- ⚠️ [Point d'attention important]

### Patterns à suivre
- Utiliser le pattern [XXX] comme dans `src/existant.ts`

### À éviter
- ❌ Ne pas [chose à éviter]

---

## Historique

| Date | Auteur | Action |
|------|--------|--------|
| YYYY-MM-DD | Scrum Master | Création |
