import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

/** Filename pattern: `[Oscar U65 CS]MyFile.csv` → statement type + base name */
export const COMMISSION_TRUTH_FILENAME_PATTERN = /^\[(.+?)\](.+)\.csv$/i;

export const COMMISSION_TRUTH = {
  inboxDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'ValidateCommissionSplit', 'inbox'),
  generatedDir: path.join(
    projectRoot,
    'TestFiles-prod-sanity',
    'ValidateCommissionSplit',
    '.generated',
  ),
  truthSheetDir: path.join(
    projectRoot,
    'TestFiles-prod-sanity',
    'ValidateCommissionSplit',
    'truth-sheets',
  ),
  dateToggleStateFile: path.join(
    projectRoot,
    'TestFiles-prod-sanity',
    'ValidateCommissionSplit',
    '.generated',
    'date-toggle-state.json',
  ),
  truthSheetFilePrefix: 'truthSheet',
  defaultStatementType: 'Oscar U65 CS',
  reviewHeading: 'Review Statement File',
  detailsHeading: 'Commission Details',
  uploadPoll: {
    maxAttempts: 90,
    intervalMs: 3_000,
  },
  gridColumns: {
    uploaded: 'Uploaded',
    status: 'Status',
    stage: 'Stage',
    fileName: 'File Name',
    fileId: 'File ID',
  },
  expectedAfterExtract: {
    status: 'Waiting',
    stage: 'Review',
  },
  completedStage: 'Completed',
  commissionTolerance: 0.02,
} as const;
