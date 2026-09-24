export type AdvanceAdjustmentContext = {
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
  advanceAmount: number;
  arfValue: number;
  carrierName: string;
};

let _ctx: AdvanceAdjustmentContext = {
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
  advanceAmount: 0,
  arfValue: 0,
  carrierName: '',
};

export function setPolicyNumber(value: string): void {
  _ctx.policyNumber = value;
}

export function getPolicyNumber(): string {
  if (!_ctx.policyNumber) {
    throw new Error('Policy number not set — run statement preparation first');
  }
  return _ctx.policyNumber;
}

export function setTimestamp(value: number): void {
  _ctx.timestamp = value;
}

export function getTimestamp(): number {
  if (!_ctx.timestamp) {
    throw new Error('Timestamp not set — run statement preparation first');
  }
  return _ctx.timestamp;
}

export function setPreparedFilePath(value: string): void {
  _ctx.preparedFilePath = value;
}

export function getPreparedFilePath(): string {
  if (!_ctx.preparedFilePath) {
    throw new Error('Prepared file path not set — run statement preparation first');
  }
  return _ctx.preparedFilePath;
}

export function setPreparedFileName(value: string): void {
  _ctx.preparedFileName = value;
}

export function getPreparedFileName(): string {
  if (!_ctx.preparedFileName) {
    throw new Error('Prepared file name not set — run statement preparation first');
  }
  return _ctx.preparedFileName;
}

export function setAgentId(value: string): void {
  _ctx.agentId = value;
}

export function getAgentId(): string {
  if (!_ctx.agentId) {
    throw new Error('Agent ID not set — extract from prepared file first');
  }
  return _ctx.agentId;
}

export function setProductName(value: string): void {
  _ctx.productName = value;
}

export function getProductName(): string {
  if (!_ctx.productName) {
    throw new Error('Product name not set — extract from prepared file first');
  }
  return _ctx.productName;
}

export function setAdvanceDefault(value: string): void {
  _ctx.advanceDefault = value;
}

export function getAdvanceDefault(): string {
  return _ctx.advanceDefault;
}

export function setAdvanceMonthly(value: number): void {
  _ctx.advanceMonthly = value;
}

export function getAdvanceMonthly(): number {
  return _ctx.advanceMonthly;
}

export function setFileId(value: string): void {
  _ctx.fileId = value;
}

export function getFileId(): string {
  if (!_ctx.fileId) {
    throw new Error('File ID not set — capture from upload grid first');
  }
  return _ctx.fileId;
}

export function setRecoveryFileId(value: string): void {
  _ctx.recoveryFileId = value;
}

export function getRecoveryFileId(): string {
  if (!_ctx.recoveryFileId) {
    throw new Error('Recovery file ID not set — capture from upload grid first');
  }
  return _ctx.recoveryFileId;
}

export function setRecoveryFilePath(value: string): void {
  _ctx.recoveryFilePath = value;
}

export function getRecoveryFilePath(): string {
  if (!_ctx.recoveryFilePath) {
    throw new Error('Recovery file path not set — run recovery preparation first');
  }
  return _ctx.recoveryFilePath;
}

export function setRecoveryFileName(value: string): void {
  _ctx.recoveryFileName = value;
}

export function getRecoveryFileName(): string {
  if (!_ctx.recoveryFileName) {
    throw new Error('Recovery file name not set — run recovery preparation first');
  }
  return _ctx.recoveryFileName;
}

export function setAdvanceAmount(value: number): void {
  _ctx.advanceAmount = value;
}

export function getAdvanceAmount(): number {
  if (!_ctx.advanceAmount) {
    throw new Error('Advance amount not set — capture from total advance input first');
  }
  return _ctx.advanceAmount;
}

export function setArfValue(value: number): void {
  _ctx.arfValue = value;
}

export function getArfValue(): number {
  if (!_ctx.arfValue) {
    throw new Error('ARF value not set — capture advance amount from total advance input first');
  }
  return _ctx.arfValue;
}

export function setCarrierName(value: string): void {
  _ctx.carrierName = value;
}

export function getCarrierName(): string {
  return _ctx.carrierName;
}

export function clearAdvanceAdjustmentContext(): void {
  _ctx = {
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
    advanceAmount: 0,
    arfValue: 0,
    carrierName: '',
  };
}
