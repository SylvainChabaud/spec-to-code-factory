# Analyse BMAD METHOD - Recommandations

> **Date** : 2026-01-21
> **Objectif** : Évaluer les bonnes pratiques BMAD pour enrichir nos agents/skills

---

## 1. Résumé BMAD METHOD

**BMAD** (Breakthrough Method for Agile AI-Driven Development) est un framework qui utilise **21+ agents spécialisés** couvrant le cycle complet de développement.

### Sources consultées
- [GitHub - BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
- [BMAD-AT-CLAUDE (port pour Claude)](https://github.com/24601/BMAD-AT-CLAUDE)
- [DeepWiki - Agent System](https://deepwiki.com/bmad-code-org/BMAD-METHOD/3.1-agent-system)
- [Medium - BMAD From Zero To Hero](https://medium.com/@visrow/bmad-method-from-zero-to-hero-1bf5203f2ecd)

---

## 2. Structure des agents BMAD

### Format YAML complet BMAD

```yaml
agent:
  metadata:
    id: "pm"
    name: "John"           # Prénom humain
    title: "Product Manager"
    icon: "📋"
    module: "bmm"
    hasSidecar: true       # Mémoire persistante

  persona:
    role: "PRD creation, requirements management"
    identity: "Experienced PM with 10+ years in software products"
    communication_style: "Strategic, user-focused, concise"
    principles:
      - "User value first"
      - "Data-driven decisions"
      - "Clear acceptance criteria"

  critical_actions:
    - "Load {project-root}/docs/prd.md before any action"
    - "Review sprint status before executing"
    - "Never skip validation checklist"

  menu:
    - trigger: "prd or product-requirements"
      description: "[PRD] Create product requirements document"
      workflow: "workflows/create-prd.yaml"
    - trigger: "ws or workflow-status"
      description: "[WS] Check workflow status"
      action: "inline-instruction"
```

### Ce que BMAD fait bien

| Aspect | BMAD | Avantage |
|--------|------|----------|
| **Persona** | Role + Identity + Style + Principles | Agent plus "incarné", comportement cohérent |
| **Critical Actions** | Règles chargées AVANT exécution | Évite les oublis critiques |
| **Menu** | Triggers courts (2-3 lettres) | UX rapide pour l'utilisateur |
| **Memory** | Sidecar pour mémoire persistante | Apprentissage entre sessions |
| **Human Name** | Prénoms (John, Sarah...) | Meilleure identification dans logs |

---

## 3. Comparaison avec notre structure actuelle

### Notre format actuel (Claude Code compatible)

```yaml
---
name: pm
description: "Phase MODEL - Produit les specs fonctionnelles"
tools:
  - Read
  - Write
  - Edit
---

# Agent PM (Product Manager)

Tu es l'agent PM de la phase MODEL.

## Rôle
Produire les specs fonctionnelles depuis le brief.

## Inputs
- docs/brief.md

## Outputs
- docs/specs/system.md

## Règles
1. ...

## Anti-dérive
- Ne PAS ...
```

### Analyse comparative

| Aspect | Notre structure | BMAD | Verdict |
|--------|----------------|------|---------|
| Format | YAML frontmatter + Markdown | YAML pur (compilé) | ✅ Le nôtre est natif Claude Code |
| Rôle | Basique | Enrichi (identity, style) | ⚠️ À améliorer |
| Règles | Anti-dérive | Critical Actions | ✅ Équivalent |
| Inputs/Outputs | ✅ Explicites | Implicites | ✅ Nous sommes mieux |
| Menu/Triggers | ❌ Absent | ✅ Présent | N/A (Skills gèrent ça) |
| Mémoire | ❌ Absent | ✅ Sidecar | Optionnel |

---

## 4. Recommandations d'adoption

### ✅ À ADOPTER - Persona enrichie

Ajouter une section `## Persona` à chaque agent avec :
- **Identity** : expertise et background
- **Communication style** : ton et approche
- **Principles** : 3-5 principes directeurs

**Exemple pour analyst.md** :
```markdown
## Persona
- **Identity** : Analyste senior spécialisé en cadrage de projets techniques
- **Style** : Méthodique, pose des questions ciblées, synthétise clairement
- **Principles** :
  - Jamais d'hypothèse implicite
  - Poser les questions critiques AVANT de continuer
  - Documenter chaque décision et son impact
```

### ✅ À ADOPTER - Critical Actions

Renommer `## Règles` en `## Actions Critiques` et les formuler comme des **impératifs** :
```markdown
## Actions Critiques (exécuter AVANT toute tâche)
1. ✓ Charger et lire input/requirements.md ENTIÈREMENT
2. ✓ Identifier les ambiguïtés et zones floues
3. ✓ Poser les questions bloquantes via AskUserQuestion
4. ✓ Documenter les Q/R dans docs/factory/questions.md
```

### ⏸️ À ÉVALUER - Prénoms humains

BMAD utilise des prénoms (John le PM, Sarah l'Architecte).
- **Avantage** : Plus identifiable dans les logs
- **Inconvénient** : Peut sembler artificiel

**Recommandation** : Optionnel, à tester sur un agent

### ❌ À NE PAS ADOPTER - Menu system

BMAD a un système de menus avec triggers courts.
- **Raison** : Nos **Skills** jouent déjà ce rôle
- Les Skills invoquent les agents via `Task(subagent_type: "agent-name")`

### ❌ À NE PAS ADOPTER - Format YAML pur

BMAD compile ses YAML en plusieurs formats.
- **Raison** : Claude Code utilise nativement Markdown avec YAML frontmatter
- Notre format est directement compatible

---

## 5. Template agent enrichi (proposition)

```markdown
---
name: agent-name
description: "Phase X - Description courte"
tools:
  - Read
  - Write
  - ...
---

# Agent [Name]

## Persona
- **Identity** : [Expertise et background]
- **Style** : [Ton, approche, personnalité]
- **Principles** :
  - [Principe 1]
  - [Principe 2]
  - [Principe 3]

## Rôle
[Description du rôle en 1-2 phrases]

## Inputs
- `path/to/input1`
- `path/to/input2`

## Outputs
- `path/to/output1`
- `path/to/output2`

## Actions Critiques
> ⚠️ Ces actions sont OBLIGATOIRES avant toute exécution

1. ✓ [Action 1]
2. ✓ [Action 2]
3. ✓ [Action 3]

## Workflow
1. [Étape 1]
2. [Étape 2]
3. [Étape 3]

## Anti-dérive
- ❌ Ne PAS [interdit 1]
- ❌ Ne PAS [interdit 2]

## Validation (DoD)
- [ ] [Critère 1]
- [ ] [Critère 2]
```

---

## 6. Agents BMAD vs nos agents

| Agent BMAD | Notre équivalent | Différence notable |
|------------|------------------|-------------------|
| Analyst | analyst.md | ✅ Similaire |
| PM | pm.md | ⚠️ BMAD plus détaillé |
| Architect | architect.md | ✅ Similaire |
| Scrum Master | scrum-master.md | ✅ Similaire |
| Developer | developer.md | ✅ Similaire, notre anti-dérive est fort |
| QA | qa.md | ⚠️ BMAD = "senior code reviewer" |

---

## 7. Plan d'action

### Phase 1 - Enrichir les agents existants
1. Ajouter section `## Persona` à chaque agent
2. Reformuler `## Règles` en `## Actions Critiques`
3. Vérifier que chaque agent a une section `## Anti-dérive`

### Phase 2 - Tester
1. Exécuter le pipeline complet
2. Évaluer si les agents se comportent mieux

### Phase 3 - Itérer
1. Ajuster les personas selon les résultats
2. Enrichir les Actions Critiques si nécessaire

---

## 8. Conclusion

**BMAD offre des patterns intéressants** mais notre structure est déjà bien alignée avec Claude Code.

### À retenir
- ✅ Adopter le **bloc Persona** (identity, style, principles)
- ✅ Adopter les **Actions Critiques** explicites
- ❌ Ne pas adopter le menu system (nos Skills gèrent ça)
- ❌ Ne pas changer le format YAML (le nôtre est natif)

**Impact estimé** : Agents plus cohérents, moins de dérive, meilleure traçabilité.

---

## 9. Spécification Anthropic - Rules `.claude/rules/`

> 📚 Source : [Claude Code Docs - Memory](https://code.claude.com/docs/en/memory)

### Format YAML frontmatter `paths`

```yaml
---
paths:
  - "src/api/**/*.ts"        # ⚠️ GUILLEMETS OBLIGATOIRES
  - "src/**/*.{ts,tsx}"      # Brace expansion supportée
---
```

### Comportement

| Configuration | Chargement |
|---------------|------------|
| **Sans `paths`** | Rule s'applique à TOUS les fichiers |
| **Avec `paths`** | Rule chargée UNIQUEMENT si fichier matche |

### Glob patterns

| Pattern | Description |
|---------|-------------|
| `"**/*.ts"` | Tous les .ts récursivement |
| `"src/**/*"` | Tous fichiers sous src/ |
| `"src/**/*.{ts,tsx}"` | .ts et .tsx sous src/ |
| `"{src,lib}/**/*.ts"` | .ts sous src/ OU lib/ |

### Template créé

Voir `templates/rule.md` pour le template complet avec exemples.
