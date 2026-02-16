# Scope — {{NOM_PROJET}}

> Template pour `docs/scope.md`
> Généré par l'agent Analyst
> Définit le périmètre précis de la {{VN}}

<!-- VERSIONING (V2+) : Encadrer tout ajout/modification avec
     <!-- VN:START --> ... <!-- VN:END -->
     Extraction : node tools/extract-version-delta.js --version N
-->

---

## Metadata

| Champ | Valeur |
|-------|--------|
| **Projet** | {{NOM_PROJET}} |
| **Version** | {{VN}} |
| **Date** | {{YYYY-MM-DD}} |
| **Agent** | Analyst |

---

## IN (inclus dans {{VN}})

> Liste exhaustive des fonctionnalités incluses dans cette version.

### Fonctionnalités principales

| # | Fonctionnalité | Description | Priorité |
|---|----------------|-------------|----------|
| F1 | {{Fonctionnalité}} | {{Description courte}} | P1 |
| F2 | {{Fonctionnalité}} | {{Description courte}} | P1 |
| F3 | {{Fonctionnalité}} | {{Description courte}} | P2 |

### Détail par fonctionnalité

#### F1 — {{Nom fonctionnalité}}

- {{Sous-fonctionnalité 1}}
- {{Sous-fonctionnalité 2}}
- {{Sous-fonctionnalité 3}}

#### F2 — {{Nom fonctionnalité}}

- {{Sous-fonctionnalité 1}}
- {{Sous-fonctionnalité 2}}

---

## OUT (explicitement exclu)

> Fonctionnalités explicitement exclues pour éviter toute ambiguïté.
> Ces éléments pourront être considérés pour les versions futures.

| # | Fonctionnalité exclue | Raison | Version future ? |
|---|----------------------|--------|------------------|
| X1 | {{Fonctionnalité}} | {{Raison de l'exclusion}} | V2 |
| X2 | {{Fonctionnalité}} | {{Raison de l'exclusion}} | Non planifié |
| X3 | {{Fonctionnalité}} | {{Raison de l'exclusion}} | V2 |

---

## Limites connues

> Contraintes techniques ou business acceptées pour cette version.

### Contraintes techniques

| # | Limite | Description | Mitigation |
|---|--------|-------------|------------|
| L1 | {{Limite}} | {{Description}} | {{Comment on gère}} |
| L2 | {{Limite}} | {{Description}} | {{Comment on gère}} |

### Contraintes business

| # | Limite | Description | Impact |
|---|--------|-------------|--------|
| B1 | {{Limite}} | {{Description}} | {{Impact accepté}} |

---

## Dépendances externes

> Services, APIs, équipes dont dépend le projet.

### APIs et services

| Service | Usage | Criticité | Fallback |
|---------|-------|-----------|----------|
| {{API 1}} | {{Pourquoi}} | Critique / Important / Nice-to-have | {{Plan B}} |
| {{API 2}} | {{Pourquoi}} | Critique / Important / Nice-to-have | {{Plan B}} |

### Équipes et stakeholders

| Équipe | Dépendance | Contact |
|--------|------------|---------|
| {{Équipe}} | {{Ce dont on a besoin}} | {{Nom/Email}} |

### Librairies et frameworks

| Librairie | Version | Usage |
|-----------|---------|-------|
| {{Lib}} | {{X.Y.Z}} | {{Pourquoi}} |

---

## Matrice de priorisation

> Vue synthétique des priorités pour arbitrage.

| Priorité | Description | Fonctionnalités |
|----------|-------------|-----------------|
| **P1 - Must Have** | Indispensable pour la {{VN}} | F1, F2 |
| **P2 - Should Have** | Important mais pas bloquant | F3 |
| **P3 - Nice to Have** | Si le temps le permet | - |

---

## Risques liés au scope

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Scope creep | Moyenne | Haut | Validation stricte via Gate 1 |
| Dépendance externe indisponible | Basse | Haut | Fallback prévu |
| {{Risque}} | {{Proba}} | {{Impact}} | {{Mitigation}} |

---

## Références

- **Brief** : [docs/brief.md](brief.md)
- **Acceptance** : [docs/acceptance.md](acceptance.md)
- **Requirements** : [input/requirements.md](../input/requirements.md)

---

## Historique

| Date | Auteur | Action |
|------|--------|--------|
| {{YYYY-MM-DD}} | Analyst | Création |

---

*Template v1.0 | Phase BREAK | Spec-to-Code Factory*
