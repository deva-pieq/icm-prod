import type { StatementProcessingPreparedFile } from '../statement-processing/statementProcessingContext';

export type SalesLeaderKpiBaseline = {
  totalGrossCommission: number;
  totalNewPolicies: number;
  avgPerPolicy: number;
};

export type SalesLeaderDashboardUploadState = {
  fileId: string;
  fileName: string;
  stage: string;
};

let _prepared: StatementProcessingPreparedFile | null = null;
let _uploadState: SalesLeaderDashboardUploadState | null = null;
let _baseline: SalesLeaderKpiBaseline | null = null;

export function setSalesLeaderPreparedFile(value: StatementProcessingPreparedFile): void {
  _prepared = value;
}

export function getSalesLeaderPreparedFile(): StatementProcessingPreparedFile {
  if (!_prepared) {
    throw new Error(
      'No sales leader dashboard prepared file stored — run the prep step first',
    );
  }
  return _prepared;
}

export function setSalesLeaderUploadState(value: SalesLeaderDashboardUploadState): void {
  _uploadState = value;
}

export function getSalesLeaderUploadState(): SalesLeaderDashboardUploadState {
  if (!_uploadState) {
    throw new Error('No sales leader dashboard upload state stored');
  }
  return _uploadState;
}

export function setSalesLeaderKpiBaseline(value: SalesLeaderKpiBaseline): void {
  _baseline = value;
}

export function getSalesLeaderKpiBaseline(): SalesLeaderKpiBaseline {
  if (!_baseline) {
    throw new Error('No sales leader KPI baseline captured — capture KPIs before upload');
  }
  return _baseline;
}

export function clearSalesLeaderDashboardContext(): void {
  _prepared = null;
  _uploadState = null;
  _baseline = null;
}
