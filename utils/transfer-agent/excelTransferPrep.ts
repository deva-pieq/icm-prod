import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import { TRANSFER_SHEET, transferSheetTemplatePath } from '../../test-data/transfer-agent/transferSheet';
import type { PreparedStatementFile } from '../excelStatementPrep';
import { registerGeneratedFile } from '../generatedFileCleanup';

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

/** Keep exactly one data row — duplicate rows cause Extract Error. */
function keepSingleDataRow(sheet: ExcelJS.Worksheet): void {
  if (sheet.rowCount > 2) {
    sheet.spliceRows(3, sheet.rowCount - 2);
  }
}

/**
 * Increment trailing digits (preserve prefix + padding).
 * Strips corrupted ms-stamp suffixes left by older prep (`UID-1790…-1790…`).
 */
function incrementCustomerUid(value: string): string {
  const stripped = value.replace(/(-\d{13})+$/g, '').trim();
  const base = stripped || 'TRAN001A0001';
  const match = base.match(/^(.*?)(\d+)$/);
  if (!match) return `${base}1`;
  const [, prefix, digits] = match;
  const next = String(Number.parseInt(digits, 10) + 1).padStart(digits.length, '0');
  return `${prefix}${next}`;
}

function cellPlain(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object' && 'result' in (value as object)) {
    return String((value as { result?: unknown }).result ?? '').trim();
  }
  if (typeof value === 'object' && 'richText' in (value as object)) {
    return ((value as { richText: Array<{ text: string }> }).richText ?? [])
      .map((t) => t.text)
      .join('')
      .trim();
  }
  return String(value).trim();
}

export type PreparedTransferFile = PreparedStatementFile & {
  policyNumber: string;
  customerUid: string;
};

/**
 * Clone the transfer agent main template for upload:
 * - single data row
 * - increment Customer UID (+1) — never append timestamps
 * - persist new UID back to template for renewal reuse
 */
export async function prepareTransferAgentUploadFile(): Promise<PreparedTransferFile> {
  const templatePath = transferSheetTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Transfer agent template not found: ${templatePath}`);
  }

  fs.mkdirSync(TRANSFER_SHEET.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Template workbook has no worksheets');
  keepSingleDataRow(sheet);

  const columns = headerColumnMap(sheet);
  const firstNameCol = columns.get('selling agent first name') ?? 2;
  const lastNameCol = columns.get('selling agent last name') ?? 1;
  const npnCol = columns.get('selling agent npn') ?? 3;
  const uidCol = columns.get('customer uid') ?? 7;
  const carrierCol = columns.get('carrier name') ?? 19;
  const policyCol =
    columns.get(TRANSFER_SHEET.policyNumberColumn) ??
    columns.get('scale name/adjustment description') ??
    16;

  const firstDataRow = sheet.getRow(2);
  if (!firstDataRow.hasValues) {
    throw new Error('Transfer agent template has no data rows');
  }

  const firstName = cellPlain(firstDataRow.getCell(firstNameCol).value);
  const lastName = cellPlain(firstDataRow.getCell(lastNameCol).value);
  const npn = cellPlain(firstDataRow.getCell(npnCol).value);
  const carrierName = cellPlain(firstDataRow.getCell(carrierCol).value);
  const policyNumber = cellPlain(firstDataRow.getCell(policyCol).value);

  const expected = TRANSFER_SHEET.transferAgent;
  if (firstName !== expected.firstName) {
    throw new Error(`Expected first name "${expected.firstName}", found "${firstName}"`);
  }
  if (lastName !== expected.lastName) {
    throw new Error(`Expected last name "${expected.lastName}", found "${lastName}"`);
  }
  if (npn !== expected.npn) {
    throw new Error(`Expected NPN "${expected.npn}", found "${npn}"`);
  }
  if (!carrierName) {
    throw new Error('Carrier name is missing in transfer agent template');
  }
  if (!policyNumber) {
    throw new Error('Policy number is missing in transfer agent main template');
  }

  const currentUid = cellPlain(firstDataRow.getCell(uidCol).value);
  const latestUid = incrementCustomerUid(currentUid);
  firstDataRow.getCell(uidCol).value = latestUid;
  firstDataRow.getCell(policyCol).value = policyNumber;
  // NPN as plain string — numeric cells can confuse extract
  firstDataRow.getCell(npnCol).value = expected.npn;

  const stamp = Date.now();
  const fileName = `TransferAgent-${stamp}.xlsx`;
  const absolutePath = path.join(TRANSFER_SHEET.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  // Persist incremented UID so renewal prep reuses the NB UID.
  const mainWb = new ExcelJS.Workbook();
  await mainWb.xlsx.readFile(templatePath);
  const mainSheet = mainWb.worksheets[0];
  if (mainSheet) {
    keepSingleDataRow(mainSheet);
    const mainRow = mainSheet.getRow(2);
    if (mainRow.hasValues) {
      mainRow.getCell(uidCol).value = latestUid;
      mainRow.getCell(policyCol).value = policyNumber;
      mainRow.getCell(npnCol).value = expected.npn;
    }
    await mainWb.xlsx.writeFile(templatePath);
  }

  return {
    absolutePath,
    fileName,
    carrierName: carrierName || TRANSFER_SHEET.carrierName,
    policyNumber,
    customerUid: latestUid,
  };
}

/**
 * Clone transfer agent template for renewal upload:
 * - keep existing Customer UID (no increment) so app treats rows as renewal
 * - single data row only
 */
export async function prepareTransferAgentRenewalUploadFile(): Promise<PreparedTransferFile> {
  const templatePath = transferSheetTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Transfer agent template not found: ${templatePath}`);
  }

  fs.mkdirSync(TRANSFER_SHEET.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Template workbook has no worksheets');
  keepSingleDataRow(sheet);

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? 7;
  const npnCol = columns.get('selling agent npn') ?? 3;
  const carrierCol = columns.get('carrier name') ?? 19;
  const policyCol =
    columns.get(TRANSFER_SHEET.policyNumberColumn) ??
    columns.get('scale name/adjustment description') ??
    16;

  const firstDataRow = sheet.getRow(2);
  if (!firstDataRow.hasValues) {
    throw new Error('Transfer agent template has no data rows');
  }

  const carrierName = cellPlain(firstDataRow.getCell(carrierCol).value);
  const policyNumber = cellPlain(firstDataRow.getCell(policyCol).value);
  let customerUid = cellPlain(firstDataRow.getCell(uidCol).value).replace(/(-\d{13})+$/g, '');
  if (!policyNumber) {
    throw new Error('Policy number is missing in transfer agent main template');
  }
  if (!customerUid) {
    throw new Error('Customer UID is missing in transfer agent main template');
  }
  firstDataRow.getCell(uidCol).value = customerUid;
  firstDataRow.getCell(npnCol).value = TRANSFER_SHEET.transferAgent.npn;

  const stamp = Date.now();
  const fileName = `TransferAgent-Renewal-${stamp}.xlsx`;
  const absolutePath = path.join(TRANSFER_SHEET.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  return {
    absolutePath,
    fileName,
    carrierName: carrierName || TRANSFER_SHEET.carrierName,
    policyNumber,
    customerUid,
  };
}
