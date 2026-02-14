#!/usr/bin/env node
/**
 * Get Planning Version - Returns the active planning directory
 *
 * Usage: node tools/get-planning-version.js
 *
 * Output (JSON):
 *   {
 *     "dir": "docs/planning/v1",
 *     "version": 1,
 *     "usDir": "docs/planning/v1/us",
 *     "tasksDir": "docs/planning/v1/tasks",
 *     "epicsFile": "docs/planning/v1/epics.md"
 *   }
 *
 * Exit codes:
 *   0 = Success
 */

import path from 'path';
import { getEvolutionVersion, getPlanningDir, getTasksDir, getUSDir } from './lib/factory-state.js';

function getPlanningVersion() {
  const version = getEvolutionVersion();
  const dir = getPlanningDir();

  return {
    dir,
    version,
    usDir: getUSDir(),
    tasksDir: getTasksDir(),
    epicsFile: path.join(dir, 'epics.md')
  };
}

// Main
const result = getPlanningVersion();
console.log(JSON.stringify(result, null, 2));
