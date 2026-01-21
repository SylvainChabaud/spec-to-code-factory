# Template Rule Claude Code

> Ce template est utilisé par l'agent `rules-memory` pour générer les rules.

---

## Format avec scope (paths)

Utiliser ce format quand la rule s'applique à des fichiers spécifiques :

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/services/**/*.ts"
---

# [Nom de la Rule]

> **Justification** : [Référence ADR ou Spec]

## [Section 1]
- Règle 1
- Règle 2

## [Section 2]
- Règle 3
- Règle 4
```

---

## Format global (sans paths)

Utiliser ce format quand la rule s'applique à TOUS les fichiers :

```markdown
# [Nom de la Rule]

> **Justification** : [Référence ADR ou Spec]

## [Section 1]
- Règle 1
- Règle 2
```

---

## Spécifications YAML `paths`

### Guillemets OBLIGATOIRES

```yaml
# ✅ CORRECT
paths:
  - "src/**/*.ts"
  - "**/*.{js,jsx}"

# ❌ INCORRECT (bug YAML)
paths:
  - src/**/*.ts
  - **/*.{js,jsx}
```

### Glob patterns supportés

| Pattern | Description |
|---------|-------------|
| `"**/*.ts"` | Tous les .ts récursivement |
| `"src/**/*"` | Tous fichiers sous src/ |
| `"*.md"` | .md à la racine seulement |
| `"src/**/*.{ts,tsx}"` | .ts et .tsx sous src/ |
| `"{src,lib}/**/*.ts"` | .ts sous src/ OU lib/ |

---

## Exemples par domaine

### Backend

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/services/**/*.ts"
  - "src/controllers/**/*.ts"
---

# Backend Rules

> Justification : ADR-0001-stack.md, docs/specs/api.md

## Validation des entrées
- Valider types et champs requis
- Sanitizer les entrées utilisateur

## Gestion des erreurs
- Messages explicites
- Codes HTTP standards
- Pas de stack traces en production
```

### Frontend

```markdown
---
paths:
  - "src/components/**/*.tsx"
  - "src/pages/**/*.tsx"
  - "src/hooks/**/*.ts"
---

# Frontend Rules

> Justification : docs/specs/system.md

## Composants
- Gérer loading / error / empty states
- Composants petits et testables
- Pas d'effets de bord dans le rendu

## Accessibilité
- Labels sur tous les inputs
- Alt text sur les images
```

### Testing

```markdown
---
paths:
  - "tests/**/*.test.ts"
  - "**/*.spec.ts"
---

# Testing Rules

> Justification : docs/specs/system.md#testing

## Couverture
- Chaque US : 1 test nominal + 1 test erreur
- Tests déterministes (pas de réseau, horloge mockée)

## Naming
- `describe` = unité testée
- `it` = comportement attendu
```

### Security

```markdown
# Security Rules

> Justification : ADR-0002-security.md

## Secrets
- INTERDIT : secrets en clair (API_KEY, PASSWORD, TOKEN)
- Utiliser variables d'environnement

## Données personnelles
- INTERDIT : données réelles
- Utiliser `@example.com`, `*.test`

## Logs
- INTERDIT : logger passwords, tokens, PII
```

---

## Checklist avant création

- [ ] La rule est justifiée par un ADR ou une spec ?
- [ ] Les paths sont entre guillemets ?
- [ ] La rule est actionnable et vérifiable ?
- [ ] Pas de duplication avec une rule existante ?
