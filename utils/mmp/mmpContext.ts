import type { AgentData } from '../agent-activation/agentActivation';

export type MmpPreparedFile = {
  absolutePath: string;
  fileName: string;
  carrierName: string;
  customerUid: string;
  agentId: string;
  productName: string;
  recordCount: number;
};

export type MmpContext = {
  agent: AgentData | null;
  /** True after create+activate+LVL1+default MMP — reused across @validate-mmp scenarios. */
  agentSetupComplete: boolean;
  activationUrl: string;
  preparedFile1: MmpPreparedFile | null;
  preparedFile2: MmpPreparedFile | null;
  fileId1: string;
  fileId2: string;
  productName: string;
  contributionAmount: number;
};

let _ctx: MmpContext = {
  agent: null,
  agentSetupComplete: false,
  activationUrl: '',
  preparedFile1: null,
  preparedFile2: null,
  fileId1: '',
  fileId2: '',
  productName: '',
  contributionAmount: 2000,
};

export function setMmpAgent(agent: AgentData): void {
  _ctx.agent = agent;
}

export function getMmpAgent(): AgentData {
  if (!_ctx.agent) {
    throw new Error('MMP agent not set — create agent first');
  }
  return _ctx.agent;
}

export function setMmpActivationUrl(url: string): void {
  _ctx.activationUrl = url;
}

export function getMmpActivationUrl(): string {
  if (!_ctx.activationUrl) {
    throw new Error('MMP activation URL not set — wait for gmail after create');
  }
  return _ctx.activationUrl;
}

export function setMmpPreparedFile1(file: MmpPreparedFile): void {
  _ctx.preparedFile1 = file;
  if (file.productName) _ctx.productName = file.productName;
}

export function getMmpPreparedFile1(): MmpPreparedFile {
  if (!_ctx.preparedFile1) {
    throw new Error('MMP file1 not prepared');
  }
  return _ctx.preparedFile1;
}

export function setMmpPreparedFile2(file: MmpPreparedFile): void {
  _ctx.preparedFile2 = file;
  if (file.productName) _ctx.productName = file.productName;
}

export function getMmpPreparedFile2(): MmpPreparedFile {
  if (!_ctx.preparedFile2) {
    throw new Error('MMP file2 not prepared');
  }
  return _ctx.preparedFile2;
}

export function setMmpFileId1(fileId: string): void {
  _ctx.fileId1 = fileId;
}

export function getMmpFileId1(): string {
  if (!_ctx.fileId1) {
    throw new Error('MMP fileId1 not captured');
  }
  return _ctx.fileId1;
}

export function setMmpFileId2(fileId: string): void {
  _ctx.fileId2 = fileId;
}

export function getMmpFileId2(): string {
  if (!_ctx.fileId2) {
    throw new Error('MMP fileId2 not captured');
  }
  return _ctx.fileId2;
}

export function getMmpProductName(): string {
  if (!_ctx.productName) {
    throw new Error('MMP product name not set — prepare statement first');
  }
  return _ctx.productName;
}

export function setMmpContributionAmount(amount: number): void {
  _ctx.contributionAmount = amount;
}

export function getMmpContributionAmount(): number {
  return _ctx.contributionAmount;
}

export function isMmpAgentSetupComplete(): boolean {
  return _ctx.agentSetupComplete && _ctx.agent != null;
}

export function markMmpAgentSetupComplete(): void {
  _ctx.agentSetupComplete = true;
}

/** Clear per-scenario file/upload state; keep shared agent. */
export function clearMmpScenarioArtifacts(): void {
  _ctx.preparedFile1 = null;
  _ctx.preparedFile2 = null;
  _ctx.fileId1 = '';
  _ctx.fileId2 = '';
  _ctx.productName = '';
  _ctx.contributionAmount = 2000;
}

export function clearMmpContext(): void {
  _ctx = {
    agent: null,
    agentSetupComplete: false,
    activationUrl: '',
    preparedFile1: null,
    preparedFile2: null,
    fileId1: '',
    fileId2: '',
    productName: '',
    contributionAmount: 2000,
  };
}
