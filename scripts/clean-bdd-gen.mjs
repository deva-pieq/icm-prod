#!/usr/bin/env node
/**
 * Remove stale playwright-bdd output so orphaned *.spec.* files do not linger
 * after feature files are moved or renamed.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const outputDir = process.env.BDD_OUTPUT_DIR ?? '.features-gen';
const root = path.resolve(process.cwd(), outputDir);

if (fs.existsSync(root)) {
  fs.rmSync(root, { recursive: true, force: true });
}
