---
name: factory-spec
description: "Phase MODEL - Génère specs + ADR + rules"
context: fork
allowed-tools: Read, Glob, Grep, Task, Bash
---

# Factory Spec - Phase MODEL

Tu es l'orchestrateur de la phase MODEL.

## Workflow

1. **Verifier Gate 1 (entree)** :
   ```bash
   node tools/gate-check.js 1 --json
   ```
   - Si `status === "FAIL"` → STOP immediat (prerequis manquants, ne peut pas corriger).
   - Terminer avec : `GATE_FAIL|1|<resume erreurs>|0`

2. **Lire le state** :
   ```bash
   node tools/factory-state.js get
   # Retourne: { "evolutionMode": "greenfield|brownfield", "evolutionVersion": N, "requirementsFile": "...", ... }

   # Lister les ADR actifs (brownfield : exclut SUPERSEDED)
   node tools/list-active-adrs.js --summary

   # Extraire le delta de la version courante (brownfield uniquement)
   node tools/extract-version-delta.js -f brief -f scope
   ```
   Extraire : `evolutionMode`, `evolutionVersion`.

3. **Deleguer aux 3 agents** (sequentiel strict, UN A LA FOIS) :

   **3a. Agent PM** (specs fonctionnelles) :
   ```
   Task(
     subagent_type: "pm",
     prompt: "Genere les specs fonctionnelles du projet.
     Mode: <evolutionMode>. Version: <evolutionVersion>.
     Si mode=greenfield: CREATE docs/specs/system.md et docs/specs/domain.md.
     Si mode=brownfield: EDIT les specs existantes pour les mettre a jour.
     DELTA VERSION COURANTE: <output de extract-version-delta.js>
     Lis les fichiers BREAK: docs/brief.md, docs/scope.md, docs/acceptance.md.
     Lis les templates: templates/specs/system.md, templates/specs/domain.md.
     IMPORTANT: Respecte EXACTEMENT les headings des templates (##).",
     description: "MODEL - PM specs"
   )
   ```

   **3b. Agent Architect** (specs techniques + ADR) :
   ```bash
   # Extraire le delta depuis les specs PM (disponibles apres 3a)
   node tools/extract-version-delta.js -f system -f domain
   ```
   ```
   Task(
     subagent_type: "architect",
     prompt: "Genere les specs techniques et ADR.
     Mode: <evolutionMode>. Version: <evolutionVersion>.
     Si mode=greenfield: CREATE docs/specs/api.md, ADR-0001-stack.md, project-config.json.
     Si mode=brownfield: EDIT api.md + CREATE nouveaux ADR + marquer anciens SUPERSEDED.
     DELTA VERSION COURANTE: <output de extract-version-delta.js>
     Lis les fichiers BREAK: docs/brief.md, docs/scope.md, docs/acceptance.md.
     Lis les specs PM: docs/specs/system.md, docs/specs/domain.md.
     Lis les templates: templates/specs/api.md, templates/adr/ADR-template.md, templates/specs/project-config.json.
     IMPORTANT: Respecte EXACTEMENT les headings des templates (##).",
     description: "MODEL - Architect specs"
   )
   ```

   **3c. Agent Rules-Memory** (rules Claude Code) :
   ```bash
   # Extraire le delta depuis toutes les specs (disponibles apres 3a+3b)
   node tools/extract-version-delta.js -f system -f domain -f api
   ```
   ```
   Task(
     subagent_type: "rules-memory",
     prompt: "Genere les rules Claude Code pour le projet.
     Mode: <evolutionMode>. Version: <evolutionVersion>.
     Si mode=greenfield: CREATE les rules dans .claude/rules/.
     Si mode=brownfield: mettre a jour les rules existantes, supprimer les obsoletes.
     ADR ACTIFS: <liste des paths retournes par list-active-adrs.js --summary>
     DELTA VERSION COURANTE: <output de extract-version-delta.js>
     IMPORTANT: NE PAS charger les ADR au statut SUPERSEDED.
     Lis les specs: docs/specs/system.md, docs/specs/domain.md, docs/specs/api.md.
     Lis le template: templates/rule.md.",
     description: "MODEL - Rules generation"
   )
   ```

4. **Executer Gate 2 (sortie avec auto-remediation)** :

   ```bash
   node tools/gate-check.js 2 --json
   ```

   Suivre le **protocole standard de gate handling** :

   **Tentative 1** : Analyser le JSON retourne.
   - Si `status === "PASS"` → continuer a l'etape 5.
   - Si `status === "FAIL"` :
     - Lire `errors[]`. Pour chaque erreur `fixable: true` :
       - `missing_section` → identifier le fichier et le template de reference dans le message d'erreur (`ref: templates/...`). Relancer l'agent responsable avec prompt : "Corrige [fichier]. Section manquante : [section]. Lis le template [template] et respecte exactement les headings."
       - `missing_file` → relancer l'agent responsable pour generer le fichier.
       - `config` → relancer l'architect pour corriger project-config.json.
       - `security` → corriger les secrets/PII directement.
     - Re-executer : `node tools/gate-check.js 2 --json`

   **Tentative 2** : Meme logique, relancer les agents fautifs.
   - Re-executer : `node tools/gate-check.js 2 --json`

   **Tentative 3** : Si toujours FAIL, retourner le rapport d'echec.
   - **NE PAS continuer le pipeline.**
   - Terminer avec : `GATE_FAIL|2|<resume erreurs separees par ;>|3`

5. **Sync ADR** (brownfield) :
   ```bash
   node tools/list-active-adrs.js --summary
   ```

6. **Logger** via :
   ```bash
   node tools/factory-log.js "MODEL" "completed" "Phase MODEL terminee"
   ```

7. **Retourner** un resume avec liste des fichiers generes (chemins complets).

## Protocole d'echec

- **Gate d'entree** (Gate 1) : Si FAIL → STOP immediat + marqueur `GATE_FAIL|1|...|0`.
- **Gate de sortie** (Gate 2) : Auto-remediation 3x puis marqueur `GATE_FAIL|2|...|3` si echec persistant.
- **Jamais** de STOP silencieux — toujours retourner un rapport structure.
