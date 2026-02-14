#!/usr/bin/env node
/**
 * Factory Reset - Reset pipeline phases
 *
 * Usage: node tools/factory-reset.js <phase>
 *
 * Phases:
 *   intake : Remove brief, scope, acceptance
 *   spec   : Remove specs/*, adr/* (except template), rules/* (except baseline)
 *   plan   : Remove planning/*
 *   build  : Remove src/*, tests/*
 *   qa     : Remove qa/report, release/checklist, CHANGELOG
 *   all    : Reset all phases
 *
 * Exit codes:
 *   0 = Success
 *   1 = Invalid usage
 *   2 = Error during reset
 */

import fs from 'fs';
import path from 'path';

/**
 * Get all version directories in planning
 */
function getAllPlanningVersions() {
  const planningDir = 'docs/planning';
  if (!fs.existsSync(planningDir)) return [];

  return fs.readdirSync(planningDir)
    .filter(d => /^v\d+$/.test(d))
    .map(d => path.join(planningDir, d));
}

const PHASES = {
  intake: {
    name: 'BREAK (intake)',
    files: [
      'docs/brief.md',
      'docs/scope.md',
      'docs/acceptance.md',
      'docs/factory/questions.md'
    ],
    patterns: []
  },
  spec: {
    name: 'MODEL (spec)',
    files: [],
    patterns: [
      { dir: 'docs/specs', exclude: [] },
      { dir: 'docs/adr', exclude: ['ADR-template.md', 'ADR-0001-template.md'] }
    ],
    rulesCleanup: true // Special handling for .claude/rules
  },
  plan: {
    name: 'ACT (plan)',
    files: [
      'docs/testing/plan.md'
    ],
    // Dynamic patterns for versioned planning directories
    getDynamicPatterns: () => {
      const patterns = [];
      const versionDirs = getAllPlanningVersions();
      for (const vDir of versionDirs) {
        patterns.push({ dir: path.join(vDir, 'us'), exclude: [] });
        patterns.push({ dir: path.join(vDir, 'tasks'), exclude: [] });
        // Also delete epics.md in each version
      }
      return patterns;
    },
    getDynamicFiles: () => {
      const files = [];
      const versionDirs = getAllPlanningVersions();
      for (const vDir of versionDirs) {
        files.push(path.join(vDir, 'epics.md'));
      }
      return files;
    }
  },
  build: {
    name: 'ACT (build)',
    files: [
      'docs/factory/current-task.txt'
    ],
    patterns: [
      { dir: 'src', exclude: [] },
      { dir: 'tests', exclude: [] }
    ]
  },
  qa: {
    name: 'DEBRIEF (qa)',
    files: [
      'docs/qa/report.md',
      'docs/release/checklist.md',
      'CHANGELOG.md'
    ],
    patterns: []
  }
};

// Protected files that are NEVER deleted
const PROTECTED_FILES = [
  'input/requirements.md',
  'input/requirements.template.md',
  'CLAUDE.md',
  'README.md',
  'package.json',
  '.claude/rules/factory-invariants.md',
  '.claude/rules/security-baseline.md'
];

function isProtected(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return PROTECTED_FILES.some(p => normalized.endsWith(p));
}

function deleteFile(filePath) {
  if (isProtected(filePath)) {
    console.log(`  ⚠️ Protected: ${filePath}`);
    return false;
  }

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`  ✅ Deleted: ${filePath}`);
      return true;
    } catch (err) {
      console.error(`  ❌ Error deleting ${filePath}: ${err.message}`);
      return false;
    }
  }
  return false;
}

function cleanDirectory(dir, exclude = []) {
  if (!fs.existsSync(dir)) {
    return 0;
  }

  let deleted = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (exclude.includes(file)) {
      console.log(`  ⏭️ Skipped: ${path.join(dir, file)}`);
      continue;
    }

    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively clean subdirectories
      deleted += cleanDirectory(filePath, exclude);
      // Try to remove empty directory
      try {
        const remaining = fs.readdirSync(filePath);
        if (remaining.length === 0) {
          fs.rmdirSync(filePath);
        }
      } catch (e) { /* ignore */ }
    } else {
      if (deleteFile(filePath)) {
        deleted++;
      }
    }
  }

  return deleted;
}

function cleanRules() {
  const rulesDir = '.claude/rules';
  if (!fs.existsSync(rulesDir)) {
    return 0;
  }

  const baselineRules = ['factory-invariants.md', 'security-baseline.md'];
  let deleted = 0;

  const files = fs.readdirSync(rulesDir);
  for (const file of files) {
    if (baselineRules.includes(file)) {
      console.log(`  ⏭️ Baseline rule kept: ${file}`);
      continue;
    }

    const filePath = path.join(rulesDir, file);
    if (fs.statSync(filePath).isFile() && deleteFile(filePath)) {
      deleted++;
    }
  }

  return deleted;
}

function resetPhase(phaseName) {
  const phase = PHASES[phaseName];
  if (!phase) {
    return { success: false, error: `Unknown phase: ${phaseName}` };
  }

  console.log(`\n🔄 Resetting phase: ${phase.name}\n`);

  let totalDeleted = 0;

  // Get files (static + dynamic)
  let files = [...(phase.files || [])];
  if (phase.getDynamicFiles) {
    files = [...files, ...phase.getDynamicFiles()];
  }

  // Delete specific files
  for (const file of files) {
    if (deleteFile(file)) {
      totalDeleted++;
    }
  }

  // Get patterns (static + dynamic)
  let patterns = [...(phase.patterns || [])];
  if (phase.getDynamicPatterns) {
    patterns = [...patterns, ...phase.getDynamicPatterns()];
  }

  // Clean directories
  for (const pattern of patterns) {
    totalDeleted += cleanDirectory(pattern.dir, pattern.exclude);
  }

  // Special handling for rules cleanup in spec phase
  if (phase.rulesCleanup) {
    totalDeleted += cleanRules();
  }

  return { success: true, deleted: totalDeleted };
}

function resetAll() {
  console.log('\n🔄 FULL RESET - All phases\n');

  let totalDeleted = 0;

  for (const phaseName of Object.keys(PHASES)) {
    const result = resetPhase(phaseName);
    if (result.success) {
      totalDeleted += result.deleted;
    }
  }

  return { success: true, deleted: totalDeleted };
}

// Main
const phase = process.argv[2]?.toLowerCase();

if (!phase) {
  console.log('Usage: node tools/factory-reset.js <phase>');
  console.log('');
  console.log('Phases:');
  Object.entries(PHASES).forEach(([key, p]) => {
    console.log(`  ${key.padEnd(8)} - ${p.name}`);
  });
  console.log(`  ${'all'.padEnd(8)} - Reset all phases`);
  process.exit(0);
}

let result;

if (phase === 'all') {
  result = resetAll();
} else if (PHASES[phase]) {
  result = resetPhase(phase);
} else {
  console.error(`❌ Unknown phase: ${phase}`);
  console.error('Valid phases: intake, spec, plan, build, qa, all');
  process.exit(1);
}

if (result.success) {
  console.log(`\n✅ Reset complete. ${result.deleted} file(s) deleted.\n`);
  process.exit(0);
} else {
  console.error(`\n❌ Reset failed: ${result.error}\n`);
  process.exit(2);
}
