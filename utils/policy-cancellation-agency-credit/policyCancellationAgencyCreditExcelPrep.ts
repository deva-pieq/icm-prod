import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import {
  POLICY_CANCELLATION_AGENCY_CREDIT,
  policyCancellationAgencyCreditTemplatePath,
  policyCancellationAgencyCreditRecoveryTemplatePath,
  policyCancellationAgencyCreditChargebackTemplatePath,
} from '../../test-data/policy-cancellation-agency-credit/validatePolicyCancellationAgencyCredit';
import { registerGeneratedFile } from '../generatedFileCleanup';

export type PolicyCancellationAgencyCreditPreparedFile = {
  absolutePath: string;
  fileName: string;
  carrierName: string;
  customerUid: string;
  agentId: string;
  productName: string;
};

function cleanGeneratedDir(): void {
  const dir = POLICY_CANCELLATION_AGENCY_CREDIT.generatedDir;
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
 * Read the policy-cancellation agency-credit Excel template, increment the
 * Customer UID by +1 on every data row, extract agent ID and product name
 * alias, then save a timestamped copy for upload AND persist the incremented
 * UIDs back to the template so the next run creates a New Policy (not a renewal).
 */
export async function preparePolicyCancellationAgencyCreditStatementFile(): Promise<PolicyCancellationAgencyCreditPreparedFile> {
  const templatePath = policyCancellationAgencyCreditTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Policy cancellation agency credit template not found: ${templatePath}`);
  }

  cleanGeneratedDir();
  fs.mkdirSync(POLICY_CANCELLATION_AGENCY_CREDIT.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Policy cancellation agency credit template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? columns.get('customeruid');
  const agentIdCol =
    columns.get('selling agent npn') ?? columns.get('agent id') ?? columns.get('agentid');
  const productNameCol =
    columns.get('scale name/adjustment description') ?? columns.get('scalenamedescription') ??
    columns.get('product name alias') ?? columns.get('productnamealias') ?? columns.get('product name');

  if (!uidCol) {
    throw new Error(`Column "Customer UID" not found in policy cancellation agency credit template: ${templatePath}`);
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
        uidCell.value = `${POLICY_CANCELLATION_AGENCY_CREDIT.customerUidPrefix}1`;
      }
    }

    if (!extractedAgentId && agentIdCol) {
      extractedAgentId = String(row.getCell(agentIdCol).value ?? '').trim();
    }

    if (!extractedProductName && productNameCol) {
      extractedProductName = String(row.getCell(productNameCol).value ?? '').trim();
    }
  }

  const fileName = `PolicyCancellationAgencyCredit-${stamp}.xlsx`;
  const absolutePath = path.join(POLICY_CANCELLATION_AGENCY_CREDIT.generatedDir, fileName);
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
    absolutePath, fileName, carrierName: POLICY_CANCELLATION_AGENCY_CREDIT.carrierName,
    customerUid, agentId: extractedAgentId, productName: extractedProductName,
  };
}

export async function preparePolicyCancellationAgencyCreditRecoveryFile(
  policyNumber: string,
  timestamp: number,
): Promise<PolicyCancellationAgencyCreditPreparedFile> {
  const templatePath = policyCancellationAgencyCreditRecoveryTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Policy cancellation agency credit recovery template not found: ${templatePath}`);
  }

  fs.mkdirSync(POLICY_CANCELLATION_AGENCY_CREDIT.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Policy cancellation agency credit recovery template has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? columns.get('customeruid');
  const checkRunCol = columns.get('check run date');
  if (!uidCol) {
    throw new Error(`Column "Customer UID" not found in policy cancellation agency credit recovery template: ${templatePath}`);
  }

  let dataRowIndex = 0;
  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    row.getCell(uidCol).value = policyNumber;
    // Keep the template's gross so each recovery row matches the advance's
    // expected monthly recovery amount — an altered gross is flagged
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

  const fileName = `policy-cancel-agency-credit-recovery-${timestamp}.xlsx`;
  const absolutePath = path.join(POLICY_CANCELLATION_AGENCY_CREDIT.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  return {
    absolutePath, fileName, carrierName: POLICY_CANCELLATION_AGENCY_CREDIT.carrierName,
    customerUid: policyNumber, agentId: '', productName: '',
  };
}

export async function preparePolicyCancellationAgencyCreditChargebackFile(
  policyNumber: string,
  timestamp: number,
): Promise<PolicyCancellationAgencyCreditPreparedFile> {
  const templatePath = policyCancellationAgencyCreditChargebackTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Policy cancellation agency credit chargeback template not found: ${templatePath}`);
  }

  fs.mkdirSync(POLICY_CANCELLATION_AGENCY_CREDIT.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Policy cancellation agency credit chargeback template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const uidCol = columns.get('customer uid') ?? columns.get('customeruid');
  if (!uidCol) {
    throw new Error(`Column "Customer UID" not found in policy cancellation agency credit chargeback template: ${templatePath}`);
  }

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    row.getCell(uidCol).value = policyNumber;
  }

  // Distinct check-run date keeps this batch from colliding with the advance or
  // recovery uploads for the same policy.
  shiftCheckRunDates(sheet, columns, 4);

  const fileName = `PolicyCancellation-AgencyCredit-Chargeback-${timestamp}.xlsx`;
  const absolutePath = path.join(POLICY_CANCELLATION_AGENCY_CREDIT.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  return {
    absolutePath, fileName, carrierName: POLICY_CANCELLATION_AGENCY_CREDIT.carrierName,
    customerUid: policyNumber, agentId: '', productName: '',
  };
}
