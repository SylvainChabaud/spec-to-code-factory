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
      // Structure JSON conforme aux specs Claude Code hooks
      console.log(JSON.stringify({
        continue: false,
        stopReason: `Commande bloquée par politique de sécurité`,
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `Pattern dangereux détecté: ${pattern}`,
          blockedCommand: command.substring(0, 100) // Tronquer pour sécurité
        }
      }));
      process.exit(2);
    }
  }
}

function checkRead(filePath) {
  for (const pattern of BLOCKED_PATHS) {
    if (pattern.test(filePath)) {
      // Structure JSON conforme aux specs Claude Code hooks
      console.log(JSON.stringify({
        continue: false,
        stopReason: `Accès fichier bloqué par politique de sécurité`,
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `Fichier sensible: ${pattern}`,
          blockedPath: filePath
        }
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

// Autorisé - structure JSON de confirmation
console.log(JSON.stringify({
  continue: true,
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "allow"
  }
}));
process.exit(0);
