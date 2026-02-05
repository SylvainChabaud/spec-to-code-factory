# Local Preferences Template

> Preferences locales pour CE projet sur CETTE machine.
> Non versionne (auto-ajoute au .gitignore).
>
> Emplacement: ./CLAUDE.local.md (racine du projet)

## Environnement local

- Branche de travail: {{BRANCH}}
- Port dev: {{PORT}}
- URL locale: http://localhost:{{PORT}}

## Variables d'environnement locales

```bash
# Copier dans .env.local
NODE_ENV=development
API_URL=http://localhost:3001
DEBUG=true
```

## Taches en cours

| Tache | Statut | Notes |
|-------|--------|-------|
| {{TASK_1}} | En cours | {{NOTES_1}} |
| {{TASK_2}} | A faire | {{NOTES_2}} |

## Notes personnelles

<!-- Notes specifiques a votre environnement local -->

- Base de donnees locale: {{DB_LOCAL}}
- Credentials test: voir 1Password / vault

## Raccourcis locaux

```bash
# Demarrer avec debug
{{PKG_MANAGER}} dev:debug

# Tests rapides
{{PKG_MANAGER}} test -- --watch

# Reset DB locale
{{PKG_MANAGER}} db:reset
```

## Rappels

- [ ] Verifier `/status` avant de commencer
- [ ] Sync avec main regulierement
- [ ] Ne pas commit les fichiers .local

---
*Local config | Derniere maj: {{DATE}}*
