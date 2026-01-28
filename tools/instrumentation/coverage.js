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
 */
const KNOWN_ITEMS = {
  // Factory tools
  tools: [
    'factory-state.js',
    'factory-reset.js',
    'gate-check.js',
    'set-current-task.js',
    'validate-file-scope.js',
    'validate-code-quality.js',
    'validate-structure.js',
    'validate-app-assembly.js',
    'scan-secrets.js',
    'validate-commit-msg.js',
    'instrumentation/collector.js'
  ],

  // Templates
  templates: [
    'templates/specs/system.md',
    'templates/specs/domain.md',
    'templates/specs/api.md',
    'templates/adr/ADR-template.md',
    'templates/testing/plan.md',
    'templates/planning/task-template.md',
    'templates/rule.md'
  ],

  // Skills (workflows)
  skills: [
    'factory-intake',
    'factory-spec',
    'factory-plan',
    'factory-build',
    'factory-qa',
    'factory-run',
    'factory-resume',
    'gate-check'
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

  // Pipeline phases
  phases: ['BREAK', 'MODEL', 'ACT', 'DEBRIEF', 'PIPELINE']
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
 */
function extractUsedTools(events) {
  const used = new Set();

  for (const event of events) {
    // Tool invocations
    if (event.type === 'tool_invocation' && event.data.command) {
      // Extract tool name from commands like "node tools/gate-check.js"
      const match = event.data.command.match(/node\s+tools\/([^\s]+)/);
      if (match) {
        used.add(match[1]);
      }
    }

    // File reads/writes that reference tools
    if (event.type === 'file_written' && event.data.filePath) {
      const toolMatch = event.data.filePath.match(/tools\/([^\/]+\.js)/);
      if (toolMatch) {
        used.add(toolMatch[1]);
      }
    }
  }

  return used;
}

/**
 * Extract used templates from events
 */
function extractUsedTemplates(events) {
  const used = new Set();

  for (const event of events) {
    if (event.data.filePath) {
      // Check if a template was read
      if (event.data.filePath.includes('templates/')) {
        used.add(event.data.filePath);
      }

      // Check if output matches a template pattern
      for (const template of KNOWN_ITEMS.templates) {
        const outputPattern = template
          .replace('templates/', 'docs/')
          .replace('-template', '')
          .replace(/\.md$/, '');

        if (event.data.filePath.includes(outputPattern)) {
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
