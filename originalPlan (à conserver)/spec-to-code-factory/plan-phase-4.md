# Phase 4 — Test End-to-End

> Lire ce fichier UNIQUEMENT pour la Phase 4.
> Objectif : Tester le pipeline complet avec un projet démo.

---

## Projet démo suggéré

**Mini API Todo List** (simple, permet de tester tout le pipeline)

### input/requirements.md (exemple)

```markdown
# Requirements — Todo API

## 1. Contexte & Problème
Besoin d'une API REST simple pour gérer des todos.

## 2. Objectifs métier (priorisés)
1. Permettre la création de todos
2. Permettre la consultation des todos
3. Permettre la modification de todos
4. Permettre la suppression de todos

## 3. Utilisateurs / Personas
- Développeur utilisant l'API

## 4. Parcours utilisateurs
- Créer un todo → le consulter → le modifier → le supprimer

## 5. Fonctionnalités attendues (priorisées)
- P0: CRUD complet sur les todos
- P1: Filtrer par statut (done/pending)

## 6. Données manipulées
- Todo: { id, title, description, done, createdAt }
- Sensibilité: FAIBLE

## 7. Contraintes non-fonctionnelles
- Pas d'authentification (V1)
- Stockage en mémoire (pas de DB)
- Temps de réponse < 100ms

## 8. Hors-scope explicite
- Authentification
- Persistance DB
- UI

## 9. Critères d'acceptation mesurables
- CRUD fonctionnel (tests passants)
- Réponses JSON valides
- Codes HTTP corrects

## 10. Intégrations externes
- Aucune

## 11. Stack / Préférences techniques
- Node.js avec Express (ou Fastify)
- TypeScript optionnel

## 12. Qualité attendue
- Tests unitaires sur les handlers
- Tests intégration sur les endpoints
```

---

## Étapes de test

### Étape 1 : Exécuter /factory-intake

```bash
# Commande Claude Code
/factory-intake

# Vérification
node tools/gate-check.js 1
```

**Attendu :**
- docs/brief.md créé avec sections
- docs/scope.md créé avec IN/OUT
- docs/acceptance.md créé avec critères
- Gate 1 : PASS

### Étape 2 : Exécuter /factory-spec

```bash
/factory-spec

node tools/gate-check.js 2
```

**Attendu :**
- docs/specs/system.md
- docs/specs/domain.md
- docs/specs/api.md
- docs/adr/ADR-0001-*.md
- .claude/rules/* (règles générées)
- CLAUDE.md enrichi
- Gate 2 : PASS

### Étape 3 : Exécuter /factory-plan

```bash
/factory-plan

node tools/gate-check.js 3
```

**Attendu :**
- docs/planning/epics.md
- Au moins 1 US dans docs/planning/us/
- Au moins 1 TASK dans docs/planning/tasks/
- Chaque TASK a DoD + tests attendus
- Gate 3 : PASS

### Étape 4 : Exécuter /factory-build

```bash
/factory-build

node tools/gate-check.js 4
```

**Attendu :**
- Code dans src/ (ex: src/app.js, src/routes/, src/handlers/)
- Tests dans tests/ (ex: tests/todo.test.js)
- Tests passants
- Gate 4 : PASS

### Étape 5 : Exécuter /factory-qa

```bash
/factory-qa

node tools/gate-check.js 5
```

**Attendu :**
- docs/qa/report.md complété
- docs/release/checklist.md complété
- CHANGELOG.md créé
- Gate 5 : PASS

---

## Checklist de validation finale

### Structure
- [ ] Aucun fichier obsolète (prompts/, tasks/, *.py)
- [ ] Tous les dossiers requis présents
- [ ] Conventions de nommage respectées (US-/TASK-/ADR-)

### Artefacts
- [ ] 14+ templates fonctionnels
- [ ] 7 skills opérationnels
- [ ] 8 agents avec règles anti-dérive
- [ ] 3 commands
- [ ] 2+ rules

### Qualité
- [ ] Gate 1-5 tous PASS
- [ ] Tests passants
- [ ] Pas de secrets/PII détectés (`node tools/scan-secrets.js`)
- [ ] Structure valide (`node tools/validate-structure.js`)

### Pipeline
- [ ] /factory-intake génère brief/scope/acceptance
- [ ] /factory-spec génère specs/ADR/rules
- [ ] /factory-plan génère epics/US/tasks
- [ ] /factory-build génère code/tests
- [ ] /factory-qa génère QA/checklist/changelog
- [ ] /factory-run exécute tout le pipeline

---

## Commandes de vérification

```bash
# Valider la structure
node tools/validate-structure.js

# Scanner secrets/PII
node tools/scan-secrets.js

# Vérifier chaque gate
node tools/gate-check.js 1
node tools/gate-check.js 2
node tools/gate-check.js 3
node tools/gate-check.js 4
node tools/gate-check.js 5

# Exécuter les tests (après build)
npm test
```

---

## Résultat attendu

À la fin de la Phase 4, vous devez avoir :

1. **Un projet démo complet** (Todo API) avec :
   - Code source fonctionnel
   - Tests passants
   - Documentation complète

2. **Un pipeline validé** qui peut être réutilisé pour n'importe quel projet

3. **Une boîte noire prête à l'emploi** :
   - Copier le repo
   - Ajouter un requirements.md
   - Exécuter /factory-run
   - Obtenir un projet livrable
