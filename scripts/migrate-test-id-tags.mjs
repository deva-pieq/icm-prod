#!/usr/bin/env node
/**
 * Migrate test case ID tags: @{Module}-{Area}-{NNN} → @TEST-{NNN}-{Module}-{Area}
 * Usage: node scripts/migrate-test-id-tags.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const re = /@([A-Za-z][A-Za-z0-9-]*)-(\d{3})\b/g;

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith('.feature')) files.push(p);
  }
  return files;
}

let total = 0;
for (const file of walk('features')) {
  const orig = fs.readFileSync(file, 'utf8');
  const next = orig.replace(re, '@TEST-$2-$1');
  if (next !== orig) {
    const n = [...orig.matchAll(re)].length;
    total += n;
    console.log(`${dryRun ? '[dry-run] ' : ''}${file}: ${n} tags`);
    if (!dryRun) fs.writeFileSync(file, next);
  }
}
console.log(`Total: ${total}`);
