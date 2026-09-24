#!/usr/bin/env node
/**
 * Collects a capped markdown bundle of Playwright failure evidence for CI
 * OpenCode summarize-only. Reads test-results/ (error-context.md, error paths);
 * does NOT embed raw trace zips.
 *
 * Output: .ci/failure-context.md
 * Exit 0 even when nothing is found (warn-only).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TEST_RESULTS = path.resolve(ROOT, 'test-results');
const OUT_DIR = path.resolve(ROOT, '.ci');
const OUT_FILE = path.join(OUT_DIR, 'failure-context.md');
/** Soft cap so OpenCode prompts stay cheap. */
const MAX_BYTES = 55_000;
const MAX_PER_ERROR_CONTEXT = 8_000;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 20)}\n…truncated…\n`;
}

function main() {
  const lines = [];
  lines.push('# Playwright failure context (CI)');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Working directory: ${ROOT}`);
  lines.push('');

  const outcomesPath = path.join(OUT_DIR, 'run-outcomes.json');
  if (fs.existsSync(outcomesPath)) {
    try {
      const outcomes = JSON.parse(fs.readFileSync(outcomesPath, 'utf8'));
      lines.push('## Run outcomes (from SlackReporter)');
      lines.push('');
      lines.push('```json');
      lines.push(
        JSON.stringify(
          {
            grand: outcomes.grand,
            flaky: outcomes.flaky ?? [],
            failed: outcomes.failed ?? [],
          },
          null,
          2,
        ),
      );
      lines.push('```');
      lines.push('');
    } catch (err) {
      lines.push(`_Could not parse run-outcomes.json: ${(err && err.message) || err}_`);
      lines.push('');
    }
  }

  if (!fs.existsSync(TEST_RESULTS)) {
    lines.push('_No `test-results/` directory found._');
    writeOut(lines.join('\n'));
    console.warn('[ci-collect] test-results/ missing — wrote empty-ish context.');
    return;
  }

  const files = walk(TEST_RESULTS);
  const errorContexts = files.filter((f) => path.basename(f) === 'error-context.md');
  const screenshots = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  const traces = files.filter((f) => /trace\.zip$/i.test(f));
  const otherErrors = files.filter(
    (f) =>
      /error/i.test(path.basename(f)) &&
      path.basename(f) !== 'error-context.md' &&
      /\.(txt|md|log)$/i.test(f),
  );

  lines.push('## Artifact inventory');
  lines.push('');
  lines.push(`- error-context.md files: ${errorContexts.length}`);
  lines.push(`- screenshots: ${screenshots.length}`);
  lines.push(`- trace.zip files: ${traces.length} (paths only — not embedded)`);
  lines.push('');

  if (screenshots.length) {
    lines.push('### Screenshots');
    lines.push('');
    for (const s of screenshots.slice(0, 40)) {
      lines.push(`- \`${rel(s)}\``);
    }
    if (screenshots.length > 40) lines.push(`- _…and ${screenshots.length - 40} more_`);
    lines.push('');
  }

  if (traces.length) {
    lines.push('### Traces (download from Actions artifacts; do not open in model)');
    lines.push('');
    for (const t of traces.slice(0, 40)) {
      lines.push(`- \`${rel(t)}\``);
    }
    if (traces.length > 40) lines.push(`- _…and ${traces.length - 40} more_`);
    lines.push('');
  }

  lines.push('## Error contexts');
  lines.push('');

  if (!errorContexts.length && !otherErrors.length) {
    lines.push('_No error-context.md files found under test-results/._');
    lines.push('');
    lines.push('List of test-results entries (names only):');
    for (const f of files.slice(0, 80)) {
      lines.push(`- \`${rel(f)}\``);
    }
  }

  let budget = MAX_BYTES - Buffer.byteLength(lines.join('\n'), 'utf8');

  for (const ctxPath of errorContexts) {
    if (budget < 500) {
      lines.push('');
      lines.push('_Remaining error contexts omitted (size cap)._');
      break;
    }
    const raw = fs.readFileSync(ctxPath, 'utf8');
    const body = truncate(raw, Math.min(MAX_PER_ERROR_CONTEXT, budget - 200));
    const block = [`### \`${rel(ctxPath)}\``, '', '```', body.trimEnd(), '```', ''].join('\n');
    const size = Buffer.byteLength(block, 'utf8');
    lines.push(block);
    budget -= size;
  }

  for (const errPath of otherErrors) {
    if (budget < 500) break;
    const raw = fs.readFileSync(errPath, 'utf8');
    const body = truncate(raw, Math.min(4_000, budget - 200));
    const block = [`### \`${rel(errPath)}\``, '', '```', body.trimEnd(), '```', ''].join('\n');
    lines.push(block);
    budget -= Buffer.byteLength(block, 'utf8');
  }

  let out = lines.join('\n');
  if (Buffer.byteLength(out, 'utf8') > MAX_BYTES) {
    out = truncate(out, MAX_BYTES);
  }

  writeOut(out);
  console.log(
    `[ci-collect] Wrote ${OUT_FILE} (${Buffer.byteLength(out, 'utf8')} bytes, ` +
      `${errorContexts.length} error-context file(s)).`,
  );
}

function writeOut(content) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, content, 'utf8');
}

try {
  main();
} catch (err) {
  console.warn(`[ci-collect] Failed: ${(err && err.message) || err}`);
  try {
    writeOut(`# Playwright failure context (CI)\n\n_Collector error: ${(err && err.message) || err}_\n`);
  } catch {
    /* ignore */
  }
  process.exit(0);
}
