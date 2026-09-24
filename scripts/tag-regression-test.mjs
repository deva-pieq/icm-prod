#!/usr/bin/env node
/**
 * Add @regression-test to feature/scenario tag lines, skipping @e2e scenarios
 * and files where every scenario is e2e (or feature line carries @e2e).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const featuresDir = path.join(root, 'features');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.feature')) out.push(full);
  }
  return out;
}

function isTagLine(line) {
  return /^(\s*)@\S/.test(line);
}

function nextLineIsScenarioBlock(lines, idx) {
  for (let j = idx + 1; j < lines.length; j++) {
    const t = lines[j].trim();
    if (!t || t.startsWith('#')) continue;
    return /^(Scenario|Scenario Outline):/.test(t);
  }
  return false;
}

function collectScenarioTagLines(lines) {
  const scenarioTags = [];
  for (let i = 0; i < lines.length; i++) {
    if (isTagLine(lines[i]) && lines[i].startsWith('  ') && nextLineIsScenarioBlock(lines, i)) {
      scenarioTags.push(i);
    }
  }
  return scenarioTags;
}

function addRegressionTest(line) {
  if (line.includes('@regression-test')) return line;
  const m = line.match(/^(\s*)(.+)$/);
  if (!m) return line;
  const tags = m[2].split(/\s+/);
  tags.splice(1, 0, '@regression-test');
  return m[1] + tags.join(' ');
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split('\n');

  const featureIdx = lines.findIndex((l) => l.startsWith('@') && !l.startsWith('  @'));
  const featureLine = featureIdx >= 0 ? lines[featureIdx] : '';
  const featureHasE2e = featureLine.includes('@e2e');

  const scenarioTagIdxs = collectScenarioTagLines(lines);
  const scenarioLines = scenarioTagIdxs.map((i) => lines[i]);
  const allScenariosE2e =
    scenarioLines.length > 0 && scenarioLines.every((l) => l.includes('@e2e'));

  if (featureHasE2e || allScenariosE2e) {
    return { changed: false, skipped: true, reason: featureHasE2e ? 'feature-e2e' : 'all-scenarios-e2e' };
  }

  let changed = false;
  const updated = lines.map((line, i) => {
    if (!isTagLine(line)) return line;
    if (line.includes('@regression-test')) return line;
    if (line.includes('@e2e')) return line;

    const isFeatureTag = i === featureIdx || (line.startsWith('@') && !line.startsWith('  @'));
    const isScenarioTag = scenarioTagIdxs.includes(i);

    if (!isFeatureTag && !isScenarioTag) return line;

    changed = true;
    return addRegressionTest(line);
  });

  if (!changed) return { changed: false, skipped: false };

  fs.writeFileSync(filePath, updated.join('\n'), 'utf8');
  return { changed: true, skipped: false };
}

const files = walk(featuresDir);
const summary = { changed: [], skipped: [], unchanged: [] };

for (const file of files) {
  const rel = path.relative(root, file);
  const result = processFile(file);
  if (result.skipped) summary.skipped.push({ rel, reason: result.reason });
  else if (result.changed) summary.changed.push(rel);
  else summary.unchanged.push(rel);
}

console.log(`Changed: ${summary.changed.length}`);
summary.changed.forEach((f) => console.log(`  + ${f}`));
console.log(`Skipped (e2e-only): ${summary.skipped.length}`);
summary.skipped.forEach(({ rel, reason }) => console.log(`  - ${rel} (${reason})`));
console.log(`Unchanged (already tagged): ${summary.unchanged.length}`);
