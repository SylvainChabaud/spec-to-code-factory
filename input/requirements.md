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
