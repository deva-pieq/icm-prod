import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const pagesDir = path.join(projectRoot, 'pages');
const stepsDir = path.join(projectRoot, 'steps');
const featuresDir = path.join(projectRoot, 'features');
const utilsDir = path.join(projectRoot, 'utils');
const testDataDir = path.join(projectRoot, 'test-data');
const outDir = path.join(projectRoot, 'graphify-out');

const isExecute = process.argv.includes('--execute');
const isDryRun = process.argv.includes('--dry-run') || !isExecute;

/**
 * MOVE_PLAN: each entry maps a source file to its target module location.
 */
const MOVE_PLAN = [
  // ── Core Modules (A001) ──────────────────────────────────────
  {
    from: 'pages/user-management/UserManagementPage.ts',
    to: 'pages/A001_core_pages/m001_user-management/UserManagementPage.ts',
    note: 'user-management: landing, add, edit, grid',
  },
  {
    from: 'pages/happy-flow/ProductPage.ts',
    to: 'pages/A001_core_pages/m004_Products/ProductPage.ts',
    note: 'products: CRUD + grid',
  },
  // ── Operations Modules (A002) ────────────────────────────────
  {
    from: 'pages/happy-flow/CommissionRulePage.ts',
    to: 'pages/A002_ops_pages/m002_commissions/CommissionRulePage.ts',
    note: 'commissions: rule creation, templates, publish',
  },
  {
    from: 'pages/commission-statements/StatementUploadPage.ts',
    to: 'pages/A002_ops_pages/m003_statements/sp001_upload/StatementUploadPage.ts',
    note: 'statements/upload: base class',
  },
  {
    from: 'pages/transfer-agent/TransferStatementPage.ts',
    to: 'pages/A002_ops_pages/m003_statements/sp001_upload/TransferStatementPage.ts',
    note: 'statements/upload: extends StatementUploadPage',
  },
  {
    from: 'pages/happy-flow/HappyFlowStatementPage.ts',
    to: 'pages/A002_ops_pages/m003_statements/sp001_upload/HappyFlowStatementPage.ts',
    note: 'statements/upload: extends StatementUploadPage',
  },
  {
    from: 'pages/operations/payment-processing/PaymentProcessingPage.ts',
    to: 'pages/A002_ops_pages/m004_payment_processing/PaymentProcessingPage.ts',
    note: 'payment-processing: payables, approval, history base',
  },
  {
    from: 'pages/transfer-agent/TransferPaymentPage.ts',
    to: 'pages/A002_ops_pages/m004_payment_processing/TransferPaymentPage.ts',
    note: 'payment-processing: extends PaymentProcessingPage',
  },
  {
    from: 'pages/transfer-agent/TransferSheetPage.ts',
    to: 'pages/A002_ops_pages/m005_settings/TransferSheetPage.ts',
    note: 'settings/transfer-sheet: CRUD',
  },
];

/* ─── helpers ─────────────────────────────────────────────────── */

function rel(p) {
  return path.relative(projectRoot, p).replace(/\\/g, '/');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function walkDir(dir, ext = '.ts') {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkDir(full, ext)));
    } else if (full.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

function extractImports(content) {
  const imports = [];
  const re = /from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content))) imports.push(m[1]);
  return imports;
}

function extractStepPhrases(content) {
  const re = /(Given|When|Then)\(\s*['"`]([^'"`]+)['"`]/g;
  const out = [];
  let m;
  while ((m = re.exec(content))) out.push({ kind: m[1], phrase: m[2] });
  return out;
}

function extractFeatureLines(content) {
  return content.split('\n').map(l => l.trim()).filter(l => /^(Given|When|Then|And)\s+/i.test(l));
}

/** Resolve a (possibly relative) import spec against the importer's absolute dir. */
function resolveImport(importerDir, spec) {
  if (spec.startsWith('.')) return path.resolve(importerDir, spec);
  return null;
}

/** Build a relative import path from `fromFile` (absolute) to `toFile` (absolute). */
function relativeImport(fromFileAbs, toFileAbs) {
  let r = path.relative(path.dirname(fromFileAbs), toFileAbs).replace(/\\/g, '/');
  if (!r.startsWith('.')) r = './' + r;
  return r;
}

/* ─── analysis ─────────────────────────────────────────────────── */

function classifyTarget(absPath) {
  const rp = rel(absPath).toLowerCase().replace(/\\/g, '/');
  for (const m of MOVE_PLAN) {
    if (rp === m.from.toLowerCase()) return { target: m.to };
  }
  if (rp.includes('/sidebar/')) return { target: `pages/shared/sidebar/${path.basename(absPath)}` };
  if (rp.includes('/smoke/')) return { target: `pages/shared/smoke/${path.basename(absPath)}` };
  if (rp.endsWith('/apppaths.ts')) return { target: 'pages/shared/appPaths.ts' };
  return null;
}

async function analyze() {
  const pageFiles = await walkDir(pagesDir, '.ts');
  const stepFiles = await walkDir(stepsDir, '.ts');
  const featureFiles = await walkDir(featuresDir, '.feature');
  const utilFiles = await walkDir(utilsDir, '.ts');
  const testFiles = await walkDir(testDataDir, '.ts');

  const moduleMap = {};
  for (const file of pageFiles) {
    const info = classifyTarget(file);
    const moduleName = info
      ? path.dirname(info.target).replace(/\\/g, '/')
      : `pages/${path.dirname(rel(file)).replace(/\\/g, '/')}`;
    (moduleMap[moduleName] ??= []).push(rel(file));
  }

  return { pageFiles, stepFiles, featureFiles, utilFiles, testFiles, moduleMap };
}

/* ─── restructure ─────────────────────────────────────────────── */

async function restructure() {
  const oldToNew = {};
  for (const m of MOVE_PLAN) {
    oldToNew[path.resolve(projectRoot, m.from).replace(/\\/g, '/')] =
      path.resolve(projectRoot, m.to).replace(/\\/g, '/');
  }

  const planned = [];
  for (const m of MOVE_PLAN) {
    const src = path.resolve(projectRoot, m.from);
    const dest = path.resolve(projectRoot, m.to);
    const srcExists = await fs.stat(src).then(() => true).catch(() => false);
    if (!srcExists) {
      console.log(`  ⏭️  ${m.from}  (source not found, skipping)`);
      continue;
    }
    planned.push({ ...m, src, dest });
  }

  if (!isExecute) {
    console.log('\n═══ RESTRUCTURE PLAN (dry-run) ═══');
    console.log('  Run with --execute to apply.\n');
    for (const p of planned) {
      const destExists = await fs.stat(p.dest).then(() => true).catch(() => false);
      console.log(`  Move:  ${p.from}`);
      console.log(`    →   ${p.to}${destExists ? '  ⚠️  DEST EXISTS (will overwrite)' : ''}`);
      console.log(`    ${p.note}\n`);
    }
    return [];
  }

  /* ── Phase 1: Read ALL file content BEFORE any changes ── */
  console.log('\n═══ READING SOURCE FILES ═══');
  const allSrcFiles = [
    ...(await walkDir(pagesDir, '.ts')),
    ...(await walkDir(stepsDir, '.ts')),
    ...(await walkDir(utilsDir, '.ts')),
    ...(await walkDir(testDataDir, '.ts')),
  ];

  /** Map: original-abs-path → { content, isMoved, newAbs } */
  const fileMap = {};
  for (const f of allSrcFiles) {
    const norm = f.replace(/\\/g, '/');
    try {
      fileMap[norm] = { content: await fs.readFile(f, 'utf8'), isMoved: false, newAbs: norm };
    } catch { /* skip */ }
  }
  for (const m of planned) {
    const srcNorm = m.src.replace(/\\/g, '/');
    if (fileMap[srcNorm]) {
      fileMap[srcNorm].isMoved = true;
      fileMap[srcNorm].newAbs = m.dest.replace(/\\/g, '/');
    }
  }
  console.log(`  Read ${Object.keys(fileMap).length} files.`);

  /* ── Phase 2: Copy files to new locations ── */
  console.log('\n═══ COPYING TO NEW LOCATIONS ═══');
  for (const p of planned) {
    await fs.mkdir(path.dirname(p.dest), { recursive: true });
    await fs.copyFile(p.src, p.dest);
    console.log(`  ✓  ${p.from}`);
    console.log(`     → ${p.to}`);
  }

  /* ── Phase 3: Fix imports in ALL files (new and unchanged) ── */
  console.log('\n═══ FIXING IMPORTS ═══');
  const fixLog = {};

  for (const [origAbs, entry] of Object.entries(fileMap)) {
    const { content, isMoved, newAbs } = entry;
    const imports = extractImports(content);
    let updated = content;
    let anyChange = false;

    for (const imp of imports) {
      if (!imp.startsWith('.')) continue;

      /* Resolve relative to the ORIGINAL file location */
      const resolved = path.resolve(path.dirname(origAbs), imp).replace(/\\/g, '/');

      /* If the resolved target was also moved, use its new location */
      const resolvedTarget = oldToNew[resolved] || oldToNew[resolved + '.ts'] || resolved;

      /* Compute what the import SHOULD be from the CURRENT file location */
      const correctImport = relativeImport(newAbs, resolvedTarget);

      if (imp !== correctImport) {
        const re = new RegExp(`(?<=from\\s+['"])${escapeRegex(imp)}(?=['"])`, 'g');
        updated = updated.replace(re, correctImport);
        anyChange = true;

        const shortFile = rel(newAbs);
        (fixLog[shortFile] ??= []).push({ old: imp, new: correctImport });
      }
    }

    if (anyChange) {
      await fs.writeFile(newAbs, updated, 'utf8');
    }
  }

  /* Print summary */
  const fixEntries = Object.entries(fixLog);
  if (fixEntries.length === 0) {
    console.log('  No import fixes needed.');
  } else {
    console.log(`  Updated imports in ${fixEntries.length} files:`);
    for (const [file, fixes] of fixEntries) {
      console.log(`\n  ${file}:`);
      for (const f of fixes) {
        console.log(`      ${f.old}  →  ${f.new}`);
      }
    }
  }

  /* ── Phase 4: Delete old files ── */
  console.log('\n═══ DELETING OLD FILES ═══');
  for (const p of planned) {
    await fs.unlink(p.src).catch(() => {});
    console.log(`  🗑️  ${p.from}`);
  }

  /* ── Phase 5: Clean empty parent dirs ── */
  for (const p of planned) {
    let dir = path.dirname(p.src);
    while (dir.startsWith(pagesDir)) {
      const entries = await fs.readdir(dir).catch(() => null);
      if (entries && entries.length === 0) {
        await fs.rmdir(dir).catch(() => {});
        console.log(`  🗑️  (removed empty dir: ${rel(dir)})`);
        dir = path.dirname(dir);
      } else {
        break;
      }
    }
  }

  return { planned, fixLog };
}

/* ─── reports ──────────────────────────────────────────────────── */

function toModuleMapMarkdown(moduleMap) {
  const lines = ['# Module Page Map', '', '| Module | Pages |', '|---|---|'];
  for (const [mod, files] of Object.entries(moduleMap).sort()) {
    lines.push(`| ${mod} | ${files.map(f => `\`${f}\``).join('<br>')} |`);
  }
  return lines.join('\n') + '\n';
}

function toStepPageMapMarkdown(stepPageMap) {
  const lines = ['# Flow Step → Page Map', ''];
  for (const row of stepPageMap) {
    lines.push(`## \`${row.stepFile}\``);
    lines.push(`- feature: \`${row.featureFile ?? 'n/a'}\``);
    lines.push(`- page imports: ${row.pageImports.length ? row.pageImports.join(', ') : 'none'}`);
    lines.push(`- step phrases: ${row.phrases.length}`);
    lines.push('');
  }
  return lines.join('\n');
}

function toRestructureReport(planned, fixLog) {
  const lines = [
    '# Restructure & Import Fix Report', '',
    '## Files Moved', '', '| From | To | Note |', '|---|---|---|',
  ];
  for (const p of planned) {
    lines.push(`| \`${p.from}\` | \`${p.to}\` | ${p.note} |`);
  }
  lines.push('', '## Import Fixes Applied', '');
  const entries = Object.entries(fixLog);
  if (!entries.length) {
    lines.push('No import fixes needed.');
  } else {
    for (const [file, fixes] of entries) {
      lines.push(`### \`${file}\``);
      for (const f of fixes) {
        lines.push(`- \`${f.old}\` → \`${f.new}\``);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

/* ─── main ─────────────────────────────────────────────────────── */

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  ICM Explore, Restructure & Import Fix');
  console.log('═══════════════════════════════════════\n');

  const { pageFiles, stepFiles, featureFiles, utilFiles, testFiles, moduleMap } = await analyze();

  console.log(`  Pages:    ${pageFiles.length} files`);
  console.log(`  Steps:    ${stepFiles.length} files`);
  console.log(`  Features: ${featureFiles.length} files`);
  console.log(`  Utils:    ${utilFiles.length} files`);
  console.log(`  TestData: ${testFiles.length} files\n`);

  console.log('Module Map (current → target):');
  for (const [mod, files] of Object.entries(moduleMap).sort()) {
    console.log(`  ${mod}/`);
    for (const f of files) console.log(`    ${f}`);
  }

  /* Step → page map */
  const stepPageMap = [];
  for (const sf of stepFiles) {
    const content = await fs.readFile(sf, 'utf8');
    const imports = extractImports(content);
    const pageImports = imports.filter(i => i.includes('/pages/') || i.startsWith('../pages/'));
    const phrases = extractStepPhrases(content);
    const bestFeature = featureFiles.find(ff => {
      const name = path.basename(sf, '.steps.ts').toLowerCase();
      return rel(ff).toLowerCase().includes(name.split('-')[0]);
    });
    stepPageMap.push({
      stepFile: rel(sf),
      featureFile: bestFeature ? rel(bestFeature) : null,
      pageImports,
      phrases,
    });
  }

  /* Feature summaries */
  const featSummaries = [];
  for (const ff of featureFiles) {
    const content = await fs.readFile(ff, 'utf8');
    featSummaries.push({ featureFile: rel(ff), stepLines: extractFeatureLines(content) });
  }

  await fs.mkdir(outDir, { recursive: true });

  if (isExecute || isDryRun) {
    const result = await restructure();
    if (result.length === 0 && isDryRun) {
      /* dry-run only — nothing to report */
    } else if (result.planned) {
      const report = toRestructureReport(result.planned, result.fixLog);
      await fs.writeFile(path.join(outDir, 'restructure-report.md'), report);
      console.log(`\n  Report: ${rel(path.join(outDir, 'restructure-report.md'))}`);
    }
  }

  await fs.writeFile(
    path.join(outDir, 'module-map.json'),
    JSON.stringify({ moduleMap, stepPageMap, featureSummaries: featSummaries }, null, 2),
  );
  await fs.writeFile(path.join(outDir, 'module-map.md'), toModuleMapMarkdown(moduleMap));
  await fs.writeFile(path.join(outDir, 'flow-step-page-map.md'), toStepPageMapMarkdown(stepPageMap));

  console.log('\n═══════════════════════════════════════');
  console.log('  Done.');
  if (!isExecute) console.log('  Run with --execute to apply.');
  console.log(`  Output: ${rel(outDir)}`);
  console.log('═══════════════════════════════════════');
}

main().catch(err => {
  console.error('exploreapp failed:', err);
  process.exitCode = 1;
});
