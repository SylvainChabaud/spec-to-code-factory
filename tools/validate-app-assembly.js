#!/usr/bin/env node
/**
 * App Assembly Validator
 * Validates that App.tsx properly assembles all components and hooks
 *
 * Usage: node tools/validate-app-assembly.js
 *
 * Exit codes:
 *   0 = PASS
 *   1 = ERROR (file not found, parse error)
 *   2 = FAIL (validation failed)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { loadProjectConfig, findAppPath, findComponentPaths, findHookPaths } from './lib/project-config.js';

// Configuration - loaded once from project-config.json with fallbacks
let _cachedConfig = null;
function getConfig() {
  if (_cachedConfig) return _cachedConfig;

  const projectConfig = loadProjectConfig();
  const thresholds = projectConfig.validation?.appAssembly || {};

  _cachedConfig = {
    appPath: findAppPath(),
    componentsDirs: findComponentPaths(),
    hooksDirs: findHookPaths(),
    componentsIndexPath: 'src/components/index.ts',
    hooksIndexPath: 'src/hooks/index.ts',
    typesIndexPath: 'src/types/index.ts',
    minAppLines: thresholds.minLines || 10,
    minComponentCoverage: thresholds.minComponentCoverage || 0.5,
    minHookCoverage: thresholds.minHookCoverage || 0.5
  };
  return _cachedConfig;
}

/**
 * Parse exports from an index.ts file
 * Supports: export { X } from './x' and export * from './x'
 */
function parseExportsFrom(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const exports = [];

  // Match named exports: export { Name } from './path'
  // Also handles: export { Name, Name2 } from './path'
  const namedExportRegex = /export\s*\{\s*([^}]+)\s*\}\s*from/g;
  let match;
  while ((match = namedExportRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(' as ')[0].trim());
    exports.push(...names.filter(n => n && !n.startsWith('type ')));
  }

  // Match re-exports: export * from './path' - need to read the file
  const reExportRegex = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
  while ((match = reExportRegex.exec(content)) !== null) {
    const relativePath = match[1];
    const dir = path.dirname(filePath);
    let targetPath = path.join(dir, relativePath);

    // Handle different extensions
    const extensions = ['.ts', '.tsx', '/index.ts', '/index.tsx'];
    for (const ext of extensions) {
      const tryPath = targetPath.endsWith('.ts') || targetPath.endsWith('.tsx')
        ? targetPath
        : targetPath + ext;
      if (fs.existsSync(tryPath)) {
        const subExports = parseExportsFrom(tryPath);
        exports.push(...subExports);
        break;
      }
    }
  }

  // Match direct exports: export const Name = ... or export function Name
  const directExportRegex = /export\s+(?:const|function|class)\s+(\w+)/g;
  while ((match = directExportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  // Match default exports with name: export default Name
  const defaultExportRegex = /export\s+default\s+(\w+)/g;
  while ((match = defaultExportRegex.exec(content)) !== null) {
    if (match[1] !== 'function' && match[1] !== 'class') {
      exports.push(match[1]);
    }
  }

  return [...new Set(exports)]; // Remove duplicates
}

/**
 * Find all component files directly if index.ts doesn't exist
 */
function findComponentsInDir(dir) {
  if (!fs.existsSync(dir)) return [];

  const components = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
      // Skip index, test files, and type files
      if (file.name === 'index.ts' || file.name === 'index.tsx' ||
          file.name.includes('.test.') || file.name.includes('.types.')) {
        continue;
      }
      // Component name is the file name without extension, PascalCase
      const name = file.name.replace(/\.(tsx?|jsx?)$/, '');
      if (name[0] === name[0].toUpperCase()) {
        components.push(name);
      }
    } else if (file.isDirectory()) {
      // Check for component in subdirectory (e.g., NoteList/NoteList.tsx)
      const subPath = path.join(dir, file.name);
      const componentFile = path.join(subPath, `${file.name}.tsx`);
      const indexFile = path.join(subPath, 'index.tsx');

      if (fs.existsSync(componentFile) || fs.existsSync(indexFile)) {
        components.push(file.name);
      }
    }
  }

  return components;
}

/**
 * Find all hooks in hooks directory
 */
function findHooksInDir(dir) {
  if (!fs.existsSync(dir)) return [];

  const hooks = [];
  const files = fs.readdirSync(dir, { recursive: true });

  for (const file of files) {
    const fileName = typeof file === 'string' ? file : file.name;
    // Match files starting with 'use' (hook convention)
    if (fileName.match(/^use[A-Z].*\.tsx?$/) && !fileName.includes('.test.')) {
      const hookName = fileName.replace(/\.(tsx?|jsx?)$/, '');
      hooks.push(hookName);
    }
  }

  return hooks;
}

/**
 * Check if a component/hook is imported in the content
 */
function isImported(name, content) {
  // Match import statements that include the name (handles multi-line imports)
  // Pattern 1: import { Name } from '...' (single or multi-line with 's' flag)
  const importRegex = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from`, 's');
  // Pattern 2: import Name from '...'
  const defaultImportRegex = new RegExp(`import\\s+${name}\\s+from`);
  // Pattern 3: import * as Name from '...'
  const namespaceImportRegex = new RegExp(`import\\s*\\*\\s*as\\s+${name}\\s+from`);

  return importRegex.test(content) || defaultImportRegex.test(content) || namespaceImportRegex.test(content);
}

/**
 * Check if a hook is used (called) in the content
 */
function isHookUsed(hookName, content) {
  // Hooks are called as functions: useXxx()
  const hookCallRegex = new RegExp(`\\b${hookName}\\s*\\(`, 'm');
  return hookCallRegex.test(content);
}

/**
 * Check if a component is rendered in JSX
 */
function isComponentRendered(componentName, content) {
  // Components in JSX: <ComponentName or <ComponentName>
  const jsxRegex = new RegExp(`<${componentName}[\\s/>]`, 'm');
  return jsxRegex.test(content);
}

/**
 * Validate TypeScript compilation
 * Uses project's tsc configuration to ensure proper module resolution
 */
function validateTypeScript(filePath) {
  try {
    // Use project's tsconfig for proper module resolution
    // --noEmit just type-checks without outputting files
    execSync(`npx tsc --noEmit`, {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 60000
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

/**
 * Main validation function
 */
function validateAppAssembly() {
  console.log('\n🔍 Validating App Assembly...\n');

  // Load config from project-config.json (or defaults)
  const CONFIG = getConfig();

  const errors = [];
  const warnings = [];
  const info = [];

  // 1. Check if App.tsx exists (from project-config.json)
  const appPath = CONFIG.appPath;
  if (!appPath) {
    console.log(`❌ App.tsx not found (check docs/factory/project-config.json)`);
    process.exit(1);
  }

  info.push(`Found App.tsx at: ${appPath}`);
  const appContent = fs.readFileSync(appPath, 'utf-8');
  const appLines = appContent.split('\n').length;

  info.push(`App.tsx has ${appLines} lines`);

  // 2. Check minimum lines (not a stub)
  if (appLines < CONFIG.minAppLines) {
    errors.push(`App.tsx has only ${appLines} lines (minimum ${CONFIG.minAppLines} expected) - likely a stub`);
  } else {
    info.push(`✅ App.tsx size OK (${appLines} >= ${CONFIG.minAppLines} lines)`);
  }

  // 3. Discover components (check multiple locations)
  let components = parseExportsFrom(CONFIG.componentsIndexPath);
  if (components.length === 0) {
    for (const dir of CONFIG.componentsDirs) {
      const found = findComponentsInDir(dir);
      if (found.length > 0) {
        components = found;
        break;
      }
    }
  }

  if (components.length === 0) {
    warnings.push('No components discovered - skipping component validation');
  } else {
    info.push(`Discovered ${components.length} components: ${components.join(', ')}`);

    // Check imported components
    const importedComponents = components.filter(c => isImported(c, appContent));
    const importCoverage = importedComponents.length / components.length;

    if (importCoverage < CONFIG.minComponentCoverage) {
      errors.push(
        `Only ${importedComponents.length}/${components.length} components imported ` +
        `(${Math.round(importCoverage * 100)}% < ${CONFIG.minComponentCoverage * 100}% required)`
      );
      errors.push(`  Missing imports: ${components.filter(c => !importedComponents.includes(c)).join(', ')}`);
    } else {
      info.push(`✅ Component imports OK (${importedComponents.length}/${components.length} = ${Math.round(importCoverage * 100)}%)`);
    }

    // Check rendered components
    const renderedComponents = components.filter(c => isComponentRendered(c, appContent));

    if (renderedComponents.length === 0) {
      errors.push('No components are rendered in JSX');
    } else {
      info.push(`✅ ${renderedComponents.length} components rendered in JSX: ${renderedComponents.join(', ')}`);
    }
  }

  // 4. Discover hooks (check multiple locations)
  let hooks = parseExportsFrom(CONFIG.hooksIndexPath);
  if (hooks.length === 0) {
    for (const dir of CONFIG.hooksDirs) {
      const found = findHooksInDir(dir);
      if (found.length > 0) {
        hooks = found;
        break;
      }
    }
  }

  if (hooks.length === 0) {
    warnings.push('No hooks discovered - skipping hook validation');
  } else {
    info.push(`Discovered ${hooks.length} hooks: ${hooks.join(', ')}`);

    // Check used hooks
    const usedHooks = hooks.filter(h => isHookUsed(h, appContent));
    const hookCoverage = usedHooks.length / hooks.length;

    if (hookCoverage < CONFIG.minHookCoverage) {
      errors.push(
        `Only ${usedHooks.length}/${hooks.length} hooks used ` +
        `(${Math.round(hookCoverage * 100)}% < ${CONFIG.minHookCoverage * 100}% required)`
      );
      errors.push(`  Missing hooks: ${hooks.filter(h => !usedHooks.includes(h)).join(', ')}`);
    } else {
      info.push(`✅ Hook usage OK (${usedHooks.length}/${hooks.length} = ${Math.round(hookCoverage * 100)}%)`);
    }
  }

  // 5. Check TypeScript validity (BLOCKING - forces agent to fix errors)
  try {
    const tsResult = validateTypeScript(appPath);
    if (!tsResult.success) {
      errors.push('TypeScript compilation failed - fix all type errors before continuing');
      if (tsResult.stderr) {
        // Extract first 5 errors for clarity
        const lines = tsResult.stderr.split('\n').filter(l => l.includes('error TS'));
        const preview = lines.slice(0, 5).join('\n  ');
        if (preview) {
          errors.push(`  ${preview}`);
        }
        if (lines.length > 5) {
          errors.push(`  ... and ${lines.length - 5} more errors`);
        }
      }
    } else {
      info.push('✅ TypeScript compilation OK');
    }
  } catch (e) {
    warnings.push('TypeScript validation skipped (tsc not available)');
  }

  // Print results
  console.log('--- Info ---');
  info.forEach(i => console.log(`  ${i}`));

  if (warnings.length > 0) {
    console.log('\n--- Warnings ---');
    warnings.forEach(w => console.log(`  ⚠️  ${w}`));
  }

  if (errors.length > 0) {
    console.log('\n--- Errors ---');
    errors.forEach(e => console.log(`  ❌ ${e}`));
    console.log(`\n❌ App Assembly validation FAILED (${errors.length} errors)\n`);
    process.exit(2);
  }

  console.log('\n✅ App Assembly validation PASSED\n');
  process.exit(0);
}

// Run validation
validateAppAssembly();
