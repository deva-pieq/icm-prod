import { expect, type Page } from '@playwright/test';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class AgentAdvanceEligibilityPage {
  readonly loc = {
    searchInput: () => this.page.getByTestId('data-grid-search-input').getByRole('textbox'),
    grid: () => this.page.getByRole('grid', { name: 'Data grid' }),
    firstRow: () =>
      this.page.getByRole('grid', { name: 'Data grid' })
        .getByRole('row')
        .filter({ hasNot: this.page.getByRole('columnheader') })
        .first(),
    settingsTab: () => this.page.getByTestId('agent-tab-navigation-tab-settings'),
    advanceEligibilityToggle: () =>
      this.page.locator('#toggle-eligible-for-carrier-advance-toggle'),
  };

  constructor(private page: Page) {}

  async navigateToAgents(): Promise<void> {
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}/agents`, {
      waitUntil: 'domcontentloaded',
    });
    await waitForAppSettled(this.page, T);
  }

  async searchAgent(query: string): Promise<void> {
    const search = this.loc.searchInput();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill(query);
    await waitForAppSettled(this.page, T);
  }

  async clickFirstAgentRow(): Promise<void> {
    const row = this.loc.firstRow();
    await expect(row).toBeVisible({ timeout: T });
    await row.click();
    await waitForAppSettled(this.page, T);
  }

  async openSettingsTab(): Promise<void> {
    const tab = this.loc.settingsTab();
    await expect(tab).toBeVisible({ timeout: T });
    await tab.click();
    await waitForAppSettled(this.page, T);
  }

  async expectAdvanceEligibilityToggleVisible(): Promise<void> {
    const toggle = this.loc.advanceEligibilityToggle();
    await expect(toggle).toBeVisible({ timeout: T });
  }

  async enableAdvanceEligibilityToggle(): Promise<void> {
    const toggle = this.loc.advanceEligibilityToggle();
    await expect(toggle).toBeVisible({ timeout: T });
    const isEnabled = await toggle.evaluate((el) => {
      if (el instanceof HTMLInputElement) return el.checked;
      const ariaChecked = el.getAttribute('aria-checked');
      const dataState = el.getAttribute('data-state');
      return ariaChecked === 'true' || dataState === 'checked';
    });
    if (!isEnabled) {
      await toggle.click({ force: true });
      await waitForAppSettled(this.page, T);
    }
  }

  async expectAdvanceEligibilityToggleEnabled(): Promise<void> {
    const toggle = this.loc.advanceEligibilityToggle();
    await expect(toggle).toBeVisible({ timeout: T });
    const isEnabled = await toggle.evaluate((el) => {
      if (el instanceof HTMLInputElement) return el.checked;
      const ariaChecked = el.getAttribute('aria-checked');
      const dataState = el.getAttribute('data-state');
      return ariaChecked === 'true' || dataState === 'checked';
    });
    expect(isEnabled, 'Advance Eligibility toggle should be enabled').toBeTruthy();
  }
}
