import { expect, type Locator, type Page } from '@playwright/test';
import {
  ALTERNATE_COMMISSION_TEMPLATE,
  COMMISSION_RULE_DRAFT_SAVED_MESSAGE,
  COMMISSION_RULE_PUBLISHED_MESSAGE,
  DEFAULT_COMMISSION_TEMPLATE,
  SPACES_ONLY_RULE_NAME,
  commissionTypeUrlSegment,
  overMaxRuleName,
  validUniqueRuleName,
} from '../../test-data/products/commissionRules';
import { IPV_SLAB_SPLIT_MATRIX, U65_ACA_PERIOD_MATRIX } from '../../test-data/products/policyPeriodMatrix';
import { captureToast, expectCapturedOrLiveToast, waitForAppSettled } from '../../utils/pageLoader';
import { waitForButtonState } from '../../utils/buttonState';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { Assert } from 'assert';

const T = smokeStepTimeoutMs;

export type AgentLevelCommissionSplit = {
  level: string;
  agency: string;
  salesLeader: string;
  agent: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePercentNumber(value: string): number {
  const n = Number.parseFloat(value.replace(/%/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

/**
 * Converts a product commission cell to the split-up % shown on reconciliation.
 *
 * Product UI layout (per LVL column):
 *   spinbox "10.00" + share label "1.00%"  →  reconciliation shows Agency 10.0%
 *   spinbox "1.00"  + share label "0.10%"  →  reconciliation shows Agency 1.0%
 *
 * Rule: split-up % = share label × 10, OR spinbox value when both are present.
 * Do NOT use regex \bagent\b for roles — "Sub Agent" must be skipped.
 */
function extractSplitUpPercentFromCell(cellText: string): string {
  const normalized = cellText.replace(/\s+/g, ' ').trim();
  const numbers = (normalized.match(/[\d.]+/g) ?? [])
    .map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value));
  const sharePercents = normalized.match(/[\d.]+%/g) ?? [];
  const share = sharePercents.length
    ? parsePercentNumber(sharePercents[sharePercents.length - 1])
    : 0;

  // Full cell: spinbox value already equals split-up % (e.g. 10.00 ↔ 1.00% share)
  if (numbers.length >= 2 && share > 0) {
    const spinbox = numbers[0];
    if (Math.abs(spinbox - share * 10) < 0.2) {
      return `${Math.round(spinbox * 10) / 10}%`;
    }
  }

  // Headless/innerText often omits spinbox — only share label is present (1.00% → 10%)
  if (share > 0) {
    return `${Math.round(share * 10 * 10) / 10}%`;
  }

  // Bare number without % — treat as spinbox split-up (1.00 → 1%, not ×10)
  if (numbers.length > 0) {
    return `${Math.round(numbers[0] * 10) / 10}%`;
  }

  return '';
}

/** Exact role match only — "Sub Agent" must not overwrite "Agent". */
function assignRoleSplitPercent(
  role: string,
  percent: string,
  split: AgentLevelCommissionSplit,
): void {
  const normalizedRole = role.replace(/\s+/g, ' ').trim().toLowerCase();
  if (normalizedRole === 'agency') split.agency = percent;
  else if (normalizedRole === 'sales leader') split.salesLeader = percent;
  else if (normalizedRole === 'agent') split.agent = percent;
}

function extractPercentFromCell(cellText: string): string {
  const percents = cellText.match(/[\d.]+%/g);
  if (percents?.length) return percents[percents.length - 1];
  const trimmed = cellText.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  return trimmed.endsWith('%') ? trimmed : `${trimmed}%`;
}

function normalizePercent(value: string): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  return trimmed.endsWith('%') ? trimmed : `${trimmed}%`;
}

function levelLabelFromHeader(header: string): string {
  const lvlMatch = header.match(/LVL\s*(\d+)/i);
  if (lvlMatch) return `LVL${lvlMatch[1]}`;
  return header.replace(/\s+/g, ' ').trim();
}

export class CommissionRulePage {
  readonly loc = {
    backButton: () => this.page.getByTestId('back-button'),
    addRuleButton: () => this.page.getByRole('button', { name: /add rule/i }),
    addRuleDialog: () => this.page.getByRole('dialog').filter({ hasText: /add rule/i }),
    commissionTypeDropdown: () =>
      this.page
        .getByTestId('commission-type-dropdown')
        .getByRole('button')
        .or(this.page.getByTestId('commission-type-dropdown')),
    dialogSaveButton: () => this.page.getByTestId('save-add-rule-button'),
    editCommissionRuleHeading: () =>
      this.page.getByRole('heading', { name: /edit commission rule/i }),
    effectiveStartDateInput: () =>
      this.page.getByTestId('effective-start-date').getByRole('textbox'),
    policyPeriodSlabsTable: () =>
      this.page.getByRole('table').filter({
        has: this.page.getByRole('columnheader', { name: /to \(months\)/i }),
      }),
    policyPeriodSlabsRow: () =>
      this.loc
        .policyPeriodSlabsTable()
        .getByRole('row')
        .filter({
          has: this.page.getByRole('button', { name: /save (changes|period)/i }),
        })
        .first(),
    addPeriodButton: () => this.page.getByRole('button', { name: /\+?\s*add period/i }),
    savePolicyPeriodButton: () =>
      this.loc.policyPeriodSlabsTable().getByRole('button', { name: /save (changes|period)/i }).first(),
    templateNameDropdown: () =>
      this.page
    .getByTestId('main-template-name-dropdown').getByRole("button"),
    publishRuleButton: () => this.page.getByRole('button', { name: /publish rule/i }),
    saveDraftButton: () => this.page.getByRole('button', { name: /save draft/i }),
    slidingNotification: () => this.page.getByTestId('commission-rule-detail-toast'),
    splitsByAgentLevelTable: () =>
      this.page
        .getByRole('heading', { name: /commission splits by agent level/i })
        .locator('xpath=following::table[1]'),
    commissionStructureGrid: () => this.page.getByRole('grid', { name: 'Data grid' }),
    ruleNameInput: () =>
      this.page
        .getByTestId('rule-name-input')
        .getByRole('textbox')
        .or(this.page.getByLabel(/rule name/i)),
    effectiveEndDateInput: () =>
      this.page
        .getByTestId('effective-end-date')
        .getByRole('textbox')
        .or(this.page.getByTestId('effective-end-date').locator('input')),
    cancelEditButton: () => this.page.getByRole('button', { name: /^cancel$/i }).last(),
    createNewVersionButton: () => this.page.getByRole('button', { name: /create new version/i }),
    // successToastForNewVersion: () => this.page.getByTestId('commission-rule-detail-toast').filter({ hasText: /new version created successfully/i }),
    pmpmToggle: () => this.page.getByRole('switch', { name: /pmpm/i }),
    addIpvSlabButton: () => this.page.getByRole('button', { name: /\+?\s*add slab/i }),
    disableIpvSlabButton: () => this.page.getByRole('button', { name: /disable ipv slab/i }),
    ipvSlabTabs: () =>
      this.page
        .getByRole('heading', { name: /IPV Slab/i })
        .locator("../../..")
        .getByRole('tab'),
    addIpvSlabDialog: () =>
      this.page.getByRole('dialog').filter({ hasText: /add ipv slab/i }),
    subAgentSplitCheckbox: () =>
      this.page.locator('#checkbox-enable-sub-agent-splits-toggle'),
    subAgentSplitToggle: () =>
      this.page.locator('label[for="checkbox-enable-sub-agent-splits-toggle"]'),
    subAgentSplitSection: () =>
      this.page.getByRole('columnheader', { name: 'Sub-Agent' }),
    unsavedChangesDialog: () =>
      this.page.getByRole('dialog').filter({ hasText: /unsaved|keep editing|discard/i }),
  };

  private activePolicyPeriodName: string | null = null;

  constructor(private readonly page: Page) {}

  async clickAddRule() {
    await this.loc.addRuleButton().click();
    await expect(this.loc.addRuleDialog()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async selectCommissionType(typeLabel: string) {
    const dropdown = this.loc.commissionTypeDropdown();
    await expect(dropdown.first()).toBeVisible({ timeout: T });
    await dropdown.first().click();
    const option = this.page
      .getByRole('listbox')
      .getByRole('option', { name: new RegExp(`^${escapeRegex(typeLabel)}$`, 'i') })
      .or(this.page.getByRole('option', { name: new RegExp(`^${escapeRegex(typeLabel)}$`, 'i') }))
      .first();
    await expect(option).toBeVisible({ timeout: T });
    await option.click();
    await waitForAppSettled(this.page, T);
  }

  async saveAddRuleDialog() {
    const save = this.loc.dialogSaveButton();
    await expect(save).toBeEnabled({ timeout: T });
    await save.click();
    await waitForAppSettled(this.page, T);
  }

  async expectOnEditCommissionRulePage() {
    await expect(this.loc.editCommissionRuleHeading()).toBeVisible({ timeout: T });
  }

  async setPolicyStartDate(dateValue: string) {
    const input = this.loc.effectiveStartDateInput();
    await expect(input).toBeVisible({ timeout: T });
    await input.click();
    const popup = this.page.locator('[data-testid$="-calendar-popup"]');
    await expect(popup).toBeVisible({ timeout: T });
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateValue.trim());
    if (!match) throw new Error(`Expected MM/DD/YYYY date, got: ${dateValue}`);
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = monthNames[month - 1];
    if (!monthName || day < 1 || day > 31) throw new Error(`Invalid calendar date: ${dateValue}`);

    const navLabel = popup.locator('.react-calendar__navigation__label');
    for (let i = 0; i < 2; i++) {
      const labelText = (await navLabel.innerText()).replace(/\s+/g, ' ').trim();
      if (/\d{4}\s*[–-]\s*\d{4}/.test(labelText)) break;
      await navLabel.click();
      await this.page.waitForTimeout(150);
    }
    let yearClicked = false;
    for (let i = 0; i < 24; i++) {
      const yearTile = popup.locator('button.react-calendar__tile').filter({ hasText: new RegExp(`^${year}$`) });
      if ((await yearTile.count()) > 0 && (await yearTile.first().isVisible().catch(() => false))) {
        await yearTile.first().click();
        yearClicked = true;
        break;
      }
      const labelText = (await navLabel.innerText()).replace(/\s+/g, ' ').trim();
      const range = labelText.match(/(\d{4})\s*[–-]\s*(\d{4})/);
      if (!range) throw new Error(`Calendar not in decade view while seeking year ${year}`);
      if (year < Number(range[1])) {
        await popup.locator('.react-calendar__navigation__prev-button').click();
      } else {
        await popup.locator('.react-calendar__navigation__next-button').click();
      }
      await this.page.waitForTimeout(150);
    }
    if (!yearClicked) throw new Error(`Could not find year ${year} in calendar`);
    await this.page.waitForTimeout(150);
    await popup.getByRole('button', { name: `${monthName} ${year}`, exact: true }).click();
    await this.page.waitForTimeout(150);
    const dayBtn = popup
      .locator('button.react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth)')
      .filter({ hasText: new RegExp(`^${day}$`) });
    await expect(dayBtn, `Day ${day} should be unique in calendar month`).toHaveCount(1);
    await dayBtn.click();
    await this.page.waitForTimeout(200);
    await waitForAppSettled(this.page, T);
  }

  async setPolicyPeriodSlabs(value: string) {
    await this.enterEditPolicyPeriodRow();
    await this.setPolicyPeriodMonthLimit(U65_ACA_PERIOD_MATRIX.regular.toMonths);
    await this.setPolicyPeriodValue(value);
  }

  private policyPeriodDataRows() {
    return this.loc.policyPeriodSlabsTable().getByRole('row').filter({
      hasNot: this.page.getByRole('columnheader'),
    });
  }

  private policyPeriodRowByName(periodName: string) {
    console.log(periodName,"[debug] filter passed");
    return this.policyPeriodDataRows().filter({
      hasText: periodName
    });
  }

  private async resolvePolicyPeriodRow(periodName?: string) {
    if (periodName=="Renewal") {
      return this.page
      .getByRole('table')
      .filter({ has:this.page.getByRole('columnheader', { name: /to \(months\)/i }) })
      .getByRole('row')
      .filter({ has:this.page.getByRole("textbox",{name:"Renewal"}) })
      .first();
    }
    if (periodName=="Regular") {
      this.page
      .getByRole('table')
      .filter({ has:this.page.getByRole('columnheader', { name: /to \(months\)/i }) })
      .getByRole('row')
      .filter({ has:this.page.getByRole("textbox",{name:"Regular"}) })
      .first();
    }
    return this.policyPeriodDataRows().first();
  }

  async enterEditPolicyPeriodRow(periodName?: string) {
    const targetPeriod = periodName ?? this.activePolicyPeriodName ?? undefined;
    await this.loc.policyPeriodSlabsTable().scrollIntoViewIfNeeded();
    if (await this.loc.policyPeriodSlabsRow().isVisible().catch(() => false)) {
      const editingRow = this.loc.policyPeriodSlabsRow();
      if (
        targetPeriod &&
        (await editingRow.filter({ hasText: new RegExp(escapeRegex(targetPeriod), 'i') }).count()) > 0
      ) {
        return;
      }
      if (!targetPeriod) {
        return;
      }
      await this.savePolicyPeriodChanges();
    }
    await this.page.keyboard.press('Escape');
    if (await this.loc.policyPeriodSlabsRow().isVisible().catch(() => false)) {
      return;
    }
    const row = await this.resolvePolicyPeriodRow(targetPeriod);
    await expect(row).toBeVisible({ timeout: T });
    const editPeriod = row.getByRole('button', { name: /edit period/i });
    if (await editPeriod.isVisible().catch(() => false)) {
      await editPeriod.click();
      await waitForAppSettled(this.page, T);
      const editingRow = await this.resolvePolicyPeriodRow(targetPeriod);
      const setLimit = editingRow.getByRole('button', { name: /set month limit|set limit/i });
      if (await setLimit.isVisible().catch(() => false)) {
        await expect(setLimit).toBeEnabled({ timeout: T });
      }
      return;
    }
    const setLimit = row.getByRole('button', { name: /set month limit|set limit/i });
    if (await setLimit.isVisible().catch(() => false) && (await setLimit.isEnabled().catch(() => false))) {
      await setLimit.click();
      await waitForAppSettled(this.page, T);
    }
  }

  async selectPolicyPeriodRow(periodName: string) {
    this.activePolicyPeriodName = periodName;
    await this.loc.policyPeriodSlabsTable().scrollIntoViewIfNeeded();
    if (await this.loc.policyPeriodSlabsRow().isVisible().catch(() => false)) {
      const editingRow = this.loc.policyPeriodSlabsRow();
      const onTarget =
        (await editingRow.filter({ hasText: new RegExp(escapeRegex(periodName), 'i') }).count()) > 0;
      if (!onTarget) {
        await this.savePolicyPeriodChanges();
      } else {
        await this.page.keyboard.press('Escape');
        await waitForAppSettled(this.page, T);
      }
    }
    const row = await this.resolvePolicyPeriodRow(periodName);
    await expect(row).toBeVisible({ timeout: T });
    const editPeriod = row.getByRole('button', { name: /edit period/i });
    await expect(editPeriod).toBeVisible({ timeout: T });
    await editPeriod.click();
    await waitForAppSettled(this.page, T);
  }

  private async activePolicyPeriodRow() {
    return this.resolvePolicyPeriodRow(this.activePolicyPeriodName ?? undefined);
  }

  async selectIpvSlabByIndex(index: number) {
    const tabs = this.loc.ipvSlabTabs();
    await expect(tabs.nth(index)).toBeVisible({ timeout: T });
    await tabs.nth(index).click();
    await waitForAppSettled(this.page, T);
  }

  async setPolicyPeriodMonthLimit(toMonths: string, save = false) {
    await this.enterEditPolicyPeriodRow();
    const row = (await this.loc.policyPeriodSlabsRow().isVisible().catch(() => false))
      ? this.loc.policyPeriodSlabsRow()
      : await this.activePolicyPeriodRow();
    const setLimit = row.getByRole('button', { name: /set month limit|set limit/i });
    if (await setLimit.isVisible().catch(() => false)) {
      await expect(setLimit).toBeEnabled({ timeout: T });
      await setLimit.click();
      await waitForAppSettled(this.page, T);
    }
    const toInput = row.getByRole('spinbutton').nth(1);
    await expect(toInput).toBeEnabled({ timeout: T });
    await toInput.fill(toMonths);
    await toInput.blur();
    if (save) {
      await this.savePolicyPeriodChanges();
    }
  }

  async setPolicyPeriodValue(value: string) {
    await this.enterEditPolicyPeriodRow();
    const row = (await this.loc.policyPeriodSlabsRow().isVisible().catch(() => false))
      ? this.loc.policyPeriodSlabsRow()
      : await this.activePolicyPeriodRow();
    const valueInput = row.getByRole('spinbutton').nth(2);
    await expect(valueInput).toBeEnabled({ timeout: T });
    await valueInput.fill(value);
    await valueInput.blur();
  }

  async addPolicyPeriod() {
    if (await this.loc.policyPeriodSlabsRow().isVisible().catch(() => false)) {
      await this.savePolicyPeriodChanges();
    }
    const add = this.loc.addPeriodButton();
    await add.scrollIntoViewIfNeeded();
    await expect(add).toBeEnabled({ timeout: T });
    await add.click();
    await waitForAppSettled(this.page, T);
    const lastRow = this.policyPeriodDataRows().last();
    const nameInput = lastRow.getByRole('textbox').first();
    const name = (await nameInput.inputValue().catch(() => '')).trim();
    this.activePolicyPeriodName = name || 'Renewal';
    // TEMP FIX NEED TO FIX THIS LATER
    await this.setPolicyPeriodValue(U65_ACA_PERIOD_MATRIX.renewal.value);
    await this.savePolicyPeriodChanges();
    await waitForAppSettled(this.page, T);
  }

  async clickAddPeriodButtonOnCommissionRule() {
    const add = this.loc.addPeriodButton();
    await add.scrollIntoViewIfNeeded();
    await expect(add).toBeVisible({ timeout: T });
    await add.click();
    await captureToast(this.page, this.loc.slidingNotification(), T);
  }

  async expectAddPeriodButtonDisabled() {
    const add = this.loc.addPeriodButton();
    await expect(add).toBeVisible({ timeout: T });
    if (await waitForButtonState(add, false, 5_000)) {
      return;
    }
    const countBefore = await this.policyPeriodDataRows().count();
    await add.click();
    await waitForAppSettled(this.page, T);
    await expect(this.policyPeriodDataRows()).toHaveCount(countBefore);
  }

  async expectAddPeriodButtonEnabled() {
    await expect(this.loc.addPeriodButton()).toBeEnabled({ timeout: T });
  }

  async expectPolicyPeriodRowCount(count: number) {
    await expect(this.policyPeriodDataRows()).toHaveCount(count, { timeout: T });
  }

  // async expectPolicyPeriodRowContains(periodName: string, text: string) {
  //   const row = await this.resolvePolicyPeriodRow(periodName);
  //   await expect(row).toBeVisible({ timeout: T });
  //   const rowText1 = await row.getByTestId(/period-to/i).locator("//input").getAttribute("value");
  //   const rowText2 = await row.getByTestId(/period-value/i).locator("//input").getAttribute("value");
  //   console.log(rowText1,rowText2);
  //   await expect.soft(rowText1).toBe(new RegExp(escapeRegex(text), 'i'));
  //   await expect.soft(rowText2).toBe(new RegExp(escapeRegex(text), 'i'));
  // }


  //test
  async expectPolicyPeriodRow(
    periodName: string,
    expectedToMonths: string | null,
    expectedValue: string | null,
  ) {
    const row = await this.resolvePolicyPeriodRow(periodName);
  
    const toMonths = await row
      .getByTestId(/period-to/i)
      .locator("input")
      .inputValue();
  
    const value = await row
      .getByTestId(/period-value/i)
      .locator("input")
      .inputValue();
    if(expectedToMonths) {
      await expect.soft(toMonths).toMatch(expectedToMonths);
    }
    await expect.soft(value).toMatch(expectedValue ?? '');
  }

  async deletePolicyPeriodRow(periodName: string) {
    const row = await this.resolvePolicyPeriodRow(periodName);
    console.log(row);
    await expect(row).toBeVisible({ timeout: T });
    const deleteBtn = row.getByRole('button', { name: /delete period|delete/i });
    await deleteBtn.click();
    await waitForAppSettled(this.page, T);
  }

  async readPolicyPeriodValue(periodName?: string): Promise<string> {
    const row = await this.resolvePolicyPeriodRow(periodName);
    await expect(row).toBeVisible({ timeout: T });
    const valueInput = row.getByRole('spinbutton').nth(2);
    return (await valueInput.inputValue()).trim();
  }

  async readPolicyPeriodRowSignature(periodName?: string): Promise<string> {
    const row = await this.resolvePolicyPeriodRow(periodName);
    await expect(row).toBeVisible({ timeout: T });
    const value = await this.readPolicyPeriodValue(periodName);
    const text = (await row.innerText()).replace(/\s+/g, ' ').trim();
    return `${value}|${text}`;
  }

  async readCommissionSplitSignature(): Promise<string> {
    const splits = await this.readCommissionSplitsByAgentLevel();
    const lvl1 = splits.find((s) => /lvl\s*1/i.test(s.level)) ?? splits[0];
    return [lvl1?.agency ?? '', lvl1?.salesLeader ?? '', lvl1?.agent ?? '']
      .map((v) => v.replace(/\s+/g, '').trim())
      .join('|');
  }

  async expectDistinctSignatures(signatures: string[]) {
    expect(new Set(signatures).size).toBe(signatures.length);
  }

  async configureRegularPolicyPeriod(toMonths: string, value: string) {
    this.activePolicyPeriodName = 'Regular';
    await this.enterEditPolicyPeriodRow('Regular');
    await this.setPolicyPeriodMonthLimit(toMonths);
    await this.setPolicyPeriodValue(value);
    await this.savePolicyPeriodChanges();
  }

  async configureRenewalPolicyPeriod(value: string) {
    await this.enterEditPolicyPeriodRow('Renewal');
    await this.setPolicyPeriodValue(value);
    await this.savePolicyPeriodChanges();
  }

  async configureDistinctPolicyPeriodValuesOnIpvSlabs() {
    const tabs = this.loc.ipvSlabTabs();
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const { toMonths } = U65_ACA_PERIOD_MATRIX.regular;
    for (let i = 0; i < count; i++) {
      await this.selectIpvSlabByIndex(i);
      const value = U65_ACA_PERIOD_MATRIX.ipvSlabs[i]?.regularValue ?? `1${i}0.00`;
      await this.configureRegularPolicyPeriod(toMonths, value);
    }
  }

  async expectCommissionSplitSignatureForAgency(expectedAgency: string) {
    const sig = await this.readCommissionSplitSignature();
    expect(sig).toMatch(new RegExp(`^${escapeRegex(expectedAgency)}`, 'i'));
  }

  async expectCommissionSplitDiffersFromStored(stored: string) {
    const current = await this.readCommissionSplitSignature();
    expect(current).not.toBe(stored);
  }

  async expectCommissionSplitMatchesStored(stored: string) {
    const current = await this.readCommissionSplitSignature();
    expect(current).toBe(stored);
  }

  async fillRegularAndRenewalPeriodsWithTemplate() {
    const { toMonths, value } = U65_ACA_PERIOD_MATRIX.regular;
    const renewalValue = U65_ACA_PERIOD_MATRIX.renewal.value;
    await this.configureRegularPolicyPeriod(toMonths, value);
    await this.selectCommissionSplitTemplate(DEFAULT_COMMISSION_TEMPLATE);
    await this.addPolicyPeriod();
    await this.configureRenewalPolicyPeriod(renewalValue);
    await this.selectCommissionSplitTemplate(ALTERNATE_COMMISSION_TEMPLATE);
  }

  async configureIpvPeriodSplitMatrix() {
    const tabs = this.loc.ipvSlabTabs();
    const slabCount = await tabs.count();
    expect(slabCount).toBeGreaterThanOrEqual(2);
    const signatures: string[] = [];
    const { toMonths } = U65_ACA_PERIOD_MATRIX.regular;

    for (let i = 0; i < slabCount; i++) {
      await this.selectIpvSlabByIndex(i);
      const slab = U65_ACA_PERIOD_MATRIX.ipvSlabs[i];
      await this.configureRegularPolicyPeriod(toMonths, slab.regularValue);
      await this.enterEditPolicyPeriodRow('Regular');
      await this.setCommissionSplitManually(slab.agencySplit, '20');
      signatures.push(`ipv${i}:regular:${await this.readCommissionSplitSignature()}`);

      await this.addPolicyPeriod();
      await this.configureRenewalPolicyPeriod(slab.renewalValue);
      await this.enterEditPolicyPeriodRow('Renewal');
      const renewalAgency = String(Number(slab.agencySplit) - 5);
      await this.setCommissionSplitManually(renewalAgency, '15');
      signatures.push(`ipv${i}:renewal:${await this.readCommissionSplitSignature()}`);
    }
    return signatures;
  }

  async expectIpvPeriodSplitMatrixDistinct() {
    const signatures = await this.configureIpvPeriodSplitMatrix();
    await this.expectDistinctSignatures(signatures);
  }

  async expectIpvSlabsHaveDistinctRegularValues() {
    const tabs = this.loc.ipvSlabTabs();
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      await this.selectIpvSlabByIndex(i);
      const sig = await this.readPolicyPeriodRowSignature('Regular');
      values.push(sig);
    }
    await this.expectDistinctSignatures(values);
  }

  async expectIpvSlabsHaveDistinctCommissionSplits() {
    const tabs = this.loc.ipvSlabTabs();
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const signatures: string[] = [];
    for (let i = 0; i < count; i++) {
      await this.selectIpvSlabByIndex(i);
      await this.enterEditPolicyPeriodRow('Regular');
      await this.setCommissionSplitManually(
        U65_ACA_PERIOD_MATRIX.ipvSlabs[i].agencySplit,
        '20',
      );
      signatures.push(await this.readCommissionSplitSignature());
    }
    await this.expectDistinctSignatures(signatures);
  }

  async setPolicyPeriodMonthLimitWithoutValue(toMonths: string) {
    await this.setPolicyPeriodMonthLimit(toMonths, false);
  }

  async savePolicyPeriodChanges() {
    const table = this.loc.policyPeriodSlabsTable();
    const saveBtn = table
      .getByRole('button', { name: /save period|save changes|^save$/i })
      .or(table.locator('button[aria-label*="save" i]'))
      .first();
    await expect(saveBtn).toBeVisible({ timeout: T });
    await saveBtn.click();
    await waitForAppSettled(this.page, T);
    await this.page.keyboard.press('Escape');
    await waitForAppSettled(this.page, T);
  }

  async selectTemplateName(templateName: string) {
    const dropdown = this.loc.templateNameDropdown();
    await expect(dropdown).toBeVisible({ timeout: T });
    await dropdown.click();
    const requested = this.page
      .getByRole('listbox')
      .getByRole('option', { name: new RegExp(escapeRegex(templateName), 'i') })
      .or(this.page.getByRole('option', { name: new RegExp(escapeRegex(templateName), 'i') }))
      .first();
    let option: Locator = requested;
    if (!(await requested.isVisible({ timeout: 10_000 }).catch(() => false))) {
      option = this.page.getByTestId(/ACA - Carrier with OVR - Regular/i).first();
    }
    await expect(option).toBeVisible({ timeout: T });
    await option.click();
    await waitForAppSettled(this.page, T);
    if(await this.page.getByTestId('template-apply-confirm-apply').isVisible({ timeout: 10_000 }).catch(() => false)) {
    await this.page.getByTestId('template-apply-confirm-apply').click();}
    await waitForAppSettled(this.page, T);
  }

  async publishRule() {
    const saveDraft = this.loc.saveDraftButton();
    await saveDraft.scrollIntoViewIfNeeded();
    await expect(saveDraft).toBeEnabled({ timeout: T });
    await saveDraft.click();
    // Dismiss draft toast before publish — leftover draft toast would be
    // captured as the publish success message.
    await captureToast(this.page, this.loc.slidingNotification(), T);

    const publish = this.loc.publishRuleButton();
    await expect(publish).toBeEnabled({ timeout: T });
    await publish.click();
    const dialog = this.page.getByRole('dialog');
    if (await dialog.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await dialog.getByRole('button', { name: /publish/i }).last().click();
    }
    await captureToast(this.page, this.loc.slidingNotification(), T);
  }

  async openFirstCommissionStructureRecord(): Promise<void> {
    const grid = this.loc.commissionStructureGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const row = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .first();
    await expect(row).toBeVisible({ timeout: T });
    await row.click();
    await waitForAppSettled(this.page, T);
    await this.expectOnEditCommissionRulePage();
  }

  /**
   * Reads split-up % per LVL from the pivoted product table (Role × LVL1–LVL5).
   * Returned values are already split-up % (10%, 20%, …) — not raw share labels (1%, 2%, …).
   */
  async readCommissionSplitsByAgentLevel(): Promise<AgentLevelCommissionSplit[]> {
    const heading = this.page.getByRole('heading', { name: /commission splits by agent level/i });
    await expect(heading).toBeVisible({ timeout: T });

    const table = this.loc.splitsByAgentLevelTable();
    await expect(table).toBeVisible({ timeout: T });

    const headerCells = table.locator('[role="columnheader"], thead th');
    const headerTexts = (await headerCells.allInnerTexts()).map((h) =>
      h.replace(/\s+/g, ' ').trim(),
    );
    const headerTextsLower = headerTexts.map((h) => h.toLowerCase());

    const levelColumns = headerTexts
      .map((header, index) => ({ header, index }))
      .filter(({ header }) => /LVL\s*\d+/i.test(header))
      .map(({ header, index }) => ({ level: levelLabelFromHeader(header), index }));

    if (levelColumns.length > 0) {
      return this.readPivotedCommissionSplits(table, levelColumns);
    }

    return this.readRowBasedCommissionSplits(table, headerTextsLower);
  }

  private async readPivotedCommissionSplits(
    table: ReturnType<CommissionRulePage['loc']['splitsByAgentLevelTable']>,
    levelColumns: { level: string; index: number }[],
  ): Promise<AgentLevelCommissionSplit[]> {
    const byLevel = new Map<string, AgentLevelCommissionSplit>();
    for (const { level } of levelColumns) {
      byLevel.set(level, { level, agency: '', salesLeader: '', agent: '' });
    }

    const rows = table.locator('tbody tr, [role="row"]').filter({
      hasNot: this.page.getByRole('columnheader'),
    });
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('td, [role="gridcell"]');
      const values = (await cells.allInnerTexts()).map((v) => v.replace(/\s+/g, ' ').trim());
      const role = values[0]?.toLowerCase() ?? '';
      if (!role) continue;

      for (const { level, index } of levelColumns) {
        const split = byLevel.get(level);
        if (!split) continue;

        // Cell text shows dollar amounts (e.g. "$11.88$"), but the disabled
        // <input type="number"> inside each cell holds the actual percentage
        // (e.g. "66.00"). Read from the input instead of parsing cell text.
        let splitUpPercent = '';
        const cellInput = cells.nth(index).locator('input[type="number"]');
        if ((await cellInput.count()) > 0) {
          const inputValue = await cellInput.inputValue();
          if (inputValue) {
            splitUpPercent = normalizePercent(Number.parseFloat(inputValue).toFixed(2));
          }
        }

        assignRoleSplitPercent(role, splitUpPercent, split);
      }
    }

    const splits = [...byLevel.values()].filter(
      (split) => split.agency || split.salesLeader || split.agent,
    );
    if (splits.length === 0) {
      throw new Error('No rows found in pivoted "Commission Splits by Agent Level" table');
    }
    return splits;
  }

  private async readRowBasedCommissionSplits(
    table: ReturnType<CommissionRulePage['loc']['splitsByAgentLevelTable']>,
    headerTexts: string[],
  ): Promise<AgentLevelCommissionSplit[]> {
    const indexFor = (...labels: string[]) =>
      headerTexts.findIndex((header) => labels.some((label) => header.includes(label)));

    const levelCol = indexFor('level', 'agent level');
    const agencyCol = indexFor('agency');
    const salesLeaderCol = indexFor('sales leader', 'salesleader');
    const agentCol = headerTexts.findIndex(
      (header, idx) =>
        idx !== levelCol &&
        (header === 'agent' || (/\bagent\b/.test(header) && !header.includes('level'))),
    );

    const rows = table.locator('tbody tr, [role="row"]').filter({
      hasNot: this.page.getByRole('columnheader'),
    });
    const count = await rows.count();
    const splits: AgentLevelCommissionSplit[] = [];

    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('td, [role="gridcell"]');
      const values = (await cells.allInnerTexts()).map((v) => v.replace(/\s+/g, ' ').trim());
      if (!values.some(Boolean)) continue;

      const readCellPercent = async (colIdx: number): Promise<string> => {
        if (colIdx < 0) return '';
        const input = cells.nth(colIdx).locator('input[type="number"]');
        if ((await input.count()) > 0) {
          const iv = await input.inputValue();
          if (iv) return normalizePercent(Number.parseFloat(iv).toFixed(2));
        }
        return normalizePercent(values[colIdx] ?? '');
      };

      splits.push({
        level: levelCol >= 0 ? values[levelCol] ?? '' : values[0] ?? '',
        agency: await readCellPercent(agencyCol),
        salesLeader: await readCellPercent(salesLeaderCol),
        agent: await readCellPercent(agentCol),
      });
    }

    if (splits.length === 0) {
      throw new Error('No rows found in "Commission Splits by Agent Level" table');
    }

    return splits;
  }

  async expectSlidingNotificationContaining(text: string) {
    const pattern = new RegExp(`${escapeRegex(text)}\\.?`, 'i');
    const captured = await expectCapturedOrLiveToast(this.page, this.loc.slidingNotification(), T);
    if (captured) {
      expect.soft(captured, `Toast "${captured}" should contain "${text}" (soft)`).toMatch(pattern);
    }
  }

  // --- Product-management commission rule edit (cases 21–41) ---

  async expectOnEditCommissionRulePageForType(typeLabel: string) {
    const segment = commissionTypeUrlSegment(typeLabel);
    await expect(this.page).toHaveURL(
      new RegExp(`/edit/${escapeRegex(segment)}`, 'i'),
      { timeout: T },
    );
    await this.expectOnEditCommissionRulePage();
  }

  async cancelCommissionRuleEdit() {
    await this.loc.ruleNameInput().fill('new rule name');
    await this.loc.ruleNameInput().blur();
    await waitForAppSettled(this.page, T);
    const cancel = this.loc.cancelEditButton();
    await expect(cancel).toBeVisible({ timeout: T });
    await cancel.click();
    await waitForAppSettled(this.page, T);
  }

  async confirmLeavingCommissionRuleEdit() {
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: T });
    const leave = dialog
      .getByRole('button', { name: /^cancel$/i })
      .or(dialog.getByRole('button', { name: /discard|leave|don't save|do not save/i }))
      .last();
    await expect(leave).toBeVisible({ timeout: T });
    await leave.click();
    await waitForAppSettled(this.page, T);
  }

  async expectPublishRuleButtonDisabled() {
    await expect(this.loc.publishRuleButton()).toBeDisabled({ timeout: T });
  }

  async expectSaveDraftButtonDisabled() {
    await expect(this.loc.saveDraftButton()).toBeDisabled({ timeout: T });
  }

  async expectSaveDraftButtonEnabled() {
    await this.ensureSaveDraftButtonEnabled();
  }

  private async ensureSaveDraftButtonEnabled() {
    const save = this.loc.saveDraftButton();
    if (!(await waitForButtonState(save, true, 5_000))) {
      const nameInput = this.loc.ruleNameInput().first();
      const name = (await nameInput.inputValue().catch(() => '')).trim();
      if (!name) {
        await this.setCommissionRuleNameToValidUniqueValue();
      }
      const startInput = this.loc.effectiveStartDateInput();
      const start = (await startInput.inputValue().catch(() => '')).trim();
      if (!start) {
        await this.setCommissionRuleEffectiveStartDate('01/01/2021');
      }
    }
    if(await this.page.getByRole('button', { name: 'Save changes' }).isVisible()) {
      await this.page.getByRole('button', { name: 'Save changes' }).click();
      await waitForAppSettled(this.page, T);
    }
    await expect(save).toBeEnabled({ timeout: T });
  }

  private async fillRuleName(value: string) {
    const input = this.loc.ruleNameInput();
    await expect(input.first()).toBeVisible({ timeout: T });
    await input.first().fill(value);
    await input.first().blur();
    await waitForAppSettled(this.page, T);
  }

  async setCommissionRuleNameToValidUniqueValue(): Promise<string> {
    const name = validUniqueRuleName();
    await this.fillRuleName(name);
    return name;
  }

  async setCommissionRuleNameWhitespaceOnly() {
    await this.fillRuleName(SPACES_ONLY_RULE_NAME);
  }

  async setCommissionRuleNameOverMaxLength() {
    await this.fillRuleName(overMaxRuleName());
  }

  async enterCommissionRuleNameAndEffectiveStartDate() {
    await this.setCommissionRuleNameToValidUniqueValue();
    await this.setCommissionRuleEffectiveStartDate('01/01/2021');
  }

  async clickSaveDraftOnCommissionRule() {
    await this.ensureSaveDraftButtonEnabled();
    const save = this.loc.saveDraftButton();
    await save.scrollIntoViewIfNeeded();
    await save.click();
    await captureToast(this.page, this.loc.slidingNotification(), T);
  }

  /** Saves the commission rule draft after validation scenarios — fills missing mandatory fields, clicks Save Draft, and captures success toast. */
  async saveTheDraft() {
    await this.ensureSaveDraftButtonEnabled();
    const save = this.loc.saveDraftButton();
    await save.scrollIntoViewIfNeeded();
    await save.click();
    await captureToast(this.page, this.loc.slidingNotification(), T);
  }

  async expectCommissionRuleDraftSavedSuccessfully() {
    const text = await expectCapturedOrLiveToast(this.page, this.loc.slidingNotification(), T);
    if (text) {
      expect
        .soft(text, `Toast "${text}" should contain draft-saved message (soft)`)
        .toMatch(new RegExp(COMMISSION_RULE_DRAFT_SAVED_MESSAGE, 'i'));
    }
  }

  async setCommissionRuleEffectiveStartDate(value: string) {
    await this.setPolicyStartDate(value);
  }

  async setCommissionRuleEffectiveEndDate(value: string) {
    const input = this.loc.effectiveEndDateInput();
    await expect(input.first()).toBeVisible({ timeout: T });
    await input.first().click();
    const popup = this.page.locator('[data-testid$="-calendar-popup"]');
    await expect(popup).toBeVisible({ timeout: T });
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    if (!match) throw new Error(`Expected MM/DD/YYYY date, got: ${value}`);
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = monthNames[month - 1];
    if (!monthName || day < 1 || day > 31) throw new Error(`Invalid calendar date: ${value}`);

    const navLabel = popup.locator('.react-calendar__navigation__label');
    for (let i = 0; i < 2; i++) {
      const labelText = (await navLabel.innerText()).replace(/\s+/g, ' ').trim();
      if (/\d{4}\s*[–-]\s*\d{4}/.test(labelText)) break;
      await navLabel.click();
      await this.page.waitForTimeout(150);
    }
    let yearClicked = false;
    for (let i = 0; i < 24; i++) {
      const yearTile = popup.locator('button.react-calendar__tile').filter({ hasText: new RegExp(`^${year}$`) });
      if ((await yearTile.count()) > 0 && (await yearTile.first().isVisible().catch(() => false))) {
        await yearTile.first().click();
        yearClicked = true;
        break;
      }
      const labelText = (await navLabel.innerText()).replace(/\s+/g, ' ').trim();
      const range = labelText.match(/(\d{4})\s*[–-]\s*(\d{4})/);
      if (!range) throw new Error(`Calendar not in decade view while seeking year ${year}`);
      if (year < Number(range[1])) {
        await popup.locator('.react-calendar__navigation__prev-button').click();
      } else {
        await popup.locator('.react-calendar__navigation__next-button').click();
      }
      await this.page.waitForTimeout(150);
    }
    if (!yearClicked) throw new Error(`Could not find year ${year} in calendar`);
    await this.page.waitForTimeout(150);
    await popup.getByRole('button', { name: `${monthName} ${year}`, exact: true }).click();
    await this.page.waitForTimeout(150);
    const dayBtn = popup
      .locator('button.react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth)')
      .filter({ hasText: new RegExp(`^${day}$`) });
    await expect(dayBtn, `Day ${day} should be unique in calendar month`).toHaveCount(1);
    await dayBtn.click();
    await this.page.waitForTimeout(200);
    await waitForAppSettled(this.page, T);
  }

  async clearCommissionRuleEffectiveDates() {
    for (const testId of ['effective-start-date', 'effective-end-date']) {
      const wrapper = this.page.getByTestId(testId);
      const input = wrapper.locator('input').first();
      if (await input.isVisible().catch(() => false)) {
        await input.click();
        const popup = this.page.getByTestId(`${testId}-calendar-popup`);
        if (await popup.isVisible({ timeout: 3_000 }).catch(() => false)) {
          const clearBtn = this.page.getByTestId(`${testId}-calendar-clear`);
          if (await clearBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await clearBtn.click();
          } else {
            await this.page.keyboard.press('Escape');
          }
        }
      }
    }
    await waitForAppSettled(this.page, T);
  }

  async expectCommissionRuleDateValidationOnEffectiveDates() {
    const error = this.page
      .getByTestId(/effective-(start|end)-date-error/i)
      .or(this.page.getByText(/effective.*date|start.*after.*end|end.*before.*start|invalid.*date/i))
      .first();
    await expect(error).toBeVisible({ timeout: T });
  }

  async enablePmpmOnCommissionRule() {
    const toggle = this.loc.pmpmToggle();
    await expect(toggle).toBeVisible({ timeout: T });
    if (!(await toggle.isChecked())) {
      await toggle.click();
      await waitForAppSettled(this.page, T);
    }
  }

  async disablePmpmOnCommissionRule() {
    const toggle = this.loc.pmpmToggle();
    await expect(toggle).toBeVisible({ timeout: T });
    if (await toggle.isChecked()) {
      await toggle.click();
      await waitForAppSettled(this.page, T);
    }
  }

  async expectPmpmDisabledOnCommissionRule() {
    await expect(this.loc.pmpmToggle()).not.toBeChecked({ timeout: T });
  }

  private async nextIpvSlabFromValue(): Promise<string> {
    const slabCount = await this.loc.ipvSlabTabs().count();
    return slabCount === 0 ? '1' : '10';
  }

  private async openAddIpvSlabDialog(): Promise<Locator> {
    const add = this.loc.addIpvSlabButton().first();
    await add.scrollIntoViewIfNeeded();
    await expect(add).toBeEnabled({ timeout: T });
    await add.click();
    const dialog = this.loc.addIpvSlabDialog();
    await expect(dialog).toBeVisible({ timeout: T });
    return dialog;
  }

  private async confirmAddIpvSlabDialog(dialog: Locator) {
    const confirm = dialog.getByRole('button', { name: /^add slab$/i });
    await expect(confirm).toBeEnabled({ timeout: T });
    await confirm.click();
    await dialog.waitFor({ state: 'hidden', timeout: T }).catch(() => {});
    await waitForAppSettled(this.page, T);
  }

  async addIpvSlabWithRange(from: string, to: string) {
    const dialog = await this.openAddIpvSlabDialog();
    const fromInput = dialog.getByRole('spinbutton').nth(0);
    const toInput = dialog.getByRole('spinbutton').nth(1);
    await expect(fromInput).toBeEnabled({ timeout: T });
    await fromInput.fill(from);
    await fromInput.blur();
    await dialog.getByTestId('slab-set-limit-button').click();
    await expect(toInput).toBeEnabled({ timeout: T });
    await toInput.fill(to);
    await toInput.blur();
    await this.confirmAddIpvSlabDialog(dialog);
  }

  async addIpvSlabFromWithNoLimit(from: string) {
    const dialog = await this.openAddIpvSlabDialog();
    const fromInput = dialog.getByRole('spinbutton').nth(0);
    await expect(fromInput).toBeEnabled({ timeout: T });
    await fromInput.fill(from);
    await fromInput.blur();
    await this.confirmAddIpvSlabDialog(dialog);
  }

  async addIpvSlabWithNoLimit() {
    await this.addIpvSlabFromWithNoLimit('25');
  }

  async addIpvSlabWithLimit(limit: string) {
    await this.addIpvSlabWithRange(await this.nextIpvSlabFromValue(), limit);
  }

  async disableIpvSlabOnCommissionRule() {
    const disable = this.loc.disableIpvSlabButton();
    await disable.scrollIntoViewIfNeeded();
    await expect(disable).toBeEnabled({ timeout: T });
    await disable.click();
    await waitForAppSettled(this.page, T);
  }

  async expectMultipleIpvSlabs() {
    const tabs = this.loc.ipvSlabTabs();
    await expect(tabs).toHaveCount(2, { timeout: T });
  }

  async expectNoIpvSlabs() {
    await expect(this.loc.addIpvSlabButton()).toBeVisible({ timeout: T });
    const tabs = this.loc.ipvSlabTabs();
    await expect(tabs).toHaveCount(0, { timeout: T });
  }

  async expectDisableIpvSlabControlDisabled() {
    await expect(this.loc.disableIpvSlabButton()).toBeDisabled({ timeout: T });
  }

  async selectEachIpvSlabOnCommissionRule() {
    const tabs = this.loc.ipvSlabTabs();
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await waitForAppSettled(this.page);
    }
  }

  async expectEachIpvSlabShowsDistinctPolicyPeriodSlab() {
    const tabs = this.loc.ipvSlabTabs();
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      await this.selectIpvSlabByIndex(i);
      values.push(await this.readPolicyPeriodValue('Regular'));
    }
    await this.expectDistinctSignatures(values);
  }

  private async setRoleSplitAcrossLevels(roleLabel: string, value: string, section?: Locator) {
    const scope = section ?? this.page.locator('body');
    const table = scope
      .getByRole('heading', { name: /commission splits by agent level/i })
      .locator('xpath=following::table[1]');
    const row = table.getByRole('row', { name: new RegExp(`^${escapeRegex(roleLabel)}`, 'i') }).first();
    const spinboxes = row.getByRole('spinbutton');
    const count = await spinboxes.count();
    expect(count, `Expected ${roleLabel} row spinbuttons`).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = spinboxes.nth(i);
      await box.fill(value);
      await box.blur();
    }
  }

  private splitSpinboxForRole(roleLabel: string, section?: Locator): Locator {
    const scope = section ?? this.page.locator('body');
    const table = scope
      .getByRole('heading', { name: /commission splits by agent level/i })
      .locator('xpath=following::table[1]');
    return table
      .getByRole('row', { name: new RegExp(`^${escapeRegex(roleLabel)}`, 'i') })
      .getByRole('spinbutton')
      .first();
  }

  async setCommissionSplitManually(agency: string, salesLeader: string) {
    await this.setRoleSplitAcrossLevels('Agency', agency);
    await this.setRoleSplitAcrossLevels('Sales Leader', salesLeader);
    await waitForAppSettled(this.page, T);
  }

  async expectCommissionSplitAgentValue(expected: string) {
    const agentBox = this.splitSpinboxForRole('Agent');
    await expect(agentBox).toHaveValue(parseFloat(expected).toFixed(2));
  }

  async selectCommissionSplitTemplate(templateName: string = DEFAULT_COMMISSION_TEMPLATE) {
    await this.selectTemplateName(templateName);
  }

  async selectCommissionSplitTemplateByKeyword(keyword: string) {
    const fallback = IPV_SLAB_SPLIT_MATRIX.templateFallbacks[keyword as keyof typeof IPV_SLAB_SPLIT_MATRIX.templateFallbacks];
    if (fallback) {
      await this.selectCommissionSplitTemplate(fallback);
      return;
    }

    const dropdown = this.loc.templateNameDropdown();
    await expect(dropdown).toBeVisible({ timeout: T });
    await dropdown.click();
    const pattern = new RegExp(escapeRegex(keyword), 'i');
    const listbox = this.page.getByRole('listbox');
    const matchingOptions = listbox.getByRole('option').filter({ hasText: pattern });

    let option = matchingOptions.first();
    if (/^aca$/i.test(keyword)) {
      const renewalOption = matchingOptions.filter({ hasText: /renewal/i }).first();
      if (await renewalOption.isVisible().catch(() => false)) {
        option = renewalOption;
      }
    }

    await expect(option).toBeVisible({ timeout: T });
    await option.click();
    await waitForAppSettled(this.page, T);
    if (
      await this.page
        .getByTestId('template-apply-confirm-apply')
        .isVisible({ timeout: 10_000 })
        .catch(() => false)
    ) {
      await this.page.getByTestId('template-apply-confirm-apply').click();
    }
    await waitForAppSettled(this.page, T);
  }

  async selectDifferentCommissionSplitTemplate() {
    await this.selectCommissionSplitTemplate(DEFAULT_COMMISSION_TEMPLATE);
    await this.selectCommissionSplitTemplate(ALTERNATE_COMMISSION_TEMPLATE);
  }

  async expectCommissionSplitFieldsPopulatedFromTemplate() {
    const splits = await this.readCommissionSplitsByAgentLevel();
    const populated = splits.some((s) => s.agency || s.salesLeader || s.agent);
    expect(populated, 'Commission split fields should be populated from template').toBeTruthy();
  }

  private subAgentSplitTable() {
    return this.loc.subAgentSplitSection().locator('xpath=ancestor::table[1]');
  }

  async enableSubAgentWiseCommissionSplit() {
    const checkbox = this.loc.subAgentSplitCheckbox();
    await expect(checkbox).toBeAttached({ timeout: T });
    if (!(await checkbox.isChecked())) {
      const toggle = this.loc.subAgentSplitToggle();
      await expect(toggle).toBeVisible({ timeout: T });
      await toggle.click();
      await waitForAppSettled(this.page, T);
    }
  }

  async expectSubAgentCommissionSplitSectionVisible() {
    await expect(this.loc.subAgentSplitSection()).toBeVisible({ timeout: T });
  }

  async setSubAgentCommissionSplitManually(agency: string, salesLeader: string) {
    await this.setCommissionSplitManually(agency, salesLeader);
  }

  async expectSubAgentCommissionSplitAgentValue(expected: string) {
    const table = this.loc.splitsByAgentLevelTable();
    await expect(table).toBeVisible({ timeout: T });
    const agentRow = table.getByRole('row', { name: /^agent\b/i }).first();
    const text = (await agentRow.innerText()).replace(/\s+/g, ' ');
    expect(text).toMatch(new RegExp(`\\b${escapeRegex(expected)}\\b`));
  }

  async expectSubAgentCommissionSplitAgentValueForAllFields(expected: string) {
    await this.expectSubAgentCommissionSplitSectionVisible();
    const table = this.loc.splitsByAgentLevelTable();
    await expect(table).toBeVisible({ timeout: T });
    const agentRow = table.getByRole('row', { name: /^agent\b/i }).first();
    await expect(agentRow).toBeVisible({ timeout: T });
    const spinboxes = agentRow.getByRole('spinbutton');
    const count = await spinboxes.count();
    expect(count, 'Expected Agent row spinbuttons in agent-level commission split table').toBeGreaterThan(0);
    const formatted = parseFloat(expected).toFixed(2);
    for (let i = 0; i < count; i++) {
      await expect(spinboxes.nth(i)).toHaveValue(formatted);
    }
  }

  async selectSubAgentCommissionSplitTemplate(templateName = DEFAULT_COMMISSION_TEMPLATE) {
    const dropdown = this.page.getByRole('button', { name: /^select$/i }).nth(1);
    await expect(dropdown).toBeVisible({ timeout: T });
    await dropdown.click();
    const option = this.page
      .getByRole("option",{name:/ACA/}).nth(0)
    await expect(option).toBeVisible({ timeout: T });
    await option.click();
    await waitForAppSettled(this.page, T);
  }

  async expectSubAgentCommissionSplitFieldsPopulatedFromTemplate() {
    await this.expectSubAgentCommissionSplitSectionVisible();
    const table = this.subAgentSplitTable();
    await expect(table).toBeVisible({ timeout: T });
    const text = await table.innerText();
    expect(text.replace(/\s+/g, ' ')).toMatch(/sa\d+/i);
    expect(text).toMatch(/[\d.]+%|[\d.]+/);
  }

  async fillAllMandatoryCommissionRuleFieldsWithValidData() {
    const name = await this.setCommissionRuleNameToValidUniqueValue();
    await this.setCommissionRuleEffectiveStartDate('01/01/2021');
    await this.setPolicyPeriodSlabs('10');
    await this.savePolicyPeriodChanges();
    await this.selectCommissionSplitTemplate(DEFAULT_COMMISSION_TEMPLATE);
    return name;
  }

  async clickPublishRuleOnCommissionRule() {
    const publish = this.loc.publishRuleButton();
    await publish.scrollIntoViewIfNeeded();
    await expect(publish).toBeEnabled({ timeout: T });
    await publish.click();
    const dialog = this.page.getByRole('dialog');
    if (await dialog.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await dialog.getByRole('button', { name: /publish/i }).last().click();
    }
    await captureToast(this.page, this.loc.slidingNotification(), T);
  }

  async expectCommissionRulePublishedSuccessfully() {
    await this.expectSlidingNotificationContaining(COMMISSION_RULE_PUBLISHED_MESSAGE);
  }

  async clickCreateNewVersionOnCommissionRule() {
    const button = this.loc.createNewVersionButton();
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeEnabled({ timeout: T });
    await button.click();
    await captureToast(this.page, this.loc.slidingNotification(), T);
    await waitForAppSettled(this.page, T);
    await this.loc.backButton().click();
    // Editing the new version may ask to leave with unsaved changes — accept the discard.
    const dialog = this.page.getByRole('dialog');
    if (await dialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const leave = dialog
        .getByRole('button', { name: /^cancel$/i })
        .or(dialog.getByRole('button', { name: /discard|leave|don't save|do not save|cancel/i }))
        .last();
      if (await leave.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await leave.click();
        await waitForAppSettled(this.page, T);
      }
    }
  }

  async expectNewDraftVersionCreatedForType(typeLabel: string) {
    if (/\/edit\//i.test(this.page.url())) {
      const tab = this.page.getByRole('button', { name: /commission structure/i }).last();
      if (await tab.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await tab.click();
        await waitForAppSettled(this.page, T);
      }
    }
    const segment = commissionTypeUrlSegment(typeLabel);
    const grid = this.loc.commissionStructureGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const row = grid
      .getByRole('row')
      .filter({ hasText: new RegExp(segment, 'i') })
      .filter({ hasText: /draft/i })
      .first();
    await expect(row).toBeVisible({ timeout: T });
    const text = (await row.innerText()).replace(/\s+/g, ' ');
    expect(text).toMatch(/version\s*2|draft/i);
  }
}

