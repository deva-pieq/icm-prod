import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const STATEMENT_PROCESSING = {
  templateFileName: '[MLB NEW]HappyFlowChangeCheckRunDate.xlsx',
  templateDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'StatementProcessing'),
  generatedDir: path.join(
    projectRoot,
    'TestFiles-prod-sanity',
    'StatementProcessing',
    '.generated',
  ),
  statementType: 'Aetna ACA',
  carrierName: 'Aetna',
  /**
   * Prod seed for real-processing uploads (SP-001/002/003/006/007/008/009).
   * Scale name cell must be the **alias** (carrier product name), not display name.
   * SP-004 blank UID + SP-005 invalid format must NOT overwrite these.
   */
  seed: {
    // Prefer Active agent WITHOUT carrier-advance eligibility.
    // 600011 (test-AgentX) has advance enabled → Needs Attention on commission.
    // ProdSL 843401317 (deva.r+prod+sl@pieq.ai) is Active LVL1, no advance.
    agentFirstName: 'ProdSL',
    agentLastName: 'ProdSL',
    agentNpn: '843401317',
    productAlias: 'test-2025-jan-1-aetna-test-001',
    productDisplayName: 'test-Aetna-Test-Product',
  },
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
