/**
 * Copy @sanity templates into TestFiles-prod-sanity and rewrite
 * product aliases → test- prefix. NPNs kept. Agent display names left
 * as-is in Excel (match by NPN); prod agents get test- display names in UI.
 *
 * Usage: node scripts/prep-prod-sanity-testfiles.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcRoot = path.join(root, 'TestFiles');
const destRoot = path.join(root, 'TestFiles-prod-sanity');

/** alias / scale-name rewrites only */
const ALIAS_REWRITES = [
  ['aetna-aca-test-advance-month-july-21', 'test-aetna-aca-test-advance-month-july-21'],
  ['aetna-test-product-001', 'test-aetna-test-product-001'],
  ['2025-jan-1-aetna-test-001', 'test-2025-jan-1-aetna-test-001'],
  ['Aetna-Test-Product', 'test-Aetna-Test-Product'],
];

/** Module folders used by @sanity (exclude .generated / InvalidUploadFiles) */
const MODULES = [
  'AdvanceOnlyTemplate',
  'AdvanceAndRecovery',
  'AdvanceAndAdjustment',
  'CommissionOnlyTemplate',
  'Chargeback',
  'TransferSheets',
  'MmpTemplate',
  'PaymentModule',
  'StatementUpload',
  'PolicyCancellationAgencyAdvance',
  'PolicyCancellationCarrierAdvance',
  'PolicyCancellationCarrierAgencyCredit',
  'HappyFlowE2E',
  'ValidateCommissionSplit',
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function listXlsx(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === '.generated' || ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listXlsx(full));
    else if (/\.xlsx$/i.test(ent.name) && !ent.name.startsWith('~$')) out.push(full);
  }
  return out;
}

function rewriteCell(value) {
  if (value == null) return { value, changed: false };
  if (typeof value === 'number' || typeof value === 'boolean') return { value, changed: false };
  let s = String(value);
  let changed = false;
  for (const [from, to] of ALIAS_REWRITES) {
    if (s === from || s.includes(from)) {
      const next = s.split(from).join(to);
      if (next !== s) {
        s = next;
        changed = true;
      }
    }
  }
  return { value: changed ? s : value, changed };
}

async function rewriteWorkbook(src, dest) {
  ensureDir(path.dirname(dest));
  await fs.promises.copyFile(src, dest);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(dest);
  let cells = 0;
  for (const sheet of wb.worksheets) {
    sheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        const raw = cell.value;
        // handle rich text / formula results lightly
        if (raw && typeof raw === 'object' && 'text' in raw) {
          const r = rewriteCell(raw.text);
          if (r.changed) {
            cell.value = r.value;
            cells++;
          }
          return;
        }
        if (raw && typeof raw === 'object' && 'result' in raw) {
          const r = rewriteCell(raw.result);
          if (r.changed) {
            cell.value = r.value;
            cells++;
          }
          return;
        }
        const r = rewriteCell(raw);
        if (r.changed) {
          cell.value = r.value;
          cells++;
        }
      });
    });
  }
  if (cells > 0) await wb.xlsx.writeFile(dest);
  return cells;
}

async function main() {
  ensureDir(destRoot);
  const report = [];
  for (const mod of MODULES) {
    const srcDir = path.join(srcRoot, mod);
    if (!fs.existsSync(srcDir)) {
      report.push({ mod, status: 'missing-src' });
      continue;
    }
    const files = listXlsx(srcDir);
    for (const src of files) {
      const rel = path.relative(srcRoot, src);
      const dest = path.join(destRoot, rel);
      const cells = await rewriteWorkbook(src, dest);
      report.push({ file: rel, cellsRewritten: cells });
      console.log(`${rel}  cells=${cells}`);
    }
  }
  const reportPath = path.join(destRoot, '_rewrite-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nDone. Wrote ${destRoot}`);
  console.log(`Report: ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
