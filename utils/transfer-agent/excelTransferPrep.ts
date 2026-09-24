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

function incrementCustomerUid(value: string): string {
  const match = value.match(/^(.*?)(\d+)([^\d]*)$/);
  if (!match) {
    const numeric = Number.parseInt(value.replace(/\D/g, ''), 10);
    if (Number.isFinite(numeric)) return String(numeric + 1);
    return `${value}-1`;
  }
  const [, prefix, digits, suffix] = match;
  const next = String(Number.parseInt(digits, 10) + 1).padStart(digits.length, '0');
  return `${prefix}${next}${suffix}`;
}

export type PreparedTransferFile = PreparedStatementFile & {
  policyNumber: string;
  customerUid: string;
};

/**
 * Clone the transfer agent main template for upload:
 * - increment Customer UID on each data row
 * - retain policy number from the main template on every row
 * - persist the new Customer UID back into the main template file
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

  const firstName = String(firstDataRow.getCell(firstNameCol).value ?? '').trim();
  const lastName = String(firstDataRow.getCell(lastNameCol).value ?? '').trim();
  const npn = String(firstDataRow.getCell(npnCol).value ?? '').trim();
  const carrierName = String(firstDataRow.getCell(carrierCol).value ?? '').trim();
  const policyNumber = String(firstDataRow.getCell(policyCol).value ?? '').trim();

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

  let latestUid = String(firstDataRow.getCell(uidCol).value ?? '').trim();
  const stamp = Date.now();

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;

    const uidCell = row.getCell(uidCol);
    const currentUid = String(uidCell.value ?? '').trim();
    if (currentUid) {
      latestUid = currentUid+'-'+stamp.toString();
      uidCell.value = latestUid;
    }

    row.getCell(policyCol).value = policyNumber;
  }

  const fileName = `TransferAgent-${stamp}.xlsx`;
  const absolutePath = path.join(TRANSFER_SHEET.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  // Stopping here to not overwrite the main template file with the new UID and policy number
  
  // const mainWb = new ExcelJS.Workbook();
  // await mainWb.xlsx.readFile(templatePath);
  // const mainSheet = mainWb.worksheets[0];
  // if (mainSheet) {
  //   const mainRow = mainSheet.getRow(2);
  //   if (mainRow.hasValues && latestUid) {
  //     mainRow.getCell(uidCol).value = latestUid;
  //     mainRow.getCell(policyCol).value = policyNumber;
  //     await mainWb.xlsx.writeFile(templatePath);
  //   }
  // }

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
 * - retain policy number from the template
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

  const columns = headerColumnMap(sheet);
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

  const carrierName = String(firstDataRow.getCell(carrierCol).value ?? '').trim();
  const policyNumber = String(firstDataRow.getCell(policyCol).value ?? '').trim();
  const customerUid = String(firstDataRow.getCell(uidCol).value ?? '').trim();
  if (!policyNumber) {
    throw new Error('Policy number is missing in transfer agent main template');
  }
  if (!customerUid) {
    throw new Error('Customer UID is missing in transfer agent main template');
  }

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
