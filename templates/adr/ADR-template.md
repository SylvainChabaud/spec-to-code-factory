# ADR-XXXX: {{Titre de la décision}}

> Template pour docs/adr/ADR-XXXX-*.md
> Remplacer {{PLACEHOLDER}} par les valeurs du projet

## Statut

{{Proposé | Accepté | Déprécié | Remplacé par ADR-YYYY}}

## Date

{{YYYY-MM-DD}}

## Contexte

{{Description du contexte technique ou métier qui nécessite une décision.
Quels problèmes essayons-nous de résoudre ?
Quelles contraintes avons-nous ?}}

## Décision

{{Description claire de la décision architecturale prise.
Utiliser un langage affirmatif : "Nous utiliserons..." "Nous adopterons..."}}

## Options considérées

### Option 1: {{Nom}}

**Description** : {{Description de l'option}}

**Avantages** :
- {{Avantage 1}}
- {{Avantage 2}}

**Inconvénients** :
- {{Inconvénient 1}}
- {{Inconvénient 2}}

### Option 2: {{Nom}}

**Description** : {{Description de l'option}}

**Avantages** :
- {{Avantage 1}}
- {{Avantage 2}}

**Inconvénients** :
- {{Inconvénient 1}}
- {{Inconvénient 2}}

### Option 3: {{Nom}} (si applicable)

{{Répéter le pattern ci-dessus}}

## Justification

{{Pourquoi cette option a été choisie plutôt que les autres ?
Quels critères ont été déterminants ?}}

## Conséquences

### Positives

- {{Conséquence positive 1}}
- {{Conséquence positive 2}}

### Négatives

- {{Conséquence négative 1 et comment la mitiger}}
- {{Dette technique acceptée et plan de résolution}}

### Neutres

- {{Changement qui n'est ni positif ni négatif}}

## Implémentation

### Actions requises

1. {{Action 1}}
2. {{Action 2}}
3. {{Action 3}}

### Fichiers impactés

- `{{chemin/fichier1}}`
- `{{chemin/fichier2}}`

### Migration (si applicable)

{{Plan de migration des systèmes existants}}

## Contraintes architecturales (si applicable)

### Structure de dossiers imposée

| Layer | Dossier | Convention de nommage |
|-------|---------|----------------------|
| {{Layer}} | `{{src/xxx/}}` | {{PascalCase, suffixe}} |

### Règles d'import

- {{Layer A}} → {{Layer B}} : {{AUTORISÉ/INTERDIT}}

### Patterns structurels imposés

- {{Repository, Factory, UseCase, etc.}}

## Références

- {{Lien vers documentation externe}}
- {{Lien vers discussion/issue}}
- {{ADR connexe : ADR-YYYY}}

---

## Historique des révisions

| Date | Auteur | Description |
|------|--------|-------------|
| {{YYYY-MM-DD}} | {{Nom}} | Création |
