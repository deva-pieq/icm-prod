import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import {
  STATEMENT_PROCESSING,
  statementProcessingTemplatePath,
} from '../../test-data/statement-processing/validateStatementProcessing';
import { registerGeneratedFile } from '../generatedFileCleanup';
import {
  getStatementProcessingPreparedFile,
  type StatementProcessingPreparedFile,
} from './statementProcessingContext';

function headerColumnMap(sheet: ExcelJS.Worksheet): Map<string, number> {
  const map = new Map<string, number>();
  const headerRow = sheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const label = String(cell.value ?? '')
      .trim()
      .toLowerCase();
    if (label) map.set(label, col);
  });
  return map;
}

function cellNumericValue(value: ExcelJS.CellValue): number {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return NaN;
  if (value !== null && typeof value === 'object') {
    if ('result' in value) {
      const result = (value as ExcelJS.CellFormulaValue).result;
      if (typeof result === 'number') return result;
      if (typeof result === 'string') {
        const parsed = Number.parseFloat(result.replace(/[$,]/g, ''));
        return Number.isFinite(parsed) ? parsed : NaN;
      }
    }
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[$,]/g, ''));
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
}

function incrementUid(current: string, fallbackPrefix: string, fallbackPad: number): string {
  const numMatch = current.match(/^(.*?)(\d+)$/);
  if (numMatch) {
    const prefix = numMatch[1];
    const pad = numMatch[2].length;
    const nextNum = Number.parseInt(numMatch[2], 10) + 1;
    return `${prefix}${String(nextNum).padStart(pad, '0')}`;
  }
  return `${fallbackPrefix}${String(1).padStart(fallbackPad, '0')}`;
}

function readPreparedData(
  sheet: ExcelJS.Worksheet,
  columns: Map<string, number>,
  runStamp: number,
): StatementProcessingPreparedFile {
  const uidCol = columns.get('customer uid') ?? 7;
  const agentNpnCol = columns.get('selling agent npn') ?? 3;
  const productCol = columns.get('scale name/adjustment description') ?? 16;
  const grossCol = columns.get('gross compensation') ?? 13;
  const netCol = columns.get('net compensation') ?? 15;
  const stateCol = columns.get('customer contract state') ?? 10;
  const premiumCol = columns.get('premium') ?? 20;

  const firstDataRow = sheet.getRow(2);
  const gross =
    Math.round(cellNumericValue(firstDataRow.getCell(grossCol).value) * 100) / 100;
  let net = Math.round(cellNumericValue(firstDataRow.getCell(netCol).value) * 100) / 100;
  if (!Number.isFinite(net)) {
    // Shared formulas sometimes omit cached result — derive from gross (12% tax).
    net = Math.round(gross * 0.88 * 100) / 100;
  }
  return {
    absolutePath: '',
    fileName: '',
    carrierName: STATEMENT_PROCESSING.carrierName,
    customerUid: String(firstDataRow.getCell(uidCol).value ?? '').trim(),
    agentNpn: String(firstDataRow.getCell(agentNpnCol).value ?? '').trim(),
    productName: String(firstDataRow.getCell(productCol).value ?? '').trim(),
    grossCompensation: Number.isFinite(gross) ? gross : 0,
    netCompensation: Number.isFinite(net) ? net : 0,
    premium: Math.round(cellNumericValue(firstDataRow.getCell(premiumCol).value) * 100) / 100,
    state: String(firstDataRow.getCell(stateCol).value ?? '').trim(),
    recordCount: runStamp, // placeholder — callers override
  };
}

function cellDateValue(value: ExcelJS.CellValue): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'result' in value) {
    return cellDateValue((value as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
  }
  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + value * 86_400_000);
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addOneDay(date: Date): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/**
 * Valid commission statement — clone the base template, increment the Customer UID
 * by +1 on every data row (preserving prefix + zero-padding), bump the Check run date
 * by one day, persist the incremented UIDs back to the template for the next run,
 * then save a timestamped copy for upload.
 */
export async function prepareValidStatementFile(): Promise<StatementProcessingPreparedFile> {
  const templatePath = statementProcessingTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Statement processing template not found: ${templatePath}`);
  }

  fs.mkdirSync(STATEMENT_PROCESSING.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Statement processing template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? 7;
  const checkRunCol = columns.get('check run date') ?? 17;
  const grossCol = columns.get('gross compensation') ?? 13;
  const taxCol = columns.get('tax withholding') ?? 14;
  const netCol = columns.get('net compensation') ?? 15;

  let dataRows = 0;
  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    dataRows += 1;

    const uidCell = row.getCell(uidCol);
    const currentUid = String(uidCell.value ?? '').trim();
    if (currentUid) {
      uidCell.value = incrementUid(
        currentUid,
        STATEMENT_PROCESSING.customerUidPrefix,
        STATEMENT_PROCESSING.customerUidPad,
      );
    }

    const checkCell = row.getCell(checkRunCol);
    const hasFormula =
      typeof checkCell.value === 'object' && checkCell.value !== null && 'formula' in checkCell.value;
    if (!hasFormula) {
      const current = cellDateValue(checkCell.value);
      if (current) {
        checkCell.value = addOneDay(current);
      }
    }

    // Extract does not evaluate Excel formulas. Template Net/Tax are often
    // formula-only with no cached result → blank on ingest. Materialize numbers.
    const gross = cellNumericValue(row.getCell(grossCol).value);
    if (Number.isFinite(gross)) {
      let tax = cellNumericValue(row.getCell(taxCol).value);
      if (!Number.isFinite(tax)) {
        tax = Math.round(gross * 0.12 * 100) / 100;
      }
      let net = cellNumericValue(row.getCell(netCol).value);
      if (!Number.isFinite(net)) {
        net = Math.round(gross * 0.88 * 100) / 100;
      }
      row.getCell(taxCol).value = tax;
      row.getCell(netCol).value = net;
    }
  }

  // Module requirement: exactly one data row with a unique Customer UID.
  // Remove trailing data rows so the generated file has a single line item.
  if (sheet.rowCount > 2) {
    sheet.spliceRows(3, sheet.rowCount - 2);
  }
  dataRows = 1;

  // Persist incremented UIDs back to the template so the next run advances again.
  await wb.xlsx.writeFile(templatePath);

  const stamp = Date.now();
  const fileName = `StatementProcessing-Valid-${stamp}.xlsx`;
  const absolutePath = path.join(STATEMENT_PROCESSING.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  const prepared = readPreparedData(sheet, columns, stamp);
  prepared.absolutePath = absolutePath;
  prepared.fileName = fileName;
  prepared.recordCount = dataRows;
  return prepared;
}

/**
 * Duplicate upload — the same valid file already uploaded. Re-uses the stored
 * valid file path so the exact same content is ingested twice.
 */
export function duplicateStatementFilePath(): string {
  return getStatementProcessingPreparedFile().absolutePath;
}

/**
 * Valid commission statement as CSV — same columns/data as the base template so the
 * app can ingest the same statement via the CSV format.
 */
export async function prepareCsvStatementFile(): Promise<string> {
  const templatePath = statementProcessingTemplatePath();
  return writeCsvFromWorkbookPath(templatePath);
}

/**
 * CSV using an existing Customer UID (no +1 increment). Prefer a seeded UID from a
 * Completed upload in the same scenario; otherwise the template UID as-is.
 * Check run date is bumped and Gross/Net are written as numbers (not blank formulas).
 * Producer comp address is randomly mutated so a second run is not flagged duplicate.
 * When `sourcePath` is set (seed workbook), clone that file so CSV matches the Completed upload.
 */
export async function prepareCsvWithExistingCustomerUid(
  seededUid?: string,
  sourcePath?: string,
  options?: { rnEffectiveMonthsAgo?: number },
): Promise<{
  absolutePath: string;
  customerUid: string;
  recordCount: number;
}> {
  const workbookPath =
    sourcePath && fs.existsSync(sourcePath) ? sourcePath : statementProcessingTemplatePath();
  if (!fs.existsSync(workbookPath)) {
    throw new Error(`Statement processing workbook not found: ${workbookPath}`);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(workbookPath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Statement processing workbook has no worksheets');

  if (sheet.rowCount > 2) {
    sheet.spliceRows(3, sheet.rowCount - 2);
  }

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? 7;
  const addressCol = columns.get('producer comp address') ?? 4;
  const checkRunCol = columns.get('check run date') ?? 17;
  const grossCol = columns.get('gross compensation') ?? 13;
  const netCol = columns.get('net compensation') ?? 15;
  const premiumCol = columns.get('premium') ?? 20;
  const effectiveDateCol = columns.get('customer effective date') ?? 9;

  const row = sheet.getRow(2);
  const templateUid = String(row.getCell(uidCol).value ?? '').trim();
  const customerUid = (seededUid ?? templateUid).trim();
  if (!customerUid) {
    throw new Error('No Customer UID available for CSV — seed a Completed upload or set template UID');
  }

  row.getCell(uidCol).value = customerUid;

  // Random address tweak — same UID re-upload must not look like an identical file.
  row.getCell(addressCol).value = mutateProducerCompAddress(
    String(row.getCell(addressCol).value ?? ''),
  );

  // New check-run only — keep effective date / amounts identical to the Completed seed.
  const checkCurrent = cellDateValue(row.getCell(checkRunCol).value) ?? new Date();
  row.getCell(checkRunCol).value = addOneDay(checkCurrent);

  const premium = cellNumericValue(row.getCell(premiumCol).value) || 549;
  let gross = cellNumericValue(row.getCell(grossCol).value);
  if (!Number.isFinite(gross) || gross === 0) {
    gross = Math.round(premium * 0.1 * 100) / 100;
  }
  let net = cellNumericValue(row.getCell(netCol).value);
  if (!Number.isFinite(net)) {
    net = Math.round(gross * 0.88 * 100) / 100;
  }

  // RN (renewal) rows mirror the working SP-009 NB+RN pattern so the renewal accrual
  // reconciles: effective = today - 13 months, gross/net recomputed from premium
  // (net = Math.round(premium * 0.88 * 100) / 100). The app expects this exact RN net,
  // NOT the template's net cell (48.31) — using the latter yields Commission Mismatch.
  if (options?.rnEffectiveMonthsAgo != null) {
    const rnEffective = new Date();
    rnEffective.setUTCMonth(rnEffective.getUTCMonth() - options.rnEffectiveMonthsAgo);
    row.getCell(effectiveDateCol).value = rnEffective;
    gross = Math.round(premium * 0.1 * 100) / 100;
    net = Math.round(premium * 0.88 * 100) / 100;
  }
  row.getCell(grossCol).value = gross;
  row.getCell(netCol).value = net;

  const absolutePath = await writeFullCsvFromSheet(sheet, columns, customerUid);
  return { absolutePath, customerUid, recordCount: 1 };
}

/**
 * CSV from the already-prepared SP-001 valid file — same Customer UID and row data.
 */
export async function prepareCsvFromPreparedFile(
  prepared: StatementProcessingPreparedFile,
): Promise<string> {
  if (!prepared.absolutePath || !fs.existsSync(prepared.absolutePath)) {
    throw new Error(`Prepared statement file not found: ${prepared.absolutePath}`);
  }
  return writeCsvFromWorkbookPath(prepared.absolutePath, prepared.customerUid);
}

async function writeCsvFromWorkbookPath(
  workbookPath: string,
  forceCustomerUid?: string,
): Promise<string> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(workbookPath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Statement processing workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  return writeFullCsvFromSheet(sheet, columns, forceCustomerUid);
}

/** Export every header column from the sheet (not the reduced config subset). */
async function writeFullCsvFromSheet(
  sheet: ExcelJS.Worksheet,
  columns: Map<string, number>,
  forceCustomerUid?: string,
): Promise<string> {
  fs.mkdirSync(STATEMENT_PROCESSING.generatedDir, { recursive: true });

  if (sheet.rowCount > 2) {
    sheet.spliceRows(3, sheet.rowCount - 2);
  }

  const headerRow = sheet.getRow(1);
  const headerNames: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    headerNames.push(String(cell.value ?? '').trim());
  });
  if (headerNames.length === 0) {
    throw new Error('Statement sheet has no header columns for CSV export');
  }

  const uidCol = columns.get('customer uid') ?? 7;
  const lines: string[] = [headerNames.join(',')];
  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    const cells = headerNames.map((header) => {
      const col = columns.get(header.toLowerCase());
      if (!col) return '';
      if (header.toLowerCase() === 'customer uid' && forceCustomerUid) {
        return csvEscape(forceCustomerUid);
      }
      if (header.toLowerCase() === 'customer uid') {
        return csvEscape(String(row.getCell(uidCol).value ?? ''));
      }
      return csvEscape(formatCsvCell(row.getCell(col).value));
    });
    lines.push(cells.join(','));
  }

  const stamp = Date.now();
  const fileName = `StatementProcessing-Csv-${stamp}.csv`;
  const absolutePath = path.join(STATEMENT_PROCESSING.generatedDir, fileName);
  fs.writeFileSync(absolutePath, lines.join('\n'), 'utf8');
  registerGeneratedFile(absolutePath);
  return absolutePath;
}

function formatCsvCell(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value !== null && 'result' in value) {
    return formatCsvCell((value as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
  }
  return String(value);
}

function csvEscape(raw: string): string {
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

const ADDRESS_MUTATE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomChars(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ADDRESS_MUTATE_CHARS[Math.floor(Math.random() * ADDRESS_MUTATE_CHARS.length)];
  }
  return out;
}

/** Remove a random substring and append random chars — avoids duplicate-file detection. */
function mutateProducerCompAddress(current: string): string {
  const trimmed = String(current ?? '').trim();
  if (!trimmed) return `Addr-${randomChars(8)}`;
  const removeCount = Math.min(3, Math.max(1, Math.floor(trimmed.length / 4)));
  const removeAt = Math.floor(Math.random() * Math.max(1, trimmed.length - removeCount));
  const shortened = trimmed.slice(0, removeAt) + trimmed.slice(removeAt + removeCount);
  return `${shortened}${randomChars(4 + Math.floor(Math.random() * 4))}`;
}

/**
 * Mutate Producer comp address on the prepared workbook in place: remove a random
 * substring and append random chars. Customer UID and other fields stay unchanged.
 */
export async function mutatePreparedFileAddress(
  prepared: StatementProcessingPreparedFile,
): Promise<StatementProcessingPreparedFile> {
  if (!prepared.absolutePath || !fs.existsSync(prepared.absolutePath)) {
    throw new Error(`Prepared statement file not found: ${prepared.absolutePath}`);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(prepared.absolutePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Prepared statement workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const addressCol = columns.get('producer comp address') ?? 4;
  const uidCol = columns.get('customer uid') ?? 7;

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;

    // Keep Customer UID identical to the prepared SP-001-style file.
    row.getCell(uidCol).value = prepared.customerUid;

    const addressCell = row.getCell(addressCol);
    addressCell.value = mutateProducerCompAddress(String(addressCell.value ?? ''));
  }

  await wb.xlsx.writeFile(prepared.absolutePath);
  return prepared;
}

/**
 * Large commission statement (1000+ records) — replicates the template's row pattern
 * with a unique Customer UID per row. Not persisted back to the base template.
 */
export async function prepareLargeStatementFile(rowCount = 1000): Promise<{
  absolutePath: string;
  fileName: string;
  recordCount: number;
}> {
  const templatePath = statementProcessingTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Statement processing template not found: ${templatePath}`);
  }

  fs.mkdirSync(STATEMENT_PROCESSING.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Statement processing template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? 7;
  const premiumCol = columns.get('premium') ?? 20;
  const grossCol = columns.get('gross compensation') ?? 13;
  const netCol = columns.get('net compensation') ?? 15;
  const checkRunCol = columns.get('check run date') ?? 17;
  const stateCol = columns.get('customer contract state') ?? 10;

  const template = sheet.getRow(2);
  const stamp = Date.now();
  const basePremium = cellNumericValue(template.getCell(premiumCol).value) || 549;
  const checkRunDate = cellDateValue(template.getCell(checkRunCol).value) ?? new Date();
  const state = String(template.getCell(stateCol).value ?? '').trim();

  for (let i = 0; i < rowCount; i++) {
    const row = sheet.getRow(i + 2);
    template.eachCell({ includeEmpty: false }, (cell, col) => {
      row.getCell(col).value = cell.value;
    });
    row.getCell(uidCol).value = `SMK-LARGE-${stamp}-${String(i + 1).padStart(6, '0')}`;
    row.getCell(grossCol).value = Math.round(basePremium * 0.1 * 100) / 100;
    row.getCell(netCol).value = Math.round(basePremium * 0.88 * 100) / 100;
    row.getCell(checkRunCol).value = checkRunDate;
    if (i % 3 === 1) {
      row.getCell(stateCol).value = 'TX';
    } else if (i % 3 === 2) {
      row.getCell(stateCol).value = 'CA';
    } else {
      row.getCell(stateCol).value = state;
    }
  }

  const fileName = `StatementProcessing-Large-${stamp}.xlsx`;
  const absolutePath = path.join(STATEMENT_PROCESSING.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  return { absolutePath, fileName, recordCount: rowCount };
}

/**
 * Missing mandatory columns — blanks the Customer UID (mandatory) on every data row
 * so extract processing flags the statement. Not persisted back to the template.
 */
export async function prepareMissingColumnsStatementFile(): Promise<string> {
  const templatePath = statementProcessingTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Statement processing template not found: ${templatePath}`);
  }

  fs.mkdirSync(STATEMENT_PROCESSING.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Statement processing template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? 7;

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    row.getCell(uidCol).value = null;
  }

  const stamp = Date.now();
  const fileName = `StatementProcessing-MissingColumns-${stamp}.xlsx`;
  const absolutePath = path.join(STATEMENT_PROCESSING.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);
  return absolutePath;
}

/**
 * Unsupported format — a plain text file masquerading as a statement upload.
 */
export function prepareInvalidFormatFile(): string {
  fs.mkdirSync(STATEMENT_PROCESSING.generatedDir, { recursive: true });
  const stamp = Date.now();
  const absolutePath = path.join(
    STATEMENT_PROCESSING.generatedDir,
    `StatementProcessing-Invalid-${stamp}.txt`,
  );
  fs.writeFileSync(
    absolutePath,
    'This is not a valid commission statement file format.',
    'utf8',
  );
  registerGeneratedFile(absolutePath);
  return absolutePath;
}

/**
 * Partial reconciliation — 1 NB (new UID) + 1 RN (seeded UID) + 1 chargeback
 * (seeded UID, Chargeback amt / Gross+Net 0). Chargeback row is the unmatched
 * exception; NB+RN match. Requires a previously Completed Customer UID.
 */
export async function preparePartialReconciliationFile(seededUid: string): Promise<{
  absolutePath: string;
  fileName: string;
  recordCount: number;
  invalidCount: number;
  matchedCount: number;
}> {
  if (!seededUid.trim()) {
    throw new Error('Partial reconciliation requires a seeded Customer UID from a Completed upload');
  }

  const templatePath = statementProcessingTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Statement processing template not found: ${templatePath}`);
  }

  fs.mkdirSync(STATEMENT_PROCESSING.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Statement processing template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? 7;
  const grossCol = columns.get('gross compensation') ?? 13;
  const netCol = columns.get('net compensation') ?? 15;
  const premiumCol = columns.get('premium') ?? 20;
  const effectiveDateCol = columns.get('customer effective date') ?? 9;
  const checkRunCol = columns.get('check run date') ?? 17;

  // Ensure a Chargeback column exists (U65 happy-flow template may omit it).
  let chargebackCol = columns.get('chargeback');
  if (!chargebackCol) {
    chargebackCol = (sheet.columnCount || 20) + 1;
    sheet.getRow(1).getCell(chargebackCol).value = 'Chargeback';
  }

  const template = sheet.getRow(2);
  const stamp = Date.now();
  const basePremium = cellNumericValue(template.getCell(premiumCol).value) || 549;
  const baseGross = Math.round(basePremium * 0.1 * 100) / 100;
  const baseNet = Math.round(baseGross * 0.88 * 100) / 100;
  const today = new Date();
  const nbEffective = new Date(today.getTime());
  nbEffective.setUTCMonth(nbEffective.getUTCMonth() - 1);
  const rnEffective = new Date(today.getTime());
  rnEffective.setUTCMonth(rnEffective.getUTCMonth() - 13);
  const checkRunDate = addOneDay(
    cellDateValue(template.getCell(checkRunCol).value) ?? today,
  );

  const rows: Array<{
    uid: string;
    effective: Date;
    gross: number;
    net: number;
    chargeback: number;
  }> = [
    {
      // Proper agency UID pattern (not IANG-NB-stamp) so extract classifies as NB cleanly.
      uid: incrementUid(
        seededUid,
        STATEMENT_PROCESSING.customerUidPrefix,
        STATEMENT_PROCESSING.customerUidPad,
      ),
      effective: nbEffective,
      gross: baseGross,
      net: baseNet,
      chargeback: 0,
    },
    {
      uid: seededUid,
      effective: rnEffective,
      gross: baseGross,
      net: baseNet,
      chargeback: 0,
    },
    {
      uid: seededUid,
      effective: rnEffective,
      gross: 0,
      net: 0,
      chargeback: baseGross,
    },
  ];

  rows.forEach((spec, i) => {
    const row = sheet.getRow(i + 2);
    template.eachCell({ includeEmpty: false }, (cell, col) => {
      row.getCell(col).value = cell.value;
    });
    row.getCell(uidCol).value = spec.uid;
    row.getCell(effectiveDateCol).value = spec.effective;
    row.getCell(grossCol).value = spec.gross;
    row.getCell(netCol).value = spec.net;
    row.getCell(chargebackCol!).value = spec.chargeback;
    row.getCell(checkRunCol).value = checkRunDate;
  });

  // Drop any leftover template rows beyond the 3 we wrote.
  if (sheet.rowCount > 4) {
    sheet.spliceRows(5, sheet.rowCount - 4);
  }

  const fileName = `StatementProcessing-Partial-${stamp}.xlsx`;
  const absolutePath = path.join(STATEMENT_PROCESSING.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  return {
    absolutePath,
    fileName,
    recordCount: 3,
    invalidCount: 1,
    matchedCount: 2,
  };
}

/**
 * State variants — one policy per state (TX, CA, IL). Reuses the template's existing
 * numeric suffix (no random stamp UIDs) and swaps the embedded state code so IL can
 * renew against the last Completed template UID while TX/CA stay on the same pad.
 */
export async function prepareStateVariantsFile(): Promise<string> {
  const templatePath = statementProcessingTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Statement processing template not found: ${templatePath}`);
  }

  fs.mkdirSync(STATEMENT_PROCESSING.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Statement processing template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? 7;
  const stateCol = columns.get('customer contract state') ?? 10;
  const grossCol = columns.get('gross compensation') ?? 13;
  const netCol = columns.get('net compensation') ?? 15;
  const premiumCol = columns.get('premium') ?? 20;
  const checkRunCol = columns.get('check run date') ?? 17;

  const template = sheet.getRow(2);
  const stamp = Date.now();
  const basePremium = cellNumericValue(template.getCell(premiumCol).value) || 549;
  const baseUid = String(template.getCell(uidCol).value ?? '').trim();
  if (!baseUid) {
    throw new Error('Template has empty Customer UID — cannot prepare state variants');
  }
  const checkRunDate =
    addOneDay(cellDateValue(template.getCell(checkRunCol).value) ?? new Date());
  const states = ['TX', 'CA', 'IL'] as const;

  states.forEach((state, i) => {
    const row = sheet.getRow(i + 2);
    template.eachCell({ includeEmpty: false }, (cell, col) => {
      row.getCell(col).value = cell.value;
    });
    // IANG12370001IL039 → IANG12370001TX039 (keep existing numeric pad; swap state).
    row.getCell(uidCol).value = baseUid.replace(/IL(?=\d+$)/i, state);
    row.getCell(stateCol).value = state;
    row.getCell(grossCol).value = Math.round(basePremium * 0.1 * 100) / 100;
    row.getCell(netCol).value = Math.round(basePremium * 0.88 * 100) / 100;
    row.getCell(checkRunCol).value = checkRunDate;
  });

  if (sheet.rowCount > 4) {
    sheet.spliceRows(5, sheet.rowCount - 4);
  }

  const fileName = `StatementProcessing-States-${stamp}.xlsx`;
  const absolutePath = path.join(STATEMENT_PROCESSING.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);
  return absolutePath;
}

/**
 * Transaction type variants — one NB (new UID) + one RN using a Customer UID
 * that was already processed (seeded). Exactly one NB → auto-reconcile to Completed.
 */
export async function prepareTransactionTypeFile(seededUid: string): Promise<string> {
  if (!seededUid.trim()) {
    throw new Error('NB/RN file requires a seeded Customer UID from a Completed upload');
  }

  const templatePath = statementProcessingTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Statement processing template not found: ${templatePath}`);
  }

  fs.mkdirSync(STATEMENT_PROCESSING.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Statement processing template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? 7;
  const effectiveDateCol = columns.get('customer effective date') ?? 9;
  const grossCol = columns.get('gross compensation') ?? 13;
  const netCol = columns.get('net compensation') ?? 15;
  const premiumCol = columns.get('premium') ?? 20;

  const template = sheet.getRow(2);
  const stamp = Date.now();
  const basePremium = cellNumericValue(template.getCell(premiumCol).value) || 549;
  const today = new Date();
  const nbEffective = new Date(today.getTime());
  nbEffective.setUTCMonth(nbEffective.getUTCMonth() - 1);
  const rnEffective = new Date(today.getTime());
  rnEffective.setUTCMonth(rnEffective.getUTCMonth() - 13);

  const rows: Array<{ uid: string; effective: Date }> = [
    {
      uid: incrementUid(
        seededUid,
        STATEMENT_PROCESSING.customerUidPrefix,
        STATEMENT_PROCESSING.customerUidPad,
      ),
      effective: nbEffective,
    },
    { uid: seededUid, effective: rnEffective },
  ];

  const checkRunCol = columns.get('check run date') ?? 17;
  const checkRunDate =
    addOneDay(cellDateValue(template.getCell(checkRunCol).value) ?? today);

  rows.forEach(({ uid, effective }, i) => {
    const row = sheet.getRow(i + 2);
    template.eachCell({ includeEmpty: false }, (cell, col) => {
      row.getCell(col).value = cell.value;
    });
    row.getCell(uidCol).value = uid;
    row.getCell(effectiveDateCol).value = effective;
    row.getCell(grossCol).value = Math.round(basePremium * 0.1 * 100) / 100;
    row.getCell(netCol).value = Math.round(basePremium * 0.88 * 100) / 100;
    row.getCell(checkRunCol).value = checkRunDate;
  });

  if (sheet.rowCount > 3) {
    sheet.spliceRows(4, sheet.rowCount - 3);
  }

  const fileName = `StatementProcessing-NbRn-${stamp}.xlsx`;
  const absolutePath = path.join(STATEMENT_PROCESSING.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);
  return absolutePath;
}
