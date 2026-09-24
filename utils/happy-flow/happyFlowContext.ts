import type { HappyFlowProductData } from '../../test-data/happy-flow/happyFlow001';
import type { PreparedHappyFlowCsv } from './happyFlowCsvPrep';

export type HappyFlowUploadState = {
  fileId: string;
  fileName: string;
  uploadedByTag: string;
};

let productData: HappyFlowProductData | null = null;
let csvData: PreparedHappyFlowCsv | null = null;
let uploadState: HappyFlowUploadState | null = null;
let batchId: string | null = null;

export function setHappyFlowProductData(data: HappyFlowProductData): void {
  productData = data;
}

export function getHappyFlowProductData(): HappyFlowProductData {
  if (!productData) {
    throw new Error('Happy flow product data not prepared — run "happy flow 001 product data is prepared" first');
  }
  return productData;
}

export function setHappyFlowCsvData(data: PreparedHappyFlowCsv): void {
  csvData = data;
}

export function getHappyFlowCsvData(): PreparedHappyFlowCsv {
  if (!csvData) {
    throw new Error('Happy flow CSV not prepared — run "the happy flow CSV file is prepared" first');
  }
  return csvData;
}

export function setHappyFlowUploadState(state: HappyFlowUploadState): void {
  uploadState = state;
}

export function getHappyFlowUploadState(): HappyFlowUploadState {
  if (!uploadState) {
    throw new Error('Happy flow upload not captured — run capture step first');
  }
  return uploadState;
}

export function setHappyFlowBatchId(id: string): void {
  batchId = id;
}

export function getHappyFlowBatchId(): string {
  if (!batchId) {
    throw new Error('Happy flow batch id not captured — run capture batch id step first');
  }
  return batchId;
}

export function clearHappyFlowContext(): void {
  productData = null;
  csvData = null;
  uploadState = null;
  batchId = null;
}
