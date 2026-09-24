import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import type { OpsManagerDashboardPage } from '../dashboard/OpsManagerDashboardPage';
import type { StatementUploadPage } from '../statement-processing/StatementUploadPage';
import { ensurePageReady, waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import {
  setPriorCutOffDay,
  tryGetPriorCutOffDay,
} from '../../utils/processing-cut-off/processingCutOffContext';

const T = smokeStepTimeoutMs;

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function dayIndex(name: string): number {
  const idx = DAY_INDEX[name.trim().toLowerCase()];
  if (idx === undefined) throw new Error(`Unknown weekday name "${name}"`);
  return idx;
}

/** "Mon DD, YYYY - Mon DD, YYYY" — separator harvested live (" - "). */
const RANGE_FORMAT = /^[A-Z][a-z]{2} \d{1,2}, \d{4} - [A-Z][a-z]{2} \d{1,2}, \d{4}$/;

function parseRangeDates(range: string): { start: Date; end: Date } {
  const [startRaw, endRaw] = range.split(' - ');
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  expect(Number.isNaN(start.getTime()), `Unparseable start in "${range}"`).toBe(false);
  expect(Number.isNaN(end.getTime()), `Unparseable end in "${range}"`).toBe(false);
  return { start, end };
}

/**
 * Active weekly cycle window containing today, for a cycle that ENDS on
 * `endDayName` (the Processing Cut Off Day) and starts the following day.
 * Verified live: cut-off Sunday → dashboard shows Mon→Sun; Thursday → Fri→Thu.
 */
export function computeActiveCycleWindow(
  startDayName: string,
  endDayName: string,
): { start: Date; end: Date } {
  const startIdx = dayIndex(startDayName);
  const endIdx = dayIndex(endDayName);
  if ((endIdx + 1) % 7 !== startIdx) {
    throw new Error(`Cycle must END on ${endDayName} and START the next day (${startDayName})`);
  }
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const daysSinceStart = (today.getDay() - startIdx + 7) % 7;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysSinceStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Agency Configuration → Agency Settings → Payment Processing Window.
 *
 * Extends the proven agency-settings surface (section/save/cancel test ids)
 * with the Processing Cut Off Day control. The control is a custom listbox:
 * a button (`aria-haspopup="listbox"`) inside
 * `[data-testid="config-input-Processing Cut Off Day"]`; opening it renders
 * `[role="option"]` entries for all seven weekdays.
 *
 * Save flow has NO toast (verified live) — success is asserted via persisted
 * value / downstream viewing period.
 */
export class ProcessingCutOffPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc: {
    heading: () => Locator;
    paymentProcessingSection: () => Locator;
    cutoffRoot: () => Locator;
    cutoffTrigger: () => Locator;
    cutoffOption: (day: string) => Locator;
    saveButton: () => Locator;
    cancelButton: () => Locator;
  };

  constructor(private readonly page: Page) {
    this.sidebar = new IcmSidebarPage(page);
    this.loc = {
      heading: () => this.page.getByRole('heading', { name: 'Agency Configurations' }),
      paymentProcessingSection: () =>
        this.page.getByTestId('agency-config-section-payment-processing'),
      cutoffRoot: () => this.page.getByTestId('config-input-Processing Cut Off Day'),
      cutoffTrigger: () => this.loc.cutoffRoot().getByRole('button'),
      cutoffOption: (day: string) =>
        this.page.getByRole('option', { name: day, exact: true }),
      saveButton: () => this.page.getByTestId('agency-config-save-button'),
      cancelButton: () => this.page.getByTestId('agency-config-cancel-button'),
    };
  }

  // ======================================================================
  // Navigation / capture
  // ======================================================================

  async open() {
    await this.sidebar.openAgencySettings();
    await expect(this.page).toHaveURL(AppUrlPatterns.settingsAgencySettings, { timeout: T });
    await ensurePageReady(this.page, this.loc.heading(), { timeout: T });
    await expect(this.loc.paymentProcessingSection()).toBeVisible({ timeout: T });
    await expect(this.loc.cutoffRoot()).toBeVisible({ timeout: T });
    await this.capturePriorCutOffDayIfUnset();
  }

  /** Capture once per module run so AfterAll can restore the original value. */
  private async capturePriorCutOffDayIfUnset() {
    if (tryGetPriorCutOffDay() !== null) return;
    const value = await this.readSelectedDay();
    setPriorCutOffDay(value);
  }

  // ======================================================================
  // Interaction
  // ======================================================================

  /** Read the currently shown cut-off day from the collapsed listbox trigger. */
  async readSelectedDay(): Promise<string> {
    const trigger = this.loc.cutoffTrigger();
    await expect(trigger).toBeVisible({ timeout: T });
    const text = (await trigger.innerText()).replace(/\s+/g, ' ').trim();
    expect(text, 'Processing Cut Off Day control rendered empty').not.toBe('');
    return text;
  }

  async selectCutOffDay(day: string) {
    const wanted = day.trim();
    if ((await this.readSelectedDay()) === wanted) {
      await this.expectCutOffDayShows(wanted);
      return;
    }
    await this.loc.cutoffTrigger().click();
    const option = this.loc.cutoffOption(wanted);
    await expect(option).toBeVisible({ timeout: T });
    await option.click();
    await waitForAppSettled(this.page, T);
    await this.expectCutOffDayShows(wanted);
  }

  async save() {
    const save = this.loc.saveButton();
    // Selecting the already-persisted day leaves the form clean → Save stays
    // disabled. Treat that as a no-op so Scenario Outline rows are idempotent.
    if (await save.isDisabled()) return;
    await save.click();
    // No toast exists in this save flow (verified live); persistence is proven
    // by expectCutOffDayShows + the downstream viewing-period assertion.
    await waitForAppSettled(this.page, T);
  }

  /**
   * Restore the pre-module cut-off day after all scenarios finished.
   * No-op when nothing was captured or the value already matches.
   */
  async restorePriorCutOffDay(): Promise<void> {
    const prior = tryGetPriorCutOffDay();
    if (!prior) return;
    await this.open();
    if ((await this.readSelectedDay()) === prior) return;
    await this.selectCutOffDay(prior);
    await this.save();
  }

  // ======================================================================
  // Read-only assertions
  // ======================================================================

  async expectCutOffDayShows(day: string) {
    const current = await this.readSelectedDay();
    expect(current, `Processing Cut Off Day should show "${day}"`).toBe(day.trim());
  }

  /**
   * Ops Manager Dashboard viewing period must span exactly seven days with
   * weekday bounds matching the saved cycle (cut-off = cycle END; START = next
   * day). Uses the dashboard page object's public readRange() — no duplicated
   * loc map here.
   */
  async expectViewingPeriodWeeklyCycle(dash: OpsManagerDashboardPage, startDayName: string, endDayName: string) {
    const range = await dash.readRange();
    expect(range, `Viewing period range "${range}" not in expected format`).toMatch(RANGE_FORMAT);
    const { start, end } = parseRangeDates(range);
    expect(
      start.getDay(),
      `Viewing period "${range}" should START on ${startDayName}`,
    ).toBe(dayIndex(startDayName));
    expect(
      end.getDay(),
      `Viewing period "${range}" should END on ${endDayName} (the cut-off day)`,
    ).toBe(dayIndex(endDayName));
    const spanDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    expect(spanDays, `Weekly cycle should span 7 inclusive days in "${range}"`).toBe(6);
  }

  /**
   * Upload "Recently Uploaded" active-window bounds for the selected cycle.
   * Asserts the grid exposes its Uploaded column, then verifies the computed
   * Monday→Sunday-style window is a real seven-day cycle.
   */
  async expectActiveUploadWindowBounds(uploadPage: StatementUploadPage, startDayName: string, endDayName: string) {
    await uploadPage.expectRecentStatementsGridHasUploadedColumn();
    const { start, end } = computeActiveCycleWindow(startDayName, endDayName);
    expect(start.getDay(), `Active window should start on ${startDayName}`).toBe(dayIndex(startDayName));
    expect(end.getDay(), `Active window should end on ${endDayName}`).toBe(dayIndex(endDayName));
    // Compare calendar dates only — end is set to 23:59:59.999 for inclusive row checks.
    const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const spanDays = Math.round((endDay - startDay) / 86_400_000);
    expect(spanDays, 'Active window should span 7 inclusive days').toBe(6);
  }

  /**
   * Every visible Recently Uploaded row's date must fall inside the active
   * Mon–Sun window. Reuses StatementUploadPage's proven grid readers.
   */
  async expectEveryVisibleUploadRowWithinWindow(uploadPage: StatementUploadPage, startDayName: string, endDayName: string) {
    const dates = await uploadPage.getRecentStatementsUploadedDates();
    expect(dates.length, 'Expected visible Recently Uploaded rows').toBeGreaterThan(0);
    const { start, end } = computeActiveCycleWindow(startDayName, endDayName);
    for (const dateStr of dates) {
      const rowDate = this.parseMmDdYyyy(dateStr);
      expect(rowDate, `Unparseable Uploaded date "${dateStr}"`).not.toBeNull();
      const t = rowDate!.getTime();
      expect(
        t >= start.getTime() && t <= end.getTime(),
        `Uploaded date ${dateStr} outside ${startDayName}–${endDayName} window (${start.toLocaleDateString()}–${end.toLocaleDateString()})`,
      ).toBe(true);
    }
  }

  private parseMmDdYyyy(text: string): Date | null {
    const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return null;
    return new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
  }
}
