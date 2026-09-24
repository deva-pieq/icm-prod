import ExcelJS from 'exceljs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const template = path.join(
  root,
  'TestFiles/StatementUpload/[MLB NEW]HappyFlowChangeCheckRunDate.xlsx',
);

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(template);
for (const sheet of wb.worksheets) {
  console.log('--- sheet:', sheet.name, 'rows', sheet.rowCount, 'cols', sheet.columnCount);
  const headerRow = sheet.getRow(1);
  const headers = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    headers.push({ col, value: String(cell.value ?? '').trim() });
  });
  console.log('headers:', headers.filter((h) => h.value).map((h) => `${h.col}:${h.value}`).join(' | '));
  for (let r = 2; r <= Math.min(4, sheet.rowCount); r++) {
    const row = sheet.getRow(r);
    const sample = [];
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      sample.push(`${col}=${JSON.stringify(cell.value)}`);
    });
    if (sample.length) console.log(`row${r}:`, sample.slice(0, 12).join(', '));
  }
}
