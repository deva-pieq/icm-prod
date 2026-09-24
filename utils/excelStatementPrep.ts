import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import { STATEMENT_UPLOAD, statementUploadTemplatePath } from '../test-data/commission-statements/statementUpload';
import { registerGeneratedFile } from './generatedFileCleanup';

export type PreparedStatementFile = {
  absolutePath: string;
  fileName: string;
  carrierName: string;
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

function stripRunSuffix(address: string): string {
  return address.replace(/\s*\[run:\d+\]\s*$/i, '').trim();
}

/**
 * Clone the renewal template and apply small non-destructive edits before upload:
 * - increment Check run date by 1 day on the first data row (formula rows follow)
 * - tweak Producer comp address with a unique run suffix
 * - optional: rewrite product alias (scale name) and Customer UIDs for environments
 *   where the template product/policies no longer exist (smoke → Completed path)
 */
export type PrepareStatementUploadOptions = {
  /** Maps to "Scale name/adjustment description" — must match an existing product alias. */
  productAlias?: string;
  /** Replace each Customer UID with a unique per-run value so policies are created as New. */
  uniqueCustomerUids?: boolean;
  fileNamePrefix?: string;
};

export async function prepareStatementUploadFile(
  options: PrepareStatementUploadOptions = {},
): Promise<PreparedStatementFile> {
  const templatePath = statementUploadTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Statement upload template not found: ${templatePath}`);
  }

  fs.mkdirSync(STATEMENT_UPLOAD.generatedDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Template workbook has no worksheets');

  const columns = headerColumnMap(sheet);
  const checkRunCol = columns.get('check run date') ?? 17;
  const addressCol = columns.get('producer comp address') ?? 4;
  const carrierCol = columns.get('carrier name') ?? 19;
  const scaleCol = columns.get('scale name/adjustment description') ?? 16;
  const customerUidCol = columns.get('customer uid') ?? 7;

  const stamp = Date.now();
  let carrierName = '';
  let primaryCheckRunDate: Date | null = null;
  let dataRowOrdinal = 0;

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row.hasValues) continue;
    dataRowOrdinal += 1;

    const checkCell = row.getCell(checkRunCol);
    const hasFormula =
      typeof checkCell.value === 'object' &&
      checkCell.value !== null &&
      'formula' in checkCell.value;

    if (!hasFormula) {
      const current = cellDateValue(checkCell.value);
      if (current) {
        const nextDate: Date = primaryCheckRunDate ?? addOneDay(current);
        if (!primaryCheckRunDate) primaryCheckRunDate = nextDate;
        checkCell.value = nextDate;
      }
    }

    const addressCell = row.getCell(addressCol);
    const baseAddress = stripRunSuffix(String(addressCell.value ?? ''));
    if (baseAddress) {
      addressCell.value = `${baseAddress} [run:${stamp}]`;
    }

    if (options.productAlias) {
      row.getCell(scaleCol).value = options.productAlias;
    }

    if (options.uniqueCustomerUids) {
      row.getCell(customerUidCol).value = `SMKSTM${stamp}${dataRowOrdinal}`;
    }

    if (!carrierName) {
      carrierName = String(row.getCell(carrierCol).value ?? '').trim();
    }
  }

  const prefix = options.fileNamePrefix ?? 'HappyFlowRenewal';
  const fileName = `${prefix}-${stamp}.xlsx`;
  const absolutePath = path.join(STATEMENT_UPLOAD.generatedDir, fileName);
  await wb.xlsx.writeFile(absolutePath);
  registerGeneratedFile(absolutePath);

  return {
    absolutePath,
    fileName,
    carrierName: carrierName || 'Aetna',
  };
}
