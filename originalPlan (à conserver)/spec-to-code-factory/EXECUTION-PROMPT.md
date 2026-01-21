# Prompt d'exécution — Spec-to-Code Factory V1

> Copie ce prompt dans une nouvelle conversation Claude Code pour exécuter le plan.

---

## PROMPT À COPIER

```
Tu vas implémenter la "Spec-to-Code Factory" — un pipeline Claude Code qui transforme un requirements.md en projet livrable.

## Documents de référence

Les plans sont dans : `C:\Users\Utilisateur\.claude\plans\spec-to-code-factory\`

**RÈGLE CRITIQUE : Document Sharding**
- Ne lis QUE le document nécessaire à la phase en cours
- Ne lis JAMAIS tous les plans d'un coup (pollution du contexte)

## Ordre d'exécution

### PHASE 0 : Nettoyage
1. Lis `plan-overview.md` (vue d'ensemble, décisions, structure cible)
2. Lis `plan-phase-0.md` (fichiers à supprimer/créer)
3. Exécute le nettoyage
4. Valide : aucun .py dans hooks/, tous les dossiers créés
5. ✅ Phase 0 terminée

### PHASE 1 : Templates
1. Lis `plan-phase-1.md` (15 templates à créer)
2. Crée chaque template avec ses sections obligatoires
3. Valide : tous les fichiers présents
4. ✅ Phase 1 terminée

### PHASE 2 : Skills + Agents + Commands + Rules
1. Lis `plan-phase-2.md` (7 skills, 8 agents, 3 commands, 2 rules)
2. Crée les skills dans .claude/skills/*/SKILL.md
3. Crée les agents dans .claude/agents/*.md
4. Crée les commands dans .claude/commands/*.md
5. Crée les rules dans .claude/rules/*.md
6. Valide : tous les fichiers présents
7. ✅ Phase 2 terminée

### PHASE 3 : Outils Node.js + Hooks + Config
1. Lis `plan-phase-3.md` (4 outils, 3 hooks, settings.json, CLAUDE.md)
2. Crée package.json
3. Crée les outils dans tools/*.js
4. Crée les hooks dans .claude/hooks/*.js
5. Crée .claude/settings.json
6. Mets à jour CLAUDE.md
7. Valide : `node tools/validate-structure.js`
8. ✅ Phase 3 terminée

### PHASE 4 : Test End-to-End
1. Lis `plan-phase-4.md` (projet démo, étapes de test)
2. Crée input/requirements.md avec l'exemple Todo API
3. Exécute le pipeline : /factory-run
4. Valide chaque gate (1-5)
5. ✅ Phase 4 terminée — Boîte noire prête !

## Répertoire de travail

D:\Projets\µEntreprise\Formations\Organisme de formation\Formation Black Rab IT\Formation IA - Claude Code\claude-code-from-scratch-starter

## Invariants à respecter

1. **Document Sharding** : Lis uniquement les docs de la phase en cours
2. **Pas de pollution** : Ne garde pas le contenu des phases précédentes en mémoire
3. **Validation** : Valide chaque phase avant de passer à la suivante
4. **Qualité** : Chaque fichier créé doit avoir ses sections obligatoires complètes

## Commencer

Démarre par la Phase 0. Annonce chaque phase avant de la commencer.
Utilise TodoWrite pour tracker ta progression.
```

---

## Notes pour l'utilisateur

### Pourquoi ce découpage ?

1. **Contexte propre** : Chaque phase ne lit que son plan (~200-400 lignes max)
2. **Pas de pollution** : L'agent n'a pas 800+ lignes de plan en mémoire
3. **Progression claire** : Validation explicite entre chaque phase
4. **Reprise facile** : Si problème, reprendre à la phase concernée

### En cas de problème

Si l'agent perd le fil :
```
Reprends à la Phase [N]. Lis `plan-phase-[N].md` et continue.
```

### Vérification manuelle

À tout moment, tu peux vérifier :
```bash
node tools/validate-structure.js
node tools/gate-check.js [1-5]
node tools/scan-secrets.js
```
