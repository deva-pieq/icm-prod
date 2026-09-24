import fs from 'node:fs';
import path from 'node:path';
import {
  COMMISSION_TRUTH,
  COMMISSION_TRUTH_FILENAME_PATTERN,
} from '../../test-data/commission-split/commissionTruth';
import { registerGeneratedFile } from '../generatedFileCleanup';

export type PreparedCommissionTruthFile = {
  absolutePath: string;
  fileName: string;
  statementType: string;
  sourceFileName: string;
  truthSheetPath: string;
  runStamp: number;
  carrierName: string;
};

type DateToggleState = {
  direction: 1 | -1;
};

function normalizeHeader(label: string): string {
  return label.replace(/\s+/g, ' ').trim().toLowerCase();
}

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

function isDateLikeHeader(header: string): boolean {
  return /date|month/i.test(header);
}

function isDateLikeValue(value: string): boolean {
  return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value.trim());
}

function shiftUsDate(value: string, days: number): string {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return value;

  const [, month, day, year] = match;
  const date = new Date(
    Date.UTC(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10)),
  );
  date.setUTCDate(date.getUTCDate() + days);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const yyyy = String(date.getUTCFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

function readDateToggleDirection(): 1 | -1 {
  const statePath = COMMISSION_TRUTH.dateToggleStateFile;
  if (!fs.existsSync(statePath)) return 1;

  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8')) as DateToggleState;
    return parsed.direction === -1 ? -1 : 1;
  } catch {
    return 1;
  }
}

function writeDateToggleDirection(current: 1 | -1): void {
  const next: DateToggleState = { direction: current === 1 ? -1 : 1 };
  fs.mkdirSync(path.dirname(COMMISSION_TRUTH.dateToggleStateFile), { recursive: true });
  fs.writeFileSync(COMMISSION_TRUTH.dateToggleStateFile, `${JSON.stringify(next)}\n`, 'utf8');
}

function parseInboxFilename(fileName: string): { statementType: string; baseName: string } {
  const match = fileName.match(COMMISSION_TRUTH_FILENAME_PATTERN);
  if (!match) {
    throw new Error(
      `Inbox file "${fileName}" must match [StatementType]name.csv — ` +
        `e.g. [Oscar U65 CS]TempSpace.csv`,
    );
  }
  return {
    statementType: match[1].trim(),
    baseName: match[2].trim(),
  };
}

function resolveInboxSourceFile(): string {
  const override = process.env.COMMISSION_TRUTH_FILE?.trim();
  if (override) {
    const absolute = path.isAbsolute(override)
      ? override
      : path.join(COMMISSION_TRUTH.inboxDir, override);
    if (!fs.existsSync(absolute)) {
      throw new Error(`COMMISSION_TRUTH_FILE not found: ${absolute}`);
    }
    return absolute;
  }

  if (!fs.existsSync(COMMISSION_TRUTH.inboxDir)) {
    throw new Error(`Commission truth inbox not found: ${COMMISSION_TRUTH.inboxDir}`);
  }

  const candidates = fs
    .readdirSync(COMMISSION_TRUTH.inboxDir)
    .filter((name) => name.toLowerCase().endsWith('.csv') && !name.startsWith('.'));

  if (candidates.length === 0) {
    throw new Error(
      `No CSV files in ${COMMISSION_TRUTH.inboxDir} — drop a file like [Oscar U65 CS]statement.csv`,
    );
  }
  if (candidates.length > 1) {
    throw new Error(
      `Multiple CSV files in inbox (${candidates.join(', ')}) — keep one file or set COMMISSION_TRUTH_FILE`,
    );
  }

  return path.join(COMMISSION_TRUTH.inboxDir, candidates[0]!);
}

function deriveCarrierName(statementType: string): string {
  const firstWord = statementType.split(/\s+/)[0]?.trim();
  return firstWord || 'Unknown';
}

/**
 * Clone inbox CSV for a unique run:
 * - parse statement type from `[StatementType]filename.csv`
 * - bump first date-like value on row 1 by +/-1 day (toggle persisted between runs)
 * - optional Block Reason tweak on row 1 when column exists
 */
export function prepareCommissionTruthFileFromInbox(): PreparedCommissionTruthFile {
  const sourcePath = resolveInboxSourceFile();
  const sourceFileName = path.basename(sourcePath);
  const { statementType } = parseInboxFilename(sourceFileName);

  fs.mkdirSync(COMMISSION_TRUTH.generatedDir, { recursive: true });
  fs.mkdirSync(COMMISSION_TRUTH.truthSheetDir, { recursive: true });

  const raw = fs.readFileSync(sourcePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error(`Inbox CSV has no data rows: ${sourcePath}`);
  }

  const headers = parseCsvLine(lines[0]!);
  const dateCol = headers.findIndex((header) => isDateLikeHeader(header));
  const blockReasonCol = headers.findIndex(
    (header) => normalizeHeader(header) === 'block reason',
  );

  const direction = readDateToggleDirection();
  const stamp = Date.now();
  const outputLines = [lines[0]!];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]!);
    while (fields.length < headers.length) fields.push('');

    if (i === 1) {
      if (dateCol >= 0) {
        const current = (fields[dateCol] ?? '').trim();
        if (isDateLikeValue(current)) {
          fields[dateCol] = shiftUsDate(current, direction);
        }
      } else {
        const fallbackCol = fields.findIndex((value) => isDateLikeValue(value));
        if (fallbackCol >= 0) {
          fields[fallbackCol] = shiftUsDate(fields[fallbackCol]!, direction);
        }
      }

      if (blockReasonCol >= 0) {
        const existing = (fields[blockReasonCol] ?? '').trim();
        fields[blockReasonCol] = existing
          ? `${existing} automation-run-${stamp}`
          : `automation-run-${stamp}`;
      }
    }

    outputLines.push(serializeCsvLine(fields));
  }

  writeDateToggleDirection(direction);

  const fileName = `commissionTruth-${stamp}.csv`;
  const absolutePath = path.join(COMMISSION_TRUTH.generatedDir, fileName);
  fs.writeFileSync(absolutePath, `${outputLines.join('\n')}\n`, 'utf8');
  registerGeneratedFile(absolutePath);

  const truthSheetPath = path.join(
    COMMISSION_TRUTH.truthSheetDir,
    `${COMMISSION_TRUTH.truthSheetFilePrefix}-${stamp}.csv`,
  );

  return {
    absolutePath,
    fileName,
    statementType,
    sourceFileName,
    truthSheetPath,
    runStamp: stamp,
    carrierName: deriveCarrierName(statementType),
  };
}
