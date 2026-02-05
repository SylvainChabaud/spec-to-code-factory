# Enterprise Policy Template

> Politiques de securite obligatoires pour tous les utilisateurs.
> Deploye par IT/DevOps via MDM/Group Policy. Non modifiable.
>
> Emplacement: C:\Program Files\ClaudeCode\CLAUDE.md (Windows)
>              /Library/Application Support/ClaudeCode/CLAUDE.md (macOS)
>              /etc/claude-code/CLAUDE.md (Linux)

## Securite (BLOQUANT)

### Secrets
- JAMAIS de secrets en clair: API_KEY, PASSWORD, TOKEN, SECRET, PRIVATE_KEY
- OBLIGATOIRE: variables d'environnement ou gestionnaire de secrets
- INTERDIT: committer .env, *.pem, *.key, credentials.*

### Donnees personnelles (RGPD)
- JAMAIS de vraies donnees personnelles dans le code ou tests
- Emails fictifs: user@example.com, test@example.org
- Noms fictifs: John Doe, Jane Smith
- Anonymiser tous les logs (pas de PII)

### Injection
- OBLIGATOIRE: valider toutes les entrees utilisateur
- OBLIGATOIRE: requetes SQL parametrees
- OBLIGATOIRE: echapper les sorties HTML (XSS)
- INTERDIT: eval(), exec() avec donnees utilisateur

## Commandes BLOQUEES

| Commande | Raison |
|----------|--------|
| `rm -rf /` | Destruction systeme |
| `rm -rf ~` | Destruction home |
| `git push --force origin main` | Perte historique |
| `chmod 777` | Permissions dangereuses |
| `curl \| sh` | Execution code distant |

## Commandes DEMANDE CONFIRMATION

- `npm publish` - Publication accidentelle
- `git reset --hard` - Perte de travail
- `docker system prune` - Suppression donnees

## Compliance

- Code review obligatoire avant merge main/master
- Commits tracables (format conventionnel)
- Logs sans donnees sensibles
- HTTPS obligatoire pour toutes communications

---
*Enterprise Policy v1.0 | IT/DevOps | {{DATE}}*
