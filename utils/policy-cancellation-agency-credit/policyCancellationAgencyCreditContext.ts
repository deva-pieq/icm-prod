export type PolicyCancellationAgencyCreditContext = {
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
  agencyCredit: number;
  carrierName: string;
  totalChargeback: number;
  totalEarnings: number;
  agencyDebit: number;
};

let _ctx: PolicyCancellationAgencyCreditContext = {
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
  agencyCredit: 0,
  carrierName: '',
  totalChargeback: 0,
  totalEarnings: 0,
  agencyDebit: 0,
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

export function setAgencyCredit(value: number): void { _ctx.agencyCredit = value; }
export function getAgencyCredit(): number {
  if (!_ctx.agencyCredit) throw new Error('Agency Credit value not set — capture from transaction preview first');
  return _ctx.agencyCredit;
}

export function setCarrierName(value: string): void { _ctx.carrierName = value; }
export function getCarrierName(): string { return _ctx.carrierName; }

export function setTotalChargeback(value: number): void { _ctx.totalChargeback = value; }
export function getTotalChargeback(): number {
  if (!_ctx.totalChargeback) throw new Error('Total Chargebacks not set — capture from the Policy Ledger modal first');
  return _ctx.totalChargeback;
}

export function setTotalEarnings(value: number): void { _ctx.totalEarnings = value; }
export function getTotalEarnings(): number {
  if (!_ctx.totalEarnings) throw new Error('Total Earnings not set — capture from the Policy Ledger modal first');
  return _ctx.totalEarnings;
}

export function setAgencyDebit(value: number): void { _ctx.agencyDebit = value; }
export function getAgencyDebit(): number {
  if (!_ctx.agencyDebit) throw new Error('Agency debit value not set — capture from the advance recovery preview first');
  return _ctx.agencyDebit;
}

export function clearPolicyCancellationAgencyCreditContext(): void {
  _ctx = {
    policyNumber: '', timestamp: 0, preparedFilePath: '', preparedFileName: '',
    agentId: '', productName: '', advanceDefault: '', advanceMonthly: 0,
    fileId: '', recoveryFileId: '', recoveryFilePath: '', recoveryFileName: '',
    chargebackFileId: '', chargebackFilePath: '', chargebackFileName: '',
    advanceAmount: 0, agencyCredit: 0, carrierName: '',
    totalChargeback: 0, totalEarnings: 0, agencyDebit: 0,
  };
}
