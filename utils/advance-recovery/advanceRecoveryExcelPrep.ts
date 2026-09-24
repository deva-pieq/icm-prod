import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import {
  ADVANCE_RECOVERY,
  advanceRecoveryTemplatePath,
  advanceRecoveryRecoveryTemplatePath,
} from '../../test-data/advance-recovery/validateAdvanceRecovery';
import { registerGeneratedFile } from '../generatedFileCleanup';

export type AdvanceRecoveryPreparedFile = {
  absolutePath: string;
  fileName: string;
  carrierName: string;
  customerUid: string;
  agentId: string;
  productName: string;
};

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

/**
 * Read the advance-recovery Excel template, increment the Customer UID by +1
 * on every data row, extract agent ID and product name alias, then save
 * a timestamped copy for upload.
 */
export async function prepareAdvanceRecoveryStatementFile(): Promise<AdvanceRecoveryPreparedFile> {
  const templatePath = advanceRecoveryTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Advance-recovery template not found: ${templatePath}`);
  }

  fs.mkdirSync(ADVANCE_RECOVERY.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Advance-recovery template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? columns.get('customeruid');
  const agentIdCol =
    columns.get('agent id') ?? columns.get('agentid') ?? columns.get('selling agent npn') ?? columns.get('sellingagentnpn');
  const productNameCol =
    columns.get('product name alias') ?? columns.get('productnamealias') ?? columns.get('product name') ??
    columns.get('scale name/adjustment description') ?? columns.get('scalenamedescription') ?? columns.get('scale name');

  if (!uidCol) {
    throw new Error(`Column "Customer UID" not found in advance-recovery template: ${templatePath}`);
  }

  const stamp = Date.now();
  let extractedAgentId = '';
  let extractedProductName = '';

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;

    // Increment Customer UID by +1 — preserves the template's prefix and zero-padding
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
        uidCell.value = `${ADVANCE_RECOVERY.customerUidPrefix}1`;
      }
    }

    // Extract agent ID from first data row
    if (!extractedAgentId && agentIdCol) {
      extractedAgentId = String(row.getCell(agentIdCol).value ?? '').trim();
    }

    // Extract product name from first data row
    if (!extractedProductName && productNameCol) {
      extractedProductName = String(row.getCell(productNameCol).value ?? '').trim();
    }
  }

  // Save timestamped copy
  const fileName = `[MLB]AdvanceStatement-AR-${stamp}.xlsx`;
  const absolutePath = path.join(ADVANCE_RECOVERY.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  // Also persist incremented UIDs back to template for next run
  await wb.xlsx.writeFile(templatePath);

  const customerUid = String(
    sheet.getRow(2).getCell(uidCol).value ?? '',
  ).trim();

  return {
    absolutePath,
    fileName,
    carrierName: ADVANCE_RECOVERY.carrierName,
    customerUid,
    agentId: extractedAgentId,
    productName: extractedProductName,
  };
}

/**
 * Read the advance-recovery recovery template, replace the Customer UID with
 * the provided policy number, and save a timestamped copy for upload.
 */
export async function prepareAdvanceRecoveryRecoveryFile(
  policyNumber: string,
  timestamp: number,
): Promise<AdvanceRecoveryPreparedFile> {
  const templatePath = advanceRecoveryRecoveryTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Advance-recovery recovery template not found: ${templatePath}`);
  }

  fs.mkdirSync(ADVANCE_RECOVERY.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Advance-recovery recovery template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? columns.get('customeruid');

  if (!uidCol) {
    throw new Error(
      `Column "Customer UID" not found in advance-recovery recovery template: ${templatePath}`,
    );
  }

  // Replace Customer UID with the stored policy number on every data row
  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;

    const uidCell = row.getCell(uidCol);
    uidCell.value = policyNumber;
  }

  // Save timestamped copy
  const fileName = `[MLB]AdvanceStatement-AR[Recovery]-${timestamp}.xlsx`;
  const absolutePath = path.join(ADVANCE_RECOVERY.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  return {
    absolutePath,
    fileName,
    carrierName: ADVANCE_RECOVERY.carrierName,
    customerUid: policyNumber,
    agentId: '',
    productName: '',
  };
}
