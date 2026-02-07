#!/usr/bin/env node
/**
 * Instrumentation Coverage - Calculates coverage metrics
 *
 * Usage:
 *   node tools/instrumentation/coverage.js [--json]
 *
 * Input: docs/factory/instrumentation.json
 * Output: Coverage metrics (console or JSON)
 */

import fs from 'fs';

const INSTRUMENTATION_FILE = 'docs/factory/instrumentation.json';

/**
 * Known items in the factory pipeline
 * Used to calculate coverage percentages
 *
 * Note: Only includes tools that are EXPECTED in a normal pipeline run.
 * Excluded:
 * - factory-reset.js: Only used with /reset command
 * - validate-commit-msg.js: Optional git hook
 * - validate-file-scope.js: Called by hooks, not gates (tracked indirectly)
 * - instrumentation/collector.js: The collector itself, always used
 */
const KNOWN_ITEMS = {
  // Factory tools expected in a normal pipeline run (12 total)
  tools: [
    'factory-state.js',
    'factory-log.js',
    'gate-check.js',
    'set-current-task.js',
    'validate-requirements.js',
    'validate-code-quality.js',
    'validate-structure.js',
    'validate-app-assembly.js',
    'scan-secrets.js',
    'validate-boundaries.js',
    'verify-pipeline.js',
    'export-release.js'
  ],

  // Templates (18 total)
  templates: [
    // Phase BREAK (Analyst)
    'templates/break/brief-template.md',
    'templates/break/scope-template.md',
    'templates/break/acceptance-template.md',
    'templates/break/questions-template.md',
    // Phase MODEL (PM, Architect, Rules-Memory)
    'templates/specs/system.md',
    'templates/specs/domain.md',
    'templates/specs/api.md',
    'templates/adr/ADR-template.md',
    'templates/rule.md',
    // Phase ACT-PLAN (Scrum Master)
    'templates/planning/epics-template.md',
    'templates/planning/US-template.md',
    'templates/planning/task-template.md',
    'templates/planning/task-assembly-template.md',
    'templates/testing/plan.md',
    // Phase DEBRIEF (QA)
    'templates/qa/report-template.md',
    'templates/release/checklist-template.md',
    'templates/release/CHANGELOG-template.md'
    // Note: README.template.md is used by export-release.js (subprocess, not tracked by hooks)
  ],

  // Skills expected in a normal /factory-run pipeline
  // Excluded: factory-resume (only after interruption), gate-check (manual)
  skills: [
    'factory-intake',
    'factory-spec',
    'factory-plan',
    'factory-build',
    'factory-qa',
    'factory-run'
  ],

  // Agent types
  agents: [
    'analyst',
    'pm',
    'architect',
    'scrum-master',
    'developer',
    'rules-memory',
    'qa'
  ],

  // Gates (0-5)
  gates: [0, 1, 2, 3, 4, 5],

  // Pipeline phases (alignés avec factory-state.js)
  // Note: ACT est subdivisé en 'plan' et 'build' dans factory-state.js
  phases: ['BREAK', 'MODEL', 'PLAN', 'BUILD', 'DEBRIEF']
};

/**
 * Load instrumentation data
 */
function loadData() {
  if (!fs.existsSync(INSTRUMENTATION_FILE)) {
    return { events: [] };
  }

  try {
    return JSON.parse(fs.readFileSync(INSTRUMENTATION_FILE, 'utf-8'));
  } catch (e) {
    return { events: [] };
  }
}

/**
 * Extract used tools from events
 * Infers tool usage from gate checks and phase events
 * (Direct Bash tracking doesn't work because hooks don't capture command field)
 */
function extractUsedTools(events) {
  const used = new Set();

  for (const event of events) {
    // Gate checks indicate which validation tools were called
    if (event.type === 'gate_checked') {
      used.add('gate-check.js');

      // Gate 0: validate-requirements.js
      if (event.data.gate === 0) {
        used.add('validate-requirements.js');
      }
      // Gate 1: validate-structure.js
      if (event.data.gate === 1) {
        used.add('validate-structure.js');
      }
      // Gate 2: scan-secrets.js
      if (event.data.gate === 2) {
        used.add('scan-secrets.js');
      }
      // Gate 4: validate-code-quality.js, validate-app-assembly.js, validate-boundaries.js
      if (event.data.gate === 4) {
        used.add('validate-code-quality.js');
        used.add('validate-app-assembly.js');
        used.add('validate-boundaries.js');
      }
      // Gate 5: export-release.js, verify-pipeline.js
      if (event.data.gate === 5) {
        used.add('export-release.js');
        used.add('verify-pipeline.js');
      }
    }

    // Phase events indicate factory-state.js and factory-log.js usage
    if (event.type === 'phase_started' || event.type === 'phase_completed') {
      used.add('factory-state.js');
      used.add('factory-log.js');
    }

    // Task events indicate set-current-task.js usage
    if (event.type === 'task_completed') {
      used.add('set-current-task.js');
    }
  }

  return used;
}

/**
 * Extract used templates from events
 * Detects templates from:
 * - template_used events (direct tracking)
 * - file_written events that match template output patterns
 */
function extractUsedTemplates(events) {
  const used = new Set();

  for (const event of events) {
    // Direct template_used events (from PreToolUse hook on Read)
    if (event.type === 'template_used' && event.data.template) {
      // Normalize and match against known templates
      const normalizedPath = event.data.template.replace(/\\/g, '/');
      for (const template of KNOWN_ITEMS.templates) {
        if (normalizedPath.includes(template) || normalizedPath.endsWith(template.replace('templates/', ''))) {
          used.add(template);
        }
      }
    }

    // Check file paths in any event
    if (event.data.filePath) {
      const normalizedPath = event.data.filePath.replace(/\\/g, '/');

      // Check if a template was directly accessed
      if (normalizedPath.includes('templates/')) {
        for (const template of KNOWN_ITEMS.templates) {
          if (normalizedPath.includes(template)) {
            used.add(template);
          }
        }
      }

      // Check if output matches a template pattern (inferring template usage)
      for (const template of KNOWN_ITEMS.templates) {
        const outputPattern = template
          .replace('templates/', 'docs/')
          .replace('-template', '')
          .replace(/\.md$/, '');

        if (normalizedPath.includes(outputPattern)) {
          used.add(template);
        }
      }
    }
  }

  return used;
}

/**
 * Extract used skills from events
 */
function extractUsedSkills(events) {
  const used = new Set();

  for (const event of events) {
    if (event.type === 'skill_invoked' && event.data.skill) {
      used.add(event.data.skill);
    }
  }

  return used;
}

/**
 * Extract used agents from events
 */
function extractUsedAgents(events) {
  const used = new Set();

  for (const event of events) {
    if (event.type === 'agent_delegated' && event.data.agent) {
      used.add(event.data.agent);
    }
  }

  return used;
}

/**
 * Extract checked gates from events
 */
function extractCheckedGates(events) {
  const checked = new Set();

  for (const event of events) {
    if (event.type === 'gate_checked' && event.data.gate !== undefined) {
      checked.add(event.data.gate);
    }
  }

  return checked;
}

/**
 * Extract completed phases from events
 */
function extractCompletedPhases(events) {
  const completed = new Set();

  for (const event of events) {
    if (event.type === 'phase_completed' && event.data.phase && event.data.status === 'PASS') {
      completed.add(event.data.phase.toUpperCase());
    }
  }

  return completed;
}

/**
 * Calculate coverage metrics
 * @param {object} data - Instrumentation data (optional, loads from file if not provided)
 * @returns {object} Coverage metrics
 */
function calculateCoverage(data = null) {
  if (!data) {
    data = loadData();
  }

  const events = data.events || [];

  const usedTools = extractUsedTools(events);
  const usedTemplates = extractUsedTemplates(events);
  const usedSkills = extractUsedSkills(events);
  const usedAgents = extractUsedAgents(events);
  const checkedGates = extractCheckedGates(events);
  const completedPhases = extractCompletedPhases(events);

  const categories = {
    Tools: {
      used: usedTools.size,
      total: KNOWN_ITEMS.tools.length,
      items: {
        used: Array.from(usedTools),
        unused: KNOWN_ITEMS.tools.filter(t => !usedTools.has(t))
      }
    },
    Templates: {
      used: usedTemplates.size,
      total: KNOWN_ITEMS.templates.length,
      items: {
        used: Array.from(usedTemplates),
        unused: KNOWN_ITEMS.templates.filter(t => !usedTemplates.has(t))
      }
    },
    Skills: {
      used: usedSkills.size,
      total: KNOWN_ITEMS.skills.length,
      items: {
        used: Array.from(usedSkills),
        unused: KNOWN_ITEMS.skills.filter(s => !usedSkills.has(s))
      }
    },
    Agents: {
      used: usedAgents.size,
      total: KNOWN_ITEMS.agents.length,
      items: {
        used: Array.from(usedAgents),
        unused: KNOWN_ITEMS.agents.filter(a => !usedAgents.has(a))
      }
    },
    Gates: {
      used: checkedGates.size,
      total: KNOWN_ITEMS.gates.length,
      items: {
        checked: Array.from(checkedGates).sort((a, b) => a - b),
        unchecked: KNOWN_ITEMS.gates.filter(g => !checkedGates.has(g))
      }
    },
    Phases: {
      used: completedPhases.size,
      total: KNOWN_ITEMS.phases.length,
      items: {
        completed: Array.from(completedPhases),
        pending: KNOWN_ITEMS.phases.filter(p => !completedPhases.has(p))
      }
    }
  };

  // Calculate overall coverage
  let totalUsed = 0;
  let totalKnown = 0;

  for (const cat of Object.values(categories)) {
    totalUsed += cat.used;
    totalKnown += cat.total;
  }

  const overall = totalKnown > 0 ? Math.round((totalUsed / totalKnown) * 100) : 0;

  return {
    overall,
    categories,
    eventCount: events.length,
    startedAt: data.startedAt
  };
}

/**
 * Print coverage summary to console
 */
function printCoverageSummary(coverage) {
  console.log('\n=== Factory Pipeline Coverage ===\n');

  console.log('Category          Used  Total  Coverage');
  console.log('----------------  ----  -----  --------');

  for (const [name, data] of Object.entries(coverage.categories)) {
    const pct = data.total > 0 ? Math.round((data.used / data.total) * 100) : 0;
    const status = pct >= 80 ? 'OK' : pct >= 50 ? 'PARTIAL' : 'LOW';
    console.log(
      `${name.padEnd(16)}  ${String(data.used).padStart(4)}  ${String(data.total).padStart(5)}  ${String(pct).padStart(3)}% (${status})`
    );
  }

  console.log('');
  console.log(`Overall Coverage: ${coverage.overall}%`);
  console.log(`Total Events: ${coverage.eventCount}`);
  console.log('');

  // Show critical unused items
  const criticalUnused = [];

  if (coverage.categories.Gates.items.unchecked?.length > 0) {
    criticalUnused.push(`Gates not checked: ${coverage.categories.Gates.items.unchecked.join(', ')}`);
  }

  if (coverage.categories.Skills.items.unused?.includes('factory-run')) {
    criticalUnused.push('Main skill factory-run not invoked');
  }

  if (coverage.categories.Phases.items.pending?.length > 0) {
    criticalUnused.push(`Phases not completed: ${coverage.categories.Phases.items.pending.join(', ')}`);
  }

  if (criticalUnused.length > 0) {
    console.log('Critical Issues:');
    for (const issue of criticalUnused) {
      console.log(`  - ${issue}`);
    }
    console.log('');
  }
}

// CLI interface - only run when executed directly (not imported)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {

const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log('Usage: node tools/instrumentation/coverage.js [--json]');
  console.log('');
  console.log('Calculates coverage metrics from instrumentation data.');
  console.log('');
  console.log('Options:');
  console.log('  --json    Output as JSON instead of formatted text');
  process.exit(0);
}

const coverage = calculateCoverage();

if (args.includes('--json')) {
  console.log(JSON.stringify(coverage, null, 2));
} else {
  printCoverageSummary(coverage);
}

} // end CLI guard

export { calculateCoverage, KNOWN_ITEMS };
