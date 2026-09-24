import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const ADVANCE_RECOVERY = {
  templateFileName: '[MLB]AdvanceStatement-AR.xlsx',
  recoveryTemplateFileName: '[MLB]AdvanceStatement-AR [Recovery].xlsx',
  templateDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'AdvanceAndRecovery'),
  generatedDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'AdvanceAndRecovery', '.generated'),
  statementType: 'MLB',
  carrierName: 'MLB',
  customerUidPrefix: 'ATENA-ADV-AR-TEST-A',
  customerUidPad: 3,
  reviewHeading: 'Review Statement File',
  reconciliationHeading: 'Commission Reconciliation',
  columns: {
    customerUid: 'Customer UID',
    agentId: 'Agent ID',
    productName: 'Product Name Alias',
    grossCompensation: 'Gross compensation',
    commissionAmount: 'Commission amount',
  },
  gridColumns: {
    uploaded: 'Uploaded',
    status: 'Status',
    stage: 'Stage',
    fileName: 'File Name',
    fileId: 'File ID',
  },
  agentGridColumns: {
    agent: 'agent',
    level: 'Level',
  },
  advanceSetupGridColumns: {
    default: 'default',
    monthly: 'monthly',
  },
  warningTooltip: {
    newPolicy: 'New Policy',
  },
  advanceExceptionTooltip:
    'Advance setup exists for this product and the pay-to agent is eligible for carrier advance',
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
  advanceSetupUrl: '/advance/advance-setup',
  advanceOverviewUrl: '/advance/overview',
} as const;

export function advanceRecoveryTemplatePath(): string {
  return path.join(ADVANCE_RECOVERY.templateDir, ADVANCE_RECOVERY.templateFileName);
}

export function advanceRecoveryRecoveryTemplatePath(): string {
  return path.join(ADVANCE_RECOVERY.templateDir, ADVANCE_RECOVERY.recoveryTemplateFileName);
}
