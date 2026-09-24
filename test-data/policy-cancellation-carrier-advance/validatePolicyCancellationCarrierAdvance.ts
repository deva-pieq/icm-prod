import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const POLICY_CANCELLATION_CARRIER_ADVANCE = {
  templateFileName: '[MLB]AdvanceStatement-PolicyCancellation-CarrierAdvance[Advance].xlsx',
  recoveryTemplateFileName: '[MLB]AdvanceStatement-PolicyCancellation-CarrierAdvance[Recovery].xlsx',
  chargebackTemplateFileName: '[MLB]AdvanceStatement-PolicyCancellation-CarrierAdvance[Cancellation].xlsx',
  templateDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'PolicyCancellationCarrierAdvance'),
  generatedDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'PolicyCancellationCarrierAdvance', '.generated'),
  statementType: 'Aetna ACA',
  carrierName: 'Aetna ACA',
  // First data-row Customer UID in the advance template is
  // "ATENA-ADVX-PC-CA-XTESTX-A003" — prefix + 3-digit zero padding.
  customerUidPrefix: 'ATENA-ADVX-PC-CA-XTESTX-A',
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

export function policyCancellationCarrierAdvanceTemplatePath(): string {
  return path.join(
    POLICY_CANCELLATION_CARRIER_ADVANCE.templateDir,
    POLICY_CANCELLATION_CARRIER_ADVANCE.templateFileName,
  );
}

export function policyCancellationCarrierAdvanceRecoveryTemplatePath(): string {
  return path.join(
    POLICY_CANCELLATION_CARRIER_ADVANCE.templateDir,
    POLICY_CANCELLATION_CARRIER_ADVANCE.recoveryTemplateFileName,
  );
}

export function policyCancellationCarrierAdvanceChargebackTemplatePath(): string {
  return path.join(
    POLICY_CANCELLATION_CARRIER_ADVANCE.templateDir,
    POLICY_CANCELLATION_CARRIER_ADVANCE.chargebackTemplateFileName,
  );
}
