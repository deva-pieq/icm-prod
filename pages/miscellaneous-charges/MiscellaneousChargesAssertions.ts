import { expect } from '@playwright/test';
import type { MiscellaneousChargesPage } from './MiscellaneousChargesPage';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class MiscellaneousChargesAssertions {
  constructor(private readonly page: MiscellaneousChargesPage) {}

  async expectPageLoaded() {
    await this.page.expectOnPage();
    await this.page.expectHeading();
  }

  async expectGridWithRequiredColumns() {
    await this.page.expectGridColumns();
  }

  async expectFooterShowsRecordCount() {
    await this.page.expectFooterRecordCount();
  }

  async expectModalWithAllFields() {
    await this.page.expectModalHeading();
    await this.page.expectTransactionDateDefaultsToToday();
    await this.page.expectSaveDisabled();
  }

  async expectBatchActionsDisabled() {
    await this.page.expectProcessDisabled();
    await this.page.expectCancelBatchDisabled();
  }

  async expectToolbarFunctional() {
    await this.page.expectSearchPlaceholder();
    await this.page.expectExportButton();
    await this.page.expectRefreshButton();
    await this.page.expectColumnsToggle();
  }
}
