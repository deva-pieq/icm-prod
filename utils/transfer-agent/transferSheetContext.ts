export type TransferSheetContext = {
  fileId: string;
  fileName: string;
  carrierName: string;
  agentCommissionAmount?: string;
  /** Alias from feature file (commission-amt). */
  commissionAmt?: string;
  policyNumber?: string;
  customerUid?: string;
  preparedFilePath?: string;
};

let transferContext: TransferSheetContext | null = null;

export function setTransferContext(ctx: TransferSheetContext): void {
  transferContext = ctx;
}

export function getTransferContext(): TransferSheetContext {
  if (!transferContext) {
    throw new Error('No transfer sheet context stored — run transfer sheet scenario first');
  }
  return transferContext;
}

export function getCommissionAmt(): string {
  const ctx = getTransferContext();
  const amount = ctx.commissionAmt ?? ctx.agentCommissionAmount;
  if (!amount) {
    throw new Error('Commission amount not stored — run "store the agent commission amount" step first');
  }
  return amount;
}

export function clearTransferContext(): void {
  transferContext = null;
}
