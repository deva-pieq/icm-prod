import type { PaymentModuleCycle } from '../../test-data/payment-module/paymentModule';
import type { PaymentModulePreparedCycle } from '../payment-module/paymentModuleExcelPrep';

export type EditTransactionContext = {
  cycle: PaymentModuleCycle;
  paymentMethod: 'Check' | 'ACH';
  customerUid: string;
  agentId: string;
  nbFileName: string;
  nbFilePath: string;
  rnFileName: string;
  rnFilePath: string;
  /** ACH Customer UID when a mixed ACH+CHK batch is prepared. */
  achCustomerUid?: string;
  /** CHK Customer UID (agent 600002) for mixed batches. */
  chkCustomerUid?: string;
  /** True after ACH NB+RN upload finished. */
  achStatementsReady?: boolean;
  /** True after CHK NB+RN upload finished. */
  chkStatementsReady?: boolean;
  /** True when the open Approval batch includes both ACH and Check agents. */
  mixedBatch?: boolean;
  /** Net Settlement from Payables process summary. */
  capturedAmount?: string;
  /** Net Disbursement from Approval batch detail. */
  capturedNetDisbursement?: string;
  batchId?: string;
  /** True after NB+RN upload+complete-review finished for this cycle. */
  statementsReady?: boolean;
  /** True after Create Payment confirmed for this suite. */
  batchCreated?: boolean;
  /** Last Downloaded Timestamp text captured from Approval ACH UI. */
  lastDownloadedTimestamp?: string;
  /** Fingerprint (sha256 or size+name) of last ACH file downloaded from Approval. */
  achFileFingerprint?: string;
  achFileName?: string;
  /**
   * testid of the payable row added by EditBatchPage.addOnePayableLineItem —
   * consumed (cleared) by removeOnePayableLineItem so add+remove never target
   * the same row (app dirty set tracks row SET; same-row add+remove empties it).
   */
  addedPayableRowTestId?: string;
};

let ctx: EditTransactionContext | null = null;

export function setEditTransactionFromPrepared(prepared: PaymentModulePreparedCycle): void {
  const base = {
    cycle: prepared.cycle,
    paymentMethod: prepared.paymentMethod,
    customerUid: prepared.customerUid,
    agentId: prepared.agentId,
    nbFileName: prepared.nb.fileName,
    nbFilePath: prepared.nb.absolutePath,
    rnFileName: prepared.rn.fileName,
    rnFilePath: prepared.rn.absolutePath,
  };
  if (!ctx) {
    ctx = { ...base };
  } else {
    Object.assign(ctx, base);
  }
  if (prepared.cycle === 'ACH') {
    ctx.achCustomerUid = prepared.customerUid;
  } else {
    ctx.chkCustomerUid = prepared.customerUid;
  }
}

export function markEditTransactionAchStatementsReady(): void {
  const c = getEditTransactionContext();
  c.achStatementsReady = true;
  if (c.cycle === 'ACH') c.statementsReady = true;
}

export function markEditTransactionChkStatementsReady(): void {
  const c = getEditTransactionContext();
  c.chkStatementsReady = true;
}

export function markEditTransactionMixedBatch(): void {
  getEditTransactionContext().mixedBatch = true;
}

export function isEditTransactionMixedBatch(): boolean {
  return Boolean(ctx?.mixedBatch && ctx.batchCreated && ctx.capturedAmount);
}

export function getEditTransactionContext(): EditTransactionContext {
  if (!ctx) {
    throw new Error('Edit transaction context is empty — prepare the cycle files first');
  }
  return ctx;
}

export function tryGetEditTransactionContext(): EditTransactionContext | null {
  return ctx;
}

/** Record which payable row addOnePayableLineItem just checked. */
export function setAddedPayableRowTestId(testId: string): void {
  getEditTransactionContext().addedPayableRowTestId = testId;
}

/** Read-and-clear the recorded added row (avoids leaking into later tests). */
export function takeAddedPayableRowTestId(): string | undefined {
  const c = getEditTransactionContext();
  const id = c.addedPayableRowTestId;
  delete c.addedPayableRowTestId;
  return id;
}

export function markEditTransactionStatementsReady(): void {
  getEditTransactionContext().statementsReady = true;
}

export function areEditTransactionStatementsReady(cycle: PaymentModuleCycle): boolean {
  return Boolean(ctx?.statementsReady && ctx.cycle === cycle);
}

export function markEditTransactionBatchCreated(): void {
  getEditTransactionContext().batchCreated = true;
}

export function isEditTransactionBatchCreated(): boolean {
  return Boolean(ctx?.batchCreated);
}

export function setCapturedAmount(amount: string): void {
  getEditTransactionContext().capturedAmount = amount;
}

export function getCapturedAmount(): string {
  const amount = getEditTransactionContext().capturedAmount;
  if (!amount) {
    throw new Error('Net Settlement amount was not captured yet on edit transaction');
  }
  return amount;
}

export function setCapturedNetDisbursement(amount: string): void {
  getEditTransactionContext().capturedNetDisbursement = amount;
}

export function getCapturedNetDisbursement(): string {
  const amount = getEditTransactionContext().capturedNetDisbursement;
  if (!amount) {
    throw new Error('Net Disbursement amount was not captured yet on edit transaction');
  }
  return amount;
}

export function setBatchId(batchId: string): void {
  getEditTransactionContext().batchId = batchId;
}

export function getBatchId(): string {
  const batchId = getEditTransactionContext().batchId;
  if (!batchId) {
    throw new Error('Batch id was not captured yet on edit transaction');
  }
  return batchId;
}

export function setLastDownloadedTimestamp(text: string): void {
  getEditTransactionContext().lastDownloadedTimestamp = text;
}

export function getLastDownloadedTimestamp(): string {
  const text = getEditTransactionContext().lastDownloadedTimestamp;
  if (!text) {
    throw new Error('Last Downloaded Timestamp was not captured yet');
  }
  return text;
}

export function setAchFileFingerprint(fingerprint: string, fileName?: string): void {
  const c = getEditTransactionContext();
  c.achFileFingerprint = fingerprint;
  if (fileName) c.achFileName = fileName;
}

export function getAchFileFingerprint(): string {
  const fp = getEditTransactionContext().achFileFingerprint;
  if (!fp) {
    throw new Error('ACH file fingerprint was not captured yet');
  }
  return fp;
}

export function clearEditTransactionContext(): void {
  ctx = null;
}
