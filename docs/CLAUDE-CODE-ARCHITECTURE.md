# Architecture Claude Code - Mémo

> **Sources** : [Claude Code Docs](https://code.claude.com/docs/en/), [Anthropic Skills](https://github.com/anthropics/skills)

---

## 1. Agents (`.claude/agents/*.md`)

### Structure

```markdown
---
name: agent-name
description: "Description courte"
tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Contenu markdown (instructions)
```

### Champs YAML

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| `name` | Oui | Identifiant unique (kebab-case) |
| `description` | Oui | Description affichée lors de l'invocation |
| `tools` | Oui | Liste des outils autorisés pour cet agent |

### Déclenchement

- **Par qui** : Un **Skill** via l'outil `Task`
- **Comment** :
  ```
  Task(
    subagent_type: "agent-name",
    prompt: "Instructions pour l'agent",
    description: "Description courte"
  )
  ```

### Pattern Persona (BMAD)

```markdown
## Persona

| Aspect | Description |
|--------|-------------|
| **Identity** | Expertise et background |
| **Style** | Ton et approche |
| **Principles** | Principes directeurs |
```

---

## 2. Skills (`.claude/skills/*/SKILL.md`)

### Structure

```markdown
---
name: skill-name
description: "Description courte (max 1024 chars)"
context: fork
allowed-tools: Read, Glob, Grep, Task, Bash
---

# Contenu markdown (workflow)
```

### Champs YAML

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| `name` | Oui | Identifiant (kebab-case, max 64 chars) |
| `description` | Oui | Affichée à l'utilisateur |
| `context` | Non | `fork` = exécution isolée avec son propre contexte |
| `allowed-tools` | Non | Outils autorisés pour ce skill |

### `context: fork` - À quoi ça sert ?

- Crée un **sous-processus isolé** avec son propre contexte
- Permet au skill de déléguer à des agents via `Task()`
- **Important** : Les subagents ne peuvent pas spawner d'autres subagents

### Déclenchement

- **Par l'utilisateur** : `/skill-name` dans le terminal
- **Par Claude** : Automatiquement si pertinent
- **Par un autre skill** : Via invocation directe (ex: `/factory-intake`)

### Déléguer à un agent

```markdown
Utiliser Task tool :
Task(
  subagent_type: "analyst",
  prompt: "Analyse le fichier requirements.md",
  description: "Analyst - Phase BREAK"
)
```

---

## 3. Rules (`.claude/rules/*.md`)

### Structure

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/**/*.{ts,tsx}"
---

# Contenu markdown (règles)
```

### Champs YAML

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| `paths` | Non | Patterns glob pour scoper la rule |

### Comportement

| Configuration | Chargement |
|---------------|------------|
| **Sans `paths`** | Rule **globale** - chargée pour TOUS les fichiers |
| **Avec `paths`** | Rule **scopée** - chargée uniquement si fichier matche |

### Déclenchement

- **Automatique** : Claude charge les rules pertinentes selon les fichiers manipulés
- **Glob patterns** : Standard glob (`**/*.ts`, `{src,lib}/**/*.ts`)
- **Guillemets obligatoires** : Bug YAML si patterns non quotés

### Exemple

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Rules
- Valider les entrées utilisateur
- Pas de secrets dans les logs
```

---

## 4. Mémoire hiérarchique

Claude Code charge automatiquement une **hiérarchie de mémoires** au démarrage.

### Niveaux de mémoire

| Niveau | Fichier | Scope | Git |
|--------|---------|-------|-----|
| **Entreprise** | `C:\Program Files\ClaudeCode\CLAUDE.md` | Tous les users (IT/DevOps) | N/A |
| **Utilisateur** | `~/.claude/CLAUDE.md` | Toi (tous projets) | N/A |
| **Projet** | `./CLAUDE.md` ou `./.claude/CLAUDE.md` | Équipe | Commité |
| **Projet rules** | `./.claude/rules/*.md` | Équipe | Commité |
| **Local** | `./CLAUDE.local.md` | Toi (ce projet) | **Gitignored** |

### Ordre de chargement (contexte)

```
1. Entreprise    ─────► Fondation (policies IT)
2. Utilisateur   ─────► Préférences globales
3. Projet        ─────► Instructions équipe
4. Project rules ─────► Règles modulaires
5. Local         ─────► Overrides personnels (priorité max)
```

**Plus bas dans la hiérarchie = priorité plus haute** (local override projet override user).

### Découverte récursive

- Claude remonte l'arborescence depuis `cwd` jusqu'à la racine
- Charge tous les `CLAUDE.md` et `CLAUDE.local.md` trouvés
- Les rules dans les sous-dossiers sont chargées quand Claude accède à ces fichiers

### Commande utile

```
/memory   → Affiche les fichiers mémoire chargés
```

---

## 5. Settings (permissions/hooks)

### Fichiers et priorité

| Fichier | Partagé | Git | Priorité |
|---------|---------|-----|----------|
| `~/.claude/settings.json` | Non | N/A | 4 (plus basse) |
| `.claude/settings.json` | **Oui** | Commité | 3 |
| `.claude/settings.local.json` | Non | **Ignoré** | 2 |
| `managed-settings.json` | Oui | IT | 1 (plus haute) |

### Différence Project vs Local

| Aspect | `settings.json` | `settings.local.json` |
|--------|-----------------|----------------------|
| **Partagé** | Oui (équipe) | Non (personnel) |
| **Git** | Commité | Gitignored |
| **Usage** | Standards équipe | Préférences perso |

### Structure

```json
{
  "permissions": {
    "allow": ["Bash(npm run:*)"],
    "deny": ["Read(./.env)"],
    "ask": ["Bash(git push:*)"]
  },
  "hooks": {
    "PreToolUse": { "Bash": "echo 'Running...'" }
  },
  "env": { "NODE_ENV": "development" }
}
```

### Permissions

| Ordre | Type | Description |
|-------|------|-------------|
| 1 | `deny` | Bloque (priorité max) |
| 2 | `ask` | Demande confirmation |
| 3 | `allow` | Autorise silencieusement |

**Patterns** :
- `Bash(npm run:*)` → Préfixe avec boundary (`:*`)
- `Read(./.env)` → Fichier exact
- `Read(./secrets/**)` → Glob récursif

### Hooks

> ⚠️ **Format obligatoire** : Les hooks utilisent un format avec `matcher` (string) et `hooks` (array).
> Source : https://code.claude.com/docs/en/hooks

#### Structure

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/pre-check.js" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/post-validate.js" }]
      },
      {
        "matcher": "Edit",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/post-validate.js" }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/stop-gate.js" }]
      }
    ]
  }
}
```

#### Champs

| Champ | Type | Description |
|-------|------|-------------|
| `matcher` | `string` | Nom du tool à matcher (ex: `"Bash"`, `"Write"`, `"Edit"`) ou `""` pour tous |
| `hooks` | `array` | Liste des hooks à exécuter |
| `hooks[].type` | `string` | Type de hook : `"command"` |
| `hooks[].command` | `string` | Commande shell à exécuter |

#### Types d'événements

| Événement | Déclencheur |
|-----------|-------------|
| `PreToolUse` | Avant l'exécution d'un outil |
| `PostToolUse` | Après l'exécution d'un outil |
| `Stop` | Quand Claude termine son tour |

#### Exemple complet

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "echo 'About to run Bash'" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{ "type": "command", "command": "npm run lint --fix" }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "node tools/gate-check.js" }]
      }
    ]
  }
}
```

#### Erreurs courantes

❌ **INCORRECT** (ancien format) :
```json
{
  "hooks": {
    "PreToolUse": { "Bash": "echo test" }
  }
}
```

✅ **CORRECT** (nouveau format) :
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "echo test" }]
      }
    ]
  }
}
```

---

## 6. Résumé visuel

```
Racine projet/
├── CLAUDE.md                  # Mémoire projet (équipe, commité)
├── CLAUDE.local.md            # Mémoire locale (perso, gitignored)
│
└── .claude/
    ├── CLAUDE.md              # Alternative pour mémoire projet
    ├── settings.json          # Permissions/hooks équipe (commité)
    ├── settings.local.json    # Permissions perso (gitignored)
    │
    ├── agents/
    │   └── *.md              # Spécialistes invoqués par Task()
    │                         # YAML: name, description, tools
    │
    ├── skills/
    │   └── */SKILL.md        # Workflows invoqués par /commande
    │                         # YAML: name, description, context, allowed-tools
    │
    └── rules/
        └── *.md              # Règles auto-chargées selon fichiers
                              # YAML: paths (optionnel, globale si absent)

~/.claude/
├── CLAUDE.md                  # Mémoire utilisateur (tous projets)
├── settings.json              # Settings utilisateur
└── rules/                     # Rules utilisateur (tous projets)
```

---

## 7. Flux d'exécution

```
Utilisateur tape /factory
        │
        ▼
    Skill chargé (context: fork)
        │
        ▼
    Task(subagent_type: "analyst")
        │
        ▼
    Agent exécute avec ses tools
        │
        ▼
    Rules chargées selon fichiers manipulés
        │
        ▼
    Permissions vérifiées (settings.json)
        │
        ▼
    Hooks déclenchés (Pre/PostToolUse)
```

---

**Version** : 2026-01-21 | **Projet** : Spec-to-Code Factory
