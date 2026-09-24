let lastSavedPolicyNo: string | null = null;
let lastEditedPolicyNo: string | null = null;
let lastSearchTerm: string | null = null;
let lastSelectedProduct: string | null = null;
let lastExportFilename: string | null = null;
let commissionPreviewClicked = false;
let commissionSaveClicked = false;
let commissionMonthRangeSet = false;
let commissionPercentageMaxEntered = false;

export function setLastSavedPolicyNo(policyNo: string): void {
  lastSavedPolicyNo = policyNo;
}

export function getLastSavedPolicyNo(): string {
  if (!lastSavedPolicyNo) {
    throw new Error('No policy number saved in this scenario yet');
  }
  return lastSavedPolicyNo;
}

export function setLastEditedPolicyNo(policyNo: string): void {
  lastEditedPolicyNo = policyNo;
}

export function getLastEditedPolicyNo(): string {
  if (!lastEditedPolicyNo) {
    throw new Error('No policy number edited in this scenario yet');
  }
  return lastEditedPolicyNo;
}

export function setPolicyMasterSearchTerm(term: string): void {
  lastSearchTerm = term;
}

export function getPolicyMasterSearchTerm(): string {
  if (!lastSearchTerm) {
    throw new Error('No search term captured from the policy grid yet');
  }
  return lastSearchTerm;
}

export function setPolicyMasterSelectedProduct(product: string): void {
  lastSelectedProduct = product;
}

export function getPolicyMasterSelectedProduct(): string {
  if (!lastSelectedProduct) {
    throw new Error('No product selected on the policy form yet');
  }
  return lastSelectedProduct;
}

export function setLastExportFilename(filename: string): void {
  lastExportFilename = filename;
}

export function getLastExportFilename(): string {
  if (!lastExportFilename) {
    throw new Error('No export download captured yet');
  }
  return lastExportFilename;
}

export function setCommissionPreviewClicked(value: boolean): void {
  commissionPreviewClicked = value;
}

export function wasCommissionPreviewClicked(): boolean {
  return commissionPreviewClicked;
}

export function setCommissionSaveClicked(value: boolean): void {
  commissionSaveClicked = value;
}

export function wasCommissionSaveClicked(): boolean {
  return commissionSaveClicked;
}

export function setCommissionMonthRangeSet(value: boolean): void {
  commissionMonthRangeSet = value;
}

export function wasCommissionMonthRangeSet(): boolean {
  return commissionMonthRangeSet;
}

export function setCommissionPercentageMaxEntered(value: boolean): void {
  commissionPercentageMaxEntered = value;
}

export function wasCommissionPercentageMaxEntered(): boolean {
  return commissionPercentageMaxEntered;
}

export function clearPolicyMasterContext(): void {
  lastSavedPolicyNo = null;
  lastEditedPolicyNo = null;
  lastSearchTerm = null;
  lastSelectedProduct = null;
  lastExportFilename = null;
  commissionPreviewClicked = false;
  commissionSaveClicked = false;
  commissionMonthRangeSet = false;
  commissionPercentageMaxEntered = false;
}