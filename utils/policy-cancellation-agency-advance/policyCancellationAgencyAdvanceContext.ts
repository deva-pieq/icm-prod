export type PolicyCancellationAgencyAdvanceContext = {
  policyNumber: string;
  timestamp: number;
  preparedFilePath: string;
  preparedFileName: string;
  agentId: string;
  productName: string;
  advanceDefault: string;
  advanceMonthly: number;
  fileId: string;
  recoveryFileId: string;
  recoveryFilePath: string;
  recoveryFileName: string;
  chargebackFileId: string;
  chargebackFilePath: string;
  chargebackFileName: string;
  advanceAmount: number;
  arfValue: number;
  carrierName: string;
  commissionRecoveryCount: number;
  pendingPayment: number;
};

let _ctx: PolicyCancellationAgencyAdvanceContext = {
  policyNumber: '',
  timestamp: 0,
  preparedFilePath: '',
  preparedFileName: '',
  agentId: '',
  productName: '',
  advanceDefault: '',
  advanceMonthly: 0,
  fileId: '',
  recoveryFileId: '',
  recoveryFilePath: '',
  recoveryFileName: '',
  chargebackFileId: '',
  chargebackFilePath: '',
  chargebackFileName: '',
  advanceAmount: 0,
  arfValue: 0,
  carrierName: '',
  commissionRecoveryCount: 0,
  pendingPayment: 0,
};

export function setPolicyNumber(value: string): void { _ctx.policyNumber = value; }
export function getPolicyNumber(): string {
  if (!_ctx.policyNumber) throw new Error('Policy number not set — run statement preparation first');
  return _ctx.policyNumber;
}

export function setTimestamp(value: number): void { _ctx.timestamp = value; }
export function getTimestamp(): number {
  if (!_ctx.timestamp) throw new Error('Timestamp not set — run statement preparation first');
  return _ctx.timestamp;
}

export function setPreparedFilePath(value: string): void { _ctx.preparedFilePath = value; }
export function getPreparedFilePath(): string {
  if (!_ctx.preparedFilePath) throw new Error('Prepared file path not set');
  return _ctx.preparedFilePath;
}

export function setPreparedFileName(value: string): void { _ctx.preparedFileName = value; }
export function getPreparedFileName(): string {
  if (!_ctx.preparedFileName) throw new Error('Prepared file name not set');
  return _ctx.preparedFileName;
}

export function setAgentId(value: string): void { _ctx.agentId = value; }
export function getAgentId(): string {
  if (!_ctx.agentId) throw new Error('Agent ID not set');
  return _ctx.agentId;
}

export function setProductName(value: string): void { _ctx.productName = value; }
export function getProductName(): string {
  if (!_ctx.productName) throw new Error('Product name not set');
  return _ctx.productName;
}

export function setAdvanceDefault(value: string): void { _ctx.advanceDefault = value; }
export function getAdvanceDefault(): string { return _ctx.advanceDefault; }

export function setAdvanceMonthly(value: number): void { _ctx.advanceMonthly = value; }
export function getAdvanceMonthly(): number { return _ctx.advanceMonthly; }

export function setFileId(value: string): void { _ctx.fileId = value; }
export function getFileId(): string {
  if (!_ctx.fileId) throw new Error('File ID not set');
  return _ctx.fileId;
}

export function setRecoveryFileId(value: string): void { _ctx.recoveryFileId = value; }
export function getRecoveryFileId(): string {
  if (!_ctx.recoveryFileId) throw new Error('Recovery file ID not set');
  return _ctx.recoveryFileId;
}

export function setRecoveryFilePath(value: string): void { _ctx.recoveryFilePath = value; }
export function getRecoveryFilePath(): string {
  if (!_ctx.recoveryFilePath) throw new Error('Recovery file path not set');
  return _ctx.recoveryFilePath;
}

export function setRecoveryFileName(value: string): void { _ctx.recoveryFileName = value; }
export function getRecoveryFileName(): string {
  if (!_ctx.recoveryFileName) throw new Error('Recovery file name not set');
  return _ctx.recoveryFileName;
}

export function setChargebackFileId(value: string): void { _ctx.chargebackFileId = value; }
export function getChargebackFileId(): string {
  if (!_ctx.chargebackFileId) throw new Error('Chargeback file ID not set');
  return _ctx.chargebackFileId;
}

export function setChargebackFilePath(value: string): void { _ctx.chargebackFilePath = value; }
export function getChargebackFilePath(): string {
  if (!_ctx.chargebackFilePath) throw new Error('Chargeback file path not set');
  return _ctx.chargebackFilePath;
}

export function setChargebackFileName(value: string): void { _ctx.chargebackFileName = value; }
export function getChargebackFileName(): string {
  if (!_ctx.chargebackFileName) throw new Error('Chargeback file name not set');
  return _ctx.chargebackFileName;
}

export function setAdvanceAmount(value: number): void { _ctx.advanceAmount = value; }
export function getAdvanceAmount(): number {
  if (!_ctx.advanceAmount) throw new Error('Advance amount not set');
  return _ctx.advanceAmount;
}

export function setArfValue(value: number): void { _ctx.arfValue = value; }
export function getArfValue(): number {
  if (!_ctx.arfValue) throw new Error('ARF value not set');
  return _ctx.arfValue;
}

export function setCarrierName(value: string): void { _ctx.carrierName = value; }
export function getCarrierName(): string { return _ctx.carrierName; }

export function setCommissionRecoveryCount(value: number): void { _ctx.commissionRecoveryCount = value; }
export function getCommissionRecoveryCount(): number { return _ctx.commissionRecoveryCount; }
export function incrementCommissionRecoveryCount(): void { _ctx.commissionRecoveryCount++; }

export function setPendingPayment(value: number): void { _ctx.pendingPayment = value; }
export function getPendingPayment(): number {
  if (!_ctx.pendingPayment) throw new Error('Pending payment not set — capture from Advance Overview first');
  return _ctx.pendingPayment;
}

export function clearPolicyCancellationAgencyAdvanceContext(): void {
  _ctx = {
    policyNumber: '', timestamp: 0, preparedFilePath: '', preparedFileName: '',
    agentId: '', productName: '', advanceDefault: '', advanceMonthly: 0,
    fileId: '', recoveryFileId: '', recoveryFilePath: '', recoveryFileName: '',
    chargebackFileId: '', chargebackFilePath: '', chargebackFileName: '',
    advanceAmount: 0, arfValue: 0, carrierName: '', commissionRecoveryCount: 0,
    pendingPayment: 0,
  };
}
