import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const POLICY_CANCELLATION_ADVANCE = {
  templateFileName: '[MLB]AdvanceStatement-PolicyCancellation-AgencyAdvance[Advance].xlsx',
  recoveryTemplateFileName: '[MLB]AdvanceStatement-PolicyCancellation-AgencyAdvance[Recovery].xlsx',
  chargebackTemplateFileName: '[MLB]AdvanceStatement-PolicyCancellation-AgencyAdvance[Cancellation].xlsx',
  templateDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'PolicyCancellationAgencyAdvance'),
  generatedDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'PolicyCancellationAgencyAdvance', '.generated'),
  statementType: 'MLB',
  carrierName: 'MLB',
  customerUidPrefix: 'ATENA-ADVX-PC-AA-TEST-B',
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
  policyLedgerUrl: '/policy',
} as const;

export function policyCancellationTemplatePath(): string {
  return path.join(POLICY_CANCELLATION_ADVANCE.templateDir, POLICY_CANCELLATION_ADVANCE.templateFileName);
}

export function policyCancellationRecoveryTemplatePath(): string {
  return path.join(POLICY_CANCELLATION_ADVANCE.templateDir, POLICY_CANCELLATION_ADVANCE.recoveryTemplateFileName);
}

export function policyCancellationChargebackTemplatePath(): string {
  return path.join(POLICY_CANCELLATION_ADVANCE.templateDir, POLICY_CANCELLATION_ADVANCE.chargebackTemplateFileName);
}
