import fs from 'node:fs';
import path from 'node:path';
import { STATEMENT_PROCESSING } from '../../test-data/statement-processing/validateStatementProcessing';

export type StatementProcessingPreparedFile = {
  absolutePath: string;
  fileName: string;
  carrierName: string;
  customerUid: string;
  agentNpn: string;
  productName: string;
  grossCompensation: number;
  /** Net compensation — Review "Total Earned Commission" uses this, not gross. */
  netCompensation: number;
  premium: number;
  state: string;
  recordCount: number;
};

export type StatementProcessingUploadState = {
  fileId: string;
  fileName: string;
  stage: string;
};

export type StatementProcessingCaptures = {
  grossCommission: number;
  agentCommission: number;
  exceptionReason: string;
  reviewRecordCount: number;
  transactionType: string;
  policyState: string;
  matchedPolicyNumber: string;
  matchedAgentNpn: string;
  /** Prep-time metadata for multi-row variants. */
  expectedReviewRecordCount: number;
  expectedInvalidCount: number;
  expectedMatchedCount: number;
  expectedStates: string[];
  expectedTransactionTypes: string[];
  /** Seeded policy UID from a prior Completed upload (required for RN / chargeback rows). */
  seededPolicyUid: string;
};

let _prepared: StatementProcessingPreparedFile | null = null;
let _duplicatePath: string | null = null;
let _csvPath: string | null = null;
let _largePath: string | null = null;
let _missingColumnsPath: string | null = null;
let _invalidFormatPath: string | null = null;
let _partialPath: string | null = null;
let _statesPath: string | null = null;
let _nbRnPath: string | null = null;
let _uploadState: StatementProcessingUploadState | null = null;
let _captures: StatementProcessingCaptures = {
  grossCommission: 0,
  agentCommission: 0,
  exceptionReason: '',
  reviewRecordCount: 0,
  transactionType: '',
  policyState: '',
  matchedPolicyNumber: '',
  matchedAgentNpn: '',
  expectedReviewRecordCount: 0,
  expectedInvalidCount: 0,
  expectedMatchedCount: 0,
  expectedStates: [],
  expectedTransactionTypes: [],
  seededPolicyUid: '',
};

export function setStatementProcessingPreparedFile(value: StatementProcessingPreparedFile): void {
  _prepared = value;
}
export function getStatementProcessingPreparedFile(): StatementProcessingPreparedFile {
  if (!_prepared) {
    throw new Error(
      'No statement processing prepared file stored — run the prep step first',
    );
  }
  return _prepared;
}

export function setStatementProcessingDuplicatePath(value: string): void {
  _duplicatePath = value;
}
export function getStatementProcessingDuplicatePath(): string {
  if (!_duplicatePath) {
    throw new Error('Duplicate statement file not prepared');
  }
  return _duplicatePath;
}

export function setStatementProcessingCsvPath(value: string): void {
  _csvPath = value;
}
export function getStatementProcessingCsvPath(): string {
  if (!_csvPath) {
    throw new Error('CSV statement file not prepared');
  }
  return _csvPath;
}

export function setStatementProcessingLargePath(value: string): void {
  _largePath = value;
}
export function getStatementProcessingLargePath(): string {
  if (!_largePath) {
    throw new Error('Large statement file not prepared');
  }
  return _largePath;
}

export function setStatementProcessingMissingColumnsPath(value: string): void {
  _missingColumnsPath = value;
}
export function getStatementProcessingMissingColumnsPath(): string {
  if (!_missingColumnsPath) {
    throw new Error('Missing-columns statement file not prepared');
  }
  return _missingColumnsPath;
}

export function setStatementProcessingInvalidFormatPath(value: string): void {
  _invalidFormatPath = value;
}
export function getStatementProcessingInvalidFormatPath(): string {
  if (!_invalidFormatPath) {
    throw new Error('Invalid-format statement file not prepared');
  }
  return _invalidFormatPath;
}

export function setStatementProcessingPartialPath(value: string): void {
  _partialPath = value;
}
export function getStatementProcessingPartialPath(): string {
  if (!_partialPath) {
    throw new Error('Partial-reconciliation statement file not prepared');
  }
  return _partialPath;
}

export function setStatementProcessingStatesPath(value: string): void {
  _statesPath = value;
}
export function getStatementProcessingStatesPath(): string {
  if (!_statesPath) {
    throw new Error('State-variants statement file not prepared');
  }
  return _statesPath;
}

export function setStatementProcessingNbRnPath(value: string): void {
  _nbRnPath = value;
}
export function getStatementProcessingNbRnPath(): string {
  if (!_nbRnPath) {
    throw new Error('NB/RN statement file not prepared');
  }
  return _nbRnPath;
}

export function setStatementProcessingUploadState(value: StatementProcessingUploadState): void {
  _uploadState = value;
}
export function getStatementProcessingUploadState(): StatementProcessingUploadState {
  if (!_uploadState) {
    throw new Error('No statement processing upload state stored');
  }
  return _uploadState;
}

export function setStatementProcessingCaptures(patch: Partial<StatementProcessingCaptures>): void {
  _captures = { ..._captures, ...patch };
}
export function getStatementProcessingCaptures(): StatementProcessingCaptures {
  return { ..._captures };
}

/** Survives per-scenario clear — one 500-row upload shared across bulk field cases. */
export type StatementProcessingBulkReviewSession = {
  reviewUrl: string;
  fileId: string;
  recordCount: number;
};

const BULK_SESSION_FILE = path.join(
  STATEMENT_PROCESSING.generatedDir,
  'bulk-review-session.json',
);

let _bulkReviewSession: StatementProcessingBulkReviewSession | null = null;

function readBulkSessionFromDisk(): StatementProcessingBulkReviewSession | null {
  try {
    if (!fs.existsSync(BULK_SESSION_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(BULK_SESSION_FILE, 'utf8')) as StatementProcessingBulkReviewSession;
    if (raw?.reviewUrl && raw?.fileId && raw?.recordCount > 0) return raw;
  } catch {
    // ignore corrupt / missing file
  }
  return null;
}

function writeBulkSessionToDisk(value: StatementProcessingBulkReviewSession): void {
  fs.mkdirSync(STATEMENT_PROCESSING.generatedDir, { recursive: true });
  fs.writeFileSync(BULK_SESSION_FILE, JSON.stringify(value), 'utf8');
}

export function setStatementProcessingBulkReviewSession(
  value: StatementProcessingBulkReviewSession,
): void {
  _bulkReviewSession = value;
  writeBulkSessionToDisk(value);
}

export function getStatementProcessingBulkReviewSession(): StatementProcessingBulkReviewSession {
  if (!_bulkReviewSession) {
    _bulkReviewSession = readBulkSessionFromDisk();
  }
  if (!_bulkReviewSession) {
    throw new Error(
      'No bulk-update review session — run @TEST-BU-000-Statement-Processing-PROD setup first',
    );
  }
  return _bulkReviewSession;
}

export function clearStatementProcessingBulkReviewSession(): void {
  _bulkReviewSession = null;
  // Keep disk file — worker recycle mid-suite must still load BU-000 session.
}

/** Call only when intentionally ending the bulk-update suite (true teardown). */
export function clearStatementProcessingBulkReviewSessionDisk(): void {
  _bulkReviewSession = null;
  try {
    if (fs.existsSync(BULK_SESSION_FILE)) fs.rmSync(BULK_SESSION_FILE, { force: true });
  } catch {
    // ignore
  }
}

export function clearStatementProcessingContext(): void {
  _prepared = null;
  _duplicatePath = null;
  _csvPath = null;
  _largePath = null;
  _missingColumnsPath = null;
  _invalidFormatPath = null;
  _partialPath = null;
  _statesPath = null;
  _nbRnPath = null;
  _uploadState = null;
  _captures = {
    grossCommission: 0,
    agentCommission: 0,
    exceptionReason: '',
    reviewRecordCount: 0,
    transactionType: '',
    policyState: '',
    matchedPolicyNumber: '',
    matchedAgentNpn: '',
    expectedReviewRecordCount: 0,
    expectedMatchedCount: 0,
    expectedInvalidCount: 0,
    expectedStates: [],
    expectedTransactionTypes: [],
    seededPolicyUid: '',
  };
  // Keep _bulkReviewSession — field cases reuse the same Review upload.
}
