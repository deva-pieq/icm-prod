import type { PreparedCommissionReportFile } from './inboxStatementPrep';

export type CommissionReportLineItem = {
  lineItem: number;
  policyNumber: string;
  productName: string;
  grossCommission: number;
  totalMembers: number;
  issueDate: string;
  paidToDate: string;
  monthDiff: number;
  commissionAmount: number;
  agentName: string;
  splitPercentage: number;
  agentValue: number;
  valueTimesMembers: number;
  commissionFromReport: number | null;
  result: 'TRUE' | 'FALSE' | '';
  skipped: boolean;
  skipReason?: string;
};

export type CommissionReportUploadState = {
  fileId: string;
  fileName: string;
  uploadedByTag: string;
  statementType: string;
};

let preparedFile: PreparedCommissionReportFile | null = null;
let uploadState: CommissionReportUploadState | null = null;
let lineItems: CommissionReportLineItem[] = [];

export function setCommissionReportPreparedFile(data: PreparedCommissionReportFile): void {
  preparedFile = data;
}

export function getCommissionReportPreparedFile(): PreparedCommissionReportFile {
  if (!preparedFile) {
    throw new Error(
      'Commission report file not prepared — run inbox preparation step first',
    );
  }
  return preparedFile;
}

export function setCommissionReportUploadState(state: CommissionReportUploadState): void {
  uploadState = state;
}

export function getCommissionReportUploadState(): CommissionReportUploadState {
  if (!uploadState) {
    throw new Error('Commission report upload not captured — run capture step first');
  }
  return uploadState;
}

export function addCommissionReportLineItem(item: CommissionReportLineItem): void {
  lineItems.push(item);
}

export function getCommissionReportLineItems(): CommissionReportLineItem[] {
  return [...lineItems];
}

export function getActiveCommissionReportLineItems(): CommissionReportLineItem[] {
  return lineItems.filter((item) => !item.skipped);
}

export function clearCommissionReportLineItems(): void {
  lineItems = [];
}

export function updateCommissionReportFromReport(
  policyNumber: string,
  commissionFromReport: number,
  tolerance: number,
): CommissionReportLineItem {
  const item = lineItems.find(
    (row) => !row.skipped && row.policyNumber === policyNumber && row.commissionFromReport === null,
  );
  if (!item) {
    throw new Error(`No pending commission report line for policy ${policyNumber}`);
  }
  item.commissionFromReport = commissionFromReport;
  item.result =
    Math.abs(commissionFromReport - item.valueTimesMembers) <= tolerance ? 'TRUE' : 'FALSE';
  return item;
}

export function clearCommissionReportContext(): void {
  preparedFile = null;
  uploadState = null;
  lineItems = [];
}
