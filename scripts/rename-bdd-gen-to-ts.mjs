#!/usr/bin/env node
/**
 * playwright-bdd emits *.spec.js; rename to *.spec.ts so generated tests stay TypeScript.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const outputDir = process.env.BDD_OUTPUT_DIR ?? '.features-gen';

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

function main() {
  const root = path.resolve(process.cwd(), outputDir);
  for (const file of walkFiles(root)) {
    if (!file.endsWith('.spec.js')) continue;
    const target = file.replace(/\.spec\.js$/, '.spec.ts');
    fs.renameSync(file, target);
  }
}

main();
