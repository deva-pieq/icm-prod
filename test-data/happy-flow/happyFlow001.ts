import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

/** Run-date stamp for happy-flow-001 product names (e.g. 04Jun2026-143015). */
export function happyFlowRunDateStamp(d = new Date()): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
  const day = String(d.getDate()).padStart(2, '0');
  const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join('');
  return `${day}${months[d.getMonth()]}${d.getFullYear()}-${time}`;
}

/** Carrier product name suffix (e.g. 2026-jun-4-140512-aetna-test-aca-u65). */
export function happyFlowCarrierProductName(d = new Date()): string {
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
  const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join('');
  return `${d.getFullYear()}-${monthNames[d.getMonth()]}-${d.getDate()}-${time}-aetna-test-aca-u65`;
}

export type HappyFlowProductData = {
  carrierName: string;
  lineOfBusiness: string;
  productType: string;
  productName: string;
  productCode: string;
  carrierProductName: string;
  effectiveDate: string;
};

export const HAPPY_FLOW_001 = {
  carrierName: 'Aetna',
  lineOfBusiness: 'Health',
  productType: 'ACA',
  effectiveDate: '01/01/2021',
  commissionType: 'Commission',
  policyPeriodSlabs: '10',
  commissionTemplate: 'ACA - Carrier with OVR - Regular',
  messages: {
    rulePublished: 'Rule published successfully',
  },
  gridColumns: {
    productName: 'Product',
  },
} as const;

export const HAPPY_FLOW_CSV = {
  templateFileName: 'HappyFlow1TestData.csv',
  // No TestFiles-prod-sanity/HappyFlowE2E variant — keeps pre-prod template.
  templateDir: path.join(projectRoot, 'TestFiles', 'HappyFlowE2E'),
  generatedDir: path.join(projectRoot, 'TestFiles', 'HappyFlowE2E', '.generated'),
  statementType: 'Aetna ACA',
  columns: {
    customerUid: 'Customer UID',
    scaleName: 'Scale name/adjustment description',
  },
} as const;

export const HAPPY_FLOW_STATEMENT = {
  reviewHeading: 'Review Statement File',
  statementType: 'Aetna ACA',
  transactionType: 'NB',
  gridColumns: {
    uploaded: 'Uploaded',
    status: 'Status',
    stage: 'Stage',
    fileName: 'File Name',
    fileId: 'File ID',
    transactionType: 'Transaction Type',
  },
  warningTooltip: {
    policyNumber: 'Policy Number',
    newPolicy: 'New Policy',
  },
  paymentStatus: 'Payment Status',
  readyForPayment: 'Ready for Payment',
} as const;

export const HAPPY_FLOW_PAYMENT = {
  removeAgentsBelow: 'Remove agents below $25.00 to proceed',
  disbursementHistoryTitle: 'Disbursement History',
  finalizedSettlement: 'Finalized Settlement',
} as const;

export function happyFlowCsvTemplatePath(): string {
  return path.join(HAPPY_FLOW_CSV.templateDir, HAPPY_FLOW_CSV.templateFileName);
}

export function buildHappyFlowProductData(d = new Date()): HappyFlowProductData {
  const stamp = happyFlowRunDateStamp(d);
  return {
    carrierName: HAPPY_FLOW_001.carrierName,
    lineOfBusiness: HAPPY_FLOW_001.lineOfBusiness,
    productType: HAPPY_FLOW_001.productType,
    productName: `Atena-ACA-Test-${stamp}`,
    productCode: `Atena-ACA-U65-Test-${stamp}`,
    carrierProductName: happyFlowCarrierProductName(d),
    effectiveDate: HAPPY_FLOW_001.effectiveDate,
  };
}
