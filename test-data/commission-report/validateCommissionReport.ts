import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

/** Filename pattern: `[StatementType]MyFile.xlsx|csv` → statement type + base name */
export const COMMISSION_REPORT_FILENAME_PATTERN = /^\[(.+?)\](.+)\.(xlsx|csv)$/i;

export const COMMISSION_REPORT = {
  inboxDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'ValidateCommissionSplit', 'inbox'),
  generatedDir: path.join(
    projectRoot,
    'TestFiles-prod-sanity',
    'ValidateCommissionSplit',
    '.generated',
  ),
  reportSheetDir: path.join(
    projectRoot,
    'TestFiles-prod-sanity',
    'ValidateCommissionSplit',
    'truth-sheets',
  ),
  /** Alternates Payee LLC casing between runs: llc → LLC → llc … */
  payeeLlcToggleStateFile: path.join(
    projectRoot,
    'TestFiles-prod-sanity',
    'ValidateCommissionSplit',
    '.generated',
    'commission-report-payee-llc-toggle-state.json',
  ),
  /** Payee value whose LLC suffix is toggled for unique uploads */
  payeeNameForUniqueness: 'Main Line Benefits LLC',
  reportSheetFilePrefix: 'commissionReport',
  /** Multi-role (Agency / Sales Leader / Agent) report sheet prefix */
  reportSheetFilePrefixAll: 'commission-report-all',
  reviewHeading: 'Review Statement File',
  uploadPoll: {
    maxAttempts: 90,
    intervalMs: 5_000,
    /** Extra attempts when waiting for Completed after Complete Review (grid remounts). */
    completedMaxAttempts: 60,
    completedIntervalMs: 5_000,
  },
  gridColumns: {
    uploaded: 'Uploaded',
    status: 'Status',
    stage: 'Stage',
    fileName: 'File Name',
    fileId: 'File ID',
  },
  reviewColumns: {
    policyNumber: 'Policy Number',
    totalMembers: 'Total Members',
    issueDate: 'Issue Date',
    paidToDate: 'Paid to Date',
    grossComm: 'Gross Comm',
    chargeback: 'Chargeback',
  },
  /** Alternate review header labels (matched via includes) */
  reviewColumnAliases: {
    policyNumber: ['policy number', 'member id', 'policy name'],
    totalMembers: ['total members', 'members', 'mem count', 'lives', 'member count'],
    issueDate: ['issue date', 'effective date', 'policy start date', 'policy start'],
    // Life statements (e.g. CoreBridge) often map Due Date / Tran Date into Paid to Date.
    paidToDate: [
      'paid to date',
      'paid-to date',
      'commission month',
      'statement date',
      'prem month',
      'due date',
      'tran date',
      'activity for period ending',
    ],
    // Prefer specific headers — bare "commission" matches "Commission %" and is too broad.
    grossComm: ['gross comm', 'gross commission', 'earned commission', 'commission amount'],
    chargeback: ['chargeback', 'charge back', 'chargebacks'],
  },
  expectedAfterExtract: {
    status: 'Waiting',
    stage: 'Review',
  },
  completedStage: 'Completed',
  commissionTolerance: 0.02,
  /** Row background that marks a line to skip */
  skipRowBackgroundRgb: 'rgb(239, 68, 68)',
  skipRowBackgroundHex: '#ef4444',
  periodTabs: {
    // Require "M1-12" / "M13" word boundary so "M13…" never matches the M1-12 locator.
    m1To12: /\bM\s*1\s*[-–]\s*12\b/i,
    m13NoLimit: /\bM\s*13\s*[-–]?\s*No\s*Limit/i,
  },
} as const;
