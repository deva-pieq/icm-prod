import ExcelJS from 'exceljs';
import fs from 'node:fs';
import { SALES_LEADER_DASHBOARD } from '../../test-data/sales-leader-dashboard/validateSalesLeaderDashboard';
import { prepareValidStatementFile } from '../statement-processing/statementProcessingExcelPrep';
import type { StatementProcessingPreparedFile } from '../statement-processing/statementProcessingContext';

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
 * Prepare an Aetna ACA statement (same UID increment rules as statement-processing),
 * then force Selling agent NPN to the given agent.
 *
 * - Downline agent (600004) → creates "Sales Leader" override commissions.
 * - Sales leader's own NPN (15278437 = Jason Hoffmann) → creates direct "Agent" selling commissions.
 *   Do NOT use '600001' (downline L1) or '0987654321' (DevaTest, template default) — they
 *   only add "Sales Leader" overrides or never book on the sales leader's ledger.
 *
 * The base template's Check run date drifts forward (+1 day per prep). Commissions
 * book into the period of their check-run date, and future check-runs are NOT
 * released/paid — they never appear in any dashboard bucket. Pin the generated
 * file's check-run date to today so the commission books into This Month / YTD.
 */
export async function prepareSalesLeaderDashboardStatementFile(
  agentId: string = SALES_LEADER_DASHBOARD.agentId,
): Promise<StatementProcessingPreparedFile> {
  const prepared = await prepareValidStatementFile();

  if (!fs.existsSync(prepared.absolutePath)) {
    throw new Error(`Prepared statement file not found: ${prepared.absolutePath}`);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(prepared.absolutePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Prepared sales leader statement workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const agentNpnCol =
    columns.get('selling agent npn') ??
    columns.get('agent id') ??
    columns.get('agentid');
  const checkRunCol = columns.get('check run date');
  if (!agentNpnCol) {
    throw new Error('Selling agent NPN / Agent ID column not found in prepared statement');
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    row.getCell(agentNpnCol).value = agentId;
    if (checkRunCol) {
      row.getCell(checkRunCol).value = today;
    }
  }

  await wb.xlsx.writeFile(prepared.absolutePath);

  prepared.agentNpn = agentId;
  prepared.carrierName = SALES_LEADER_DASHBOARD.carrierName;
  return prepared;
}
