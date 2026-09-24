import { expect } from '@playwright/test';
import type { PolicyMasterPage } from './PolicyMasterPage';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class PolicyMasterAssertions {
  constructor(private readonly page: PolicyMasterPage) {}

  async expectListPageLoaded() {
    await this.page.expectOnList();
    await this.page.expectHeadingAndSubtitle();
    await this.page.expectAddPolicyButton();
  }

  async expectSummaryCardsPopulated() {
    await this.page.expectSummaryCards();
  }

  async expectGridWithRequiredColumns() {
    await this.page.expectGridColumns();
  }

  async expectFooterShowsRecordCount() {
    await this.page.expectFooterRecordCount();
  }
}
