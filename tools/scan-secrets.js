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
