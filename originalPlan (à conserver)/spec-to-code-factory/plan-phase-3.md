# Phase 3 — Outils Node.js + Hooks + Configuration

> Lire ce fichier UNIQUEMENT pour la Phase 3.
> Objectif : Créer les outils de validation et la configuration.

---

## package.json

```json
{
  "name": "spec-to-code-factory",
  "version": "1.0.0",
  "description": "Pipeline Spec-to-Code pour Claude Code",
  "type": "module",
  "scripts": {
    "gate:check": "node tools/gate-check.js",
    "validate": "node tools/validate-structure.js",
    "scan:secrets": "node tools/scan-secrets.js"
  },
  "keywords": ["claude-code", "pipeline", "spec-to-code"],
  "license": "MIT"
}
```

---

## Tools (4 fichiers)

### tools/gate-check.js

```javascript
#!/usr/bin/env node
/**
 * Gate Check - Vérifie les prérequis d'un gate
 * Usage: node tools/gate-check.js [1-5]
 */

import fs from 'fs';
import path from 'path';

const GATES = {
  1: {
    name: 'BREAK → MODEL',
    files: [
      'docs/brief.md',
      'docs/scope.md',
      'docs/acceptance.md'
    ],
    sections: {
      'docs/brief.md': ['## Résumé exécutif', '## Hypothèses explicites'],
      'docs/scope.md': ['## IN', '## OUT'],
      'docs/acceptance.md': ['## Critères globaux']
    }
  },
  2: {
    name: 'MODEL → ACT',
    files: [
      'docs/specs/system.md',
      'docs/specs/domain.md'
    ],
    patterns: [
      { glob: 'docs/adr/ADR-0001-*.md', min: 1 }
    ],
    sections: {
      'docs/specs/system.md': ['## Vue d\'ensemble', '## Contraintes non-fonctionnelles'],
      'docs/specs/domain.md': ['## Concepts clés', '## Entités']
    }
  },
  3: {
    name: 'Planning → Build',
    files: ['docs/planning/epics.md'],
    patterns: [
      { glob: 'docs/planning/us/US-*.md', min: 1 },
      { glob: 'docs/planning/tasks/TASK-*.md', min: 1 }
    ],
    taskValidation: true // Vérifie DoD dans chaque task
  },
  4: {
    name: 'Build → QA',
    files: ['docs/testing/plan.md'],
    patterns: [
      { glob: 'tests/**/*.test.*', min: 1 }
    ],
    testsPass: true // Vérifie que les tests passent
  },
  5: {
    name: 'QA → Release',
    files: [
      'docs/qa/report.md',
      'docs/release/checklist.md',
      'CHANGELOG.md'
    ],
    sections: {
      'docs/qa/report.md': ['## Résumé', '## Tests exécutés'],
      'docs/release/checklist.md': ['## Pré-release'],
      'CHANGELOG.md': ['## [']
    }
  }
};

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function hasSection(filePath, section) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes(section);
}

function globFiles(pattern) {
  // Simple glob implementation for Windows compatibility
  const dir = path.dirname(pattern);
  const filePattern = path.basename(pattern).replace('*', '.*');
  const regex = new RegExp(`^${filePattern}$`);

  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { recursive: true })
    .filter(f => regex.test(path.basename(f)))
    .map(f => path.join(dir, f));
}

function validateTask(taskPath) {
  const content = fs.readFileSync(taskPath, 'utf-8');
  const requiredSections = [
    '## Objectif technique',
    '## Definition of Done',
    '## Tests attendus'
  ];
  return requiredSections.every(s => content.includes(s));
}

function checkGate(gateNum) {
  const gate = GATES[gateNum];
  if (!gate) {
    console.error(`❌ Gate ${gateNum} invalide. Utilisez 1-5.`);
    process.exit(1);
  }

  console.log(`\n🔍 Vérification Gate ${gateNum}: ${gate.name}\n`);

  const errors = [];

  // Check required files
  if (gate.files) {
    for (const file of gate.files) {
      if (!fileExists(file)) {
        errors.push(`Fichier manquant: ${file}`);
      }
    }
  }

  // Check patterns (glob)
  if (gate.patterns) {
    for (const p of gate.patterns) {
      const matches = globFiles(p.glob);
      if (matches.length < p.min) {
        errors.push(`Pattern ${p.glob}: ${matches.length} fichier(s), minimum ${p.min} requis`);
      }
    }
  }

  // Check sections
  if (gate.sections) {
    for (const [file, sections] of Object.entries(gate.sections)) {
      for (const section of sections) {
        if (!hasSection(file, section)) {
          errors.push(`Section manquante dans ${file}: ${section}`);
        }
      }
    }
  }

  // Task validation (Gate 3)
  if (gate.taskValidation) {
    const tasks = globFiles('docs/planning/tasks/TASK-*.md');
    for (const task of tasks) {
      if (!validateTask(task)) {
        errors.push(`Task incomplète (DoD/Tests manquants): ${task}`);
      }
    }
  }

  // Report results
  if (errors.length === 0) {
    console.log(`✅ Gate ${gateNum} PASS\n`);
    process.exit(0);
  } else {
    console.log(`❌ Gate ${gateNum} FAIL\n`);
    console.log('Erreurs:');
    errors.forEach(e => console.log(`  - ${e}`));
    console.log('');
    process.exit(2);
  }
}

// Main
const gateNum = parseInt(process.argv[2], 10);
if (!gateNum) {
  console.log('Usage: node tools/gate-check.js [1-5]');
  console.log('');
  console.log('Gates:');
  Object.entries(GATES).forEach(([num, gate]) => {
    console.log(`  ${num}: ${gate.name}`);
  });
  process.exit(0);
}

checkGate(gateNum);
```

### tools/validate-structure.js

```javascript
#!/usr/bin/env node
/**
 * Validate Structure - Vérifie la structure du projet
 */

import fs from 'fs';
import path from 'path';

const REQUIRED_DIRS = [
  'input',
  'docs',
  'docs/specs',
  'docs/adr',
  'docs/planning',
  'docs/planning/us',
  'docs/planning/tasks',
  'docs/testing',
  'docs/qa',
  'docs/release',
  'docs/factory',
  '.claude',
  '.claude/skills',
  '.claude/agents',
  '.claude/commands',
  '.claude/rules',
  '.claude/hooks',
  'tools',
  'src',
  'tests'
];

const REQUIRED_FILES = [
  'CLAUDE.md',
  'package.json',
  '.claude/settings.json',
  '.claude/rules/factory-invariants.md',
  '.claude/rules/security-baseline.md'
];

const NAMING_CONVENTIONS = [
  { dir: 'docs/planning/us', pattern: /^US-\d{4}/, description: 'US-XXXX' },
  { dir: 'docs/planning/tasks', pattern: /^TASK-\d{4}/, description: 'TASK-XXXX' },
  { dir: 'docs/adr', pattern: /^ADR-\d{4}/, description: 'ADR-XXXX' }
];

function validate() {
  console.log('🔍 Validation de la structure du projet\n');

  const errors = [];
  const warnings = [];

  // Check directories
  console.log('📁 Vérification des dossiers...');
  for (const dir of REQUIRED_DIRS) {
    if (!fs.existsSync(dir)) {
      errors.push(`Dossier manquant: ${dir}`);
    }
  }

  // Check files
  console.log('📄 Vérification des fichiers...');
  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(file)) {
      errors.push(`Fichier manquant: ${file}`);
    }
  }

  // Check naming conventions
  console.log('📝 Vérification des conventions de nommage...');
  for (const conv of NAMING_CONVENTIONS) {
    if (fs.existsSync(conv.dir)) {
      const files = fs.readdirSync(conv.dir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        if (file.includes('template')) continue; // Skip templates
        if (!conv.pattern.test(file)) {
          warnings.push(`Convention ${conv.description} non respectée: ${path.join(conv.dir, file)}`);
        }
      }
    }
  }

  // Report
  console.log('');
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Structure valide\n');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.log('❌ Erreurs:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  if (warnings.length > 0) {
    console.log('⚠️ Avertissements:');
    warnings.forEach(w => console.log(`  - ${w}`));
  }

  console.log('');
  process.exit(errors.length > 0 ? 1 : 0);
}

validate();
```

### tools/scan-secrets.js

```javascript
#!/usr/bin/env node
/**
 * Scan Secrets - Détecte les secrets et PII dans le code
 */

import fs from 'fs';
import path from 'path';

const SECRET_PATTERNS = [
  { pattern: /API_KEY\s*=\s*["'][^"']+["']/gi, type: 'API Key' },
  { pattern: /PRIVATE_KEY\s*=\s*["'][^"']+["']/gi, type: 'Private Key' },
  { pattern: /PASSWORD\s*=\s*["'][^"']+["']/gi, type: 'Password' },
  { pattern: /SECRET\s*=\s*["'][^"']+["']/gi, type: 'Secret' },
  { pattern: /TOKEN\s*=\s*["'][^"']+["']/gi, type: 'Token' },
  { pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/gi, type: 'Private Key Block' }
];

const PII_PATTERNS = [
  { pattern: /[a-zA-Z0-9._%+-]+@(?!example\.com|test\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, type: 'Email (potentiellement réel)' },
  { pattern: /\b\d{10,}\b/g, type: 'Numéro long (téléphone?)' }
];

const SCAN_DIRS = ['src', 'tests', 'docs'];
const SKIP_PATTERNS = [/node_modules/, /\.git/, /\.env\.example/];

function shouldSkip(filePath) {
  return SKIP_PATTERNS.some(p => p.test(filePath));
}

function scanFile(filePath) {
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check secrets
    for (const { pattern, type } of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        issues.push({ file: filePath, line: lineNum, type, severity: 'CRITICAL' });
      }
      pattern.lastIndex = 0; // Reset regex
    }

    // Check PII
    for (const { pattern, type } of PII_PATTERNS) {
      if (pattern.test(line)) {
        issues.push({ file: filePath, line: lineNum, type, severity: 'WARNING' });
      }
      pattern.lastIndex = 0;
    }
  }

  return issues;
}

function scanDir(dir) {
  const issues = [];

  if (!fs.existsSync(dir)) return issues;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldSkip(fullPath)) continue;

    if (entry.isDirectory()) {
      issues.push(...scanDir(fullPath));
    } else if (entry.isFile() && /\.(js|ts|jsx|tsx|py|md|json|yaml|yml)$/i.test(entry.name)) {
      issues.push(...scanFile(fullPath));
    }
  }

  return issues;
}

function scan() {
  console.log('🔍 Scan des secrets et PII\n');

  const allIssues = [];

  for (const dir of SCAN_DIRS) {
    allIssues.push(...scanDir(dir));
  }

  if (allIssues.length === 0) {
    console.log('✅ Aucun secret ou PII détecté\n');
    process.exit(0);
  }

  const critical = allIssues.filter(i => i.severity === 'CRITICAL');
  const warnings = allIssues.filter(i => i.severity === 'WARNING');

  if (critical.length > 0) {
    console.log('🚨 CRITIQUE:');
    critical.forEach(i => {
      console.log(`  ${i.file}:${i.line} - ${i.type}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️ Avertissements:');
    warnings.forEach(i => {
      console.log(`  ${i.file}:${i.line} - ${i.type}`);
    });
    console.log('');
  }

  process.exit(critical.length > 0 ? 2 : 0);
}

scan();
```

### tools/factory-log.js

```javascript
#!/usr/bin/env node
/**
 * Factory Log - Ajoute une entrée au journal
 * Usage: node tools/factory-log.js <phase> <agent> <status> [message]
 */

import fs from 'fs';

const LOG_FILE = 'docs/factory/log.md';

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 16);
}

function ensureLogFile() {
  if (!fs.existsSync('docs/factory')) {
    fs.mkdirSync('docs/factory', { recursive: true });
  }

  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, `# Factory Log — Journal de génération

> Ce fichier trace les actions du pipeline.

---

`);
  }
}

function addEntry(phase, agent, status, message = '') {
  ensureLogFile();

  const timestamp = getTimestamp();
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';

  const entry = `
## [${timestamp}] Phase ${phase.toUpperCase()}
- **Agent**: ${agent}
- **Status**: ${statusIcon} ${status}
${message ? `- **Message**: ${message}` : ''}

`;

  fs.appendFileSync(LOG_FILE, entry);
  console.log(`📝 Logged: ${phase} - ${agent} - ${status}`);
}

// Main
const [,, phase, agent, status, ...messageParts] = process.argv;

if (!phase || !agent || !status) {
  console.log('Usage: node tools/factory-log.js <phase> <agent> <status> [message]');
  console.log('');
  console.log('Exemples:');
  console.log('  node tools/factory-log.js BREAK Analyst PASS');
  console.log('  node tools/factory-log.js MODEL PM FAIL "Section manquante"');
  process.exit(0);
}

addEntry(phase, agent, status, messageParts.join(' '));
```

---

## Hooks (3 fichiers)

### .claude/hooks/pretooluse-security.js

```javascript
#!/usr/bin/env node
/**
 * PreToolUse Hook - Bloque les commandes dangereuses
 * Exit code 2 = bloqué
 */

const input = JSON.parse(process.argv[2] || '{}');

const BLOCKED_COMMANDS = [
  /rm\s+-rf\s+\//,
  /rmdir\s+\/s\s+\/q\s+[A-Z]:\\/i,
  /curl\s+/,
  /wget\s+/,
  /eval\s*\(/,
  /npm\s+publish/,
  /git\s+push\s+.*--force/
];

const BLOCKED_PATHS = [
  /\.env$/,
  /\.env\./,
  /secrets?\//i,
  /credentials/i,
  /private.*key/i
];

function checkBash(command) {
  for (const pattern of BLOCKED_COMMANDS) {
    if (pattern.test(command)) {
      console.error(JSON.stringify({
        decision: 'block',
        reason: `Commande bloquée par politique de sécurité: ${pattern}`
      }));
      process.exit(2);
    }
  }
}

function checkRead(path) {
  for (const pattern of BLOCKED_PATHS) {
    if (pattern.test(path)) {
      console.error(JSON.stringify({
        decision: 'block',
        reason: `Accès bloqué par politique de sécurité: ${path}`
      }));
      process.exit(2);
    }
  }
}

// Main
if (input.tool === 'Bash' && input.params?.command) {
  checkBash(input.params.command);
}

if (input.tool === 'Read' && input.params?.file_path) {
  checkRead(input.params.file_path);
}

// Autorisé
process.exit(0);
```

### .claude/hooks/posttooluse-validate.js

```javascript
#!/usr/bin/env node
/**
 * PostToolUse Hook - Valide les fichiers écrits
 */

import fs from 'fs';

const input = JSON.parse(process.argv[2] || '{}');

const REQUIRED_SECTIONS = {
  'docs/brief.md': ['## Résumé exécutif', '## Hypothèses explicites'],
  'docs/scope.md': ['## IN', '## OUT'],
  'docs/acceptance.md': ['## Critères globaux'],
  'docs/specs/system.md': ['## Vue d\'ensemble'],
  'docs/specs/domain.md': ['## Concepts clés'],
  'docs/specs/api.md': ['## Endpoints'],
  'docs/qa/report.md': ['## Résumé', '## Tests exécutés'],
  'docs/release/checklist.md': ['## Pré-release']
};

function validateFile(filePath) {
  const sections = REQUIRED_SECTIONS[filePath];
  if (!sections) return; // Pas de validation pour ce fichier

  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const missing = sections.filter(s => !content.includes(s));

  if (missing.length > 0) {
    console.warn(`⚠️ Sections manquantes dans ${filePath}:`);
    missing.forEach(s => console.warn(`  - ${s}`));
  }
}

// Main
if (input.tool === 'Write' || input.tool === 'Edit') {
  const filePath = input.params?.file_path || input.params?.path;
  if (filePath) {
    validateFile(filePath);
  }
}

process.exit(0);
```

### .claude/hooks/stop-gate.js

```javascript
#!/usr/bin/env node
/**
 * Stop Hook - Rappelle de vérifier les gates
 */

console.log(`
💡 Rappel: Avant de continuer, vérifiez le gate approprié:
   node tools/gate-check.js [1-5]
`);

process.exit(0);
```

---

## Configuration settings.json

> ⚠️ **IMPORTANT** : Les hooks utilisent un format spécifique avec `matcher` (string) et `hooks` (array).
> Source : https://code.claude.com/docs/en/hooks

### .claude/settings.json

```json
{
  "permissions": {
    "allow": [
      "Read(docs/**)",
      "Read(input/**)",
      "Read(.claude/**)",
      "Read(src/**)",
      "Read(tests/**)",
      "Glob(*)",
      "Grep(*)",
      "Bash(node tools/*)",
      "Bash(npm run *)",
      "Bash(npm test)"
    ],
    "ask": [
      "Write(*)",
      "Edit(*)",
      "Bash(git *)"
    ],
    "deny": [
      "Read(.env)",
      "Read(.env.*)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/pretooluse-security.js" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/posttooluse-validate.js" }]
      },
      {
        "matcher": "Edit",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/posttooluse-validate.js" }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/stop-gate.js" }]
      }
    ]
  },
  "env": {
    "NODE_ENV": "development"
  }
}
```

> **Note** : Chaque entrée de hook nécessite :
> - `matcher` : string (nom du tool ou `""` pour tous)
> - `hooks` : array avec `{ "type": "command", "command": "..." }`

---

## CLAUDE.md enrichi

```markdown
# CLAUDE.md — Spec-to-Code Factory

## Vision
Pipeline automatisé qui transforme un requirements.md en projet livrable.

## Workflow obligatoire
```
BREAK → MODEL → ACT → DEBRIEF
  │        │       │       │
Gate 1  Gate 2  Gate 3+4  Gate 5
```

## Phases
1. **BREAK** : Normaliser le besoin → brief + scope + acceptance
2. **MODEL** : Spécifier → specs + ADR + rules
3. **ACT** : Planifier + Construire → epics + US + tasks + code + tests
4. **DEBRIEF** : Valider + Livrer → QA + checklist + CHANGELOG

## Invariants (ABSOLUS)
- **No Spec, No Code** : Pas de code sans specs validées
- **No Task, No Commit** : Chaque commit référence TASK-XXXX
- **Anti-dérive** : Implémentation strictement alignée au plan

## Conventions de nommage
- User Stories : `US-XXXX-titre.md`
- Tasks : `TASK-XXXX-titre.md`
- ADR : `ADR-XXXX-titre.md`

## Commands disponibles
### Skills (workflows)
- `/factory-intake` : Phase BREAK
- `/factory-spec` : Phase MODEL
- `/factory-plan` : Phase ACT (planning)
- `/factory-build` : Phase ACT (build)
- `/factory-qa` : Phase DEBRIEF
- `/factory-run` : Pipeline complet
- `/gate-check [1-5]` : Vérifie un gate

### Commands
- `/status` : État du pipeline
- `/reset [phase]` : Réinitialise une phase
- `/help` : Affiche l'aide

## Limites (V1)
- Stack-agnostic (projet cible défini par ADR)
- Pas d'UI dashboard
- Pas de CI/CD intégré

## Règles par domaine
- `.claude/rules/factory-invariants.md` : Invariants pipeline
- `.claude/rules/security-baseline.md` : Sécurité baseline
- `.claude/rules/*.md` : Règles générées selon projet
```

---

## Vérification Phase 3

- [ ] package.json créé
- [ ] 4 outils Node.js créés dans tools/
- [ ] 3 hooks créés dans .claude/hooks/
- [ ] .claude/settings.json configuré
- [ ] CLAUDE.md enrichi
- [ ] README.md mis à jour
