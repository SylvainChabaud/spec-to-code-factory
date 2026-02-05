# User Preferences Template

> Preferences personnelles applicables a tous vos projets.
>
> Emplacement: ~/.claude/CLAUDE.md (tous OS)
>              C:\Users\<user>\.claude\CLAUDE.md (Windows)

## Environnement

- OS: {{OS}}
- IDE: {{IDE}}
- Terminal: {{TERMINAL}}
- Runtime: {{RUNTIME}}

## Style de code

- Indentation: {{INDENT}} espaces
- Quotes: {{QUOTES}}
- Point-virgule: {{SEMICOLON}}
- Langue code: {{CODE_LANG}}
- Langue commentaires: {{COMMENT_LANG}}

## Outils preferes

- Package manager: {{PKG_MANAGER}}
- Tests: {{TEST_FRAMEWORK}}
- Bundler: {{BUNDLER}}
- Linter: {{LINTER}}

## Git workflow

- Branches: feature/xxx, fix/xxx, chore/xxx
- Commits: format conventionnel (feat:, fix:, chore:)
- Toujours `git status` avant commit

## Raccourcis communs

```bash
{{PKG_MANAGER}} dev      # Dev server
{{PKG_MANAGER}} test     # Tests
{{PKG_MANAGER}} build    # Build prod
{{PKG_MANAGER}} lint     # Linter
```

## Preferences Claude Code

- Reponses concises
- Pas d'emojis sauf demande
- Expliquer les choix techniques
- Proposer des alternatives quand pertinent

---
*v1.0 | {{DATE}}*
