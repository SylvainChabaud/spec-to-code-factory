# Brief — {{NOM_PROJET}}

> Template pour `docs/brief.md`
> Généré par l'agent Analyst depuis `input/requirements.md`
> Questions de clarification : [docs/factory/questions.md](../factory/questions.md)

<!-- VERSIONING (V2+) : Encadrer tout ajout/modification avec
     <!-- VN:START --> ... <!-- VN:END -->
     Extraction : node tools/extract-version-delta.js --version N
-->

---

## Metadata

| Champ | Valeur |
|-------|--------|
| **Projet** | {{NOM_PROJET}} |
| **Date** | {{YYYY-MM-DD}} |
| **Agent** | Analyst |
| **Source** | `input/requirements.md` |

---

## Résumé exécutif

> 2-3 phrases maximum résumant le projet.

{{RESUME_EXECUTIF}}

---

## Problème reformulé

> Clarification du besoin sans ambiguïté.

{{PROBLEME_REFORMULE}}

---

## Objectifs principaux

> Liste ordonnée des objectifs du projet.

1. {{OBJECTIF_1}}
2. {{OBJECTIF_2}}
3. {{OBJECTIF_3}}

---

## Contexte utilisateur

> Informations collectées via les questions de clarification.

### Public cible

| Critère | Valeur |
|---------|--------|
| **Type** | {{Grand public / Professionnels / Développeurs}} |
| **Niveau technique** | {{Débutant / Intermédiaire / Expert}} |
| **Volume estimé** | {{Nombre d'utilisateurs attendus}} |

### Contraintes exprimées

| Contrainte | Description | Impact |
|------------|-------------|--------|
| {{CONTRAINTE_1}} | {{Description}} | {{Haut/Moyen/Bas}} |
| {{CONTRAINTE_2}} | {{Description}} | {{Haut/Moyen/Bas}} |

### Environnement technique

| Aspect | Détail |
|--------|--------|
| **Plateforme** | {{Web / Mobile / Desktop / API}} |
| **Navigateurs** | {{Chrome, Firefox, Safari, Edge}} |
| **Intégrations** | {{APIs externes, services tiers}} |

---

## Hypothèses explicites {#hypotheses}

> **IMPORTANT** : Cette section contient les hypothèses faites lorsque des questions
> n'ont pas reçu de réponse. **Chaque hypothèse doit être validée** avant de continuer.

| # | Question non répondue | Hypothèse retenue | Impact si faux |
|---|----------------------|-------------------|----------------|
| H1 | _Réf: Q{{X}} dans questions.md_ | {{Hypothèse}} | {{Impact}} |
| H2 | _Réf: Q{{Y}} dans questions.md_ | {{Hypothèse}} | {{Impact}} |

### Validation des hypothèses

- [ ] H1 validée par l'utilisateur
- [ ] H2 validée par l'utilisateur

---

## Questions en suspens

> Voir le détail dans [docs/factory/questions.md](../factory/questions.md)

| Statut | Nombre |
|--------|--------|
| ✅ Répondues | {{X}} |
| ⏳ En attente | {{Y}} |
| 🟡 Hypothèses générées | {{Z}} |

---

## Décisions de cadrage

> Décisions prises pendant la phase BREAK.

| # | Décision | Justification | Date |
|---|----------|---------------|------|
| D1 | {{Décision}} | {{Pourquoi}} | {{YYYY-MM-DD}} |
| D2 | {{Décision}} | {{Pourquoi}} | {{YYYY-MM-DD}} |

---

## Références

- **Source** : [input/requirements.md](../input/requirements.md)
- **Questions** : [docs/factory/questions.md](../factory/questions.md)
- **Scope** : [docs/scope.md](scope.md)
- **Acceptance** : [docs/acceptance.md](acceptance.md)

---

## Historique

| Date | Auteur | Action |
|------|--------|--------|
| {{YYYY-MM-DD}} | Analyst | Création |

---

*Template v1.0 | Phase BREAK | Spec-to-Code Factory*
