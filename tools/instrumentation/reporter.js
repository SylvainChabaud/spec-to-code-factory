#!/usr/bin/env node
/**
 * Instrumentation Reporter - Generates markdown coverage report
 *
 * Usage:
 *   node tools/instrumentation/reporter.js [output-file]
 *
 * Input: docs/factory/instrumentation.json
 * Output: docs/factory/coverage-report.md (or custom path)
 */

import fs from 'fs';
import path from 'path';
import { loadData, getSummary } from './collector.js';
import { calculateCoverage, KNOWN_ITEMS } from './coverage.js';

const DEFAULT_OUTPUT = 'docs/factory/coverage-report.md';

/**
 * Format duration in human-readable form
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Format timestamp to readable date
 */
function formatTimestamp(isoString) {
  return new Date(isoString).toLocaleString();
}

/**
 * Generate executive summary section
 */
function generateExecutiveSummary(coverage) {
  const lines = [
    '## Executive Summary',
    '',
    '| Category | Used | Total | Coverage |',
    '|----------|------|-------|----------|'
  ];

  for (const [category, data] of Object.entries(coverage.categories)) {
    const pct = data.total > 0 ? Math.round((data.used / data.total) * 100) : 0;
    const icon = pct >= 80 ? 'OK' : pct >= 50 ? 'PARTIAL' : 'LOW';
    lines.push(`| ${category} | ${data.used} | ${data.total} | ${pct}% (${icon}) |`);
  }

  lines.push('');
  lines.push(`**Overall Coverage**: ${coverage.overall}%`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate event sequence section
 */
function generateEventSequence(data) {
  if (!data.events || data.events.length === 0) {
    return '## Event Sequence\n\nNo events recorded.\n';
  }

  const lines = [
    '## Event Sequence',
    '',
    '| # | Time | Type | Details |',
    '|---|------|------|---------|'
  ];

  let prevTimestamp = null;
  let eventNum = 0;

  for (const event of data.events.slice(0, 100)) { // Limit to first 100 events
    eventNum++;
    const timestamp = new Date(event.timestamp);
    const timeStr = timestamp.toTimeString().substring(0, 8);

    let duration = '';
    if (prevTimestamp) {
      const ms = timestamp - prevTimestamp;
      duration = ` (+${formatDuration(ms)})`;
    }
    prevTimestamp = timestamp;

    let details = '';
    switch (event.type) {
      case 'tool_invocation':
        details = `Tool: ${event.data.tool}`;
        if (event.data.command) {
          details += ` | \`${event.data.command.substring(0, 50)}...\``;
        }
        break;
      case 'file_written':
        details = `File: ${event.data.filePath}`;
        break;
      case 'gate_checked':
        details = `Gate ${event.data.gate}: ${event.data.status}`;
        break;
      case 'skill_invoked':
        details = `Skill: ${event.data.skill}`;
        if (event.data.parentSkill) {
          details += ` (from ${event.data.parentSkill})`;
        }
        break;
      case 'agent_delegated':
        details = `Agent: ${event.data.agent}`;
        if (event.data.source) {
          details += ` (from ${event.data.source})`;
        }
        break;
      default:
        details = JSON.stringify(event.data).substring(0, 80);
    }

    lines.push(`| ${eventNum} | ${timeStr}${duration} | ${event.type} | ${details} |`);
  }

  if (data.events.length > 100) {
    lines.push(`| ... | ... | ... | *${data.events.length - 100} more events* |`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generate tools usage section
 */
function generateToolsUsage(data, coverage) {
  const lines = [
    '## Tools Usage',
    '',
    '### Used Tools',
    ''
  ];

  const toolCounts = {};
  for (const event of data.events) {
    if (event.type === 'tool_invocation' && event.data.tool) {
      toolCounts[event.data.tool] = (toolCounts[event.data.tool] || 0) + 1;
    }
  }

  if (Object.keys(toolCounts).length > 0) {
    lines.push('| Tool | Invocations |');
    lines.push('|------|-------------|');
    for (const [tool, count] of Object.entries(toolCounts).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${tool} | ${count} |`);
    }
  } else {
    lines.push('No tool invocations recorded.');
  }

  lines.push('');
  lines.push('### Unused Factory Tools');
  lines.push('');

  const usedTools = new Set(Object.keys(toolCounts));
  const unusedTools = KNOWN_ITEMS.tools.filter(t => !usedTools.has(t));

  if (unusedTools.length > 0) {
    for (const tool of unusedTools) {
      lines.push(`- ${tool}`);
    }
  } else {
    lines.push('All factory tools were used.');
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generate files written section
 */
function generateFilesWritten(data) {
  const lines = [
    '## Files Written',
    ''
  ];

  const filesWritten = data.events
    .filter(e => e.type === 'file_written')
    .map(e => e.data.filePath);

  if (filesWritten.length > 0) {
    const byDir = {};
    for (const file of filesWritten) {
      const dir = path.dirname(file);
      if (!byDir[dir]) byDir[dir] = [];
      byDir[dir].push(path.basename(file));
    }

    for (const [dir, files] of Object.entries(byDir).sort()) {
      lines.push(`### ${dir}/`);
      for (const file of files) {
        lines.push(`- ${file}`);
      }
      lines.push('');
    }
  } else {
    lines.push('No files written during this run.');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate gates section
 */
function generateGatesSection(data) {
  const lines = [
    '## Gates Checked',
    ''
  ];

  const gateEvents = data.events.filter(e => e.type === 'gate_checked');

  if (gateEvents.length > 0) {
    lines.push('| Gate | Status | Errors |');
    lines.push('|------|--------|--------|');

    const gateResults = {};
    for (const event of gateEvents) {
      gateResults[event.data.gate] = event.data;
    }

    for (let i = 1; i <= 5; i++) {
      const result = gateResults[i];
      if (result) {
        const errCount = result.errors?.length || 0;
        lines.push(`| Gate ${i} | ${result.status} | ${errCount > 0 ? errCount + ' errors' : '-'} |`);
      } else {
        lines.push(`| Gate ${i} | NOT CHECKED | - |`);
      }
    }
  } else {
    lines.push('No gates were checked during this run.');
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generate skills section
 */
function generateSkillsSection(data, coverage) {
  const lines = [
    '## Skills Invoked',
    ''
  ];

  const skillEvents = data.events.filter(e => e.type === 'skill_invoked');

  if (skillEvents.length > 0) {
    const skillCounts = {};
    for (const event of skillEvents) {
      skillCounts[event.data.skill] = (skillCounts[event.data.skill] || 0) + 1;
    }

    lines.push('### Used Skills');
    lines.push('');
    lines.push('| Skill | Invocations |');
    lines.push('|-------|-------------|');

    for (const [skill, count] of Object.entries(skillCounts).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${skill} | ${count} |`);
    }

    lines.push('');
    lines.push('### Unused Skills');
    lines.push('');

    const usedSkills = new Set(Object.keys(skillCounts));
    const unusedSkills = KNOWN_ITEMS.skills.filter(s => !usedSkills.has(s));

    if (unusedSkills.length > 0) {
      for (const skill of unusedSkills) {
        lines.push(`- ${skill}`);
      }
    } else {
      lines.push('All skills were invoked.');
    }
  } else {
    lines.push('No skills were invoked during this run.');
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generate agents section
 */
function generateAgentsSection(data) {
  const lines = [
    '## Agents Delegated',
    ''
  ];

  const agentEvents = data.events.filter(e => e.type === 'agent_delegated');

  if (agentEvents.length > 0) {
    const agentCounts = {};
    for (const event of agentEvents) {
      agentCounts[event.data.agent] = (agentCounts[event.data.agent] || 0) + 1;
    }

    lines.push('| Agent | Delegations |');
    lines.push('|-------|-------------|');

    for (const [agent, count] of Object.entries(agentCounts).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${agent} | ${count} |`);
    }

    lines.push('');
    lines.push('### Unused Agents');
    lines.push('');

    const usedAgents = new Set(Object.keys(agentCounts));
    const unusedAgents = KNOWN_ITEMS.agents.filter(a => !usedAgents.has(a));

    if (unusedAgents.length > 0) {
      for (const agent of unusedAgents) {
        lines.push(`- ${agent}`);
      }
    } else {
      lines.push('All agents were used.');
    }
  } else {
    lines.push('No agents were delegated during this run.');
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generate recommendations section
 */
function generateRecommendations(coverage, data) {
  const lines = [
    '## Recommendations',
    ''
  ];

  const recommendations = [];

  // Check low coverage categories
  for (const [category, catData] of Object.entries(coverage.categories)) {
    const pct = catData.total > 0 ? (catData.used / catData.total) * 100 : 100;
    if (pct < 50) {
      recommendations.push(`Low ${category} coverage (${Math.round(pct)}%): Review unused ${category.toLowerCase()}`);
    }
  }

  // Check missing gates
  const gateEvents = data.events.filter(e => e.type === 'gate_checked');
  const checkedGates = new Set(gateEvents.map(e => e.data.gate));
  for (let i = 1; i <= 5; i++) {
    if (!checkedGates.has(i)) {
      recommendations.push(`Gate ${i} was not checked during this pipeline run`);
    }
  }

  // Check failed gates
  for (const event of gateEvents) {
    if (event.data.status === 'FAIL') {
      recommendations.push(`Gate ${event.data.gate} failed - review errors before release`);
    }
  }

  if (recommendations.length > 0) {
    for (const rec of recommendations) {
      lines.push(`- ${rec}`);
    }
  } else {
    lines.push('No recommendations - pipeline coverage looks good!');
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generate full report
 */
function generateReport(outputPath = DEFAULT_OUTPUT) {
  const data = loadData();
  const coverage = calculateCoverage(data);

  const startTime = data.startedAt ? new Date(data.startedAt) : new Date();
  const endTime = data.events.length > 0
    ? new Date(data.events[data.events.length - 1].timestamp)
    : startTime;
  const duration = endTime - startTime;

  const report = [
    '# Factory Pipeline Coverage Report',
    '',
    `**Generated**: ${formatTimestamp(new Date().toISOString())}`,
    `**Pipeline Start**: ${formatTimestamp(data.startedAt || 'N/A')}`,
    `**Duration**: ${formatDuration(duration)}`,
    `**Total Events**: ${data.events?.length || 0}`,
    '',
    '---',
    '',
    generateExecutiveSummary(coverage),
    '---',
    '',
    generateGatesSection(data),
    '---',
    '',
    generateSkillsSection(data, coverage),
    '---',
    '',
    generateAgentsSection(data),
    '---',
    '',
    generateToolsUsage(data, coverage),
    '---',
    '',
    generateFilesWritten(data),
    '---',
    '',
    generateEventSequence(data),
    '---',
    '',
    generateRecommendations(coverage, data)
  ].join('\n');

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, report, 'utf-8');
  console.log(`Coverage report generated: ${outputPath}`);

  return outputPath;
}

// CLI interface
const outputPath = process.argv[2] || DEFAULT_OUTPUT;

if (process.argv[2] === '--help') {
  console.log('Usage: node tools/instrumentation/reporter.js [output-file]');
  console.log('');
  console.log('Generates a markdown coverage report from instrumentation data.');
  console.log('');
  console.log('Default output: docs/factory/coverage-report.md');
  process.exit(0);
}

generateReport(outputPath);

export { generateReport };
