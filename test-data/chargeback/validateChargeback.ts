import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const CHARGEBACK = {
  nbTemplateFileName: 'Chargeback+AG1+AetnaACA[NB].xlsx',
  rc1TemplateFileName: 'Chargeback+AG1+AetnaACA[RC1]AsPerSplit.xlsx',
  rc2TemplateFileName: 'Chargeback+AG1+AetnaACA[RC2]Agency.xlsx',
  rc3TemplateFileName: 'Chargeback+AG1+AetnaACA[RC3]Agent.xlsx',
  templateDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'Chargeback'),
  generatedDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'Chargeback', '.generated'),
  statementType: 'Aetna ACA',
  carrierName: 'Aetna',
  customerUidPrefix: 'AETNA-TEST-CBK-',
  customerUidPad: 3,
  reviewHeading: 'Review Statement File',
  chargebackRecoveryHeading: 'Chargeback Recovery Required',
  columns: {
    customerUid: 'Customer UID',
    agentId: 'Selling agent NPN',
    productName: 'Scale name/adjustment description',
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
  policyLedgerUrl: '/policy',
  /** Month offsets so RC batches do not collide with NB / each other. */
  rcCheckRunMonthOffset: {
    RC1: 1,
    RC2: 2,
    RC3: 3,
  },
  recoveryOptions: {
    RC1: {
      radioTestId: 'recovery-option-split-radio',
      rationale: 'test-as-per-split',
      detailMustContain: ['Agency', 'Agent', 'Sales Leader'] as const,
      detailMustNotContain: [] as const,
    },
    RC2: {
      radioTestId: 'recovery-option-agency-radio',
      rationale: 'test-to-agency',
      detailMustContain: ['Agency'] as const,
      detailMustNotContain: ['Agent', 'Sales Leader'] as const,
    },
    RC3: {
      radioTestId: 'recovery-option-agent-radio',
      rationale: 'test-to-agent',
      detailMustContain: ['Agent'] as const,
      detailMustNotContain: ['Agency', 'Sales Leader'] as const,
    },
  },
} as const;

export type ChargebackRcVariant = keyof typeof CHARGEBACK.rcCheckRunMonthOffset;

export function chargebackNbTemplatePath(): string {
  return path.join(CHARGEBACK.templateDir, CHARGEBACK.nbTemplateFileName);
}

export function chargebackRcTemplatePath(variant: ChargebackRcVariant): string {
  const fileName =
    variant === 'RC1'
      ? CHARGEBACK.rc1TemplateFileName
      : variant === 'RC2'
        ? CHARGEBACK.rc2TemplateFileName
        : CHARGEBACK.rc3TemplateFileName;
  return path.join(CHARGEBACK.templateDir, fileName);
}
