import fs from 'fs';
import path from 'path';

const FEATURES_DIR = 'features';

function listFeatureFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...listFeatureFiles(full));
    else if (entry.name.endsWith('.feature')) results.push(full);
  }
  return results;
}
const EM_DASH = '\u2014';

const testSuffixRules = [
  [/Agent-Dashboard-Global-Filters$/, 'AGT', 'FLT'],
  [/Agent-Dashboard-Viewing-Period$/, 'AGT', 'VP'],
  [/Agent-Dashboard-Filter-Actions$/, 'AGT', 'FLT'],
  [/Agent-Dashboard-Time-Period$/, 'AGT', 'TP'],
  [/Agent-Dashboard-Additional-Filters$/, 'AGT', 'ADF'],
  [/Agent-Dashboard-Performance-Overview$/, 'AGT', 'PO'],
  [/Agent-Dashboard-Commission-Role$/, 'AGT', 'CR'],
  [/Agent-Dashboard-Product-Type-Performance$/, 'AGT', 'PTP'],
  [/Agent-Dashboard-Persistency$/, 'AGT', 'PER'],
  [/Agent-Dashboard-LOB-Carrier$/, 'AGT', 'LCS'],
  [/Agent-Dashboard-Cross-Sell$/, 'AGT', 'CS'],
  [/Agency-Dashboard-Global-Filters$/, 'AGD', 'FLT'],
  [/Agency-Dashboard-Viewing-Period$/, 'AGD', 'VP'],
  [/Agency-Dashboard-Filter-Actions$/, 'AGD', 'FLT'],
  [/Agency-Dashboard-Time-Period$/, 'AGD', 'TP'],
  [/Agency-Dashboard-Additional-Filters$/, 'AGD', 'ADF'],
  [/Agency-Dashboard-Widgets-UI$/, 'AGD', 'WDG'],
  [/Agency-Dashboard-Key-Metrics$/, 'AGD', 'KM'],
  [/Agency-Dashboard-Revenue-LOB$/, 'AGD', 'RL'],
  [/Agency-Dashboard-Revenue-Filter$/, 'AGD', 'RF'],
  [/Agency-Dashboard-Top-Performers$/, 'AGD', 'TP'],
  [/Agency-Dashboard-Revenue-Trend$/, 'AGD', 'RT'],
  [/Agency-Dashboard-Commission-Role$/, 'AGD', 'CR'],
  [/Agency-Dashboard-Year-Limit$/, 'AGD', 'YL'],
  [/Product-Create-Page$/, 'PRD', 'PCP'],
  [/Product-Edit-Page$/, 'PRD', 'PEP'],
  [/Product-Commission-Structure$/, 'PRD', 'PCS'],
  [/Product-Commission-Rule$/, 'PRD', 'PCR'],
  [/dashboard-viewing-period$/, 'DASH', 'VP'],
  [/dashboard-processing-cycle$/, 'DASH', 'PC'],
  [/dashboard-stage-breakdown$/, 'DASH', 'SB'],
  [/dashboard-carrier-ageing$/, 'DASH', 'CA'],
  [/dashboard-exception-tracking$/, 'DASH', 'ET'],
  [/dashboard-pending-payments$/, 'DASH', 'PP'],
  [/happy-flow$/, 'E2E', 'HF'],
];

const fileDefaults = {
  'features/users/user-management.feature': { mod: 'USR', submod: 'GEN' },
  'features/e2e-transfer-sheet/transfer-sheet.feature': { mod: 'TS', submod: 'GEN' },
  'features/e2e-commission-statements/statement-upload-renewal.feature': { mod: 'STM', submod: 'RNW' },
};

function deriveFromTestSuffix(suffix) {
  for (const [pattern, mod, submod] of testSuffixRules) {
    if (pattern.test(suffix)) return { mod, submod };
  }
  return null;
}

function deriveSmokeSubmod(tagLine) {
  if (tagLine.includes('@sidebar-user-management')) return 'UM';
  if (tagLine.includes('@sidebar-carriers')) return 'CAR';
  if (tagLine.includes('@sidebar-agents')) return 'AGN';
  if (tagLine.includes('@sidebar-products')) return 'PRD';
  if (tagLine.includes('@sidebar-policies')) return 'POL';
  if (tagLine.includes('@sidebar-commission-management')) return 'CMS';
  if (tagLine.includes('@sidebar-statements')) return 'STM';
  if (tagLine.includes('@sidebar-payment-processing')) return 'PAY';
  if (tagLine.includes('@sidebar-settings')) return 'SET';
  if (tagLine.includes('@ops-dashboard')) return 'DSH';
  if (tagLine.includes('@smoke-logout')) return 'OUT';
  if (tagLine.includes('@agent')) return 'AGT';
  if (tagLine.includes('@owner')) return 'OWN';
  if (tagLine.includes('@smoke-role')) return 'ROL';
  return 'GEN';
}

function deriveUserMgmtSubmod(tagLine) {
  if (tagLine.includes('@screenshot')) return 'SCR';
  if (tagLine.includes('@sort')) return 'SRT';
  if (tagLine.includes('@grid') && tagLine.includes('@columns')) return 'GCO';
  if (tagLine.includes('@grid') && tagLine.includes('@empty')) return 'GEP';
  if (tagLine.includes('@grid') && tagLine.includes('@kpi')) return 'KPI';
  if (tagLine.includes('@grid') && tagLine.includes('@clear')) return 'GCL';
  if (tagLine.includes('@grid') && tagLine.includes('@role')) return 'GRL';
  if (tagLine.includes('@grid') && tagLine.includes('@status')) return 'GST';
  if (tagLine.includes('@grid') && tagLine.includes('@search')) return 'GSR';
  if (tagLine.includes('@negative')) return 'NEG';
  if (tagLine.includes('@validation')) return 'VAL';
  if (tagLine.includes('@positive')) return 'ADD';
  return 'GEN';
}

function deriveTransferSheetSubmod(tagLine) {
  if (tagLine.includes('@transfer-sheet-duplicate')) return 'DUP';
  if (tagLine.includes('@transfer-sheet-invalid-date')) return 'DAT';
  if (tagLine.includes('@transfer-agent')) return 'E2E';
  return 'GEN';
}

function renameFeatureFile(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  const content = fs.readFileSync(relPath, 'utf8');
  const lines = content.split(/\r?\n/);
  let lastTagLine = '';
  let seq = 0;
  let changed = 0;
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('@TEST-') || line.trim().startsWith('@')) {
      if (line.includes('@TEST-') || /^\s*@[\w-]+/.test(line)) {
        lastTagLine = line;
      }
    }

    const alreadyNamed = line.match(/^(\s*Scenario(?: Outline)?:\s*)T\d{3}-[A-Z]+-[A-Z0-9]+\s/);
    if (alreadyNamed) {
      skipped++;
      continue;
    }

    const oldFormat = line.match(
      /^(\s*Scenario(?: Outline)?:\s*)([A-Z]+)-([A-Z]+)-(\d{3})\s*[\u2014\u2013-]\s*(.+)$/,
    );
    if (oldFormat) {
      const [, prefix, mod, submod, num, desc] = oldFormat;
      lines[i] = `${prefix}T${num}-${mod}-${submod} ${EM_DASH} ${desc}`;
      changed++;
      continue;
    }

    const plainScenario = line.match(/^(\s*Scenario(?: Outline)?:\s*)(.+)$/);
    if (!plainScenario) continue;

    const [, prefix, title] = plainScenario;
    if (/^T\d{3}-[A-Z]+-[A-Z0-9]+\s/.test(title)) continue;

    let num;
    let mod;
    let submod;

    const testMatch = lastTagLine.match(/@TEST-(\d{3})-([\w-]+)/);
    if (testMatch) {
      num = testMatch[1];
      const derived = deriveFromTestSuffix(testMatch[2]);
      if (derived) {
        ({ mod, submod } = derived);
      } else if (testMatch[2] === 'smoke') {
        mod = 'SMK';
        submod = deriveSmokeSubmod(lastTagLine);
      } else {
        throw new Error(`${normalized}:${i + 1} unknown TEST suffix "${testMatch[2]}"`);
      }
    } else if (normalized.includes('user-management.feature')) {
      seq++;
      num = String(seq).padStart(3, '0');
      mod = 'USR';
      submod = deriveUserMgmtSubmod(lastTagLine);
    } else if (normalized.includes('transfer-sheet.feature')) {
      seq++;
      num = String(seq).padStart(3, '0');
      mod = 'TS';
      submod = deriveTransferSheetSubmod(lastTagLine);
    } else {
      const defaults = fileDefaults[normalized];
      if (!defaults) {
        throw new Error(`${normalized}:${i + 1} no TEST tag and no file defaults for scenario "${title}"`);
      }
      seq++;
      num = String(seq).padStart(3, '0');
      ({ mod, submod } = defaults);
    }

    lines[i] = `${prefix}T${num}-${mod}-${submod} ${EM_DASH} ${title}`;
    changed++;
  }

  if (changed > 0) {
    fs.writeFileSync(relPath, lines.join('\n'));
  }

  return { file: normalized, changed, skipped };
}

const files = listFeatureFiles(FEATURES_DIR).sort();
const results = files.map((f) => renameFeatureFile(f));

for (const r of results) {
  if (r.changed > 0) {
    console.log(`${r.file}: renamed ${r.changed}, skipped ${r.skipped}`);
  } else {
    console.log(`${r.file}: no changes (${r.skipped} already named)`);
  }
}
