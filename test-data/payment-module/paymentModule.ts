import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export type PaymentModuleCycle = 'CHK' | 'ACH';

export const PAYMENT_MODULE = {
  templateDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'PaymentModule'),
  generatedDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'PaymentModule', '.generated'),
  statementType: 'Aetna ACA',
  environment: 'MLB New',
  opsManager: {
    email: 'deva.r+ag3@pieq.ai',
  },
  agents: {
    CHK: {
      agentId: '600002',
      email: 'deva.r+ag+l2@pieq.ai',
      paymentMethod: 'Check' as const,
    },
    ACH: {
      agentId: '600001',
      email: 'deva.r+ag+l1@pieq.ai',
      paymentMethod: 'ACH' as const,
    },
  },
  customerUidPrefix: {
    CHK: 'AETNA-PAY-TEST-CHK-',
    ACH: 'AETNA-PAY-TEST-ACH-',
  },
  customerUidPad: 3,
  templates: {
    CHK: {
      nb: '[MLB][NB]PaymentModule-CHK.xlsx',
      rn: '[MLB][RN]PaymentModule-CHK.xlsx',
      subDir: 'CHK',
    },
    ACH: {
      nb: '[MLB][NB]PaymentModule-ACH.xlsx',
      rn: '[MLB][RN]PaymentModule-ACH.xlsx',
      subDir: 'ACH',
    },
  },
  generatedFilePrefix: {
    CHK: '[MLB]PaymentModule-CHK',
    ACH: '[MLB]PaymentModule-ACH',
  },
  reviewHeading: 'Review Statement File',
  columns: {
    customerUid: 'Customer UID',
    agentNpn: 'Selling agent NPN',
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
    maxAttempts: 20,
    intervalMs: 2_000,
  },
  expectedAfterExtract: {
    status: 'Waiting',
    stage: 'Review',
  },
  completedStage: 'Completed',
} as const;

export function paymentModuleTemplatePath(
  cycle: PaymentModuleCycle,
  kind: 'nb' | 'rn',
): string {
  const cfg = PAYMENT_MODULE.templates[cycle];
  return path.join(PAYMENT_MODULE.templateDir, cfg.subDir, cfg[kind]);
}
