import fs from 'node:fs';
import path from 'node:path';
import type { PreparedStatementFile } from '../excelStatementPrep';

export type SmokeStatementRun = {
  preparedFile: PreparedStatementFile;
  customerUid: string;
  fileId: string;
};

type SmokeSessionDisk = {
  first: SmokeStatementRun | null;
  second: SmokeStatementRun | null;
};

/** Survives scenario boundaries / worker recycle so T093–T096 can load T092/T095 captures. */
const SESSION_FILE = path.join(
  process.cwd(),
  'TestFiles-prod-sanity',
  'StatementUpload',
  '.generated',
  'smoke-statement-session.json',
);

let first: SmokeStatementRun | null = null;
let second: SmokeStatementRun | null = null;

function readSessionFromDisk(): SmokeSessionDisk | null {
  try {
    if (!fs.existsSync(SESSION_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')) as SmokeSessionDisk;
    if (!raw || typeof raw !== 'object') return null;
    return {
      first: raw.first ?? null,
      second: raw.second ?? null,
    };
  } catch {
    return null;
  }
}

function writeSessionToDisk(): void {
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
  const payload: SmokeSessionDisk = { first, second };
  fs.writeFileSync(SESSION_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

function hydrateFromDisk(): void {
  if (first && second) return;
  const disk = readSessionFromDisk();
  if (!disk) return;
  if (!first && disk.first) first = disk.first;
  if (!second && disk.second) second = disk.second;
}

export function setFirstSmokeRun(run: SmokeStatementRun): void {
  first = run;
  writeSessionToDisk();
}

export function getFirstSmokeRun(): SmokeStatementRun {
  hydrateFromDisk();
  if (!first) {
    throw new Error(
      'First smoke run not prepared — run @TEST-092-smoke-PROD (upload → Completed) first',
    );
  }
  return first;
}

export function updateFirstSmokeRun(patch: Partial<SmokeStatementRun>): void {
  hydrateFromDisk();
  if (!first) {
    throw new Error(
      'First smoke run not prepared — run @TEST-092-smoke-PROD (upload → Completed) first',
    );
  }
  first = { ...first, ...patch };
  writeSessionToDisk();
}

export function setSecondSmokeRun(run: SmokeStatementRun): void {
  second = run;
  writeSessionToDisk();
}

export function getSecondSmokeRun(): SmokeStatementRun {
  hydrateFromDisk();
  if (!second) {
    throw new Error(
      'Second smoke run not prepared — run @TEST-095-smoke-PROD (upload → Completed) first',
    );
  }
  return second;
}

export function updateSecondSmokeRun(patch: Partial<SmokeStatementRun>): void {
  hydrateFromDisk();
  if (!second) {
    throw new Error(
      'Second smoke run not prepared — run @TEST-095-smoke-PROD (upload → Completed) first',
    );
  }
  second = { ...second, ...patch };
  writeSessionToDisk();
}

export function clearSmokeStatementContext(): void {
  first = null;
  second = null;
  // Keep disk — dependent scenarios / retries still load prior captures.
}

/** Call only when intentionally ending the smoke statement-processing family. */
export function clearSmokeStatementContextDisk(): void {
  first = null;
  second = null;
  try {
    if (fs.existsSync(SESSION_FILE)) fs.rmSync(SESSION_FILE, { force: true });
  } catch {
    // ignore
  }
}
