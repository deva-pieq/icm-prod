import fs from 'node:fs';
import path from 'node:path';
import type { CommissionReportLineItem } from './commissionReportContext';
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
  'commission-from-report',
  'result',
]);

function serializeActiveLine(item: CommissionReportLineItem): string {
  return serializeCsvLine([
    String(item.lineItem),
    item.policyNumber,
    item.productName,
    formatMoney(item.grossCommission),
    String(item.totalMembers),
    formatMoney(item.splitPercentage),
    formatMoney(item.agentValue),
    formatMoney(item.valueTimesMembers),
    item.commissionFromReport === null ? '' : formatMoney(item.commissionFromReport),
    item.result,
  ]);
}

export function writeCommissionReportCsvSkeleton(reportSheetPath: string): void {
  fs.mkdirSync(path.dirname(reportSheetPath), { recursive: true });
  fs.writeFileSync(reportSheetPath, `${HEADER}\n`, 'utf8');
}

export function appendCommissionReportLine(
  reportSheetPath: string,
  item: CommissionReportLineItem,
): void {
  if (item.skipped) return;
  fs.appendFileSync(reportSheetPath, `${serializeActiveLine(item)}\n`, 'utf8');
}

/** Rewrite the full sheet from in-memory items (after report fill). */
export function rewriteCommissionReportCsv(
  reportSheetPath: string,
  items: CommissionReportLineItem[],
): void {
  const active = items.filter((item) => !item.skipped);
  const lines = [HEADER, ...active.map(serializeActiveLine)];
  fs.writeFileSync(reportSheetPath, `${lines.join('\n')}\n`, 'utf8');
}

export function finalizeCommissionReportCsv(
  reportSheetPath: string,
  items: CommissionReportLineItem[],
): void {
  rewriteCommissionReportCsv(reportSheetPath, items);
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
  ]);
  fs.appendFileSync(reportSheetPath, `${summary}\n`, 'utf8');
}
