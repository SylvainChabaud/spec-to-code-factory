# Questions de Clarification — {{NOM_PROJET}}

> Template pour `docs/factory/questions.md`
> Généré par l'agent Analyst
> **Phase BREAK - Étape critique de cadrage**

---

## Metadata

| Champ | Valeur |
|-------|--------|
| **Projet** | {{NOM_PROJET}} |
| **Date** | {{YYYY-MM-DD}} |
| **Agent** | Analyst |
| **Statut** | En cours / Complété |

---

## Comment répondre ?

**Option 1 - Via le terminal** (recommandé)
L'agent vous posera les questions directement et enregistrera vos réponses ici.

**Option 2 - Éditer ce fichier**
Remplissez la colonne "Réponse" et changez le statut en "✅ RÉPONDU".
Relancez ensuite `/factory-intake` pour continuer.

---

## Résumé des questions

| Statut | Nombre |
|--------|--------|
| ✅ Répondues | {{X}} |
| ⏳ En attente | {{Y}} |
| 🔴 Bloquantes | {{Z}} |
| 🟡 Hypothèses générées | {{W}} |

---

## Questions ouvertes

| # | Priorité | Question | Réponse | Statut |
|---|----------|----------|---------|--------|
| Q1 | 🔴 | {{Question bloquante}} | | ⏳ EN ATTENTE |
| Q2 | 🔴 | {{Question bloquante}} | | ⏳ EN ATTENTE |
| Q3 | 🟡 | {{Question optionnelle}} | | ⏳ EN ATTENTE |

---

## Réponses collectées

> Cette section est remplie automatiquement par l'agent.

### Q1 — {{Question}}

| Champ | Valeur |
|-------|--------|
| **Priorité** | 🔴 Bloquante |
| **Posée le** | {{YYYY-MM-DD HH:MM}} |
| **Répondue le** | {{YYYY-MM-DD HH:MM}} |
| **Statut** | ✅ RÉPONDU |

**Question complète** :
{{Question détaillée avec contexte}}

**Réponse** :
{{Réponse de l'utilisateur}}

**Impact sur le brief** :
- {{Impact 1 : ce que cela change dans la spec}}
- {{Impact 2}}

---

### Q2 — {{Question}}

| Champ | Valeur |
|-------|--------|
| **Priorité** | 🟡 Optionnelle |
| **Posée le** | {{YYYY-MM-DD HH:MM}} |
| **Répondue le** | - |
| **Statut** | 🟡 HYPOTHÈSE |

**Question complète** :
{{Question détaillée avec contexte}}

**Réponse** :
_Non répondu_

**Hypothèse générée** :
{{Hypothèse retenue par défaut}}

**Impact si hypothèse fausse** :
{{Conséquences si l'hypothèse est invalidée}}

---

## Règles de gestion des questions

### Priorisation

| Priorité | Signification | Action |
|----------|---------------|--------|
| 🔴 Bloquante | Empêche de continuer | Attendre réponse obligatoire |
| 🟡 Optionnelle | Améliore la qualité | Générer hypothèse si non répondu |

### Limites

- **Maximum 10 questions** par session
- **Questions bloquantes en premier** pour débloquer rapidement
- **Regrouper** les questions liées pour éviter les allers-retours

### Statuts

| Statut | Signification |
|--------|---------------|
| ⏳ EN ATTENTE | Question posée, réponse attendue |
| ✅ RÉPONDU | Réponse fournie et intégrée |
| 🔴 BLOQUANT | Doit être résolu avant de continuer |
| 🟡 HYPOTHÈSE | Non répondu → hypothèse générée dans brief.md |
| ❌ ANNULÉE | Question devenue non pertinente |

---

## Traçabilité

> Mapping questions → documents impactés.

| Question | Document impacté | Section |
|----------|-----------------|---------|
| Q1 | `docs/brief.md` | Contexte utilisateur |
| Q2 | `docs/scope.md` | IN/OUT |
| Q3 | `docs/acceptance.md` | Critères |

---

## Historique des sessions

| Session | Date | Questions posées | Répondues |
|---------|------|------------------|-----------|
| 1 | {{YYYY-MM-DD}} | {{X}} | {{Y}} |

---

## Références

- **Brief** : [docs/brief.md](../brief.md)
- **Requirements** : [input/requirements.md](../../input/requirements.md)

---

*Template v1.0 | Phase BREAK | Spec-to-Code Factory*
