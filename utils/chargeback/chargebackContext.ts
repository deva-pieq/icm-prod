export type ChargebackContext = {
  policyNumber: string;
  timestamp: number;
  nbFilePath: string;
  nbFileName: string;
  nbFileId: string;
  agentId: string;
  productName: string;
  carrierName: string;
  activeRcVariant: '' | 'RC1' | 'RC2' | 'RC3';
  rc1FilePath: string;
  rc1FileName: string;
  rc1FileId: string;
  rc2FilePath: string;
  rc2FileName: string;
  rc2FileId: string;
  rc3FilePath: string;
  rc3FileName: string;
  rc3FileId: string;
};

let _ctx: ChargebackContext = {
  policyNumber: '',
  timestamp: 0,
  nbFilePath: '',
  nbFileName: '',
  nbFileId: '',
  agentId: '',
  productName: '',
  carrierName: '',
  activeRcVariant: '',
  rc1FilePath: '',
  rc1FileName: '',
  rc1FileId: '',
  rc2FilePath: '',
  rc2FileName: '',
  rc2FileId: '',
  rc3FilePath: '',
  rc3FileName: '',
  rc3FileId: '',
};

export function setPolicyNumber(value: string): void {
  _ctx.policyNumber = value;
}
export function getPolicyNumber(): string {
  if (!_ctx.policyNumber) throw new Error('Policy number not set — run NB statement preparation first');
  return _ctx.policyNumber;
}

export function setTimestamp(value: number): void {
  _ctx.timestamp = value;
}
export function getTimestamp(): number {
  if (!_ctx.timestamp) throw new Error('Timestamp not set — run NB statement preparation first');
  return _ctx.timestamp;
}

export function setNbFilePath(value: string): void {
  _ctx.nbFilePath = value;
}
export function getNbFilePath(): string {
  if (!_ctx.nbFilePath) throw new Error('NB file path not set');
  return _ctx.nbFilePath;
}

export function setNbFileName(value: string): void {
  _ctx.nbFileName = value;
}
export function getNbFileName(): string {
  if (!_ctx.nbFileName) throw new Error('NB file name not set');
  return _ctx.nbFileName;
}

export function setNbFileId(value: string): void {
  _ctx.nbFileId = value;
}
export function getNbFileId(): string {
  if (!_ctx.nbFileId) throw new Error('NB file ID not set');
  return _ctx.nbFileId;
}

export function setAgentId(value: string): void {
  _ctx.agentId = value;
}
export function getAgentId(): string {
  return _ctx.agentId;
}

export function setProductName(value: string): void {
  _ctx.productName = value;
}
export function getProductName(): string {
  return _ctx.productName;
}

export function setCarrierName(value: string): void {
  _ctx.carrierName = value;
}
export function getCarrierName(): string {
  return _ctx.carrierName;
}

export function setActiveRcVariant(value: '' | 'RC1' | 'RC2' | 'RC3'): void {
  _ctx.activeRcVariant = value;
}
export function getActiveRcVariant(): 'RC1' | 'RC2' | 'RC3' {
  if (!_ctx.activeRcVariant) throw new Error('Active RC variant not set');
  return _ctx.activeRcVariant;
}

export function setRcFilePath(variant: 'RC1' | 'RC2' | 'RC3', value: string): void {
  if (variant === 'RC1') _ctx.rc1FilePath = value;
  else if (variant === 'RC2') _ctx.rc2FilePath = value;
  else _ctx.rc3FilePath = value;
}
export function getRcFilePath(variant: 'RC1' | 'RC2' | 'RC3'): string {
  const value =
    variant === 'RC1' ? _ctx.rc1FilePath : variant === 'RC2' ? _ctx.rc2FilePath : _ctx.rc3FilePath;
  if (!value) throw new Error(`${variant} file path not set`);
  return value;
}

export function setRcFileName(variant: 'RC1' | 'RC2' | 'RC3', value: string): void {
  if (variant === 'RC1') _ctx.rc1FileName = value;
  else if (variant === 'RC2') _ctx.rc2FileName = value;
  else _ctx.rc3FileName = value;
}
export function getRcFileName(variant: 'RC1' | 'RC2' | 'RC3'): string {
  const value =
    variant === 'RC1' ? _ctx.rc1FileName : variant === 'RC2' ? _ctx.rc2FileName : _ctx.rc3FileName;
  if (!value) throw new Error(`${variant} file name not set`);
  return value;
}

export function setRcFileId(variant: 'RC1' | 'RC2' | 'RC3', value: string): void {
  if (variant === 'RC1') _ctx.rc1FileId = value;
  else if (variant === 'RC2') _ctx.rc2FileId = value;
  else _ctx.rc3FileId = value;
}
export function getRcFileId(variant: 'RC1' | 'RC2' | 'RC3'): string {
  const value =
    variant === 'RC1' ? _ctx.rc1FileId : variant === 'RC2' ? _ctx.rc2FileId : _ctx.rc3FileId;
  if (!value) throw new Error(`${variant} file ID not set`);
  return value;
}

export function getActiveRcFileId(): string {
  return getRcFileId(getActiveRcVariant());
}

export function getActiveRcFileName(): string {
  return getRcFileName(getActiveRcVariant());
}

export function clearChargebackContext(): void {
  _ctx = {
    policyNumber: '',
    timestamp: 0,
    nbFilePath: '',
    nbFileName: '',
    nbFileId: '',
    agentId: '',
    productName: '',
    carrierName: '',
    activeRcVariant: '',
    rc1FilePath: '',
    rc1FileName: '',
    rc1FileId: '',
    rc2FilePath: '',
    rc2FileName: '',
    rc2FileId: '',
    rc3FilePath: '',
    rc3FileName: '',
    rc3FileId: '',
  };
}
