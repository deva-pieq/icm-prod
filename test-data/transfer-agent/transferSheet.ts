import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const TRANSFER_SHEET = {
  templateFileName: '[MLB New]EditThis[TransferAgent].xlsx',
  templateDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'TransferSheets'),
  generatedDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'TransferSheets', '.generated'),
  carrierName: 'Aetna',
  statementType: 'Aetna ACA',
  productName: 'Aetna-Test-Product',
  transferAgent: {
    firstName: 'Agent',
    lastName: 'Test Transfer',
    fullName: 'Test Transfer Agent',
    npn: '120876543',
  },
  gridColumns: {
    agent: 'Agent as per Statement',
    product: 'Product',
    effectiveDate: 'Effective Date',
    status: 'Status',
    fileName: 'File Name',
    fileId: 'File ID',
    stage: 'Stage',
    uploaded: 'Uploaded',
  },
  status: {
    active: 'Active',
    waiting: 'Waiting',
    needAttention: 'Need Attention',
    unmatched: 'Unmatched',
    policyTransfer: 'Policy Transfer',
  },
  reviewHeading: 'Review Statement File',
  commissionDetailsHeading: 'Commission Details',
  /** Scale name / adjustment description column — policy number for auto-reconcile. */
  policyNumberColumn: 'scale name/adjustment description',
  contextKeys: {
    commissionAmt: 'commission-amt',
  },
} as const;

export function transferSheetTemplatePath(): string {
  return path.join(TRANSFER_SHEET.templateDir, TRANSFER_SHEET.templateFileName);
}
