let lastSavedTxnId: string | null = null;
let lastAgentCode: string | null = null;

export function setLastSavedTxnId(txnId: string): void {
  lastSavedTxnId = txnId;
}

export function getLastSavedTxnId(): string {
  if (!lastSavedTxnId) {
    throw new Error('No Txn ID saved in this scenario yet');
  }
  return lastSavedTxnId;
}

export function setLastAgentCode(code: string): void {
  lastAgentCode = code;
}

export function getLastAgentCode(): string {
  if (!lastAgentCode) {
    throw new Error('No agent code saved in this scenario yet');
  }
  return lastAgentCode;
}

export function clearMiscellaneousChargesContext(): void {
  lastSavedTxnId = null;
  lastAgentCode = null;
}
