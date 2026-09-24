import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const ADVANCE_ADJUSTMENT = {
  templateFileName: '[MLB]AdvanceStatement-AA.xlsx',
  recoveryTemplateFileName: '[MLB]AdvanceStatement-AA [Recovery].xlsx',
  templateDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'AdvanceAndAdjustment'),
  generatedDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'AdvanceAndAdjustment', '.generated'),
  statementType: 'MLB',
  carrierName: 'MLB',
  customerUidPrefix: 'ATENA-ADV-AO-TEST-A',
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

export function advanceAdjustmentTemplatePath(): string {
  return path.join(ADVANCE_ADJUSTMENT.templateDir, ADVANCE_ADJUSTMENT.templateFileName);
}

export function advanceAdjustmentRecoveryTemplatePath(): string {
  return path.join(ADVANCE_ADJUSTMENT.templateDir, ADVANCE_ADJUSTMENT.recoveryTemplateFileName);
}
