# Input - Fichiers Requirements

Ce dossier contient les fichiers requirements pour le pipeline factory.

## Convention de nommage

| Fichier | Usage |
|---------|-------|
| `requirements.md` | Version initiale (V1) |
| `requirements-2.md` | Evolution V2 |
| `requirements-3.md` | Evolution V3 |
| ... | etc. |

## Quel workflow utiliser ?

| Situation | Commande | Fichier requis |
|-----------|----------|----------------|
| Nouveau projet | `/factory-run` | `requirements.md` |
| Nouvelle feature majeure | `/factory-evolve` | `requirements-N.md` |
| Bug fix / tweak mineur | `/factory-quick` | Aucun (ou auto-genere) |

## Workflows detailles

### Nouveau projet (V1)
1. Creer `requirements.md` avec les 12 sections obligatoires
2. Lancer `/factory-run`

### Evolution majeure (V2+)
1. Garder `requirements.md` intact (historique V1)
2. Creer `requirements-N.md` avec les nouvelles features
3. Lancer `/factory-evolve`

### Quick fix (sans nouveau requirements)
1. Lancer `/factory-quick`
2. Decrire la modification
3. Le skill analyse la conformite :
   - **Conforme** → Implementation directe
   - **Non-conforme** → Propose de generer `requirements-N.md` automatiquement

## Generation automatique (Quick → Evolve)

Si `/factory-quick` detecte que la modification necessite une evolution :

```
Option A (Recommande):
  → Le skill genere requirements-N.md pre-rempli
  → Vous validez/completez
  → /factory-evolve s'execute

Option B:
  → Vous creez requirements-N.md manuellement
  → Template: copiez requirements.md
  → Completez les sections impactees
```

## Detection automatique

```bash
node tools/detect-requirements.js
# { "file": "input/requirements-2.md", "version": 2, "isEvolution": true }
```

Le pipeline detecte automatiquement la derniere version et adapte son comportement.

## Sections obligatoires (12)

Chaque requirements.md doit contenir :

1. Objectif
2. Fonctionnalites cles
3. Contraintes techniques
4. Stack technique
5. Personas
6. User Stories
7. Regles metier
8. API
9. Securite
10. Performance
11. Livrables
12. Hors scope
