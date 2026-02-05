# Guide des fichiers CLAUDE.md

> Documentation complete sur les fichiers de memoire Claude Code.
> Bonnes pratiques, emplacements et templates.

## Vue d'ensemble

Claude Code utilise une hierarchie de fichiers CLAUDE.md pour personnaliser son comportement.
Les fichiers sont charges automatiquement au demarrage de chaque session.

## Hierarchie des fichiers

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MANAGED POLICY (Enterprise)                      │
│  C:\Program Files\ClaudeCode\CLAUDE.md                              │
│  Priorite: HAUTE | Partage: Organisation | Modifiable: IT/DevOps    │
├─────────────────────────────────────────────────────────────────────┤
│                         USER MEMORY                                  │
│  C:\Users\<user>\.claude\CLAUDE.md                                  │
│  Priorite: MOYENNE | Partage: Personnel | Modifiable: Utilisateur   │
├─────────────────────────────────────────────────────────────────────┤
│                         USER RULES                                   │
│  C:\Users\<user>\.claude\rules\*.md                                 │
│  Priorite: MOYENNE | Partage: Personnel | Modifiable: Utilisateur   │
├─────────────────────────────────────────────────────────────────────┤
│                       PROJECT MEMORY                                 │
│  ./CLAUDE.md  ou  ./.claude/CLAUDE.md                               │
│  Priorite: NORMALE | Partage: Equipe (Git) | Modifiable: Equipe     │
├─────────────────────────────────────────────────────────────────────┤
│                       PROJECT RULES                                  │
│  ./.claude/rules/*.md                                               │
│  Priorite: NORMALE | Partage: Equipe (Git) | Modifiable: Equipe     │
├─────────────────────────────────────────────────────────────────────┤
│                       PROJECT LOCAL                                  │
│  ./CLAUDE.local.md                                                  │
│  Priorite: BASSE | Partage: Personnel | Modifiable: Utilisateur     │
│  (auto-gitignore)                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Emplacements par OS

| Niveau | Windows | macOS | Linux |
|--------|---------|-------|-------|
| **Enterprise** | `C:\Program Files\ClaudeCode\CLAUDE.md` | `/Library/Application Support/ClaudeCode/CLAUDE.md` | `/etc/claude-code/CLAUDE.md` |
| **User** | `%USERPROFILE%\.claude\CLAUDE.md` | `~/.claude/CLAUDE.md` | `~/.claude/CLAUDE.md` |
| **User Rules** | `%USERPROFILE%\.claude\rules\*.md` | `~/.claude/rules/*.md` | `~/.claude/rules/*.md` |
| **Project** | `.\CLAUDE.md` | `./CLAUDE.md` | `./CLAUDE.md` |
| **Project Rules** | `.\.claude\rules\*.md` | `./.claude/rules/*.md` | `./.claude/rules/*.md` |
| **Local** | `.\CLAUDE.local.md` | `./CLAUDE.local.md` | `./CLAUDE.local.md` |

## Quel contenu pour quel fichier ?

### Enterprise (Managed Policy)

**Objectif**: Politiques de securite non negociables pour l'organisation

| Inclure | Ne PAS inclure |
|---------|----------------|
| Regles securite OWASP | Preferences personnelles |
| Commandes bloquees | Style de code |
| Compliance RGPD | Outils preferes |
| Audit et tracabilite | Workflows projet |

**Caracteristiques**:
- Deploye par IT/DevOps (MDM, Group Policy, Ansible)
- Non modifiable par les utilisateurs
- ~40-50 lignes max
- Focus: securite et compliance

**Template**: [templates/claude-md/enterprise-template.md](templates/claude-md/enterprise-template.md)

---

### User Memory

**Objectif**: Preferences personnelles applicables a tous vos projets

| Inclure | Ne PAS inclure |
|---------|----------------|
| Environnement (OS, IDE) | Regles projet specifiques |
| Style de code prefere | Architecture projet |
| Outils favoris | Commandes projet |
| Workflow Git personnel | Secrets |

**Caracteristiques**:
- Modifiable par l'utilisateur
- Applique a TOUS les projets
- ~40-60 lignes max
- Focus: preferences personnelles

**Template**: [templates/claude-md/user-template.md](templates/claude-md/user-template.md)

---

### Project Memory

**Objectif**: Instructions partagees avec l'equipe pour ce projet

| Inclure | Ne PAS inclure |
|---------|----------------|
| Stack technique | Preferences personnelles |
| Commandes build/test/lint | Config locale |
| Structure du projet | Secrets |
| Conventions equipe | Credentials |
| Architecture (pointeurs) | Taches en cours |

**Caracteristiques**:
- Versionne avec Git
- Partage avec l'equipe
- ~60-100 lignes max
- Focus: projet et equipe

**Template**: [templates/claude-md/project-template.md](templates/claude-md/project-template.md)

---

### Project Rules

**Objectif**: Regles modulaires par domaine

| Inclure | Ne PAS inclure |
|---------|----------------|
| Regles par domaine | Instructions generiques |
| Conventions specifiques | Commandes |
| Standards (API, tests) | Preferences personnelles |
| Regles conditionnelles (paths) | Architecture complete |

**Caracteristiques**:
- Un fichier par domaine
- Peut etre conditionnel (paths)
- Versionne avec Git
- ~30-50 lignes par fichier

**Template**: [templates/claude-md/rules-template.md](templates/claude-md/rules-template.md)

---

### Project Local

**Objectif**: Preferences locales pour CE projet sur CETTE machine

| Inclure | Ne PAS inclure |
|---------|----------------|
| Config environnement local | Regles equipe |
| Taches en cours | Secrets (meme locaux) |
| Notes personnelles | Credentials |
| URLs locales | Donnees sensibles |

**Caracteristiques**:
- Auto-ajoute au .gitignore
- NON partage
- ~30-50 lignes max
- Focus: config locale

**Template**: [templates/claude-md/local-template.md](templates/claude-md/local-template.md)

---

## Bonnes pratiques

### Regles d'or

| Regle | Explication |
|-------|-------------|
| **< 60-150 lignes** | Claude a une capacite limitee (~150-200 instructions) |
| **Specifique > Generique** | "2 espaces" > "formater correctement" |
| **Pointeurs > Copies** | `@docs/api.md` > copier le contenu |
| **Linter > Instructions** | ESLint/Prettier > regles textuelles |
| **Iterer** | Affiner regulierement, tester l'efficacite |

### A eviter

- Instructions generiques ("ecrire du code propre")
- Contenu genere par `/init` sans revision
- Code copie (devient obsolete)
- Fichiers trop longs (> 150 lignes)
- Duplication entre niveaux

### Syntaxe d'import

Les fichiers CLAUDE.md supportent les imports:

```markdown
Voir @README.md pour le projet.
Conventions: @docs/conventions.md
API: @docs/api.md
```

### Regles conditionnelles (paths)

Pour les rules modulaires:

```markdown
---
paths:
  - "src/**/*.ts"
  - "tests/**/*.test.ts"
---

# TypeScript Rules
...
```

---

## Templates disponibles

| Template | Usage | Emplacement |
|----------|-------|-------------|
| [enterprise-template.md](templates/claude-md/enterprise-template.md) | Politique entreprise | `C:\Program Files\ClaudeCode\` |
| [user-template.md](templates/claude-md/user-template.md) | Preferences personnelles | `~/.claude/` |
| [project-template.md](templates/claude-md/project-template.md) | Instructions projet | `./` |
| [local-template.md](templates/claude-md/local-template.md) | Config locale | `./` |
| [rules-template.md](templates/claude-md/rules-template.md) | Regles modulaires | `./.claude/rules/` |

---

## Commandes utiles

```bash
# Voir les fichiers CLAUDE.md charges
/context

# Voir la memoire
/memory

# Initialiser un CLAUDE.md projet
/init

# Ajouter une memoire rapidement (touche #)
# description de la memoire
```

---

## Verification

Pour verifier que vos fichiers sont bien charges:

1. Lancer Claude Code
2. Executer `/context`
3. Verifier la section "Memory Files"

---

## Sources et references

- [Memory - Claude Code Docs](https://code.claude.com/docs/en/memory)
- [Security - Claude Code Docs](https://code.claude.com/docs/en/security)
- [Best Practices - Claude Code Docs](https://code.claude.com/docs/en/best-practices)
- [Writing a good CLAUDE.md - HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [The Complete Guide to CLAUDE.md - Builder.io](https://www.builder.io/blog/claude-md-guide)
- [Creating the Perfect CLAUDE.md - Dometrain](https://dometrain.com/blog/creating-the-perfect-claudemd-for-claude-code/)

---

*Guide CLAUDE.md | v1.0 | 2026-02*
