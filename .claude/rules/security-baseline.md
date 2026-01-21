# Security Baseline

> ⚠️ **Rule GLOBALE** (pas de `paths`) : s'applique à TOUS les fichiers du projet.
>
> Justification : OWASP Top 10, bonnes pratiques sécurité

## Secrets
**INTERDIT** : secrets en clair dans le code
- API_KEY, PRIVATE_KEY, PASSWORD, TOKEN, SECRET
- Utiliser des variables d'environnement

## Données personnelles
**INTERDIT** : données personnelles réelles
- Emails : utiliser `user@example.com` ou `*.test`
- Noms : utiliser des placeholders
- Téléphones : utiliser des faux numéros

## Réseau
Par défaut, réseau interdit (`deny_all: true`).
Toute exception doit être justifiée dans un ADR.

## Logs
**INTERDIT** : logger des données sensibles
- Pas de passwords
- Pas de tokens
- Pas de PII (Personally Identifiable Information)

## Validation
Toujours valider les entrées utilisateur :
- Types attendus
- Champs requis
- Sanitization (XSS, injection)
