import fs from 'node:fs';
import path from 'node:path';
import type { CommissionReportAllLineItem } from './commissionReportAllContext';
import { COMMISSION_REPORT } from '../../test-data/commission-report/validateCommissionReport';

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

const HEADER = serializeCsvLine([
  'LineItem',
  'policyName',
  'ProductName',
  'GrossCommission',
  'TotalMembers',
  'split-percentage',
  'value',
  'value x TotalMembers',
  'Role',
  'commission-from-report',
  'result',
]);

function serializeActiveLine(item: CommissionReportAllLineItem): string {
  return serializeCsvLine([
    String(item.lineItem),
    item.policyNumber,
    item.productName,
    formatMoney(item.grossCommission),
    String(item.totalMembers),
    formatMoney(item.splitPercentage),
    formatMoney(item.value),
    formatMoney(item.valueTimesMembers),
    item.role,
    item.commissionFromReport === null ? '' : formatMoney(item.commissionFromReport),
    item.result,
  ]);
}

export function writeCommissionReportAllCsvSkeleton(reportSheetPath: string): void {
  fs.mkdirSync(path.dirname(reportSheetPath), { recursive: true });
  fs.writeFileSync(reportSheetPath, `${HEADER}\n`, 'utf8');
}

export function appendCommissionReportAllLine(
  reportSheetPath: string,
  item: CommissionReportAllLineItem,
): void {
  if (item.skipped) return;
  fs.appendFileSync(reportSheetPath, `${serializeActiveLine(item)}\n`, 'utf8');
}

export function rewriteCommissionReportAllCsv(
  reportSheetPath: string,
  items: CommissionReportAllLineItem[],
): void {
  const active = items.filter((item) => !item.skipped);
  const lines = [HEADER, ...active.map(serializeActiveLine)];
  fs.writeFileSync(reportSheetPath, `${lines.join('\n')}\n`, 'utf8');
}

export function finalizeCommissionReportAllCsv(
  reportSheetPath: string,
  items: CommissionReportAllLineItem[],
): void {
  rewriteCommissionReportAllCsv(reportSheetPath, items);
  const active = items.filter((item) => !item.skipped);
  const trueCount = active.filter((item) => item.result === 'TRUE').length;
  const falseCount = active.filter((item) => item.result === 'FALSE').length;
  const summary = serializeCsvLine([
    'Summary',
    `${active.length} lines`,
    `${trueCount} TRUE`,
    `${falseCount} FALSE`,
    `${items.length - active.length} skipped`,
    `tolerance=${COMMISSION_REPORT.commissionTolerance}`,
    '',
    '',
    '',
    '',
    '',
  ]);
  fs.appendFileSync(reportSheetPath, `${summary}\n`, 'utf8');
}
