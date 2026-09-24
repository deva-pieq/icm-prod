import type { PaymentModuleCycle } from '../../test-data/payment-module/paymentModule';
import type { PaymentModulePreparedCycle } from './paymentModuleExcelPrep';

export type PaymentModuleContext = {
  cycle: PaymentModuleCycle;
  paymentMethod: 'Check' | 'ACH';
  customerUid: string;
  agentId: string;
  nbFileName: string;
  nbFilePath: string;
  rnFileName: string;
  rnFilePath: string;
  nbFileId?: string;
  rnFileId?: string;
  /** Net Settlement from Payables process summary (T005). */
  capturedAmount?: string;
  /** Net Disbursement from Approval batch detail (T006). */
  capturedNetDisbursement?: string;
  batchId?: string;
  /** True after NB+RN upload+complete-review finished for this cycle (shared across scenarios). */
  statementsReady?: boolean;
};

let ctx: PaymentModuleContext | null = null;

export function setPaymentModuleContext(next: PaymentModuleContext): void {
  ctx = next;
}

export function setPaymentModuleFromPrepared(prepared: PaymentModulePreparedCycle): void {
  ctx = {
    cycle: prepared.cycle,
    paymentMethod: prepared.paymentMethod,
    customerUid: prepared.customerUid,
    agentId: prepared.agentId,
    nbFileName: prepared.nb.fileName,
    nbFilePath: prepared.nb.absolutePath,
    rnFileName: prepared.rn.fileName,
    rnFilePath: prepared.rn.absolutePath,
  };
}

export function getPaymentModuleContext(): PaymentModuleContext {
  if (!ctx) {
    throw new Error('Payment module context is empty — prepare the cycle files first');
  }
  return ctx;
}

/** Returns null when cycle files have not been prepared yet. */
export function tryGetPaymentModuleContext(): PaymentModuleContext | null {
  return ctx;
}

export function markPaymentModuleStatementsReady(): void {
  getPaymentModuleContext().statementsReady = true;
}

export function arePaymentModuleStatementsReady(cycle: PaymentModuleCycle): boolean {
  return Boolean(ctx?.statementsReady && ctx.cycle === cycle);
}

export function setPaymentModuleNbFileId(fileId: string): void {
  getPaymentModuleContext().nbFileId = fileId;
}

export function setPaymentModuleRnFileId(fileId: string): void {
  getPaymentModuleContext().rnFileId = fileId;
}

export function setCapturedAmount(amount: string): void {
  getPaymentModuleContext().capturedAmount = amount;
}

export function getCapturedAmount(): string {
  const amount = getPaymentModuleContext().capturedAmount;
  if (!amount) {
    throw new Error('Net Settlement amount was not captured yet');
  }
  return amount;
}

export function setCapturedNetDisbursement(amount: string): void {
  getPaymentModuleContext().capturedNetDisbursement = amount;
}

export function getCapturedNetDisbursement(): string {
  const amount = getPaymentModuleContext().capturedNetDisbursement;
  if (!amount) {
    throw new Error('Net Disbursement amount was not captured yet on Approval');
  }
  return amount;
}

export function setBatchId(batchId: string): void {
  getPaymentModuleContext().batchId = batchId;
}

export function getBatchId(): string {
  const batchId = getPaymentModuleContext().batchId;
  if (!batchId) {
    throw new Error('Batch id was not captured yet');
  }
  return batchId;
}

export function clearPaymentModuleContext(): void {
  ctx = null;
}
