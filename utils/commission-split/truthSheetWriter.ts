import fs from 'node:fs';
import path from 'node:path';
import type { CommissionTruthLineItem } from './commissionTruthContext';

const CALCULATION_NOTE =
  '// note use for calculation and ignore it calculated value = gross compensation from row x percentage';

function formatCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function serializeCsvLine(fields: string[]): string {
  return fields.map(formatCsvField).join(',');
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

export function writeCommissionTruthSheetSkeleton(truthSheetPath: string): void {
  fs.mkdirSync(path.dirname(truthSheetPath), { recursive: true });
  const header = serializeCsvLine([
    'Line item',
    'product name',
    'agent level',
    'product commission %',
    'gross compensation',
    'agent commission',
    'calculated',
    'Validate',
  ]);
  fs.writeFileSync(truthSheetPath, `${header}\n`, 'utf8');
}

export function appendCommissionTruthLineItem(
  truthSheetPath: string,
  item: CommissionTruthLineItem,
): void {
  const passed =
    !item.skipped &&
    Math.abs(item.calculatedValue - item.agentCommission) < 0.02;
  const line = serializeCsvLine([
    item.skipped ? `line item ${item.rowIndex + 1} (skipped)` : `line item ${item.rowIndex + 1}`,
    item.productName,
    item.agentLevel,
    item.skipped ? '' : formatMoney(item.productCommissionPercent),
    item.skipped ? '' : formatMoney(item.grossCompensation),
    item.skipped ? '' : formatMoney(item.agentCommission),
    item.skipped ? '' : formatMoney(item.calculatedValue),
    item.skipped ? `SKIP: ${item.skipReason ?? 'n/a'}` : passed ? 'PASS' : 'FAIL',
  ]);
  fs.appendFileSync(truthSheetPath, `${line}\n`, 'utf8');
}

export function finalizeCommissionTruthSheet(
  truthSheetPath: string,
  lineItems: CommissionTruthLineItem[],
): void {
  const validated = lineItems.filter((item) => !item.skipped);
  const passedCount = validated.filter(
    (item) => Math.abs(item.calculatedValue - item.agentCommission) < 0.02,
  ).length;

  const summary = serializeCsvLine([
    'Summary',
    `${validated.length} validated`,
    `${passedCount} passed`,
    `${lineItems.length - validated.length} skipped`,
    '',
    '',
    '',
    '',
  ]);
  const note = serializeCsvLine([
    '',
    '',
    '',
    CALCULATION_NOTE,
    '',
    '',
    '',
    '',
  ]);

  fs.appendFileSync(truthSheetPath, `${summary}\n${note}\n`, 'utf8');
}
