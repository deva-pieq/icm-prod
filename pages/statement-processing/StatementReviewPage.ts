import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { STATEMENT_UPLOAD } from '../../test-data/commission-statements/statementUpload';
import { debugLogFileIdCaptured, debugLogFileIdClick } from '../../utils/debugSteps';
import { StatementReviewAssertions } from './StatementReviewAssertions';
import { captureToast, expectCapturedOrLiveToast, waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class StatementReviewPage {
  readonly assertions: StatementReviewAssertions;

  readonly loc = {
    heading: () =>
      this.page.getByRole('heading', { name: STATEMENT_UPLOAD.reviewHeading, exact: true }),
    warningIcon: () =>
      this.page
        .locator("//div[@col-id='warning']").locator(".lucide.lucide-triangle-alert").first(),
    tooltip: () =>
      this.page
        .getByRole('tooltip')
        .or(this.page.locator('[data-radix-popper-content-wrapper], [role="tooltip"]')),
    completeReviewButton: () =>
      this.page
        .getByTestId('complete-review-button')
        .or(this.page.getByRole('button', { name: /complete review/i })),
    completeReviewConfirmButton: () =>
      this.page
        .getByTestId('complete-review-confirm-button')
        .or(this.page.getByRole('button', { name: /^ok$|^confirm$/i })),
    submitStatement: () => this.page.getByTestId('submit-statement-button'),
    submitConfirm: () => this.page.getByTestId('submit-statement-confirm-button'),
    toast: () => this.page.getByTestId(/toast/).first(),
    // Bulk update (harvested on Review — count===1 after select-all)
    reviewGrid: () => this.page.getByTestId('review-statement-grid'),
    bulkSelectAll: () => this.page.getByTestId('review-bulk-header-select-all'),
    bulkUpdateButton: () => this.page.getByTestId('review-bulk-update-button'),
    bulkUpdateModal: () => this.page.getByTestId('review-bulk-update-modal'),
    bulkFieldDropdown: () => this.page.getByTestId('review-bulk-field-dropdown'),
    bulkFieldDropdownButton: () =>
      this.page.getByTestId('review-bulk-field-dropdown').locator('button').first(),
    bulkFieldOption: (label: string) =>
      this.page.getByRole('option', { name: label, exact: true }),
    bulkNewValueInput: () =>
      this.page.getByTestId('review-bulk-new-value-text').locator('input').first(),
    bulkNewValueDateInput: () =>
      this.page.getByTestId('review-bulk-new-value-date').locator('input').first(),
    bulkRationaleInput: () =>
      this.page.getByTestId('review-bulk-rationale').locator('textarea').first(),
    bulkModalSubmit: () => this.page.getByTestId('review-bulk-modal-submit'),
    bulkModalCancel: () => this.page.getByTestId('review-bulk-modal-cancel'),
    bulkValidationWarning: () => this.page.getByTestId('review-bulk-validation-warning'),
  };

  /** Live Field-to-Update labels → AG Grid col-id (harvested). */
  static readonly BULK_FIELD_COL_IDS: Record<string, string> = {
    'Policy Number': 'policy_number',
    'Policy Holder Name': 'policy_holder_name',
    'Agent Id': 'agent_npn',
    'Agent Name': 'agent_name',
    'Product Name': 'product_name',
    State: 'policy_state',
    Address: 'address',
    'Total Members': 'total_members',
    'Issue Date': 'policy_effective_date',
    'Paid to Date': 'paid_to_date',
    Premium: 'premium',
    'Commission %': 'commission_percent',
    Chargeback: 'chargeback',
    'Gross Comm': 'gross_commission',
    'Earned Comm': 'earned_commission',
  };

  constructor(readonly page: Page) {
    this.assertions = new StatementReviewAssertions(this);
  }

  async openFromRow(row: Locator, fileId?: string): Promise<string> {
    debugLogFileIdClick(fileId ?? '');
    const reviewLink = row.locator('a[href*="/commission-processing/review/"]').first();
    if (await reviewLink.isVisible().catch(() => false)) {
      await reviewLink.click();
    } else {
      await row.click();
    }
    await expect.soft(this.page).toHaveURL(AppUrlPatterns.commissionReview, { timeout: T });
    await waitForAppSettled(this.page, T);
    const urlFileId = this.getFileIdFromUrl();
    debugLogFileIdCaptured(urlFileId, 'review-url');
    return urlFileId;
  }

  getFileIdFromUrl(): string {
    const urlId = this.page.url().match(/\/review\/([^/?#]+)/i)?.[1];
    return urlId ? decodeURIComponent(urlId) : '';
  }

  async expectOnReviewPage(): Promise<void> {
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionReview, { timeout: T });
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
  }

  async expectHeading(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: title, exact: true })).toBeVisible({
      timeout: T,
    });
  }

  async hoverWarningIcon(): Promise<string> {
    const icon = this.loc.warningIcon();
    await expect(icon).toBeVisible({ timeout: T });
    await icon.hover();
    await this.page.waitForTimeout(500);
    const tooltip = this.loc.tooltip().first();
    await expect(tooltip).toBeVisible({ timeout: T });
    return (await tooltip.innerText()).replace(/\s+/g, ' ').trim();
  }

  async completeReviewAndConfirm(): Promise<void> {
    await this.loc.completeReviewButton().click();
    await expect(this.loc.completeReviewConfirmButton()).toBeVisible({ timeout: T });
    await this.loc.completeReviewConfirmButton().click();
    await captureToast(this.page, this.loc.toast(), T);
  }

  async submitStatementForReview(): Promise<void> {
    await this.loc.submitStatement().click();
    await expect(this.loc.submitConfirm()).toBeVisible({ timeout: T });
    await this.loc.submitConfirm().click();
    await captureToast(this.page, this.loc.toast(), T);
  }

  async confirmSubmissionIfVisible(): Promise<void> {
    const confirm = this.loc.submitConfirm();
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
      await captureToast(this.page, this.loc.toast(), T);
    }
  }

  async expectSuccessToastVisible(): Promise<void> {
    const text = await expectCapturedOrLiveToast(this.page, this.loc.toast(), T);
    if (text) {
      expect.soft(text.length, 'Success toast should contain a message (soft)').toBeGreaterThan(0);
    }
  }

  async getSubtitleText(): Promise<string> {
    const subtitle = this.page.locator('h1, h2, h3').first().locator('..').locator('p, span').first();
    if (await subtitle.isVisible().catch(() => false)) {
      return (await subtitle.innerText()).replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  async selectAllRowsForBulkUpdate(): Promise<void> {
    await expect(this.loc.reviewGrid()).toBeVisible({ timeout: T });
    const selectAll = this.loc.bulkSelectAll();
    await expect(selectAll).toBeVisible({ timeout: T });
    await selectAll.click();
    await expect(this.loc.bulkUpdateButton()).toBeVisible({ timeout: T });
  }

  async openBulkUpdateModal(): Promise<void> {
    await this.loc.bulkUpdateButton().click();
    await expect(this.loc.bulkUpdateModal()).toBeVisible({ timeout: T });
  }

  async fillBulkUpdateForm(field: string, newValue: string, rationale: string): Promise<void> {
    await expect(this.loc.bulkUpdateModal()).toBeVisible({ timeout: T });
    await this.loc.bulkFieldDropdownButton().click();
    await expect(this.loc.bulkFieldOption(field)).toBeVisible({ timeout: T });
    await this.loc.bulkFieldOption(field).click();

    const dateInput = this.loc.bulkNewValueDateInput();
    const textInput = this.loc.bulkNewValueInput();
    const useDate = await dateInput.isVisible().catch(() => false);
    const input = useDate ? dateInput : textInput;

    if (useDate) {
      const calendarValue = normalizeBulkDateValue(newValue);
      const filled = await input.fill(calendarValue).then(() => true).catch(() => false);
      if (!filled) {
        await this.selectDateInBulkCalendar(calendarValue);
      }
    } else {
      await input.fill(newValue);
    }

    await this.loc.bulkRationaleInput().fill(rationale);
    await expect(this.loc.bulkRationaleInput()).toHaveValue(rationale);
  }

  /**
   * Navigate react-calendar popup inside the bulk update modal to pick dd/mm/yyyy.
   * Similar to TransferSheetPage.selectDateInCalendar — calendar popup testid
   * ends with -calendar-popup (e.g. review-bulk-new-value-date-calendar-popup).
   */
  private async selectDateInBulkCalendar(dateStr: string): Promise<void> {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr.trim());
    if (!match) throw new Error(`Expected dd/mm/yyyy date for bulk calendar, got: ${dateStr}`);
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ];
    const monthName = monthNames[month - 1];
    if (!monthName || day < 1 || day > 31) throw new Error(`Invalid bulk calendar date: ${dateStr}`);

    // Click the date input to open the calendar popup
    await this.loc.bulkNewValueDateInput().click();

    // Find the calendar popup (same pattern as other modules)
    const popup = this.page.locator('[data-testid$="-calendar-popup"]').filter({ has: this.page.locator('.react-calendar') }).first();
    await expect(popup).toBeVisible({ timeout: T });

    // Navigate to year view if needed
    const navLabel = popup.locator('.react-calendar__navigation__label');
    for (let i = 0; i < 2; i++) {
      const labelText = (await navLabel.innerText()).replace(/\s+/g, ' ').trim();
      if (/\d{4}\s*[–-]\s*\d{4}/.test(labelText)) break;
      await navLabel.click();
      await this.page.waitForTimeout(150);
    }

    // Click the target year
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
      if (!range) throw new Error(`Bulk calendar not in decade view while seeking year ${year}`);
      const start = Number(range[1]);
      if (year < start) {
        await popup.locator('.react-calendar__navigation__prev-button').click();
      } else {
        await popup.locator('.react-calendar__navigation__next-button').click();
      }
      await this.page.waitForTimeout(150);
    }
    if (!yearClicked) throw new Error(`Could not find year ${year} in bulk calendar`);
    await this.page.waitForTimeout(150);

    // Click the target month
    await popup.getByRole('button', { name: `${monthName} ${year}`, exact: true }).click();
    await this.page.waitForTimeout(150);

    // Click the target day
    const dayBtn = popup
      .locator('button.react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth)')
      .filter({ hasText: new RegExp(`^${day}$`) });
    await expect(dayBtn, `Day ${day} should be unique in bulk calendar month`).toHaveCount(1);
    await dayBtn.click();
    await this.page.waitForTimeout(200);
  }

  async submitBulkUpdate(): Promise<void> {
    await this.loc.bulkModalSubmit().click();
    await captureToast(this.page, this.loc.toast(), T);
    await waitForAppSettled(this.page, T);
  }

  /**
   * Select-all → open modal → fill Field / New Value / Rationale → submit.
   * Selection clears after each update — call once per field.
   */
  async bulkUpdateField(field: string, newValue: string, rationale: string): Promise<void> {
    await this.selectAllRowsForBulkUpdate();
    await this.openBulkUpdateModal();
    await this.fillBulkUpdateForm(field, newValue, rationale);
    await this.submitBulkUpdate();
  }

  async expectBulkUpdateToast(): Promise<void> {
    const text = await expectCapturedOrLiveToast(this.page, this.loc.toast(), T);
    expect(text.toLowerCase()).toContain('bulk update completed');
  }

  /** Re-open stored Review URL if shared page left the review route. */
  async ensureBulkReviewSession(reviewUrl: string, fileId: string): Promise<void> {
    const onStoredReview =
      AppUrlPatterns.commissionReview.test(this.page.url()) &&
      this.page.url().includes(fileId);
    if (!onStoredReview) {
      await this.page.goto(reviewUrl, { waitUntil: 'domcontentloaded' });
      await waitForAppSettled(this.page, T);
    }
    await this.expectOnReviewPage();
  }

  /** Assert visible (virtualized) cells for the field col-id match newValue. */
  async expectVisibleRowsShowBulkValue(field: string, newValue: string): Promise<void> {
    const colId = StatementReviewPage.BULK_FIELD_COL_IDS[field];
    expect(colId, `Unknown bulk field label: ${field}`).toBeTruthy();
    await this.assertions.expectVisibleColumnCellsEqual(colId!, newValue);
  }
}

/**
 * Bulk date New Value control uses dd/mm/yyyy (testid review-bulk-new-value-date).
 * Gherkin often writes US MM/DD/YYYY — convert when the day/month are unambiguous or swap.
 */
function normalizeBulkDateValue(raw: string): string {
  const s = raw.trim();
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!m) return s;
  const a = Number.parseInt(m[1], 10);
  const b = Number.parseInt(m[2], 10);
  const y = m[3];
  const pad = (n: number) => String(n).padStart(2, '0');
  if (a > 12) return `${pad(a)}/${pad(b)}/${y}`; // already day-first
  if (b > 12) return `${pad(b)}/${pad(a)}/${y}`; // month-first → day-first
  // Ambiguous (both ≤12): treat feature literals as MM/DD/YYYY → DD/MM/YYYY
  return `${pad(b)}/${pad(a)}/${y}`;
}
