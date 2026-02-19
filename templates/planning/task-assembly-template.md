# TASK-XXXX — App Assembly (Intégration Finale)

> **Principe BMAD** : Cette task est 100% auto-suffisante.
> Tout le contexte nécessaire pour assembler l'application est inclus ci-dessous.
>
> **Note** : Cette task est TOUJOURS la dernière du pipeline.
> Elle assemble les artefacts générés par les tasks précédentes.

---

## Metadata

| Champ | Valeur |
|-------|--------|
| **ID** | TASK-XXXX |
| **US Parent** | US-XXXX (dernière US) |
| **EPIC** | EPIC-XXX |
| **Priorité** | P1 (bloquant pour Gate 4) |
| **Estimation** | 1-2h |
| **Statut** | pending |

---

## Objectif technique

Intégrer TOUS les composants et hooks générés dans `src/App.tsx` pour produire une application fonctionnelle.

### Ce qui est attendu
- [ ] Importer tous les composants principaux
- [ ] Utiliser tous les hooks d'état et de logique métier
- [ ] Créer un layout cohérent selon les specs système
- [ ] Connecter les composants entre eux via les hooks
- [ ] L'application doit être fonctionnelle (pas un stub)

### Ce qui n'est PAS attendu (hors scope)
- Refactoriser les composants existants
- Ajouter de nouvelles fonctionnalités non prévues
- Modifier les hooks ou leurs signatures
- Ajouter du styling au-delà du layout

---

## Contexte complet

> Cette section contient TOUT le contexte nécessaire pour implémenter la task.

### Composants à intégrer

> Liste exhaustive des composants exportés par `src/components/index.ts`
> (ou découverts dans `src/components/` si pas d'index)

{{LISTE_COMPOSANTS}}

**Exemple** :
| Composant | Fichier | Props principales |
|-----------|---------|-------------------|
| `NoteList` | `src/components/NoteList/NoteList.tsx` | `notes`, `onSelect`, `onDelete` |
| `NoteForm` | `src/components/NoteForm/NoteForm.tsx` | `note?`, `onSave`, `onCancel` |
| ... | ... | ... |

### Hooks à utiliser

> Liste exhaustive des hooks exportés par `src/hooks/index.ts`
> (ou découverts dans `src/hooks/` si pas d'index)

{{LISTE_HOOKS}}

**Exemple** :
| Hook | Fichier | Retour principal |
|------|---------|------------------|
| `useNotes` | `src/hooks/useNotes.ts` | `{ notes, addNote, updateNote, deleteNote }` |
| `useSearch` | `src/hooks/useSearch.ts` | `{ searchTerm, setSearchTerm, filteredNotes }` |
| ... | ... | ... |

### Types principaux

> Types à importer depuis `src/types/index.ts`

{{LISTE_TYPES}}

**Exemple** :
| Type | Description |
|------|-------------|
| `Note` | Entité note avec id, title, content, tags, etc. |
| `Category` | Entité catégorie avec id, name, color |

### Layout attendu

> Structure UI extraite des specs par le Scrum Master.

{{DESCRIPTION_LAYOUT_DEPUIS_SPECS}}

**Exemple de structure** :
```
┌─────────────────────────────────────────┐
│ Header (titre application)              │
├─────────────────────────────────────────┤
│ SearchBar                               │
├────────────────┬────────────────────────┤
│ CategoryFilter │ NoteList / NoteDetail  │
│                │                        │
│                ├────────────────────────┤
│                │ NoteForm (modal/inline)│
└────────────────┴────────────────────────┘
```

### Règles métier applicables

> Règles extraites des specs par le Scrum Master. Auto-suffisant — ne pas chercher d'autre source.

| Règle | Contrainte |
|-------|------------|
| [Architecture UI] | [Description du layout et des composants attendus] |
| [Interfaces composants] | [Props et types des composants à assembler] |
| [ADR stack] | [Framework UI et contraintes architecturales] |

### Code existant pertinent

> Exemple de connexion entre hooks et composants (si disponible)

```typescript
// Pattern type pour connecter hook → composant
const { notes, addNote } = useNotes();
// ...
<NoteList notes={notes} onSelect={handleSelect} />
```

---

## Fichiers concernés

> Liste exhaustive des fichiers à créer/modifier.

### Fichiers à modifier
- `src/App.tsx` (transformation complète)

### Fichiers à créer (si nécessaire)
- `src/App.test.tsx` (tests de rendu et intégration)
- `src/App.css` ou styles inline (layout seulement)

---

## Plan d'implémentation

> Ordre des étapes à suivre.

1. **Imports** : Importer tous les composants, hooks et types
   - Fichier: `src/App.tsx`
   - Vérifier que chaque import est valide (pas d'erreur TS)

2. **État global** : Initialiser tous les hooks
   - Appeler chaque hook au niveau du composant App
   - Gérer les états locaux supplémentaires si nécessaire (ex: selectedNote)

3. **Handlers** : Créer les fonctions de liaison
   - Connecter les callbacks des composants aux hooks
   - Gérer la navigation entre vues (si applicable)

4. **Layout** : Structurer le JSX
   - Suivre le layout des specs système
   - Positionner chaque composant

5. **Styling basique** : Layout CSS/Tailwind
   - Grid/Flexbox pour la structure
   - Pas de styling cosmétique (hors scope)

6. **Tests** : Écrire les tests de rendu
   - Test: App renders without crashing
   - Test: Principaux composants sont présents

---

## Definition of Done

> TOUS les critères doivent être cochés.

- [ ] App.tsx importe ≥ 50% des composants disponibles
- [ ] App.tsx utilise ≥ 50% des hooks disponibles
- [ ] Au moins 1 composant principal est rendu dans le JSX
- [ ] `npm run build` passe sans erreur TypeScript
- [ ] `npm test` passe (tous les tests)
- [ ] L'application se lance (`npm run dev`) et est navigable
- [ ] App.tsx a au moins 50 lignes (pas un stub)

---

## Tests attendus

### Tests unitaires
- [ ] Test: App renders without crashing
- [ ] Test: App renders main components (NoteList, etc.)
- [ ] Test: Hooks are properly initialized
- [ ] Test: Components receive correct props from hooks

### Tests d'intégration (si applicable)
- [ ] Test: User can add a new item via form
- [ ] Test: User can search/filter items
- [ ] Test: User can select and view item details

---

## Critères de validation automatique

> Validés par `tools/validate-app-assembly.js`

| Critère | Seuil | Obligatoire |
|---------|-------|-------------|
| Taille App.tsx | ≥ 50 lignes | Oui |
| Components importés | ≥ 50% | Oui |
| Hooks utilisés | ≥ 50% | Oui |
| Composants rendus | ≥ 1 | Oui |
| TypeScript valide | `tsc --noEmit` | Oui |

---

## Notes d'implémentation

### Attention
- ⚠️ Ne PAS modifier les composants existants (hors scope)
- ⚠️ Ne PAS ajouter de nouvelles fonctionnalités
- ⚠️ Se limiter au layout et à l'intégration

### Patterns à suivre
- Utiliser les hooks comme source unique de vérité (state)
- Props drilling minimal (passer les callbacks directs)
- Composition de composants (pas d'héritage)

### Validation
- Lancer `node tools/validate-app-assembly.js` avant de marquer complete
- Lancer `npm run build` et `npm test`

---

## Historique

| Date | Auteur | Action |
|------|--------|--------|
| YYYY-MM-DD | Scrum Master | Création (auto-générée) |
