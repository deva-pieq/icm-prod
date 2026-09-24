import type { PreparedCommissionTruthFile } from './statementInboxPrep';

export type CommissionTruthLineItem = {
  rowIndex: number;
  productName: string;
  agentLevel: string;
  productCommissionPercent: number;
  grossCompensation: number;
  agentCommission: number;
  calculatedValue: number;
  skipped: boolean;
  skipReason?: string;
};

export type CommissionTruthUploadState = {
  fileId: string;
  fileName: string;
  uploadedByTag: string;
  statementType: string;
};

let preparedFile: PreparedCommissionTruthFile | null = null;
let uploadState: CommissionTruthUploadState | null = null;
let truthLineItems: CommissionTruthLineItem[] = [];

export function setCommissionTruthPreparedFile(data: PreparedCommissionTruthFile): void {
  preparedFile = data;
}

export function getCommissionTruthPreparedFile(): PreparedCommissionTruthFile {
  if (!preparedFile) {
    throw new Error(
      'Commission truth file not prepared — run inbox preparation step first',
    );
  }
  return preparedFile;
}

export function setCommissionTruthUploadState(state: CommissionTruthUploadState): void {
  uploadState = state;
}

export function getCommissionTruthUploadState(): CommissionTruthUploadState {
  if (!uploadState) {
    throw new Error('Commission truth upload not captured — run capture step first');
  }
  return uploadState;
}

export function addCommissionTruthLineItem(item: CommissionTruthLineItem): void {
  truthLineItems.push(item);
}

export function getCommissionTruthLineItems(): CommissionTruthLineItem[] {
  return [...truthLineItems];
}

export function getValidatedCommissionTruthLineItems(): CommissionTruthLineItem[] {
  return truthLineItems.filter((item) => !item.skipped);
}

export function clearCommissionTruthLineItems(): void {
  truthLineItems = [];
}

export function clearCommissionTruthContext(): void {
  preparedFile = null;
  uploadState = null;
  truthLineItems = [];
  clearProductCommissionPercentCache();
}

export type ProductLevelCommissionPercent = {
  level: string;
  agentPercent: number;
};

const productCommissionSplitsByName = new Map<string, ProductLevelCommissionPercent[]>();

export function setProductCommissionPercentCache(
  productName: string,
  splits: ProductLevelCommissionPercent[],
): void {
  productCommissionSplitsByName.set(productName.trim(), splits);
}

export function getProductCommissionPercentCache(
  productName: string,
): ProductLevelCommissionPercent[] | undefined {
  return productCommissionSplitsByName.get(productName.trim());
}

export function hasProductCommissionPercentCache(productName: string): boolean {
  return productCommissionSplitsByName.has(productName.trim());
}

export function getAllProductCommissionPercentCache(): Map<string, ProductLevelCommissionPercent[]> {
  return new Map(productCommissionSplitsByName);
}

export function clearProductCommissionPercentCache(): void {
  productCommissionSplitsByName.clear();
}
