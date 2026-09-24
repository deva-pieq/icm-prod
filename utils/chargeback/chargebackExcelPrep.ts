import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import {
  CHARGEBACK,
  chargebackNbTemplatePath,
  chargebackRcTemplatePath,
  type ChargebackRcVariant,
} from '../../test-data/chargeback/validateChargeback';
import { registerGeneratedFile } from '../generatedFileCleanup';

export type ChargebackPreparedFile = {
  absolutePath: string;
  fileName: string;
  carrierName: string;
  customerUid: string;
  agentId: string;
  productName: string;
};

function cleanGeneratedDir(): void {
  const dir = CHARGEBACK.generatedDir;
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      fs.rmSync(path.join(dir, file), { force: true, recursive: true });
    }
  }
}

function headerColumnMap(sheet: ExcelJS.Worksheet): Map<string, number> {
  const map = new Map<string, number>();
  const headerRow = sheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const label = String(cell.value ?? '').trim().toLowerCase();
    if (label) map.set(label, col);
  });
  return map;
}

function shiftCheckRunDates(
  sheet: ExcelJS.Worksheet,
  columns: Map<string, number>,
  monthOffset: number,
): void {
  const checkRunCol = columns.get('check run date');
  if (!checkRunCol) return;
  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    const cell = row.getCell(checkRunCol);
    const value = cell.value;
    const base = value instanceof Date ? new Date(value.getTime()) : new Date(String(value ?? ''));
    if (Number.isNaN(base.getTime())) continue;
    base.setMonth(base.getMonth() + monthOffset);
    cell.value = base;
  }
}

/**
 * Read the Chargeback NB template, increment Customer UID by +1 on every data
 * row, save a timestamped copy for upload, and persist incremented UIDs back
 * to the template so the next cycle creates a new policy.
 */
export async function prepareChargebackNbFile(): Promise<ChargebackPreparedFile> {
  const templatePath = chargebackNbTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Chargeback NB template not found: ${templatePath}`);
  }

  cleanGeneratedDir();
  fs.mkdirSync(CHARGEBACK.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Chargeback NB template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? columns.get('customeruid');
  const agentIdCol =
    columns.get('selling agent npn') ??
    columns.get('sellingagentnpn') ??
    columns.get('agent id') ??
    columns.get('agentid');
  const productNameCol =
    columns.get('scale name/adjustment description') ??
    columns.get('product name alias') ??
    columns.get('product name');

  if (!uidCol) {
    throw new Error(`Column "Customer UID" not found in chargeback NB template: ${templatePath}`);
  }

  const stamp = Date.now();
  let extractedAgentId = '';
  let extractedProductName = '';

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;

    const uidCell = row.getCell(uidCol);
    const currentUid = String(uidCell.value ?? '').trim();
    if (currentUid) {
      const numMatch = currentUid.match(/^(.*?)(\d+)$/);
      if (numMatch) {
        const prefix = numMatch[1];
        const pad = numMatch[2].length;
        const nextNum = Number.parseInt(numMatch[2], 10) + 1;
        uidCell.value = `${prefix}${String(nextNum).padStart(pad, '0')}`;
      } else {
        uidCell.value = `${CHARGEBACK.customerUidPrefix}001`;
      }
    }

    if (!extractedAgentId && agentIdCol) {
      extractedAgentId = String(row.getCell(agentIdCol).value ?? '').trim();
    }
    if (!extractedProductName && productNameCol) {
      extractedProductName = String(row.getCell(productNameCol).value ?? '').trim();
    }
  }

  const fileName = `Chargeback-NB-${stamp}.xlsx`;
  const absolutePath = path.join(CHARGEBACK.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  // Persist incremented UIDs so the next cycle gets a unique Customer UID.
  await wb.xlsx.writeFile(templatePath);

  const customerUid = String(sheet.getRow(2).getCell(uidCol).value ?? '').trim();
  if (!customerUid) {
    throw new Error(`Customer UID is empty after NB prepare in ${absolutePath}`);
  }

  return {
    absolutePath,
    fileName,
    carrierName: CHARGEBACK.carrierName,
    customerUid,
    agentId: extractedAgentId,
    productName: extractedProductName,
  };
}

/**
 * Prepare an RC chargeback file using the stored PolicyNumber from NB.
 * Does NOT overwrite the NB template. Shifts check-run date to avoid duplicate batches.
 */
export async function prepareChargebackRcFile(
  variant: ChargebackRcVariant,
  policyNumber: string,
  timestamp: number,
): Promise<ChargebackPreparedFile> {
  const templatePath = chargebackRcTemplatePath(variant);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Chargeback ${variant} template not found: ${templatePath}`);
  }

  fs.mkdirSync(CHARGEBACK.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error(`Chargeback ${variant} template workbook has no worksheets`);

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? columns.get('customeruid');
  if (!uidCol) {
    throw new Error(`Column "Customer UID" not found in chargeback ${variant} template: ${templatePath}`);
  }

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    row.getCell(uidCol).value = policyNumber;
  }

  shiftCheckRunDates(sheet, columns, CHARGEBACK.rcCheckRunMonthOffset[variant]);

  const fileName = `Chargeback-${variant}-${timestamp}.xlsx`;
  const absolutePath = path.join(CHARGEBACK.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  return {
    absolutePath,
    fileName,
    carrierName: CHARGEBACK.carrierName,
    customerUid: policyNumber,
    agentId: '',
    productName: '',
  };
}
