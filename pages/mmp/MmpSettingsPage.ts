import { expect, type Locator, type Page } from '@playwright/test';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { MMP } from '../../test-data/mmp/validateMmp';
import { AgentsPage } from '../agents/AgentsPage';
import { AgentFormPage } from '../agents/AgentFormPage';

const T = smokeStepTimeoutMs;

export class MmpSettingsPage {
  private readonly agentsPage: AgentsPage;
  private readonly agentFormPage: AgentFormPage;

  readonly loc = {
    settingsTab: () => this.page.getByTestId('agent-tab-navigation-tab-settings'),
    settingsSection: () => this.page.getByTestId('agent-settings-section'),
    mmpHeading: () =>
      this.page.getByRole('heading', { name: MMP.mmpHeading, exact: true }).first(),
    mmpToggle: () => this.page.getByTestId('marketing-contribution-toggle'),
    mmpToggleLabel: () => this.page.getByText(MMP.mmpToggleLabel).first(),
    // testids are on wrapper divs — drill to the real control (AgentFormPage pattern)
    contributionAmount: () =>
      this.page.getByTestId('marketing-contribution-value-input').getByRole('spinbutton'),
    contributionPercentage: () =>
      this.page.getByTestId('marketing-contribution-percentage-input').getByRole('textbox'),
    earningTypeDropdown: () => this.page.getByTestId('deduct-from-earning-type-dropdown'),
    /** Real control inside the wrapper testid (wrapper itself is never HTML-disabled). */
    earningTypeTrigger: () =>
      this.page.getByTestId('deduct-from-earning-type-dropdown').getByRole('button').first(),
    earningTypeListbox: () => this.page.getByTestId('deduct-from-earning-type-dropdown-listbox'),
    maxContributionLabel: () => this.page.getByText(MMP.maxContributionLabel),
    saveButton: () => this.page.getByTestId('update-agent-settings-button'),
    cancelButton: () => this.page.getByTestId('settings-cancel-button'),
    confirmDialog: () =>
      this.page.getByRole('dialog').filter({
        has: this.page.getByRole('heading', { name: /save|confirm|settings/i }),
      }),
    confirmSaveButton: () =>
      this.page
        .getByRole('dialog')
        .getByRole('button', { name: /^save$|^confirm$|^ok$/i })
        .first(),
    /** T008 zero/invalid amount inline error. */
    contributionValueError: () => this.page.getByTestId('marketing-contribution-value-error'),
    /**
     * T006 over-max inline error — helper copy turns red (`text-[var(--error)]`).
     * Distinct from `marketing-contribution-value-error` (T008; empty during max-error).
     * Class substring `(--error)` avoids brittle Tailwind arbitrary-value escaping.
     */
    maxContributionError: () =>
      this.page.locator('p.mt-1.text-xs[class*="(--error)"]').filter({
        hasText: MMP.validationMessages.maxContribution,
      }),
    /** T007 earning-type inline error. */
    earningTypeError: () => this.page.getByTestId('deduct-from-earning-type-error'),
    successToast: () =>
      this.page.getByText(/settings (updated|saved)|successfully/i).first(),
    selectAll: () => this.page.getByTestId('deduct-from-earning-type-dropdown-select-all-button'),
    clearAll: () => this.page.getByTestId('deduct-from-earning-type-dropdown-clear-all-button'),
    /** Locked fields when MMP toggle is off — lucide-lock on each label. */
    mmpFieldLocks: () => this.page.locator('svg.lucide-lock'),
    earningOption: (label: string) =>
      this.page.getByTestId(`deduct-from-earning-type-dropdown-option-${label}`),
  };

  constructor(private readonly page: Page) {
    this.agentsPage = new AgentsPage(page);
    this.agentFormPage = new AgentFormPage(page);
  }

  async openSettingsTab(): Promise<void> {
    const tab = this.loc.settingsTab();
    await expect(tab).toBeVisible({ timeout: T });
    await tab.click();
    await waitForAppSettled(this.page, T);
    await expect(this.loc.settingsSection()).toBeVisible({ timeout: T });
    await expect(this.loc.mmpToggle()).toBeVisible({ timeout: T });
  }

  async openFirstExistingAgentSettings(): Promise<void> {
    await this.agentsPage.openList();
    const rows = this.agentsPage.getDataRows();
    await expect(rows.first()).toBeVisible({ timeout: T });
    await rows.first().click();
    await waitForAppSettled(this.page, T);
    if (await this.page.getByTestId('review-lock-modal-acquire').isVisible().catch(() => false)) {
      await this.page.getByTestId('review-lock-modal-acquire').click();
      await waitForAppSettled(this.page, T);
    }
    await this.openSettingsTab();
  }

  async createNewAgentDraftAndOpenSettings(): Promise<void> {
    const stamp = Date.now().toString().slice(-6);
    const agentId = `8${stamp}`.slice(0, 10);
    await this.agentsPage.openList();
    await this.agentsPage.openAdd();
    await this.agentFormPage.fillAllRequiredFields({
      agentId,
      firstName: `MmpNew${stamp}`,
      lastName: `MmpNew${stamp}`,
      email: `${MMP.opsEmail.replace('@', `+mmp+${stamp}@`)}`,
      npn: agentId,
    });
    await this.agentFormPage.fillValidBankDetails();
    await this.agentFormPage.clickSave();
    await this.agentFormPage.clickConfirmSave({ captureToast: true });
    await waitForAppSettled(this.page, T);
    // Land on edit or reopen via search
    if (!(await this.loc.settingsTab().isVisible().catch(() => false))) {
      await this.agentsPage.openList();
      await this.agentsPage.searchGrid(agentId);
      await this.agentsPage.openEditByMatchingRow(`MmpNew${stamp}`);
    }
    await this.openSettingsTab();
  }

  async expectMmpSectionVisible(): Promise<void> {
    await expect(this.loc.mmpToggle()).toBeVisible({ timeout: T });
    await expect(this.loc.mmpHeading()).toBeVisible({ timeout: T });
  }

  private async readToggleEnabled(): Promise<boolean> {
    const toggle = this.loc.mmpToggle();
    return toggle.evaluate((el) => {
      if (el instanceof HTMLInputElement) return el.checked;
      const ariaChecked = el.getAttribute('aria-checked');
      const dataState = el.getAttribute('data-state');
      return ariaChecked === 'true' || dataState === 'checked';
    });
  }

  async enableMmp(): Promise<void> {
    const toggle = this.loc.mmpToggle();
    await expect(toggle).toBeVisible({ timeout: T });
    if (!(await this.readToggleEnabled())) {
      await toggle.click({ force: true });
      await waitForAppSettled(this.page, T);
    }
    expect(await this.readToggleEnabled(), 'MMP toggle should be enabled').toBeTruthy();
  }

  async disableMmp(): Promise<void> {
    const toggle = this.loc.mmpToggle();
    await expect(toggle).toBeVisible({ timeout: T });
    if (await this.readToggleEnabled()) {
      await toggle.click({ force: true });
      await waitForAppSettled(this.page, T);
    }
    expect(await this.readToggleEnabled(), 'MMP toggle should be disabled').toBeFalsy();
  }

  async expectMmpEnabled(): Promise<void> {
    expect(await this.readToggleEnabled()).toBeTruthy();
  }

  async expectMmpDisabled(): Promise<void> {
    expect(await this.readToggleEnabled()).toBeFalsy();
  }

  async toggleMmpViaLabel(): Promise<void> {
    const before = await this.readToggleEnabled();
    await this.loc.mmpToggleLabel().click();
    await waitForAppSettled(this.page, T);
    expect(await this.readToggleEnabled()).toBe(!before);
  }

  async toggleMmpViaSwitch(): Promise<void> {
    const before = await this.readToggleEnabled();
    await this.loc.mmpToggle().click({ force: true });
    await waitForAppSettled(this.page, T);
    expect(await this.readToggleEnabled()).toBe(!before);
  }

  private async fillTestIdInput(input: Locator, value: string) {
    await expect(input).toBeEnabled({ timeout: T });
    await input.click({ clickCount: 3 });
    await input.fill(value);
    await waitForAppSettled(this.page, T);
  }

  async setContributionAmount(amount: number | string): Promise<void> {
    await this.fillTestIdInput(this.loc.contributionAmount(), String(amount));
  }

  async setContributionPercentage(pct: number): Promise<void> {
    await this.fillTestIdInput(this.loc.contributionPercentage(), String(pct));
  }

  async expectMmpFieldsEnabled(): Promise<void> {
    await expect(this.loc.mmpFieldLocks()).toHaveCount(0, { timeout: T });
    await expect(this.loc.contributionAmount()).toBeEnabled({ timeout: T });
    await expect(this.loc.contributionPercentage()).toBeEnabled({ timeout: T });
    await expect(this.loc.earningTypeTrigger()).toBeEnabled({ timeout: T });
  }

  async expectMmpFieldsDisabled(): Promise<void> {
    // Disabled MMP fields show lucide-lock on each label (not only HTML disabled on wrapper).
    await expect(this.loc.mmpFieldLocks()).toHaveCount(3, { timeout: T });
    await expect(this.loc.contributionAmount()).toBeDisabled({ timeout: T });
    await expect(this.loc.contributionPercentage()).toBeDisabled({ timeout: T });
    await expect(this.loc.earningTypeTrigger()).toBeDisabled({ timeout: T });
  }

  private async isEarningTypeListboxOpen(): Promise<boolean> {
    return this.loc.earningTypeListbox().isVisible().catch(() => false);
  }

  async openEarningTypeDropdown(): Promise<void> {
    if (await this.isEarningTypeListboxOpen()) return;
    const trigger = this.loc.earningTypeTrigger();
    await expect(trigger).toBeEnabled({ timeout: T });
    await trigger.click();
    await expect(this.loc.earningTypeListbox()).toBeVisible({ timeout: T });
  }

  async closeEarningTypeDropdown(): Promise<void> {
    if (!(await this.isEarningTypeListboxOpen())) return;
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await expect(this.loc.earningTypeListbox()).toBeHidden({ timeout: 5_000 }).catch(() => undefined);
  }

  async selectEarningTypes(types: readonly string[]): Promise<void> {
    await this.openEarningTypeDropdown();

    const clearAll = this.loc.clearAll();
    if (await clearAll.isVisible().catch(() => false)) {
      await clearAll.click();
      await this.page.waitForTimeout(200);
      await this.openEarningTypeDropdown();
    }

    for (const type of types) {
      const option = this.loc.earningOption(type);
      await expect(option, `Earning type "${type}" should be visible`).toBeVisible({
        timeout: T,
      });
      const selected = (await option.getAttribute('aria-selected')) === 'true';
      if (!selected) {
        await option.click();
        await this.page.waitForTimeout(150);
      }
    }

    await this.closeEarningTypeDropdown();
    await waitForAppSettled(this.page, T);
  }

  async clearEarningTypes(): Promise<void> {
    await this.openEarningTypeDropdown();
    const clearAll = this.loc.clearAll();
    await expect(clearAll).toBeVisible({ timeout: T });
    await clearAll.click();
    await this.closeEarningTypeDropdown();
    await waitForAppSettled(this.page, T);
  }

  async clickSelectAllEarningTypes(): Promise<void> {
    await this.openEarningTypeDropdown();
    await expect(this.loc.selectAll()).toBeVisible({ timeout: T });
    await this.loc.selectAll().click();
    await this.page.waitForTimeout(200);
  }

  async clickClearAllEarningTypes(): Promise<void> {
    await this.openEarningTypeDropdown();
    await expect(this.loc.clearAll()).toBeVisible({ timeout: T });
    await this.loc.clearAll().click();
    await this.page.waitForTimeout(200);
  }

  async expectAllEarningTypesListed(): Promise<void> {
    await this.openEarningTypeDropdown();
    for (const type of MMP.allEarningTypes) {
      await expect(this.loc.earningOption(type)).toBeVisible({ timeout: T });
    }
    await this.closeEarningTypeDropdown();
  }

  async expectAllEarningTypesSelected(): Promise<void> {
    // Chips on the closed trigger prove Select All applied
    await this.closeEarningTypeDropdown();
    const triggerText = ((await this.loc.earningTypeTrigger().innerText()) || '').replace(
      /\s+/g,
      ' ',
    );
    for (const type of MMP.allEarningTypes) {
      expect(
        new RegExp(type, 'i').test(triggerText),
        `Expected "${type}" selected after Select All (trigger="${triggerText}")`,
      ).toBeTruthy();
    }
  }

  async expectNoEarningTypesSelected(): Promise<void> {
    await this.closeEarningTypeDropdown();
    const text = ((await this.loc.earningTypeTrigger().innerText()) || '').replace(/\s+/g, ' ');
    expect(
      /select earning types/i.test(text),
      `Expected empty placeholder after Clear All (trigger="${text}")`,
    ).toBeTruthy();
  }

  async clickSaveOnly(): Promise<void> {
    const save = this.loc.saveButton();
    await expect(save).toBeEnabled({ timeout: T });
    await save.click();
    await waitForAppSettled(this.page, T);
  }

  async expectConfirmationDialogVisible(): Promise<void> {
    await expect(this.loc.confirmDialog()).toBeVisible({ timeout: T });
  }

  async confirmSaveDialog(): Promise<void> {
    await this.loc.confirmSaveButton().click();
    await waitForAppSettled(this.page, T);
  }

  async saveSettings(): Promise<void> {
    const save = this.loc.saveButton();
    if (await save.isDisabled()) {
      return;
    }
    await this.clickSaveOnly();
    if (await this.loc.confirmDialog().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await this.confirmSaveDialog();
    }
    await this.loc
      .successToast()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => undefined);
  }

  async expectValidationError(pattern: RegExp): Promise<void> {
    if (pattern === MMP.validationMessages.maxContribution) {
      const error = this.loc.maxContributionError();
      await expect(error).toBeVisible({ timeout: T });
      await expect(error).toHaveText(pattern);
      return;
    }
    if (pattern === MMP.validationMessages.validContributionAmount) {
      const error = this.loc.contributionValueError();
      await expect(error).toBeVisible({ timeout: T });
      await expect(error).toHaveText(pattern);
      return;
    }
    const error = this.loc.earningTypeError();
    await expect(error).toBeVisible({ timeout: T });
    await expect(error).toHaveText(pattern);
  }

  async configureMmpProgram(options?: {
    amount?: number;
    percentage?: number;
    earningTypes?: readonly string[];
  }): Promise<void> {
    const amount = options?.amount ?? MMP.contributionAmount;
    const percentage = options?.percentage ?? MMP.contributionPercentage;
    const earningTypes = options?.earningTypes ?? MMP.earningTypes;

    await this.openSettingsTab();
    await this.enableMmp();
    await this.setContributionAmount(amount);
    await this.setContributionPercentage(percentage);
    await this.selectEarningTypes(earningTypes);
    await this.saveSettings();
  }
}
