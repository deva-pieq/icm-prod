import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { commissionTypeUrlSegment } from '../../test-data/products/commissionRules';
import { getSeedCommissionStructureUrl } from '../../utils/products/productContext';
import { createSeedProductWithUrls } from '../../utils/products/seedProduct';
import { CommissionRulePage } from './CommissionRulePage';

const T = smokeStepTimeoutMs;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Commission structure list grid — Add Rule dialog, draft rows (cases 16–20). */
export class CommissionStructurePage {
  readonly loc = {
    sectionHeading: () => this.page.getByRole('heading', { name: /commission structure/i }).first(),
    addRuleButton: () => this.page.getByRole('button', { name: /add rule/i }),
    addRuleDialog: () => this.page.getByRole('dialog').filter({ hasText: /add rule/i }),
    commissionTypeDropdown: () =>
      this.page
        .getByTestId('commission-type-dropdown')
        .getByRole('button')
        .or(this.page.getByRole('button', { name: /select commission type/i })),
    dialogSaveButton: () => this.page.getByTestId('save-add-rule-button'),
    dialogCancelButton: () =>
      this.page
        .getByTestId('cancel-add-rule-button')
        .or(this.page.getByRole('dialog').filter({ hasText: /add rule/i }).getByRole('button', { name: /^cancel$/i })),
    structureGrid: () => this.page.getByRole('grid', { name: 'Data grid' }),
  };

  constructor(private readonly page: Page) {}

  async gotoSeedCommissionStructure() {
    await this.page.goto(getSeedCommissionStructureUrl());
    await this.expectOnCommissionStructurePage();
  }

  private draftRowForType(typeLabel: string) {
    const segment = commissionTypeUrlSegment(typeLabel);
    return this.loc
      .structureGrid()
      .getByRole('row')
      .filter({ hasText: new RegExp(segment, 'i') })
      .filter({ hasText: /draft/i })
      .first();
  }

  async hasDraftForType(typeLabel: string): Promise<boolean> {
    return this.draftRowForType(typeLabel).isVisible({ timeout: 2_000 }).catch(() => false);
  }

  private publishedRowForType(typeLabel: string) {
    const segment = commissionTypeUrlSegment(typeLabel);
    return this.loc
      .structureGrid()
      .getByRole('row')
      .filter({ hasText: new RegExp(segment, 'i') })
      .filter({ hasNotText: /draft/i })
      .first();
  }

  /** True when a non-draft rule for the type exists (draft rows show "Draft"; published rows do not). */
  async hasPublishedForType(typeLabel: string): Promise<boolean> {
    // AG-Grid renders the shell immediately but rows arrive async — wait for at
    // least one data row (aria-rowindex>1) before probing, otherwise the 2s
    // visibility check races row render and returns a false negative (which made
    // T019 create a second overlapping Bonus draft and lock the publish button).
    const grid = this.loc.structureGrid();
    const anyDataRow = grid.getByRole('row').filter({
      hasNot: this.page.getByRole('columnheader'),
    });
    try {
      await expect
        .poll(async () => await anyDataRow.count(), {
          timeout: T,
          intervals: [250, 500, 1000],
        })
        .toBeGreaterThan(0);
    } catch {
      return false; // grid never populated — treat as no published rule
    }
    return this.publishedRowForType(typeLabel).isVisible({ timeout: 2_000 }).catch(() => false);
  }

  /** Create a draft rule for the type when missing, then return to the structure grid. */
  async ensureDraftRuleForType(typeLabel: string) {
    await this.gotoSeedCommissionStructure();
    if (await this.hasDraftForType(typeLabel)) return;

    const commissionRulePage = new CommissionRulePage(this.page);
    await this.clickAddRule();
    await this.selectCommissionRuleTypeInDialog(typeLabel);
    await this.confirmAddCommissionRuleDialog();
    await commissionRulePage.cancelCommissionRuleEdit();
    await commissionRulePage.confirmLeavingCommissionRuleEdit();
    await this.expectOnCommissionStructurePage();
  }

  async openCommissionRuleDraftForType(typeLabel: string) {
    await this.ensureDraftRuleForType(typeLabel);
    await this.openDraftForType(typeLabel);
  }

  async expectOnCommissionStructurePage() {
    await expect(this.page).toHaveURL(AppUrlPatterns.productCommissionStructure, { timeout: T });
    await expect(this.page).not.toHaveURL(/\/product\/commission-structure\/[^/]+\/edit\//i);
    await expect(this.loc.sectionHeading()).toBeVisible({ timeout: T });
    await expect(this.loc.structureGrid()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async clickAddRule() {
    await this.expectOnCommissionStructurePage();
    let addRule = this.loc.addRuleButton();
    await expect(addRule).toBeVisible({ timeout: T });

    if (!(await addRule.isEnabled().catch(() => false))) {
      await createSeedProductWithUrls(this.page);
      await this.expectOnCommissionStructurePage();
      addRule = this.loc.addRuleButton();
      await expect(addRule).toBeEnabled({ timeout: T });
    }

    await addRule.click();
    await expect(this.loc.addRuleDialog()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async readAddRuleDropdownOptions(): Promise<string[]> {
    await expect(this.loc.addRuleDialog()).toBeVisible({ timeout: T });
    const dropdown = this.loc.commissionTypeDropdown().first();
    await expect(dropdown).toBeVisible({ timeout: T });
    await dropdown.click();
    await waitForAppSettled(this.page);
    const options = await this.page
      .getByRole('listbox')
      .getByRole('option')
      .or(this.page.getByRole('option'))
      .allInnerTexts();
    await this.page.keyboard.press('Escape');
    await waitForAppSettled(this.page);
    return options.map((o) => o.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  async expectAddRuleDropdownShowsTypes(expectedCsv: string) {
    const expected = expectedCsv.split(',').map((t) => t.trim()).filter(Boolean);
    const options = await this.readAddRuleDropdownOptions();
    for (const type of expected) {
      expect(
        options.some((o) => o.toLowerCase() === type.toLowerCase()),
        `Expected "${type}" in add-rule dropdown, got: ${options.join(', ')}`,
      ).toBeTruthy();
    }
  }

  async expectAddRuleDropdownDoesNotShowType(typeLabel: string) {
    const options = await this.readAddRuleDropdownOptions();
    expect(
      options.some((o) => o.toLowerCase() === typeLabel.toLowerCase()),
      `Expected "${typeLabel}" to be absent from add-rule dropdown, got: ${options.join(', ')}`,
    ).toBeFalsy();
    await this.closeAddRuleDialogIfOpen();
  }

  async selectCommissionRuleTypeInDialog(typeLabel: string) {
    const dropdown = this.loc.commissionTypeDropdown().first();
    await expect(dropdown).toBeVisible({ timeout: T });
    await dropdown.click();
    const option = this.page
      .getByRole('listbox')
      .getByRole('option', { name: new RegExp(`^${escapeRegex(typeLabel)}$`, 'i') })
      .or(this.page.getByRole('option', { name: new RegExp(`^${escapeRegex(typeLabel)}$`, 'i') }))
      .first();
    await expect(option).toBeVisible({ timeout: T });
    await option.click();
    await waitForAppSettled(this.page, T);
  }

  async confirmAddCommissionRuleDialog() {
    const save = this.loc.dialogSaveButton();
    await expect(save).toBeEnabled({ timeout: T });
    await save.click();
    await waitForAppSettled(this.page, T);
    await expect(this.page).toHaveURL(/\/product\/commission-structure\/[^/]+\/edit\//i, { timeout: T });
  }

  async expectDraftChipForType(typeLabel: string) {
    await this.expectOnCommissionStructurePage();
    await expect(this.draftRowForType(typeLabel)).toBeVisible({ timeout: T });
  }

  async openDraftForType(typeLabel: string) {
    await this.expectOnCommissionStructurePage();
    const row = this.draftRowForType(typeLabel);
    await expect(row).toBeVisible({ timeout: T });
    await row.click();
    await waitForAppSettled(this.page, T);
    const segment = commissionTypeUrlSegment(typeLabel);
    await expect(this.page).toHaveURL(
      new RegExp(`/edit/${escapeRegex(segment)}`, 'i'),
      { timeout: T },
    );
  }

  async closeAddRuleDialogIfOpen() {
    const dialog = this.loc.addRuleDialog();
    if (await dialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const cancel = this.loc.dialogCancelButton().first();
      if (await cancel.isVisible().catch(() => false)) {
        await cancel.click();
      } else {
        await this.page.keyboard.press('Escape');
      }
      await waitForAppSettled(this.page);
    }
  }
}
