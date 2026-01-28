#!/usr/bin/env node
/**
 * PostToolUse Hook - Valide les fichiers écrits
 * Exit codes:
 *   0 = OK (fichier valide ou pas de validation requise)
 *   2 = BLOCK (sections manquantes ou fichier hors scope)
 *
 * Validations:
 *   1. Section validation: docs files must have required sections
 *   2. Scope validation: src/tests files must be in current task scope (anti-drift)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { isEnabled } from '../../tools/instrumentation/config.js';

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

function normalizePath(filePath) {
  // Normalize path separators and remove leading ./ or absolute path prefix
  return filePath
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^[A-Za-z]:/, '') // Remove Windows drive letter
    .replace(/^\//, '');
}

function validateFile(filePath) {
  const normalizedPath = normalizePath(filePath);

  // Find matching key in REQUIRED_SECTIONS
  // Use anchored matching to avoid false positives (e.g., my-brief.md matching brief.md)
  const matchingKey = Object.keys(REQUIRED_SECTIONS).find(key => {
    const normalizedKey = normalizePath(key);
    // Match exact path or path ending with /key
    return normalizedPath === normalizedKey ||
           normalizedPath.endsWith('/' + normalizedKey);
  });

  if (!matchingKey) {
    return { valid: true }; // Pas de validation pour ce fichier
  }

  if (!fs.existsSync(filePath)) {
    return { valid: true }; // Fichier n'existe pas encore
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = REQUIRED_SECTIONS[matchingKey];
  const missing = sections.filter(s => !content.includes(s));

  if (missing.length > 0) {
    return { valid: false, missing, filePath: matchingKey };
  }

  return { valid: true };
}

/**
 * Validate file scope against current task (anti-drift)
 * Only validates src/ and tests/ files when a task is active
 */
function validateScope(filePath) {
  const normalizedPath = normalizePath(filePath);

  // Only validate src/ and tests/ files
  if (!normalizedPath.startsWith('src/') && !normalizedPath.startsWith('tests/')) {
    return { valid: true };
  }

  // Check if a current task is set
  const currentTaskFile = 'docs/factory/current-task.txt';
  if (!fs.existsSync(currentTaskFile)) {
    return { valid: true }; // No active task, skip validation
  }

  const taskFile = fs.readFileSync(currentTaskFile, 'utf-8').trim();
  if (!taskFile || !fs.existsSync(taskFile)) {
    return { valid: true }; // Invalid task file, skip validation
  }

  // Call validate-file-scope.js
  try {
    execSync(`node tools/validate-file-scope.js "${taskFile}" "${filePath}"`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return { valid: true };
  } catch (error) {
    // Exit code 2 = out of scope
    if (error.status === 2) {
      return {
        valid: false,
        reason: 'scope',
        taskFile: path.basename(taskFile),
        filePath: normalizedPath
      };
    }
    // Other errors (exit code 1) = skip validation
    return { valid: true };
  }
}

// Instrumentation: record file write (opt-in)
function recordFileWrite(filePath, tool) {
  if (isEnabled()) {
    try {
      const currentTask = fs.existsSync('docs/factory/current-task.txt')
        ? fs.readFileSync('docs/factory/current-task.txt', 'utf-8').trim()
        : null;
      const data = JSON.stringify({ filePath, tool, task: currentTask });
      execSync(`node tools/instrumentation/collector.js file "${data.replace(/"/g, '\\"')}"`, {
        stdio: 'ignore',
        timeout: 1000
      });
    } catch (e) { /* silent fail */ }
  }
}

// Main
if (input.tool === 'Write' || input.tool === 'Edit') {
  const filePath = input.params?.file_path || input.params?.path;
  if (filePath) {
    // Record file write for instrumentation
    recordFileWrite(filePath, input.tool);
    // 1. Validate required sections (docs files)
    const sectionResult = validateFile(filePath);
    if (!sectionResult.valid) {
      // Structure JSON conforme aux specs Claude Code hooks
      console.log(JSON.stringify({
        continue: false,
        stopReason: `Fichier incomplet: ${sectionResult.filePath}. Sections manquantes: ${sectionResult.missing.join(', ')}`,
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `Sections obligatoires manquantes dans ${sectionResult.filePath}`,
          validationErrors: sectionResult.missing
        }
      }));
      process.exit(2);
    }

    // 2. Validate file scope (anti-drift for src/tests files)
    const scopeResult = validateScope(filePath);
    if (!scopeResult.valid) {
      // Structure JSON conforme aux specs Claude Code hooks
      console.log(JSON.stringify({
        continue: false,
        stopReason: `Anti-drift: fichier ${scopeResult.filePath} hors scope de ${scopeResult.taskFile}`,
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: "Fichier non autorisé par la task courante",
          taskFile: scopeResult.taskFile,
          attemptedFile: scopeResult.filePath,
          solutions: [
            'Ajoutez ce fichier au "## Fichiers concernés" de la task',
            'Créez une task dédiée pour ce fichier',
            'Exécutez: node tools/set-current-task.js clear'
          ]
        }
      }));
      process.exit(2);
    }
  }
}

// Success - structure JSON de confirmation
console.log(JSON.stringify({
  continue: true,
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    validated: true
  }
}));
process.exit(0);
