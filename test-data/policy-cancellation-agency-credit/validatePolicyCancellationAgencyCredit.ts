import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const POLICY_CANCELLATION_AGENCY_CREDIT = {
  templateFileName: '[MLB]AdvanceStatement-PolicyCancellation-AgencyCredit[Advance].xlsx',
  recoveryTemplateFileName: '[MLB]AdvanceStatement-PolicyCancellation-AgencyCredit[Recovery].xlsx',
  chargebackTemplateFileName: '[MLB]AdvanceStatement-PolicyCancellation-AgencyCredit[Cancellation].xlsx',
  templateDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'PolicyCancellationCarrierAgencyCredit'),
  generatedDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'PolicyCancellationCarrierAgencyCredit', '.generated'),
  statementType: 'Aetna ACA',
  carrierName: 'Aetna ACA',
  // First data-row Customer UID in the advance template is
  // "ATENA-ADV-PC-AGC-TEST-X01" — prefix + 2-digit zero padding.
  customerUidPrefix: 'ATENA-ADV-PC-AGC-TEST-X',
  customerUidPad: 2,
  reviewHeading: 'Review Statement File',
  reconciliationHeading: 'Commission Reconciliation',
  columns: {
    customerUid: 'Customer UID',
    agentId: 'Selling agent NPN',
    productName: 'Scale name/adjustment description',
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
  statementHistoryTooltip: {
    exception: 'commission amount or period not matched',
    cancellation: 'policy cancellation',
  },
  agencyInfoBannerText:
    'Carrier Advance Received for this Policy and it was not paid to the Agent, And it was credited To the agency',
  reconcileRationale: 'automation-policy-cancellation-agency-credit',
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

export function policyCancellationAgencyCreditTemplatePath(): string {
  return path.join(
    POLICY_CANCELLATION_AGENCY_CREDIT.templateDir,
    POLICY_CANCELLATION_AGENCY_CREDIT.templateFileName,
  );
}

export function policyCancellationAgencyCreditRecoveryTemplatePath(): string {
  return path.join(
    POLICY_CANCELLATION_AGENCY_CREDIT.templateDir,
    POLICY_CANCELLATION_AGENCY_CREDIT.recoveryTemplateFileName,
  );
}

export function policyCancellationAgencyCreditChargebackTemplatePath(): string {
  return path.join(
    POLICY_CANCELLATION_AGENCY_CREDIT.templateDir,
    POLICY_CANCELLATION_AGENCY_CREDIT.chargebackTemplateFileName,
  );
}
