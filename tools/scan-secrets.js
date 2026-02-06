#!/usr/bin/env node
/**
 * Scan Secrets - Détecte les secrets et PII dans le code
 */

import fs from 'fs';
import path from 'path';

const SECRET_PATTERNS = [
  // Assignations directes (existant)
  { pattern: /API_KEY\s*=\s*["'][^"']+["']/gi, type: 'API Key' },
  { pattern: /PRIVATE_KEY\s*=\s*["'][^"']+["']/gi, type: 'Private Key' },
  { pattern: /PASSWORD\s*=\s*["'][^"']+["']/gi, type: 'Password' },
  { pattern: /SECRET\s*=\s*["'][^"']+["']/gi, type: 'Secret' },
  { pattern: /TOKEN\s*=\s*["'][^"']+["']/gi, type: 'Token' },
  { pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/gi, type: 'Private Key Block' },

  // Headers HTTP avec tokens (nouveau)
  { pattern: /Authorization:\s*["']?Bearer\s+[A-Za-z0-9_\-.]+["']?/gi, type: 'Authorization Header' },
  { pattern: /Authorization:\s*["']?Basic\s+[A-Za-z0-9+/=]+["']?/gi, type: 'Basic Auth Header' },
  { pattern: /X-API-Key:\s*["']?[A-Za-z0-9_\-]+["']?/gi, type: 'X-API-Key Header' },

  // process.env avec valeurs hardcodees (nouveau)
  { pattern: /process\.env\.[A-Z_]+\s*\|\|\s*["'][^"']{8,}["']/gi, type: 'Env Fallback Secret' },

  // AWS/Cloud credentials (nouveau)
  { pattern: /AKIA[0-9A-Z]{16}/g, type: 'AWS Access Key ID' },
  { pattern: /aws_secret_access_key\s*=\s*["'][^"']+["']/gi, type: 'AWS Secret Key' },

  // JWT tokens hardcodes (nouveau)
  { pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, type: 'JWT Token' },

  // Connection strings avec credentials (nouveau)
  { pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi, type: 'MongoDB Connection String' },
  { pattern: /postgres(ql)?:\/\/[^:]+:[^@]+@/gi, type: 'PostgreSQL Connection String' },
  { pattern: /mysql:\/\/[^:]+:[^@]+@/gi, type: 'MySQL Connection String' }
];

const PII_PATTERNS = [
  { pattern: /[a-zA-Z0-9._%+-]+@(?!example\.com|test\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, type: 'Email (potentiellement réel)' },
  { pattern: /\b\d{10,}\b/g, type: 'Numéro long (téléphone?)' }
];

const SCAN_DIRS = ['src', 'tests', 'docs', '.'];
const SKIP_PATTERNS = [/node_modules/, /\.git/, /\.env\.example/, /coverage/, /dist/, /release/];

// Fichiers de cles a detecter (peu importe le contenu)
const SENSITIVE_FILE_PATTERNS = [
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.jks$/i,
  /id_rsa$/i,
  /id_dsa$/i,
  /id_ecdsa$/i,
  /id_ed25519$/i,
  /\.env$/i,  // Fichiers .env (sauf .env.example)
  /credentials\.json$/i,
  /service[-_]?account.*\.json$/i
];

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

function isSensitiveFile(fileName) {
  return SENSITIVE_FILE_PATTERNS.some(p => p.test(fileName));
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
    } else if (entry.isFile()) {
      // Detecter fichiers sensibles par leur nom/extension
      if (isSensitiveFile(entry.name)) {
        issues.push({
          file: fullPath,
          line: 0,
          type: 'Sensitive File Detected',
          severity: 'CRITICAL'
        });
      }
      // Scanner le contenu des fichiers texte
      if (/\.(js|ts|jsx|tsx|py|md|json|yaml|yml|sh|bash|zsh|env)$/i.test(entry.name)) {
        issues.push(...scanFile(fullPath));
      }
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
    console.log('⚠️ Avertissements (PII potentiels):');
    warnings.forEach(i => {
      console.log(`  ${i.file}:${i.line} - ${i.type}`);
    });
    console.log('');
  }

  // Exit codes:
  // 0 = OK (aucun probleme)
  // 1 = Warnings PII (bloquant en mode strict)
  // 2 = Secrets critiques detectes
  if (critical.length > 0) {
    console.log('❌ ECHEC: Secrets critiques detectes - corriger avant de continuer\n');
    process.exit(2);
  } else if (warnings.length > 0) {
    console.log('⚠️ ATTENTION: PII potentiels detectes - verifier et corriger si necessaire\n');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

scan();
