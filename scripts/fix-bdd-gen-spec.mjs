#!/usr/bin/env node
/**
 * Post-process playwright-bdd *.spec.ts:
 * 1. Move bddFileData above hooks/test.use (avoids TDZ at runtime)
 * 2. Assert BddFileData type (fixes keywordType: string vs PickleStepType)
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const outputDir = process.env.BDD_OUTPUT_DIR ?? '.features-gen';
const BDD_DATA_RE =
  /const bddFileData = \[[\s\S]*?\]; \/\/ bdd-data-end/;

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

function insertDataBlock(next, dataBlock) {
  const anchors = [
    "test.beforeAll('BeforeAll Hooks'",
    "test.beforeEach('BeforeEach Hooks'",
    'test.use({',
  ];
  for (const anchor of anchors) {
    if (next.includes(anchor)) {
      return next.replace(anchor, `${dataBlock}\n\n${anchor}`);
    }
  }
  return null;
}

function fixSpec(content) {
  if (!content.includes('// == technical section ==')) return content;

  const match = content.match(BDD_DATA_RE);
  if (!match) return content;

  let dataBlock = match[0];
  dataBlock = dataBlock.replace(
    /]; \/\/ bdd-data-end$/,
    `] as import('playwright-bdd').BddFileData; // bdd-data-end`,
  );

  const next = content.replace(BDD_DATA_RE, '').trimEnd();
  const withData = insertDataBlock(next, dataBlock);
  if (!withData) {
    console.warn('fix-bdd-gen-spec: could not re-insert bddFileData — leaving file unchanged');
    return content;
  }

  return `${withData}\n`;
}

function main() {
  const root = path.resolve(process.cwd(), outputDir);
  for (const file of walkFiles(root)) {
    if (!file.endsWith('.spec.ts')) continue;
    const original = fs.readFileSync(file, 'utf8');
    const fixed = fixSpec(original);
    if (fixed !== original) {
      fs.writeFileSync(file, fixed);
    }
  }
}

main();
