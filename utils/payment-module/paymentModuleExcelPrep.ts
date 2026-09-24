import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import {
  PAYMENT_MODULE,
  paymentModuleTemplatePath,
  type PaymentModuleCycle,
} from '../../test-data/payment-module/paymentModule';
import { registerGeneratedFile } from '../generatedFileCleanup';

export type PaymentModulePreparedFile = {
  absolutePath: string;
  fileName: string;
  carrierName: string;
  customerUid: string;
  kind: 'NB' | 'RN';
};

export type PaymentModulePreparedCycle = {
  cycle: PaymentModuleCycle;
  paymentMethod: 'Check' | 'ACH';
  customerUid: string;
  agentId: string;
  nb: PaymentModulePreparedFile;
  rn: PaymentModulePreparedFile;
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

function nextCustomerUid(current: string, prefix: string, pad: number): string {
  const match = current.match(/(\d+)$/);
  const nextNum = match ? Number.parseInt(match[1], 10) + 1 : 1;
  const width = match ? Math.max(match[1].length, pad) : pad;
  return `${prefix}${String(nextNum).padStart(width, '0')}`;
}

function applyCustomerUid(sheet: ExcelJS.Worksheet, uidCol: number, customerUid: string): void {
  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    row.getCell(uidCol).value = customerUid;
  }
}

async function loadSheet(templatePath: string): Promise<{
  wb: ExcelJS.Workbook;
  sheet: ExcelJS.Worksheet;
  columns: Map<string, number>;
}> {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Payment module template not found: ${templatePath}`);
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error(`Payment module template has no worksheets: ${templatePath}`);
  return { wb, sheet, columns: headerColumnMap(sheet) };
}

/**
 * Prepare NB + RN files for a CHK or ACH cycle.
 * - Increments Customer UID once per cycle (same UID on NB and RN)
 * - Writes timestamped generated copies
 * - Persists incremented UIDs back to both templates
 */
export async function preparePaymentModuleCycle(
  cycle: PaymentModuleCycle,
): Promise<PaymentModulePreparedCycle> {
  const prefix = PAYMENT_MODULE.customerUidPrefix[cycle];
  const pad = PAYMENT_MODULE.customerUidPad;
  const agentCfg = PAYMENT_MODULE.agents[cycle];
  const nbTemplate = paymentModuleTemplatePath(cycle, 'nb');
  const rnTemplate = paymentModuleTemplatePath(cycle, 'rn');

  const nb = await loadSheet(nbTemplate);
  const rn = await loadSheet(rnTemplate);

  const nbUidCol =
    nb.columns.get('customer uid') ?? nb.columns.get(PAYMENT_MODULE.columns.customerUid.toLowerCase());
  const rnUidCol =
    rn.columns.get('customer uid') ?? rn.columns.get(PAYMENT_MODULE.columns.customerUid.toLowerCase());
  if (!nbUidCol || !rnUidCol) {
    throw new Error(`Column "Customer UID" missing in payment module ${cycle} templates`);
  }

  const currentUid = String(nb.sheet.getRow(2).getCell(nbUidCol).value ?? '').trim();
  const customerUid = nextCustomerUid(currentUid, prefix, pad);

  applyCustomerUid(nb.sheet, nbUidCol, customerUid);
  applyCustomerUid(rn.sheet, rnUidCol, customerUid);

  fs.mkdirSync(PAYMENT_MODULE.generatedDir, { recursive: true });
  const stamp = Date.now();
  const filePrefix = PAYMENT_MODULE.generatedFilePrefix[cycle];

  const nbFileName = `${filePrefix}-NB-${stamp}.xlsx`;
  const rnFileName = `${filePrefix}-RN-${stamp}.xlsx`;
  const nbAbsolutePath = path.join(PAYMENT_MODULE.generatedDir, nbFileName);
  const rnAbsolutePath = path.join(PAYMENT_MODULE.generatedDir, rnFileName);

  await nb.wb.xlsx.writeFile(nbAbsolutePath);
  await rn.wb.xlsx.writeFile(rnAbsolutePath);
  registerGeneratedFile(nbAbsolutePath);
  registerGeneratedFile(rnAbsolutePath);

  // Persist incremented UID so the next run advances again
  await nb.wb.xlsx.writeFile(nbTemplate);
  await rn.wb.xlsx.writeFile(rnTemplate);

  const agentIdCol =
    nb.columns.get('selling agent npn') ??
    nb.columns.get('agent id') ??
    nb.columns.get('agentid');
  const agentId = agentIdCol
    ? String(nb.sheet.getRow(2).getCell(agentIdCol).value ?? '').trim() || agentCfg.agentId
    : agentCfg.agentId;

  return {
    cycle,
    paymentMethod: agentCfg.paymentMethod,
    customerUid,
    agentId,
    nb: {
      absolutePath: nbAbsolutePath,
      fileName: nbFileName,
      carrierName: 'Aetna',
      customerUid,
      kind: 'NB',
    },
    rn: {
      absolutePath: rnAbsolutePath,
      fileName: rnFileName,
      carrierName: 'Aetna',
      customerUid,
      kind: 'RN',
    },
  };
}
