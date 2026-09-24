#!/usr/bin/env node
/**
 * Audit manual CSV test cases against Gherkin features and assertion depth.
 *
 * Primary CSV format:
 *   Sno, Scenarios, Steps, Expected result
 *
 * Usage:
 *   node .cursor/skills/validate-csv-bdd-coverage/scripts/audit-csv-coverage.mjs \
 *     --csv <path> --feature <path> [--steps <path>] [--page <path>] [--json]
 *
 * Exit 1 when gaps are found (missing scenarios, unmapped expected results, or weak assertions).
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opts = { json: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--json') opts.json = true;
  else if (a.startsWith('--')) opts[a.slice(2)] = args[++i];
}

if (!opts.csv || !opts.feature) {
  console.error(
    `Usage: node audit-csv-coverage.mjs --csv <file> --feature <file> [--steps <file>] [--page <file>] [--json]`,
  );
  process.exit(2);
}

const SNO_HEADERS = ['sno', 's.no', 's no', 'sr no', 'sr. no', 'serial', 'serial no', '#'];
const ID_HEADERS = ['test case id', 'test id', 'tc id', 'case id'];
const SCENARIO_HEADERS = ['scenarios', 'scenario', 'test scenario', 'test case', 'title', 'summary'];
const EXPECTED_HEADERS = ['expected result', 'expected results', 'expected outcome', 'expected'];
const STEPS_HEADERS = ['steps', 'test steps', 'procedure', 'actions'];

const WEAK_ASSERT_PATTERNS = [/toBeVisible\s*\(/, /toBeAttached\s*\(/, /toBeEnabled\s*\(/, /toBeHidden\s*\(/];
const STRONG_ASSERT_PATTERNS = [
  /toBeChecked\s*\(/,
  /toHaveValue\s*\(/,
  /toHaveText\s*\(/,
  /toContainText\s*\(/,
  /toMatch\s*\(/,
  /toBe\s*\(/,
  /toBeGreaterThan/,
  /toBeLessThan/,
  /toBeCloseTo\s*\(/,
  /not\.toBe\s*\(/,
  /expect\s*\([^)]+\)\.not\./,
];

function normalizeHeader(h) {
  return h.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\./g, '');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || (c === '\r' && text[i + 1] === '\n')) {
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = '';
      if (c === '\r') i++;
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  return rows;
}

function pickColumn(headers, candidates) {
  const norm = headers.map(normalizeHeader);
  for (const c of candidates) {
    const idx = norm.indexOf(c);
    if (idx >= 0) return idx;
  }
  for (let i = 0; i < norm.length; i++) {
    if (candidates.some((c) => norm[i] === c || norm[i].includes(c))) return i;
  }
  return -1;
}

function loadCsvCases(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCsv(raw);
  if (!rows.length) return [];

  const headers = rows[0];
  const snoCol = pickColumn(headers, SNO_HEADERS);
  const idCol = pickColumn(headers, ID_HEADERS);
  const scenarioCol = pickColumn(headers, SCENARIO_HEADERS);
  const expectedCol = pickColumn(headers, EXPECTED_HEADERS);
  const stepsCol = pickColumn(headers, STEPS_HEADERS);

  if (snoCol < 0 && idCol < 0 && scenarioCol < 0) {
    throw new Error(
      `CSV missing row identifier. Expected columns like: Sno + Scenarios, or Test Case ID, or Scenarios`,
    );
  }

  const cases = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const snoRaw = snoCol >= 0 ? (row[snoCol] ?? '').trim() : '';
    const sno = snoRaw.replace(/\D/g, '') || String(r);
    const tracePrefix = `T${sno.padStart(3, '0')}`;
    const explicitId = idCol >= 0 ? (row[idCol] ?? '').trim() : '';
    const scenarioText = scenarioCol >= 0 ? (row[scenarioCol] ?? '').trim() : '';
    const expected = expectedCol >= 0 ? (row[expectedCol] ?? '').trim() : '';
    const steps = stepsCol >= 0 ? (row[stepsCol] ?? '').trim() : '';

    if (!snoRaw && !explicitId && !scenarioText) continue;

    cases.push({
      sno,
      tracePrefix,
      id: explicitId || tracePrefix,
      scenarioText,
      title: scenarioText,
      expected,
      steps,
    });
  }
  return cases;
}

function extractScenarioId(title) {
  const m = title.match(/\b(T\d{3}-[A-Z0-9]+-[A-Z0-9]+)\b/);
  return m ? m[1] : null;
}

function scenarioTitleBody(title) {
  return title.replace(/^T\d{3}-[A-Z0-9]+-[A-Z0-9]+\s*[\u2014\u2013-]\s*/i, '').trim();
}

function parseFeature(featurePath) {
  const content = fs.readFileSync(featurePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const scenarios = [];
  let current = null;
  let lastTags = '';
  let inThenSection = false;

  for (const line of lines) {
    const tagMatch = line.match(/^\s*(@[\w-]+(?:\s+@[\w-]+)*)\s*$/);
    if (tagMatch) {
      lastTags = tagMatch[1];
      continue;
    }
    const scenarioMatch = line.match(/^\s*Scenario(?: Outline)?:\s*(.+)$/);
    if (scenarioMatch) {
      if (current) scenarios.push(current);
      const title = scenarioMatch[1].trim();
      const testTag = lastTags.match(/@TEST-(\d{3}-[\w-]+)/);
      current = {
        title,
        titleBody: scenarioTitleBody(title),
        traceId: extractScenarioId(title),
        testTag: testTag ? testTag[0] : null,
        tags: lastTags,
        whenSteps: [],
        thenSteps: [],
      };
      lastTags = '';
      inThenSection = false;
      continue;
    }
    if (current) {
      if (line.match(/^\s*Then\s+/)) {
        inThenSection = true;
        current.thenSteps.push(line.replace(/^\s*Then\s+/, '').trim());
        continue;
      }
      if (line.match(/^\s*And\s+/)) {
        const text = line.replace(/^\s*And\s+/, '').trim();
        if (inThenSection) current.thenSteps.push(text);
        else current.whenSteps.push(text);
        continue;
      }
      const givenWhen = line.match(/^\s*(Given|When)\s+(.+)$/);
      if (givenWhen) {
        inThenSection = false;
        current.whenSteps.push(givenWhen[2].trim());
      }
    }
  }
  if (current) scenarios.push(current);
  return scenarios;
}

function findMatchingScenario(tc, scenarios) {
  if (tc.id && tc.id.startsWith('T')) {
    const byTrace = scenarios.find((s) => s.traceId === tc.id);
    if (byTrace) return { scenario: byTrace, matchBy: 'trace-id' };
  }

  const byPrefix = scenarios.find((s) => s.traceId?.startsWith(tc.tracePrefix + '-'));
  if (byPrefix) return { scenario: byPrefix, matchBy: 'sno-prefix' };

  if (tc.scenarioText) {
    const csvTokens = tokenize(tc.scenarioText);
    let best = null;
    let bestScore = 0;
    for (const s of scenarios) {
      const titleTokens = new Set(tokenize(s.titleBody || s.title));
      if (!csvTokens.length) continue;
      const overlap = csvTokens.filter((t) => titleTokens.has(t)).length / csvTokens.length;
      if (overlap > bestScore) {
        bestScore = overlap;
        best = s;
      }
    }
    if (best && bestScore >= 0.4) return { scenario: best, matchBy: 'title', score: bestScore };
  }

  return null;
}

function splitBullets(text) {
  if (!text) return [];
  return text
    .split(/\n|(?<=\.)\s+|;\s+|\d+\.\s+/)
    .map((s) => s.replace(/^[-*•]\s*/, '').trim())
    .filter((s) => s.length > 8);
}

function tokenize(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        !['that', 'with', 'from', 'when', 'then', 'should', 'will', 'the', 'and', 'are', 'for'].includes(w),
    );
}

function textCoveredBySteps(expected, steps) {
  const expTokens = tokenize(expected);
  if (!expTokens.length) return { covered: false, score: 0 };

  let best = 0;
  for (const step of steps) {
    const stepTokens = new Set(tokenize(step));
    const overlap = expTokens.filter((t) => stepTokens.has(t)).length;
    const score = overlap / expTokens.length;
    if (score > best) best = score;
  }
  return { covered: best >= 0.35, score: best };
}

function parseStepMappings(stepsPath) {
  if (!stepsPath || !fs.existsSync(stepsPath)) return new Map();
  const content = fs.readFileSync(stepsPath, 'utf8');
  const map = new Map();
  const re = /Then\(\s*['"`]([^'"`]+)['"`]\s*,\s*async\s*\([^)]*\)\s*=>\s*\{([^}]*)\}/gs;
  let m;
  while ((m = re.exec(content))) {
    const stepText = m[1];
    const body = m[2];
    const call = body.match(/await\s+(\w+)\.(\w+)\s*\(/);
    map.set(stepText, call ? `${call[1]}.${call[2]}` : null);
  }
  return map;
}

function loadPageMethods(pagePath) {
  if (!pagePath || !fs.existsSync(pagePath)) return new Map();
  const content = fs.readFileSync(pagePath, 'utf8');
  const map = new Map();
  const re = /async\s+(expect\w+)\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/g;
  let m;
  while ((m = re.exec(content))) {
    map.set(m[1], m[2]);
  }
  return map;
}

function scoreAssertionMethod(body) {
  if (!body) return { strength: 'unknown', issues: ['no page method body found'] };

  const hasStrong = STRONG_ASSERT_PATTERNS.some((p) => p.test(body));
  const weakOnly =
    WEAK_ASSERT_PATTERNS.some((p) => p.test(body)) &&
    !hasStrong &&
    !/expect\s*\([^)]+\)\.(not\.|toBe(?!Visible|Attached|Enabled|Hidden))/s.test(body);

  const issues = [];
  if (/text\.length\)\.toBeGreaterThan\(0\)/.test(body) && !/\$|%|Mon |checked|value/i.test(body)) {
    issues.push('non-empty text only — add pattern or value check');
  }
  if (weakOnly) issues.push('visibility-only assertion — upgrade per bdd-contextual-assertions skill');
  if (/if\s*\(before\s*!==\s*after\)/.test(body)) {
    issues.push('conditional refresh check may pass without proving change');
  }

  let strength = 'strong';
  if (issues.length) strength = weakOnly ? 'weak' : 'medium';
  else if (!hasStrong && WEAK_ASSERT_PATTERNS.some((p) => p.test(body))) strength = 'medium';

  return { strength, issues };
}

function audit() {
  const csvCases = loadCsvCases(opts.csv);
  const scenarios = parseFeature(opts.feature);
  const stepMap = parseStepMappings(opts.steps);
  const pageMethods = loadPageMethods(opts.page);

  const missingInFeature = [];
  const matched = [];

  for (const tc of csvCases) {
    const hit = findMatchingScenario(tc, scenarios);
    if (!hit) {
      missingInFeature.push(tc);
      continue;
    }
    matched.push({ tc, ...hit });
  }

  const matchedScenarioTitles = new Set(matched.map((m) => m.scenario.title));
  const extraInFeature = scenarios.filter((s) => !matchedScenarioTitles.has(s.title));

  const expectedGaps = [];
  const stepGaps = [];

  for (const { tc, scenario } of matched) {
    const expectedBullets = splitBullets(tc.expected);
    for (const bullet of expectedBullets) {
      const { covered, score } = textCoveredBySteps(bullet, scenario.thenSteps);
      if (!covered) {
        expectedGaps.push({
          sno: tc.sno,
          id: scenario.traceId || tc.tracePrefix,
          expected: bullet,
          score: Math.round(score * 100),
          scenarioTitle: scenario.title,
        });
      }
    }
    if (!expectedBullets.length && tc.expected && scenario.thenSteps.length === 0) {
      expectedGaps.push({
        sno: tc.sno,
        id: scenario.traceId || tc.tracePrefix,
        expected: tc.expected,
        score: 0,
        scenarioTitle: scenario.title,
        note: 'scenario has no Then/And steps',
      });
    }

    const stepBullets = splitBullets(tc.steps);
    for (const bullet of stepBullets) {
      const { covered, score } = textCoveredBySteps(bullet, scenario.whenSteps);
      if (!covered) {
        stepGaps.push({
          sno: tc.sno,
          id: scenario.traceId || tc.tracePrefix,
          step: bullet,
          score: Math.round(score * 100),
          scenarioTitle: scenario.title,
        });
      }
    }
  }

  const assertionGaps = [];
  for (const scenario of scenarios) {
    for (const thenText of scenario.thenSteps) {
      const normalized = thenText.replace(/\{string\}|\{word\}|\{int\}/g, '{}');
      let mapping = stepMap.get(thenText) ?? stepMap.get(normalized);
      if (!mapping) {
        for (const [key, val] of stepMap) {
          const pattern = key.replace(/\{string\}|\{word\}|\{int\}/g, '.+');
          if (
            new RegExp(
              `^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\\\}/g, '.+')}$`,
            ).test(thenText)
          ) {
            mapping = val;
            break;
          }
        }
      }
      if (!mapping) continue;
      const methodName = mapping.split('.').pop();
      const body = pageMethods.get(methodName);
      const { strength, issues } = scoreAssertionMethod(body);
      if (strength === 'weak' || strength === 'medium' || issues.length) {
        assertionGaps.push({
          traceId: scenario.traceId,
          scenario: scenario.title,
          thenStep: thenText,
          method: methodName,
          strength,
          issues,
        });
      }
    }
  }

  const report = {
    csv: path.normalize(opts.csv),
    feature: path.normalize(opts.feature),
    csvFormat: 'Sno, Scenarios, Steps, Expected result',
    summary: {
      csvCases: csvCases.length,
      featureScenarios: scenarios.length,
      matched: matched.length,
      missingInFeature: missingInFeature.length,
      extraInFeature: extraInFeature.length,
      expectedResultGaps: expectedGaps.length,
      stepGaps: stepGaps.length,
      weakAssertions: assertionGaps.filter((a) => a.strength === 'weak').length,
      mediumAssertions: assertionGaps.filter((a) => a.strength === 'medium').length,
    },
    missingInFeature: missingInFeature.map((c) => ({
      sno: c.sno,
      scenarios: c.scenarioText,
      tracePrefix: c.tracePrefix,
    })),
    extraInFeature: extraInFeature.map((s) => ({ id: s.traceId, title: s.title })),
    expectedResultGaps: expectedGaps,
    stepGaps,
    assertionGaps,
  };

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }

  const hasGaps =
    report.summary.missingInFeature > 0 ||
    report.summary.expectedResultGaps > 0 ||
    report.summary.weakAssertions > 0;

  process.exit(hasGaps ? 1 : 0);
}

function printReport(report) {
  const s = report.summary;
  console.log('\n# CSV → BDD Coverage Audit\n');
  console.log(`CSV:     ${report.csv}`);
  console.log(`Feature: ${report.feature}`);
  console.log(`Format:  ${report.csvFormat}\n`);
  console.log('## Summary');
  console.log(`| Metric | Count |`);
  console.log(`|--------|------:|`);
  console.log(`| CSV rows | ${s.csvCases} |`);
  console.log(`| Feature scenarios | ${s.featureScenarios} |`);
  console.log(`| Matched (Sno / title) | ${s.matched} |`);
  console.log(`| Missing in feature | ${s.missingInFeature} |`);
  console.log(`| Extra in feature (not in CSV) | ${s.extraInFeature} |`);
  console.log(`| Expected-result gaps | ${s.expectedResultGaps} |`);
  console.log(`| Step gaps (CSV Steps → When) | ${s.stepGaps} |`);
  console.log(`| Weak assertions | ${s.weakAssertions} |`);
  console.log(`| Medium assertions | ${s.mediumAssertions} |`);

  if (report.missingInFeature.length) {
    console.log('\n## Missing scenarios (CSV row not found in feature)\n');
    for (const m of report.missingInFeature) {
      console.log(`- **Sno ${m.sno}** (${m.tracePrefix}): ${m.scenarios || '(no scenario text)'}`);
    }
  }

  if (report.expectedResultGaps.length) {
    console.log('\n## Expected results not reflected in Then steps\n');
    for (const g of report.expectedResultGaps.slice(0, 30)) {
      console.log(`- **Sno ${g.sno}** / ${g.id} (${g.score}% match): ${g.expected}`);
    }
    if (report.expectedResultGaps.length > 30) {
      console.log(`\n… and ${report.expectedResultGaps.length - 30} more`);
    }
  }

  if (report.stepGaps.length) {
    console.log('\n## CSV Steps not reflected in When/Given steps\n');
    for (const g of report.stepGaps.slice(0, 20)) {
      console.log(`- **Sno ${g.sno}** / ${g.id} (${g.score}% match): ${g.step}`);
    }
    if (report.stepGaps.length > 20) {
      console.log(`\n… and ${report.stepGaps.length - 20} more`);
    }
  }

  if (report.assertionGaps.length) {
    console.log('\n## Assertion depth gaps\n');
    for (const a of report.assertionGaps.slice(0, 25)) {
      console.log(`- **${a.traceId || '?'}** \`${a.thenStep.slice(0, 70)}…\``);
      console.log(`  Method: \`${a.method}\` — **${a.strength}**`);
      for (const issue of a.issues) console.log(`  - ${issue}`);
    }
    if (report.assertionGaps.length > 25) {
      console.log(`\n… and ${report.assertionGaps.length - 25} more`);
    }
  }

  console.log('\n---');
  if (s.missingInFeature || s.expectedResultGaps || s.weakAssertions) {
    console.log('FAIL — gaps found. Follow validate-csv-bdd-coverage skill to fix.');
  } else {
    console.log('PASS — full CSV coverage and no weak assertions detected.');
  }
}

audit();
