import fs from 'node:fs';
import path from 'node:path';
import {
  HAPPY_FLOW_CSV,
  happyFlowCsvTemplatePath,
} from '../../test-data/happy-flow/happyFlow001';
import { registerGeneratedFile } from '../generatedFileCleanup';

export type PreparedHappyFlowCsv = {
  absolutePath: string;
  fileName: string;
  customerUids: string[];
};

function normalizeHeader(label: string): string {
  return label.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Parse a single CSV line respecting double-quoted fields. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields;
}

function formatCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function serializeCsvLine(fields: string[]): string {
  return fields.map(formatCsvField).join(',');
}

/**
 * Clone HappyFlow1TestData.csv and apply run-specific edits:
 * - set Scale name/adjustment description to the prepared carrier product name
 * - append Date.now() to each Customer UID for uniqueness
 */
export function prepareHappyFlowCsvFile(carrierProductName: string): PreparedHappyFlowCsv {
  const templatePath = happyFlowCsvTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Happy flow CSV template not found: ${templatePath}`);
  }

  fs.mkdirSync(HAPPY_FLOW_CSV.generatedDir, { recursive: true });

  const raw = fs.readFileSync(templatePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error(`Happy flow CSV template has no data rows: ${templatePath}`);
  }

  const headers = parseCsvLine(lines[0]);
  const scaleCol = headers.findIndex(h => normalizeHeader(h) === normalizeHeader(HAPPY_FLOW_CSV.columns.scaleName));
  const uidCol = headers.findIndex(h => normalizeHeader(h) === normalizeHeader(HAPPY_FLOW_CSV.columns.customerUid));

  if (scaleCol < 0) {
    throw new Error(`Column "${HAPPY_FLOW_CSV.columns.scaleName}" not found in ${templatePath}`);
  }
  if (uidCol < 0) {
    throw new Error(`Column "${HAPPY_FLOW_CSV.columns.customerUid}" not found in ${templatePath}`);
  }

  const stamp = Date.now();
  const customerUids: string[] = [];
  const outputLines = [lines[0]];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.every(f => !f.trim())) continue;

    while (fields.length < headers.length) fields.push('');

    const baseUid = (fields[uidCol] ?? '').trim();
    const uniqueUid = `${baseUid}${stamp}`;
    fields[uidCol] = uniqueUid;
    fields[scaleCol] = carrierProductName;
    customerUids.push(uniqueUid);

    outputLines.push(serializeCsvLine(fields));
  }

  if (customerUids.length === 0) {
    throw new Error(`No data rows updated in happy flow CSV template: ${templatePath}`);
  }

  const fileName = `HappyFlow1TestData-${stamp}.csv`;
  const absolutePath = path.join(HAPPY_FLOW_CSV.generatedDir, fileName);
  fs.writeFileSync(absolutePath, `${outputLines.join('\n')}\n`, 'utf8');
  registerGeneratedFile(absolutePath);

  return { absolutePath, fileName, customerUids };
}
