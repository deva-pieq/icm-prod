import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const STATEMENT_PROCESSING = {
  templateFileName: '[MLB NEW]HappyFlowChangeCheckRunDate.xlsx',
  // No TestFiles-prod-sanity/StatementProcessing variant — keeps pre-prod template.
  templateDir: path.join(projectRoot, 'TestFiles', 'StatementProcessing'),
  generatedDir: path.join(projectRoot, 'TestFiles', 'StatementProcessing', '.generated'),
  statementType: 'Aetna ACA',
  carrierName: 'Aetna',
  customerUidPrefix: 'IANG12370001IL',
  customerUidPad: 3,
  reviewHeading: 'Review Statement File',
  reconciliationHeading: 'Commission Reconciliation',
  needsAttentionHeading: 'Needs Attention',
  columns: {
    customerUid: 'Customer UID',
    agentNpn: 'Selling agent NPN',
    agentLastName: 'Selling agent last name',
    productName: 'Scale name/adjustment description',
    grossCompensation: 'Gross compensation',
    netCompensation: 'Net compensation',
    state: 'Customer contract state',
    premium: 'Premium',
    effectiveDate: 'Customer effective date',
    checkRunDate: 'Check run date',
  },
  gridColumns: {
    uploaded: 'Uploaded',
    status: 'Status',
    stage: 'Stage',
    fileName: 'File Name',
    fileId: 'File ID',
  },
  uploadPoll: {
    maxAttempts: 30,
    intervalMs: 2_000,
  },
  reviewPoll: {
    maxAttempts: 15,
    intervalMs: 2_000,
  },
  expectedAfterExtract: {
    status: 'Waiting',
    stage: 'Review',
  },
  completedStage: 'Completed',
  needsAttentionStage: 'Needs Attention',
  /** Large-file scenario needs a longer extract poll window (1000+ rows). */
  largeFilePoll: {
    maxAttempts: 60,
    intervalMs: 3_000,
  },
  grossCommissionTolerance: 0.02,
} as const;

export function statementProcessingTemplatePath(): string {
  return path.join(STATEMENT_PROCESSING.templateDir, STATEMENT_PROCESSING.templateFileName);
}
