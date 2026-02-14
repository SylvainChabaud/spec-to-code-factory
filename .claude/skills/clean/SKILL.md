# /clean - Reset complet du projet

Remet le projet en état "starter" propre.

## Workflow

1. **Demander confirmation** via AskUserQuestion :
   - Question : "Remettre le projet en état starter ? Tous les artefacts seront supprimés."
   - Options : "Oui, nettoyer" / "Non, annuler"
   - Si "Non" → STOP

2. **Supprimer les artefacts** via Bash :
   ```bash
   # Artefacts documentation
   rm -rf docs/brief.md docs/scope.md docs/acceptance.md 2>/dev/null || true
   rm -rf docs/specs docs/adr docs/planning docs/qa docs/release docs/testing 2>/dev/null || true

   # Code généré
   rm -rf src tests release 2>/dev/null || true
   rm -f CHANGELOG.md 2>/dev/null || true

   # État factory
   rm -rf docs/factory 2>/dev/null || true

   # Config générée
   rm -f index.html postcss.config.js tailwind.config.js 2>/dev/null || true
   rm -f tsconfig.json tsconfig.node.json vite.config.ts 2>/dev/null || true
   rm -f eslint.config.js biome.json 2>/dev/null || true
   ```

3. **Supprimer rules générées** (garder baseline) :
   ```bash
   # Liste les rules, supprime celles qui ne sont pas baseline
   for f in .claude/rules/*.md; do
     case "$f" in
       *factory-invariants.md|*security-baseline.md) ;;
       *) rm -f "$f" 2>/dev/null || true ;;
     esac
   done
   ```

4. **Recréer structure minimale** :
   ```bash
   mkdir -p docs/factory docs/adr docs/specs
   ```

5. **Réinitialiser l'état** :
   ```bash
   echo '{"evolutionVersion":1,"evolutionMode":"greenfield","phase":null,"counters":{"epic":0,"us":0,"task":0}}' > docs/factory/state.json
   ```

6. **Réinitialiser package.json** (starter minimal) :
   ```bash
   cat > package.json << 'EOF'
{
  "name": "spec-to-code-factory",
  "version": "1.0.0",
  "description": "Pipeline Claude Code: requirements.md → projet livrable",
  "type": "module",
  "scripts": {
    "gate:check": "node tools/gate-check.js",
    "validate": "node tools/validate-structure.js",
    "scan:secrets": "node tools/scan-secrets.js",
    "verify": "node tools/verify-pipeline.js"
  },
  "keywords": ["claude-code", "pipeline", "spec-to-code", "factory"],
  "license": "MIT"
}
EOF
   ```

7. **Réinitialiser l'instrumentation** :
   ```bash
   node tools/instrumentation/collector.js reset
   ```

8. **Confirmer** :
   ```
   Projet nettoyé.

   Structure conservée :
   - input/requirements.md (source)
   - templates/ (templates workflow)
   - tools/ (outils workflow)
   - .claude/ (config Claude Code)

   Prêt pour : /factory-run
   ```

## Mode --force

Si l'argument contient "--force", skip la confirmation et exécute directement.
