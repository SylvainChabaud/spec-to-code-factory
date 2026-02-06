# Checklist Release — {{NOM_PROJET}}

> Template pour `docs/release/checklist.md`
> Généré par l'agent QA
> Phase DEBRIEF - Validation finale avant release

---

## Metadata

| Champ | Valeur |
|-------|--------|
| **Projet** | {{NOM_PROJET}} |
| **Version** | {{X.Y.Z}} |
| **Date prévue** | {{YYYY-MM-DD}} |
| **Release Manager** | {{Nom}} |
| **Statut** | En cours / Prêt / Bloqué |

---

## Résumé

| Phase | Progression | Statut |
|-------|-------------|--------|
| Pré-release | {{X}}/{{Y}} | ✅/🔄/❌ |
| Validation métier | {{X}}/{{Y}} | ✅/🔄/❌ |
| Déploiement | {{X}}/{{Y}} | ✅/🔄/❌ |
| Post-release | {{X}}/{{Y}} | ✅/🔄/❌ |

---

## Pré-release

### Code & Tests

- [ ] Tous les tests unitaires passent
- [ ] Tous les tests d'intégration passent
- [ ] Tests E2E passent sur environnement staging
- [ ] Couverture de code ≥ {{80}}%
- [ ] Pas de tests ignorés sans justification
- [ ] TypeScript compile sans erreurs (strict mode)
- [ ] Linting passe sans warnings

### Sécurité

- [ ] `npm audit` : aucune vulnérabilité critique
- [ ] `scan-secrets.js` : aucun secret détecté
- [ ] Dépendances à jour (ou justification)
- [ ] HTTPS configuré pour tous les endpoints
- [ ] Headers de sécurité configurés (CSP, HSTS, etc.)

### Documentation

- [ ] README.md à jour
- [ ] CHANGELOG.md complété
- [ ] API documentation à jour
- [ ] Migration guide (si breaking changes)
- [ ] Release notes préparées

### Configuration

- [ ] Variables d'environnement documentées
- [ ] Configurations staging/production vérifiées
- [ ] Feature flags configurés (si applicable)
- [ ] Rollback plan documenté

---

## Validation métier

### Fonctionnel

- [ ] Tous les critères d'acceptation validés
  - Référence : [docs/acceptance.md](../acceptance.md)
- [ ] Scénarios BDD validés
- [ ] Edge cases testés et validés
- [ ] Pas de régression détectée

### UX/UI

- [ ] Design conforme aux maquettes
- [ ] Responsive vérifié (mobile, tablet, desktop)
- [ ] Accessibilité validée (WCAG {{AA}})
- [ ] Messages d'erreur clairs et localisés
- [ ] Loading states et feedback utilisateur OK

### Sign-off

- [ ] Demo réalisée auprès des stakeholders
- [ ] PO sign-off obtenu
- [ ] QA sign-off obtenu
- [ ] Tech lead sign-off obtenu

---

## Déploiement

### Préparation

- [ ] Tag git créé (v{{X.Y.Z}})
- [ ] Build de production réussi
- [ ] Artefacts générés et archivés
- [ ] Database migrations préparées (si applicable)

### Staging

- [ ] Déploiement staging réussi
- [ ] Smoke tests passent
- [ ] Tests de performance OK
- [ ] Pas d'erreurs dans les logs

### Production

- [ ] Fenêtre de maintenance planifiée (si applicable)
- [ ] Communication aux utilisateurs (si applicable)
- [ ] Déploiement production réussi
- [ ] Smoke tests production passent
- [ ] Vérification des logs (pas d'erreurs)

---

## Post-release

### Monitoring

- [ ] Dashboards monitoring vérifiés
- [ ] Alertes configurées et fonctionnelles
- [ ] Métriques de performance dans les seuils
- [ ] Pas d'augmentation du taux d'erreur

### Communication

- [ ] Release notes publiées
- [ ] Équipe informée
- [ ] Utilisateurs informés (si applicable)
- [ ] Documentation externe mise à jour

### Suivi

- [ ] Issues post-release trackées
- [ ] Feedback utilisateur collecté
- [ ] Retrospective planifiée
- [ ] Technical debt documentée

---

## Rollback Plan

### Conditions de rollback

| Condition | Seuil | Action |
|-----------|-------|--------|
| Taux d'erreur | > {{5}}% | Rollback immédiat |
| Temps de réponse | > {{2}}s (p95) | Investigation + rollback si persistant |
| Erreurs critiques | > {{0}} | Rollback immédiat |

### Procédure de rollback

1. {{Étape 1 : Notification de l'équipe}}
2. {{Étape 2 : Revert du déploiement}}
3. {{Étape 3 : Vérification du rollback}}
4. {{Étape 4 : Post-mortem}}

### Contacts d'urgence

| Rôle | Nom | Contact |
|------|-----|---------|
| Tech Lead | {{Nom}} | {{Contact}} |
| DevOps | {{Nom}} | {{Contact}} |
| PO | {{Nom}} | {{Contact}} |

---

## Notes

### Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| {{Risque}} | {{Haute/Moyenne/Basse}} | {{Haut/Moyen/Bas}} | {{Action}} |

### Décisions prises

| Décision | Justification | Date |
|----------|---------------|------|
| {{Décision}} | {{Pourquoi}} | {{YYYY-MM-DD}} |

---

## Références

- **QA Report** : [docs/qa/report.md](../qa/report.md)
- **CHANGELOG** : [CHANGELOG.md](../../CHANGELOG.md)
- **Acceptance** : [docs/acceptance.md](../acceptance.md)

---

## Historique

| Date | Auteur | Action |
|------|--------|--------|
| {{YYYY-MM-DD}} | QA | Création |
| {{YYYY-MM-DD}} | {{Nom}} | Sign-off |

---

*Template v1.0 | Phase DEBRIEF | Spec-to-Code Factory*
