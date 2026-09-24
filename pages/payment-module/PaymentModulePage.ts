import { expect, type Page } from '@playwright/test';
import { StatementUploadPage } from '../statement-processing/StatementUploadPage';
import { PAYMENT_MODULE, type PaymentModuleCycle } from '../../test-data/payment-module/paymentModule';
import {
  preparePaymentModuleCycle,
  type PaymentModulePreparedCycle,
  type PaymentModulePreparedFile,
} from '../../utils/payment-module/paymentModuleExcelPrep';
import {
  getPaymentModuleContext,
  setPaymentModuleFromPrepared,
  setPaymentModuleNbFileId,
  setPaymentModuleRnFileId,
} from '../../utils/payment-module/paymentModuleContext';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class PaymentModulePage extends StatementUploadPage {
  private preparedCycle: PaymentModulePreparedCycle | null = null;
  private activeKind: 'NB' | 'RN' = 'NB';

  constructor(page: Page) {
    super(page);
  }

  async prepareCycle(cycle: PaymentModuleCycle): Promise<PaymentModulePreparedCycle> {
    this.preparedCycle = await preparePaymentModuleCycle(cycle);
    setPaymentModuleFromPrepared(this.preparedCycle);
    return this.preparedCycle;
  }

  getPreparedCycle(): PaymentModulePreparedCycle {
    if (!this.preparedCycle) {
      throw new Error('Call prepareCycle() before payment module upload steps');
    }
    return this.preparedCycle;
  }

  private activePreparedFile(): PaymentModulePreparedFile {
    const cycle = this.getPreparedCycle();
    return this.activeKind === 'NB' ? cycle.nb : cycle.rn;
  }

  async uploadStatementKind(kind: 'NB' | 'RN'): Promise<void> {
    this.activeKind = kind;
    const file = this.activePreparedFile();
    this.setPreparedFile(file);
    await this.openUploadPage();
    await this.uploadPreparedFile();
    await this.selectStatementType(PAYMENT_MODULE.statementType);
    await this.clickUploadStatement();
  }

  async captureUploadAndWaitForReview(): Promise<string> {
    const file = this.activePreparedFile();
    this.setPreparedFile(file);

    const fileId = await this.assertions.pollPastExtractProcessing(file.fileName, {
      maxAttempts: PAYMENT_MODULE.uploadPoll.maxAttempts,
      intervalMs: PAYMENT_MODULE.uploadPoll.intervalMs,
    });

    const reviewFileId = await this.assertions.pollUntilUploadReviewReady(
      file.fileName,
      PAYMENT_MODULE.expectedAfterExtract.status,
      PAYMENT_MODULE.expectedAfterExtract.stage,
      {
        maxAttempts: PAYMENT_MODULE.uploadPoll.maxAttempts,
        intervalMs: PAYMENT_MODULE.uploadPoll.intervalMs,
      },
      fileId,
    );

    const resolvedId = reviewFileId || fileId;
    this.setStoredRow({
      row: await this.resolveStoredUploadRow({ fileId: resolvedId, fileName: file.fileName }),
      fileId: resolvedId,
      fileName: file.fileName,
      carrierName: file.carrierName,
    });

    if (this.activeKind === 'NB') {
      setPaymentModuleNbFileId(resolvedId);
    } else {
      setPaymentModuleRnFileId(resolvedId);
    }
    return resolvedId;
  }

  async openReviewAndComplete(): Promise<void> {
    await this.openReviewForStoredUpload();
    await expect(this.page.getByRole('heading', { name: PAYMENT_MODULE.reviewHeading })).toBeVisible({
      timeout: T,
    });
    await this.completeReviewAndConfirm();
    await waitForAppSettled(this.page, T);
  }

  async expectUploadCompleted(): Promise<void> {
    const file = this.activePreparedFile();
    const stored = this.getStoredRow();
    await this.assertions.pollUntilStageCompleted(
      file.fileName,
      {
        maxAttempts: PAYMENT_MODULE.reviewPoll.maxAttempts,
        intervalMs: PAYMENT_MODULE.reviewPoll.intervalMs,
      },
      stored?.fileId,
    );
  }

  /** Full NB or RN path: upload → wait for Review → complete review → Completed. */
  async uploadAndAutoReconcile(kind: 'NB' | 'RN'): Promise<void> {
    await this.uploadStatementKind(kind);
    await this.captureUploadAndWaitForReview();
    await this.openReviewAndComplete();
    await this.expectUploadCompleted();
  }

  expectPreparedCustomerUid(): string {
    return getPaymentModuleContext().customerUid;
  }
}
