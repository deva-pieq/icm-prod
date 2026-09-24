import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import {
  COMMISSION_REPORT,
  COMMISSION_REPORT_FILENAME_PATTERN,
} from '../../test-data/commission-report/validateCommissionReport';
import { registerGeneratedFile } from '../generatedFileCleanup';

export type PreparedCommissionReportFile = {
  absolutePath: string;
  fileName: string;
  statementType: string;
  sourceFileName: string;
  reportSheetPath: string;
  runStamp: number;
  carrierName: string;
};

type PayeeLlcToggleState = {
  /** Next LLC casing to apply: lowercase first, then uppercase, alternating. */
  suffix: 'llc' | 'LLC';
};

const PAYEE_HEADER_CANDIDATES = ['payee name', 'agent name', 'financial owner'] as const;

function normalizeHeader(label: string): string {
  return label.replace(/\s+/g, ' ').trim().toLowerCase();
}

function payeeUniquenessPattern(): RegExp {
  const base = COMMISSION_REPORT.payeeNameForUniqueness.replace(/\s+llc$/i, '').trim();
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
  return new RegExp(`${escaped}\\s+llc`, 'i');
}

function readPayeeLlcSuffix(): 'llc' | 'LLC' {
  const statePath = COMMISSION_REPORT.payeeLlcToggleStateFile;
  if (!fs.existsSync(statePath)) return 'llc';

  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8')) as PayeeLlcToggleState;
    return parsed.suffix === 'LLC' ? 'LLC' : 'llc';
  } catch {
    return 'llc';
  }
}

function writePayeeLlcSuffix(current: 'llc' | 'LLC'): void {
  const next: PayeeLlcToggleState = { suffix: current === 'llc' ? 'LLC' : 'llc' };
  fs.mkdirSync(path.dirname(COMMISSION_REPORT.payeeLlcToggleStateFile), { recursive: true });
  fs.writeFileSync(COMMISSION_REPORT.payeeLlcToggleStateFile, `${JSON.stringify(next)}\n`, 'utf8');
}

function parseInboxFilename(fileName: string): { statementType: string; baseName: string } {
  const match = fileName.match(COMMISSION_REPORT_FILENAME_PATTERN);
  if (!match) {
    throw new Error(
      `Inbox file "${fileName}" must match [StatementType]name.xlsx|csv — ` +
        `e.g. [Carrier Product]statement.xlsx`,
    );
  }
  return {
    statementType: match[1].trim(),
    baseName: match[2].trim(),
  };
}

function resolveInboxSourceFile(): string {
  const override = process.env.COMMISSION_REPORT_FILE?.trim();
  if (override) {
    const absolute = path.isAbsolute(override)
      ? override
      : path.join(COMMISSION_REPORT.inboxDir, override);
    if (!fs.existsSync(absolute)) {
      throw new Error(`COMMISSION_REPORT_FILE not found: ${absolute}`);
    }
    return absolute;
  }

  if (!fs.existsSync(COMMISSION_REPORT.inboxDir)) {
    throw new Error(`Commission report inbox not found: ${COMMISSION_REPORT.inboxDir}`);
  }

  const candidates = fs
    .readdirSync(COMMISSION_REPORT.inboxDir)
    .filter(
      (name) =>
        (name.toLowerCase().endsWith('.xlsx') || name.toLowerCase().endsWith('.csv')) &&
        !name.startsWith('.'),
    )
    .sort((a, b) => {
      const aX = a.toLowerCase().endsWith('.xlsx') ? 0 : 1;
      const bX = b.toLowerCase().endsWith('.xlsx') ? 0 : 1;
      return aX - bX || a.localeCompare(b);
    });

  if (candidates.length === 0) {
    throw new Error(
      `No xlsx/csv files in ${COMMISSION_REPORT.inboxDir} — drop a file like ` +
        `[StatementType]statement.xlsx`,
    );
  }

  if (candidates.length > 1) {
    throw new Error(
      `Multiple inbox files (${candidates.join(', ')}) — keep one file or set COMMISSION_REPORT_FILE`,
    );
  }

  return path.join(COMMISSION_REPORT.inboxDir, candidates[0]!);
}

function deriveCarrierName(statementType: string): string {
  const firstWord = statementType.split(/\s+/)[0]?.trim();
  return firstWord || 'Unknown';
}

function findHeaderRow(sheet: ExcelJS.Worksheet): {
  rowIndex: number;
  columns: Map<string, number>;
} {
  const maxScan = Math.min(20, sheet.rowCount || 20);
  for (let rowIndex = 1; rowIndex <= maxScan; rowIndex++) {
    const columns = new Map<string, number>();
    sheet.getRow(rowIndex).eachCell({ includeEmpty: false }, (cell, col) => {
      const label = normalizeHeader(String(cell.value ?? ''));
      if (label) columns.set(label, col);
    });
    const hasPayeeLike = PAYEE_HEADER_CANDIDATES.some((name) => columns.has(name));
    if (hasPayeeLike || columns.has('policy number') || columns.has('agent number')) {
      return { rowIndex, columns };
    }
  }
  throw new Error(`Could not locate header row with Payee/Agent name in ${sheet.name}`);
}

function resolvePayeeColumn(columns: Map<string, number>): number {
  for (const candidate of PAYEE_HEADER_CANDIDATES) {
    const col = columns.get(candidate);
    if (col != null) return col;
  }
  throw new Error(
    `Missing Payee name column — looked for: ${PAYEE_HEADER_CANDIDATES.join(', ')}`,
  );
}

function applyLlcSuffix(value: string, suffix: 'llc' | 'LLC'): string {
  return value.replace(/\bllc\b/i, suffix);
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields;
}

function formatCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function serializeCsvLine(fields: string[]): string {
  return fields.map(formatCsvField).join(',');
}

function findCsvHeaderRow(lines: string[]): {
  rowIndex: number;
  headers: string[];
  columns: Map<string, number>;
} {
  const maxScan = Math.min(20, lines.length);
  for (let rowIndex = 0; rowIndex < maxScan; rowIndex++) {
    const headers = parseCsvLine(lines[rowIndex]!);
    const columns = new Map<string, number>();
    headers.forEach((header, col) => {
      const label = normalizeHeader(header);
      if (label) columns.set(label, col);
    });
    const hasPayeeLike = PAYEE_HEADER_CANDIDATES.some((name) => columns.has(name));
    if (hasPayeeLike || columns.has('policy number') || columns.has('agent number')) {
      return { rowIndex, headers, columns };
    }
  }
  throw new Error('Could not locate CSV header row with Payee/Agent name');
}

async function prepareFromXlsx(
  sourcePath: string,
  sourceFileName: string,
  stamp: number,
  suffix: 'llc' | 'LLC',
): Promise<{ absolutePath: string; fileName: string }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(sourcePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error(`Workbook has no worksheets: ${sourcePath}`);

  const { rowIndex: headerRowIndex, columns } = findHeaderRow(sheet);
  const payeeCol = resolvePayeeColumn(columns);
  const payeeRe = payeeUniquenessPattern();
  const blockReasonCol = columns.get('block reason');
  const stampToken = `automation-run-${stamp}`;

  let changed = false;
  for (let rowIndex = headerRowIndex + 1; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;

    const cell = row.getCell(payeeCol);
    const current = String(cell.value ?? '').trim();
    if (!payeeRe.test(current)) continue;

    cell.value = applyLlcSuffix(current, suffix);
    if (blockReasonCol != null) {
      const brCell = row.getCell(blockReasonCol);
      const existing = String(brCell.value ?? '').trim();
      brCell.value = existing ? `${existing} ${stampToken}` : stampToken;
    }
    changed = true;
    break;
  }

  if (!changed) {
    throw new Error(
      `No "${COMMISSION_REPORT.payeeNameForUniqueness}" value found in Payee/Agent column ` +
        `(col ${payeeCol}) of ${sourceFileName}`,
    );
  }

  const fileName = `commissionReport-${stamp}.xlsx`;
  const absolutePath = path.join(COMMISSION_REPORT.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  return { absolutePath, fileName };
}

function prepareFromCsv(
  sourcePath: string,
  sourceFileName: string,
  stamp: number,
  suffix: 'llc' | 'LLC',
): { absolutePath: string; fileName: string } {
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error(`Inbox CSV has no data rows: ${sourcePath}`);
  }

  const { rowIndex: headerRowIndex, headers, columns } = findCsvHeaderRow(lines);
  const payeeCol = resolvePayeeColumn(columns);
  const payeeRe = payeeUniquenessPattern();
  const blockReasonCol = columns.get('block reason');
  const stampToken = `automation-run-${stamp}`;

  let changed = false;
  const outputLines = lines.slice(0, headerRowIndex + 1);

  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]!);
    while (fields.length < headers.length) fields.push('');

    if (!changed) {
      const current = (fields[payeeCol] ?? '').trim();
      if (payeeRe.test(current)) {
        fields[payeeCol] = applyLlcSuffix(current, suffix);
        if (blockReasonCol != null) {
          const existing = (fields[blockReasonCol] ?? '').trim();
          fields[blockReasonCol] = existing
            ? `${existing} ${stampToken}`
            : stampToken;
        }
        changed = true;
      }
    }

    outputLines.push(serializeCsvLine(fields));
  }

  if (!changed) {
    throw new Error(
      `No "${COMMISSION_REPORT.payeeNameForUniqueness}" value found in Payee/Agent column ` +
        `(col ${payeeCol}) of ${sourceFileName}`,
    );
  }

  const fileName = `commissionReport-${stamp}.csv`;
  const absolutePath = path.join(COMMISSION_REPORT.generatedDir, fileName);
  fs.writeFileSync(absolutePath, `${outputLines.join('\n')}\n`, 'utf8');
  return { absolutePath, fileName };
}

export type PrepareCommissionReportOptions = {
  /** Defaults to COMMISSION_REPORT.reportSheetFilePrefix */
  reportSheetFilePrefix?: string;
};

/**
 * Clone inbox xlsx/csv for a unique run:
 * - statement type from `[StatementType]filename.xlsx|csv`
 * - find Payee name (or Agent Name / Financial Owner) column
 * - change ONE configured payee LLC cell: LLC ↔ llc (persisted toggle)
 * - stamp same row with a per-run `automation-run-<ts>` token so file content
 *   (and thus the DB content-hash) differs every run — app rejects byte-equal
 *   uploads via the Duplicate File modal
 * - write unique generated file for upload (same extension as source)
 */
export async function prepareCommissionReportFileFromInbox(
  options: PrepareCommissionReportOptions = {},
): Promise<PreparedCommissionReportFile> {
  const sourcePath = resolveInboxSourceFile();
  const sourceFileName = path.basename(sourcePath);
  const { statementType } = parseInboxFilename(sourceFileName);
  const lower = sourceFileName.toLowerCase();
  const isXlsx = lower.endsWith('.xlsx');
  const isCsv = lower.endsWith('.csv');

  if (!isXlsx && !isCsv) {
    throw new Error(
      `Commission report prep expects an .xlsx or .csv inbox file (got "${sourceFileName}"). ` +
        `Place [StatementType]….xlsx|csv in the inbox.`,
    );
  }

  fs.mkdirSync(COMMISSION_REPORT.generatedDir, { recursive: true });
  fs.mkdirSync(COMMISSION_REPORT.reportSheetDir, { recursive: true });

  const stamp = Date.now();
  const suffix = readPayeeLlcSuffix();

  const prepared = isXlsx
    ? await prepareFromXlsx(sourcePath, sourceFileName, stamp, suffix)
    : prepareFromCsv(sourcePath, sourceFileName, stamp, suffix);
  registerGeneratedFile(prepared.absolutePath);

  writePayeeLlcSuffix(suffix);

  const reportPrefix =
    options.reportSheetFilePrefix ?? COMMISSION_REPORT.reportSheetFilePrefix;
  const reportSheetPath = path.join(
    COMMISSION_REPORT.reportSheetDir,
    `${reportPrefix}-${stamp}.csv`,
  );

  return {
    absolutePath: prepared.absolutePath,
    fileName: prepared.fileName,
    statementType,
    sourceFileName,
    reportSheetPath,
    runStamp: stamp,
    carrierName: deriveCarrierName(statementType),
  };
}
