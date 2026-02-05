# {{PROJECT_NAME}}

> Instructions partagees avec l'equipe pour ce projet.
>
> Emplacement: ./CLAUDE.md (racine du projet)
>              Versionne avec Git - partage avec l'equipe

## Projet

{{PROJECT_DESCRIPTION}}

## Stack technique

- Language: {{LANGUAGE}}
- Framework: {{FRAMEWORK}}
- Database: {{DATABASE}}
- Infra: {{INFRA}}

## Structure

```
src/
  components/   # Composants UI
  services/     # Logique metier
  utils/        # Utilitaires
tests/          # Tests
docs/           # Documentation
```

## Commandes

```bash
# Installation
{{PKG_MANAGER}} install

# Developpement
{{PKG_MANAGER}} dev

# Tests
{{PKG_MANAGER}} test
{{PKG_MANAGER}} test:coverage

# Build
{{PKG_MANAGER}} build

# Lint
{{PKG_MANAGER}} lint
{{PKG_MANAGER}} lint:fix
```

## Conventions

### Code
- Utiliser le linter configure (voir .eslintrc / biome.json)
- Types TypeScript stricts si applicable
- Pas de `any` sauf justification

### Git
- Format commit: `type(scope): description`
- Types: feat, fix, chore, docs, refactor, test
- Branch depuis main, PR obligatoire

### Tests
- Couverture minimum: 80%
- Tests unitaires pour logique metier
- Tests integration pour API

## Documentation supplementaire

- Architecture: @docs/architecture.md
- API: @docs/api.md
- Contributing: @CONTRIBUTING.md

---
*{{PROJECT_NAME}} | v{{VERSION}} | {{DATE}}*
