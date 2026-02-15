#!/usr/bin/env node
/**
 * Detect Requirements - Finds the latest requirements-N.md file
 *
 * Usage: node tools/detect-requirements.js
 *
 * Output (JSON):
 *   {
 *     "file": "input/requirements-2.md",
 *     "version": 2,
 *     "isEvolution": true,
 *     "allVersions": [...]
 *   }
 *
 * Exit codes:
 *   0 = Success
 *   1 = No requirements file found
 */

import fs from 'fs';
import path from 'path';

const INPUT_DIR = 'input';

function detectRequirements() {
  if (!fs.existsSync(INPUT_DIR)) {
    return { error: 'Input directory not found' };
  }

  const files = fs.readdirSync(INPUT_DIR)
    .filter(f => f.match(/^requirements(-\d+)?\.md$/));

  if (files.length === 0) {
    return { error: 'No requirements file found' };
  }

  // Parse versions: requirements.md = 1, requirements-2.md = 2, etc.
  const versions = files.map(f => {
    const match = f.match(/requirements-(\d+)\.md$/);
    return {
      file: path.join(INPUT_DIR, f),
      version: match ? parseInt(match[1], 10) : 1
    };
  }).sort((a, b) => b.version - a.version);

  const latest = versions[0];

  return {
    file: latest.file,
    version: latest.version,
    nextVersion: latest.version + 1,
    isEvolution: latest.version > 1,
    allVersions: versions
  };
}

// Main
const result = detectRequirements();

if (result.error) {
  console.error(JSON.stringify({ error: result.error }));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
