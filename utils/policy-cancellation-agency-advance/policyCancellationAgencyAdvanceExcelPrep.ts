import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import {
  POLICY_CANCELLATION_ADVANCE,
  policyCancellationTemplatePath,
  policyCancellationRecoveryTemplatePath,
  policyCancellationChargebackTemplatePath,
} from '../../test-data/policy-cancellation-agency-advance/validatePolicyCancellationAgencyAdvance';
import { registerGeneratedFile } from '../generatedFileCleanup';

export type PolicyCancellationPreparedFile = {
  absolutePath: string;
  fileName: string;
  carrierName: string;
  customerUid: string;
  agentId: string;
  productName: string;
};

function cleanGeneratedDir(): void {
  const dir = POLICY_CANCELLATION_ADVANCE.generatedDir;
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

/**
 * Shift the "Check run date" on every data row by the given month offset.
 * The recovery/cancellation templates share the same check-run date as the
 * advance template; without a distinct date the app flags the upload as a
 * duplicate of the already-processed advance batch.
 */
function shiftCheckRunDates(sheet: ExcelJS.Worksheet, columns: Map<string, number>, monthOffset: number): void {
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
 * Read the policy-cancellation Excel template, increment the Customer UID by +1
 * on every data row, extract agent ID and product name alias, then save a
 * timestamped copy for upload AND persist the incremented UIDs back to the
 * template so the next run creates a New Policy (not a renewal).
 */
export async function preparePolicyCancellationStatementFile(): Promise<PolicyCancellationPreparedFile> {
  const templatePath = policyCancellationTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Policy cancellation template not found: ${templatePath}`);
  }

  cleanGeneratedDir();
  fs.mkdirSync(POLICY_CANCELLATION_ADVANCE.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Policy cancellation template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? columns.get('customeruid');
  const agentIdCol =
    columns.get('agent id') ?? columns.get('agentid') ?? columns.get('selling agent npn') ?? columns.get('sellingagentnpn');
  const productNameCol =
    columns.get('product name alias') ?? columns.get('productnamealias') ?? columns.get('product name') ??
    columns.get('scale name/adjustment description') ?? columns.get('scalenamedescription') ?? columns.get('scale name');

  if (!uidCol) {
    throw new Error(`Column "Customer UID" not found in policy cancellation template: ${templatePath}`);
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
        uidCell.value = `${POLICY_CANCELLATION_ADVANCE.customerUidPrefix}1`;
      }
    }

    if (!extractedAgentId && agentIdCol) {
      extractedAgentId = String(row.getCell(agentIdCol).value ?? '').trim();
    }

    if (!extractedProductName && productNameCol) {
      extractedProductName = String(row.getCell(productNameCol).value ?? '').trim();
    }
  }

  const fileName = `PolicyCancellation-${stamp}.xlsx`;
  const absolutePath = path.join(POLICY_CANCELLATION_ADVANCE.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  // Persist incremented UIDs back to the template so the next run gets a new policy
  // (same pattern as advance-only / advance-recovery / advance-adjustment).
  await wb.xlsx.writeFile(templatePath);

  const customerUid = String(sheet.getRow(2).getCell(uidCol).value ?? '').trim();
  if (!customerUid) {
    throw new Error(`Customer UID is empty after prepare in ${absolutePath}`);
  }

  return {
    absolutePath, fileName, carrierName: POLICY_CANCELLATION_ADVANCE.carrierName,
    customerUid, agentId: extractedAgentId, productName: extractedProductName,
  };
}

export async function preparePolicyCancellationRecoveryFile(
  policyNumber: string,
  timestamp: number,
): Promise<PolicyCancellationPreparedFile> {
  const templatePath = policyCancellationRecoveryTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Policy cancellation recovery template not found: ${templatePath}`);
  }

  fs.mkdirSync(POLICY_CANCELLATION_ADVANCE.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Policy cancellation recovery template has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? columns.get('customeruid');
  const checkRunCol = columns.get('check run date');
  if (!uidCol) {
    throw new Error(`Column "Customer UID" not found in policy cancellation recovery template: ${templatePath}`);
  }

  let dataRowIndex = 0;
  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    row.getCell(uidCol).value = policyNumber;
    // Keep the template's gross (78.90) so each recovery row matches the
    // advance's expected monthly recovery amount — an altered gross is flagged
    // "Unmatched Commission Mismatch" and the upload stalls in Needs Attention.
    // Check-run dates advance month by month across the ARF schedule.
    if (checkRunCol) {
      const cell = row.getCell(checkRunCol);
      const base = cell.value instanceof Date ? new Date(cell.value.getTime()) : new Date(String(cell.value ?? ''));
      if (!Number.isNaN(base.getTime())) {
        base.setMonth(base.getMonth() + 1 + dataRowIndex);
        cell.value = base;
      }
    }
    dataRowIndex++;
  }

  const fileName = `policy-cancel-recovery-${timestamp}.xlsx`;
  const absolutePath = path.join(POLICY_CANCELLATION_ADVANCE.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  return {
    absolutePath, fileName, carrierName: POLICY_CANCELLATION_ADVANCE.carrierName,
    customerUid: policyNumber, agentId: '', productName: '',
  };
}

export async function preparePolicyCancellationChargebackFile(
  policyNumber: string,
  timestamp: number,
): Promise<PolicyCancellationPreparedFile> {
  const templatePath = policyCancellationChargebackTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Policy cancellation chargeback template not found: ${templatePath}`);
  }

  fs.mkdirSync(POLICY_CANCELLATION_ADVANCE.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Policy cancellation chargeback template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? columns.get('customeruid');
  if (!uidCol) {
    throw new Error(`Column "Customer UID" not found in policy cancellation chargeback template: ${templatePath}`);
  }

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    row.getCell(uidCol).value = policyNumber;
  }

  // Distinct check-run date keeps this batch from colliding with the advance or
  // recovery uploads for the same policy.
  shiftCheckRunDates(sheet, columns, 4);

  const fileName = `PolicyCancellation-Chargeback-${timestamp}.xlsx`;
  const absolutePath = path.join(POLICY_CANCELLATION_ADVANCE.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  return {
    absolutePath, fileName, carrierName: POLICY_CANCELLATION_ADVANCE.carrierName,
    customerUid: policyNumber, agentId: '', productName: '',
  };
}
