import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import { MMP, mmpTemplatePath } from '../../test-data/mmp/validateMmp';
import { registerGeneratedFile } from '../generatedFileCleanup';
import type { MmpPreparedFile } from './mmpContext';

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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Customer UID for this prep row. Template holds the *next* UID to use.
 * Non-MMP / missing → ATENA-MMP-TEST-A000. Matching → use as-is (never reuse prior).
 */
function resolveMmpCustomerUid(current: string): string {
  const prefix = MMP.customerUidPrefix;
  const pad = MMP.customerUidPad;
  const match = String(current ?? '')
    .trim()
    .match(new RegExp(`^${escapeRegExp(prefix)}(\\d+)$`));
  if (!match) {
    return `${prefix}${String(0).padStart(pad, '0')}`;
  }
  return `${prefix}${match[1].padStart(pad, '0')}`;
}

/** +1 after a UID was used — written back to template for the next run. */
function bumpMmpCustomerUid(used: string): string {
  const prefix = MMP.customerUidPrefix;
  const pad = MMP.customerUidPad;
  const match = used.match(new RegExp(`^${escapeRegExp(prefix)}(\\d+)$`));
  const n = match ? Number.parseInt(match[1], 10) + 1 : 1;
  return `${prefix}${String(n).padStart(pad, '0')}`;
}

function requireCol(columns: Map<string, number>, ...keys: string[]): number {
  for (const key of keys) {
    const col = columns.get(key);
    if (col) return col;
  }
  throw new Error(`Column not found (tried: ${keys.join(', ')})`);
}

type RowAmounts = {
  premium: number;
  grossCompensation: number;
  netCompensation: number;
  taxWithholding: number;
};

type AgentIds = {
  agentId: string;
  firstName: string;
  lastName: string;
};

async function loadTemplate(): Promise<{
  wb: ExcelJS.Workbook;
  sheet: ExcelJS.Worksheet;
  columns: Map<string, number>;
  templatePath: string;
}> {
  const templatePath = mmpTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`MMP template not found: ${templatePath}`);
  }
  fs.mkdirSync(MMP.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('MMP template workbook has no worksheets');

  return { wb, sheet, columns: headerColumnMap(sheet), templatePath };
}

function applyAgentAndAmounts(
  row: ExcelJS.Row,
  columns: Map<string, number>,
  agent: AgentIds,
  amounts: RowAmounts,
  uid: string,
): string {
  const uidCol = requireCol(columns, 'customer uid', 'customeruid');
  const npnCol = requireCol(columns, 'selling agent npn', 'sellingagentnpn', 'agent id', 'agentid');
  const firstCol = columns.get('selling agent first name') ?? columns.get('sellingagentfirstname');
  const lastCol = columns.get('selling agent last name') ?? columns.get('sellingagentlastname');
  const grossCol = requireCol(columns, 'gross compensation', 'grosscompensation');
  const taxCol = columns.get('tax withholding') ?? columns.get('taxwithholding');
  const netCol = requireCol(columns, 'net compensation', 'netcompensation');
  const premiumCol = requireCol(columns, 'premium');

  row.getCell(uidCol).value = uid;
  row.getCell(npnCol).value = agent.agentId;
  if (firstCol) row.getCell(firstCol).value = agent.firstName;
  if (lastCol) row.getCell(lastCol).value = agent.lastName;
  row.getCell(grossCol).value = amounts.grossCompensation;
  if (taxCol) row.getCell(taxCol).value = amounts.taxWithholding;
  row.getCell(netCol).value = amounts.netCompensation;
  row.getCell(premiumCol).value = amounts.premium;

  return uid;
}

function extractProductName(sheet: ExcelJS.Worksheet, columns: Map<string, number>): string {
  const productCol =
    columns.get('scale name/adjustment description') ??
    columns.get('product name alias') ??
    columns.get('product name') ??
    columns.get('scale name');
  if (!productCol) return '';
  return String(sheet.getRow(2).getCell(productCol).value ?? '').trim();
}

async function savePrepared(
  wb: ExcelJS.Workbook,
  templatePath: string,
  prefix: string,
  options?: { persistUidCol?: number; persistUid?: string },
): Promise<{ absolutePath: string; fileName: string }> {
  const stamp = Date.now();
  const fileName = `${prefix}-${stamp}.xlsx`;
  const absolutePath = path.join(MMP.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  // Persist next UID on template without changing the generated upload file.
  if (options?.persistUidCol != null && options.persistUid) {
    const sheet = wb.worksheets[0];
    if (sheet) {
      sheet.getRow(2).getCell(options.persistUidCol).value = options.persistUid;
    }
  }
  await wb.xlsx.writeFile(templatePath);
  return { absolutePath, fileName };
}

/**
 * Single-row NB statement: commission = 10% of premium, Agent ID overwritten.
 * Uses template Customer UID (ATENA-MMP-TEST-A000…), then persists +1 so next run never reuses.
 */
export async function prepareMmpFile1(agent: AgentIds): Promise<MmpPreparedFile> {
  const { wb, sheet, columns, templatePath } = await loadTemplate();
  const uidCol = requireCol(columns, 'customer uid', 'customeruid');

  // Keep only first data row
  for (let rowIndex = sheet.rowCount; rowIndex >= 3; rowIndex--) {
    sheet.spliceRows(rowIndex, 1);
  }

  const row = sheet.getRow(2);
  const currentUid = String(row.getCell(uidCol).value ?? '').trim();
  const usedUid = resolveMmpCustomerUid(currentUid);

  applyAgentAndAmounts(row, columns, agent, MMP.file1, usedUid);
  row.commit();

  const productName = extractProductName(sheet, columns);
  const { absolutePath, fileName } = await savePrepared(wb, templatePath, 'Mmp-File1', {
    persistUidCol: uidCol,
    persistUid: bumpMmpCustomerUid(usedUid),
  });

  return {
    absolutePath,
    fileName,
    carrierName: MMP.carrierName,
    customerUid: usedUid,
    agentId: agent.agentId,
    productName,
    recordCount: 1,
  };
}

/**
 * Multi-row statement sized to exceed MMP contribution cap (+1 surplus row).
 * Each data row gets a unique Customer UID; template gets next unused UID after last row.
 */
export async function prepareMmpFile2(agent: AgentIds): Promise<MmpPreparedFile> {
  const { wb, sheet, columns, templatePath } = await loadTemplate();
  const uidCol = requireCol(columns, 'customer uid', 'customeruid');

  const templateRow = sheet.getRow(2);
  const baseUid = String(templateRow.getCell(uidCol).value ?? '').trim();
  let uid = resolveMmpCustomerUid(baseUid);

  const totalRows = MMP.file2.commissionRowCount + MMP.file2.surplusRowCount;

  // Ensure we have enough rows by cloning row 2
  for (let i = 3; i <= totalRows + 1; i++) {
    if (!sheet.getRow(i).hasValues) {
      for (let c = 1; c <= 20; c++) {
        sheet.getRow(i).getCell(c).value = templateRow.getCell(c).value;
      }
    }
  }
  // Trim extras
  for (let rowIndex = sheet.rowCount; rowIndex >= totalRows + 2; rowIndex--) {
    sheet.spliceRows(rowIndex, 1);
  }

  const firstUid = uid;
  let lastUsed = uid;
  for (let i = 0; i < totalRows; i++) {
    const row = sheet.getRow(i + 2);
    applyAgentAndAmounts(row, columns, agent, MMP.file2, uid);
    row.commit();
    lastUsed = uid;
    uid = bumpMmpCustomerUid(uid);
  }

  const productName = extractProductName(sheet, columns);
  const { absolutePath, fileName } = await savePrepared(wb, templatePath, 'Mmp-File2');

  // Re-seed template as single row with next unused UID (never reuse lastUsed)
  const seedWb = new ExcelJS.Workbook();
  await seedWb.xlsx.readFile(absolutePath);
  const seedSheet = seedWb.worksheets[0];
  if (seedSheet) {
    for (let rowIndex = seedSheet.rowCount; rowIndex >= 3; rowIndex--) {
      seedSheet.spliceRows(rowIndex, 1);
    }
    seedSheet.getRow(2).getCell(uidCol).value = bumpMmpCustomerUid(lastUsed);
    await seedWb.xlsx.writeFile(templatePath);
  }

  return {
    absolutePath,
    fileName,
    carrierName: MMP.carrierName,
    customerUid: firstUid,
    agentId: agent.agentId,
    productName,
    recordCount: totalRows,
  };
}

/**
 * Renewal (RN): reuse stored Customer UID from NB seed; do not write UID back to template.
 */
export async function prepareMmpRenewalFile(
  agent: AgentIds,
  existingCustomerUid: string,
): Promise<MmpPreparedFile> {
  const { wb, sheet, columns, templatePath } = await loadTemplate();
  const uidCol = requireCol(columns, 'customer uid', 'customeruid');

  for (let rowIndex = sheet.rowCount; rowIndex >= 3; rowIndex--) {
    sheet.spliceRows(rowIndex, 1);
  }

  const row = sheet.getRow(2);
  applyAgentAndAmounts(row, columns, agent, MMP.file1, existingCustomerUid);
  row.commit();

  const productName = extractProductName(sheet, columns);
  const stamp = Date.now();
  const fileName = `Mmp-RN-${stamp}.xlsx`;
  const absolutePath = path.join(MMP.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);
  // Do NOT write RN UID back to NB template

  return {
    absolutePath,
    fileName,
    carrierName: MMP.carrierName,
    customerUid: existingCustomerUid,
    agentId: agent.agentId,
    productName,
    recordCount: 1,
  };
}
