import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { PoliciesPage } from './PoliciesPage';
import { COMMISSION_REPORT } from '../../test-data/commission-report/validateCommissionReport';
import {
  COMMISSION_HIERARCHY_ROLES,
  type CommissionHierarchyRole,
} from '../../utils/commission-report/commissionReportAllContext';
import { parseMoney, parsePercent } from '../../utils/commission-report/monthDiff';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export type PolicyAgentCommissionCapture = {
  productName: string;
  agentName: string;
  splitPercentage: number;
  agentValue: number;
  periodTab: 'M1-12' | 'M13-No Limit';
};

export type PolicyRoleCommissionCapture = {
  role: CommissionHierarchyRole;
  roleName: string;
  splitPercentage: number;
  roleValue: number;
};

export type PolicyAllRolesCommissionCapture = {
  productName: string;
  periodTab: 'M1-12' | 'M13-No Limit';
  roles: PolicyRoleCommissionCapture[];
};

const ROLE_ORDER_FALLBACK: Record<CommissionHierarchyRole, RegExp> = {
  Agency: /^1\b/,
  'Sales Leader': /^2\b/,
  Agent: /^3\b/,
};

const ROLE_BUTTON_NAME: Record<CommissionHierarchyRole, RegExp> = {
  Agency: /^Agency$/i,
  'Sales Leader': /^Sales\s*Leader$/i,
  Agent: /^Agent$/i,
};

/**
 * Policy commission lookups for @validate-commission-report only.
 * Extends PoliciesPage without changing smoke / split callers of the base class.
 */
export class PolicyCommissionReportPage extends PoliciesPage {
  readonly reportLoc = {
    productInformationHeading: () =>
      this.page.getByRole('heading', { name: 'Product Information', exact: true }),
    /** Edit page: Product Name is a dropdown button (shows "Loading…" until hydrated). */
    productNameButton: () =>
      this.page
        .getByTestId('product-name-dropdown')
        .or(
          this.page
            .locator('div, section')
            .filter({ has: this.page.getByRole('heading', { name: 'Product Information', exact: true }) })
            .getByRole('button')
            .first(),
        ),
    productNameLabel: () =>
      this.page
        .locator('#product-name-dropdown-label')
        .or(this.page.locator('span[id="product-name-dropdown-label"]'))
        .or(this.page.getByTestId('product-name-dropdown-label')),
    periodTabM1To12: () =>
      this.page
        .getByRole('tab', { name: COMMISSION_REPORT.periodTabs.m1To12 })
        .or(this.page.getByRole('button', { name: COMMISSION_REPORT.periodTabs.m1To12 })),
    periodTabM13: () =>
      this.page
        .getByRole('tab', { name: COMMISSION_REPORT.periodTabs.m13NoLimit })
        .or(this.page.getByRole('button', { name: COMMISSION_REPORT.periodTabs.m13NoLimit })),
  };

  constructor(page: Page) {
    super(page);
  }

  async searchAndOpenPolicy(policyNumber: string): Promise<void> {
    await this.openList();
    await this.searchGrid(policyNumber);
    await waitForAppSettled(this.page, T);

    const row = this.getDataRows().filter({ hasText: policyNumber }).first();
    await expect(row).toBeVisible({ timeout: T });
    await row.click();
    if (await this.gridLoc.acquireLock().isVisible().catch(() => false)) {
      await this.gridLoc.acquireLock().click();
    }
    await waitForAppSettled(this.page, T);
    await expect(this.page).toHaveURL(AppUrlPatterns.policiesEdit, { timeout: T });
    // Product / agent dropdowns hydrate async on edit — wait past "Loading…".
    await this.waitForProductNameReady();
  }

  /** True when text is a real product name (not placeholder / loading). */
  private isResolvedProductName(text: string): boolean {
    const t = text.replace(/\s+/g, ' ').trim();
    if (!t) return false;
    if (/^loading/i.test(t)) return false;
    if (/^select(\s+product)?$/i.test(t)) return false;
    return true;
  }

  async waitForProductNameReady(): Promise<void> {
    const heading = this.reportLoc.productInformationHeading().first();
    if (await heading.isVisible().catch(() => false)) {
      await heading.scrollIntoViewIfNeeded().catch(() => {});
    }

    await expect
      .poll(
        async () => {
          const fromBtn = (
            (await this.reportLoc.productNameButton().first().innerText().catch(() => '')) || ''
          ).replace(/\s+/g, ' ').trim();
          if (this.isResolvedProductName(fromBtn)) return fromBtn;

          const fromLabel = (
            (await this.reportLoc.productNameLabel().first().innerText().catch(() => '')) || ''
          ).replace(/\s+/g, ' ').trim();
          if (this.isResolvedProductName(fromLabel)) return fromLabel;

          return '';
        },
        { timeout: T, intervals: [300, 600, 1_200, 2_000] },
      )
      .not.toEqual('');
  }

  async captureProductName(): Promise<string> {
    await this.waitForProductNameReady();

    const fromBtn = (
      (await this.reportLoc.productNameButton().first().innerText().catch(() => '')) || ''
    ).replace(/\s+/g, ' ').trim();
    if (this.isResolvedProductName(fromBtn)) return fromBtn;

    const fromLabel = (
      (await this.reportLoc.productNameLabel().first().innerText().catch(() => '')) || ''
    ).replace(/\s+/g, ' ').trim();
    if (this.isResolvedProductName(fromLabel)) return fromLabel;

    throw new Error(
      'Product name still empty/loading on policy edit (Product Information dropdown)',
    );
  }

  async selectCommissionPeriodTab(period: 'M1-12' | 'M13-No Limit'): Promise<void> {
    // Period pills are plain buttons ("Commission V1 | M1-12 | 137%"), often without
    // aria-selected / data-state. Confirm via Month From / Month To instead.
    const tab = this.periodTabLocator(period);
    await expect(tab).toBeVisible({ timeout: T });
    await tab.scrollIntoViewIfNeeded().catch(() => {});
    await tab.click();
    await waitForAppSettled(this.page, T);

    await expect
      .poll(
        async () => {
          if (await this.isCommissionStructureLoading()) return false;
          const match = await this.commissionConfigMatchesPeriod(period);
          if (match) return true;
          await this.periodTabLocator(period).click({ force: true });
          await waitForAppSettled(this.page, T);
          return false;
        },
        { timeout: T, intervals: [300, 600, 1_200, 2_000] },
      )
      .toBeTruthy();
  }

  private periodTabLocator(period: 'M1-12' | 'M13-No Limit') {
    const nameRe =
      period === 'M13-No Limit'
        ? COMMISSION_REPORT.periodTabs.m13NoLimit
        : COMMISSION_REPORT.periodTabs.m1To12;
    return this.page
      .getByRole('button', { name: nameRe })
      .or(this.page.getByRole('tab', { name: nameRe }))
      .locator('visible=true')
      .first();
  }

  private async isCommissionStructureLoading(): Promise<boolean> {
    const toast = this.page.getByText(/Loading data/i).first();
    if (await toast.isVisible().catch(() => false)) return true;
    return false;
  }

  /** True when Commission Configuration month range matches the requested period tab. */
  private async commissionConfigMatchesPeriod(
    period: 'M1-12' | 'M13-No Limit',
  ): Promise<boolean> {
    const { from, to } = await this.readCommissionMonthRange();
    console.log(
      `[print-captured-data] period-tab-check period=${period} monthFrom=${from} monthTo=${to}`,
    );
    if (period === 'M1-12') {
      return from === 1 && to === 12;
    }
    // M13-No Limit: typically Month From ≥ 13; Month To may be blank/ongoing.
    if (!Number.isFinite(from) || from <= 0) return false;
    if (from === 1 && to === 12) return false;
    return from >= 13 || !Number.isFinite(to);
  }

  /**
   * Month From / Month To are sibling pairs (spinbutton then label). Do NOT take
   * `.first()` spinbutton from a large ancestor — that made Month To always read Month From.
   */
  private async readCommissionMonthRange(): Promise<{ from: number; to: number }> {
    return this.page.evaluate(() => {
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      const parseSpin = (el: Element | null): number => {
        if (!el) return Number.NaN;
        const input = el as HTMLInputElement;
        const raw =
          input.value ||
          el.getAttribute('aria-valuenow') ||
          el.textContent ||
          '';
        const n = Number.parseInt(String(raw).replace(/[^\d]/g, ''), 10);
        return Number.isFinite(n) ? n : Number.NaN;
      };

      const findNearLabel = (labelRe: RegExp): number => {
        const labels = Array.from(document.querySelectorAll('label, span, p, div'));
        for (const label of labels) {
          const text = normalize(label.textContent || '');
          // Tight label node only (avoid huge containers that include both fields).
          if (!labelRe.test(text) || text.length > 60) continue;
          if ([...label.querySelectorAll('*')].length > 2) continue;

          const parent = label.parentElement;
          if (!parent) continue;

          // Prefer spinbutton that is a sibling of the label (DOM: spin then label).
          const siblingSpin =
            (label.previousElementSibling &&
            (label.previousElementSibling.getAttribute('role') === 'spinbutton' ||
              label.previousElementSibling.tagName === 'INPUT')
              ? label.previousElementSibling
              : null) ||
            (Array.from(parent.children).find(
              (c) =>
                c !== label &&
                (c.getAttribute('role') === 'spinbutton' ||
                  (c as HTMLElement).tagName === 'INPUT'),
            ) as Element | undefined) ||
            null;

          const n = parseSpin(siblingSpin);
          if (Number.isFinite(n)) return n;
        }
        return Number.NaN;
      };

      return {
        from: findNearLabel(/^Month From$/i),
        to: findNearLabel(/^Month To\b/i),
      };
    });
  }

  private policyUuidFromEditUrl(): string {
    return this.page.url().match(/\/policy\/edit\/([^/?#]+)/i)?.[1] ?? '';
  }

  /**
   * Hierarchy table for the *active* period only.
   * Prefer rows scoped to the current policy UUID (avoids detached previous-policy tables).
   */
  private commissionSplitHierarchyTable() {
    const hasSplitHeader = this.page.getByRole('columnheader', { name: '% (Split)' });
    const uuid = this.policyUuidFromEditUrl();
    if (uuid) {
      const scoped = this.page
        .locator(`[data-testid^="split-role-${uuid}-"]`)
        .first()
        .locator('xpath=ancestor::*[@role="table" or self::table][1]');
      return scoped
        .or(
          this.page
            .getByRole('table')
            .filter({ has: this.page.locator(`[data-testid^="split-role-${uuid}-"]`) })
            .locator('visible=true')
            .first(),
        )
        .or(
          this.page
            .getByRole('table')
            .filter({ has: hasSplitHeader })
            .locator('visible=true')
            .first(),
        );
    }

    const hierarchySection = this.page
      .locator('section, div')
      .filter({
        has: this.page
          .getByRole('heading', { name: /commission split hierarchy/i })
          .or(this.page.getByText(/^Get Commission$/i)),
      })
      .filter({ has: hasSplitHeader })
      .first();

    return hierarchySection
      .getByRole('table')
      .filter({ has: hasSplitHeader })
      .locator('visible=true')
      .first()
      .or(
        this.page
          .getByRole('table')
          .filter({ has: hasSplitHeader })
          .locator('visible=true')
          .first(),
      );
  }

  /** Commission $ amount the active period form is built on (hierarchy $ cells use this). */
  private async readActivePeriodCommissionAmount(): Promise<number> {
    const fromTestId = this.page
      .getByTestId('calculated-commission-amount-input')
      .locator('input')
      .or(this.page.getByTestId('calculated-commission-amount-input'))
      .first();
    if (await fromTestId.isVisible().catch(() => false)) {
      const raw =
        (await fromTestId.inputValue().catch(() => '')) ||
        ((await fromTestId.textContent().catch(() => '')) ?? '');
      const n = parseMoney(raw);
      if (n > 0) return n;
    }

    // Fallback: label "Calculated Commission Amount" → nearest spinbutton/input
    const labeled = await this.page.evaluate(() => {
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      const label = Array.from(document.querySelectorAll('label, span, p, div')).find((el) => {
        const t = normalize(el.textContent || '');
        return /^Calculated Commission Amount$/i.test(t) && t.length < 50;
      });
      if (!label) return NaN;
      const parent = label.parentElement;
      const input =
        parent?.querySelector('input, [role="spinbutton"]') ||
        label.previousElementSibling ||
        label.nextElementSibling;
      if (!input) return NaN;
      const raw =
        (input as HTMLInputElement).value ||
        input.getAttribute('aria-valuenow') ||
        input.textContent ||
        '';
      const n = Number.parseFloat(String(raw).replace(/[$,\s]/g, ''));
      return Number.isFinite(n) ? n : NaN;
    });
    if (Number.isFinite(labeled) && labeled > 0) return labeled;

    return Number.NaN;
  }

  /**
   * Month fields + calc $ update before hierarchy % inputs. Reject mid-hydration where
   * M13 % (41/55) are still shown under M1-12 months — Agent $ = calc × stale % still "syncs".
   */
  private async waitForHierarchySyncedToActivePeriod(
    period: 'M1-12' | 'M13-No Limit',
  ): Promise<void> {
    const pctSamples: number[] = [];

    await expect
      .poll(
        async () => {
          if (await this.isCommissionStructureLoading()) return 0;
          if (!(await this.commissionConfigMatchesPeriod(period))) return 0;

          const calcAmt = await this.readActivePeriodCommissionAmount();
          const agency = await this.captureRoleRowFromCommissionStructure('Agency');
          const agent = await this.captureRoleRowFromCommissionStructure('Agent');
          const agencyPct = agency.splitPercentage;
          const agentPct = agent.splitPercentage;
          if (!(agentPct > 0) || !(agencyPct > 0)) return 0;

          // Stale fingerprint: CoreBridge M13 hierarchy still mounted under M1-12 months.
          if (period === 'M1-12' && agencyPct === 41 && agentPct === 55) {
            console.log(
              '[print-captured-data] hierarchy-sync reject stale M13 fingerprint 41/55 under M1-12 — re-click period',
            );
            pctSamples.length = 0;
            await this.periodTabLocator(period).click({ force: true });
            await waitForAppSettled(this.page, T);
            return 0;
          }
          // Inverse: M1-12 hierarchy under M13 months.
          if (
            period === 'M13-No Limit' &&
            (agencyPct === 22 || agencyPct === 23.5) &&
            (agentPct === 74 || agentPct === 72.5)
          ) {
            console.log(
              '[print-captured-data] hierarchy-sync reject stale M1-12 fingerprint under M13 — re-click period',
            );
            pctSamples.length = 0;
            await this.periodTabLocator(period).click({ force: true });
            await waitForAppSettled(this.page, T);
            return 0;
          }

          if (!(Number.isFinite(calcAmt) && calcAmt > 0)) return 0;
          const expectedDollar = Math.round(calcAmt * (agentPct / 100) * 100) / 100;
          const synced = Math.abs(agent.roleValue - expectedDollar) <= 0.05;
          console.log(
            `[print-captured-data] hierarchy-sync period=${period} calcAmt=${calcAmt.toFixed(2)} ` +
              `agencyPct=${agencyPct} agentPct=${agentPct} agent$=${agent.roleValue.toFixed(2)} ` +
              `expected$=${expectedDollar.toFixed(2)} synced=${synced}`,
          );
          if (!synced) {
            pctSamples.length = 0;
            return 0;
          }

          pctSamples.push(agentPct);
          if (pctSamples.length > 4) pctSamples.shift();
          // Four consecutive identical Agent % reads (spread by poll intervals) = hydrated.
          if (
            pctSamples.length === 4 &&
            pctSamples.every((p) => p === pctSamples[0])
          ) {
            return agentPct;
          }
          return 0;
        },
        { timeout: T, intervals: [400, 500, 600, 800, 1_000] },
      )
      .toBeGreaterThan(0);
  }

  /**
   * Agent is always order-3 in Commission Split Hierarchy.
   * % (Split) is a textbox value (e.g. "79") — not text with a "%" suffix.
   */
  async captureAgentRowFromCommissionStructure(): Promise<{
    agentName: string;
    splitPercentage: number;
    agentValue: number;
  }> {
    await this.loc.sectionCommissionConfiguration().scrollIntoViewIfNeeded().catch(() => {});
    await this.page
      .getByText(/Get Commission|Commission Split Hierarchy/i)
      .first()
      .scrollIntoViewIfNeeded()
      .catch(() => {});

    const table = this.commissionSplitHierarchyTable();
    await expect(table).toBeVisible({ timeout: T });

    const uuid = this.policyUuidFromEditUrl();
    const agentRow = uuid
      ? table
          .locator(`[data-testid="split-role-${uuid}-3"]`)
          .locator('xpath=ancestor::*[@role="row" or self::tr][1]')
          .or(
            table
              .getByRole('row')
              .filter({ has: this.page.getByRole('button', { name: /^Agent$/i }) })
              .first(),
          )
      : table
          .getByRole('row')
          .filter({ has: this.page.getByRole('button', { name: /^Agent$/i }) })
          .first()
          .or(table.getByRole('row', { name: /^3\b/ }).first());
    await expect(agentRow).toBeVisible({ timeout: T });

    const percentInput = agentRow.getByRole('textbox').last();
    await expect(percentInput).toBeVisible({ timeout: T });
    const splitPercentage = parsePercent(await percentInput.inputValue());

    const dollarText =
      (await agentRow.getByRole('cell').filter({ hasText: /\$/ }).first().innerText()).replace(
        /\s+/g,
        ' ',
      ) || (await agentRow.innerText());
    const agentValue = parseMoney(dollarText.match(/\$\s*[\d,]+\.?\d*/)?.[0] ?? dollarText);

    const nameBtn = agentRow
      .getByRole('button')
      .filter({ hasNotText: /^(Agent|Delete split)$/i })
      .first();
    const agentName = (await nameBtn.innerText().catch(() => '')).replace(/\s+/g, ' ').trim() || 'Agent';

    if (!Number.isFinite(splitPercentage)) {
      throw new Error('Agent % (Split) textbox was empty on policy commission structure');
    }

    const result = { agentName, splitPercentage, agentValue };
    console.log('[print-captured-data] agent-row-split', JSON.stringify(result));
    return result;
  }

  async captureAgentCommissionForPeriod(
    period: 'M1-12' | 'M13-No Limit',
  ): Promise<PolicyAgentCommissionCapture> {
    const productName = await this.captureProductName();
    await this.openCommissionConfiguration();
    await this.selectCommissionPeriodTab(period);
    await this.waitForHierarchySyncedToActivePeriod(period);
    const agent = await this.captureAgentRowFromCommissionStructure();
    const result: PolicyAgentCommissionCapture = {
      productName,
      ...agent,
      periodTab: period,
    };
    console.log('[print-captured-data] policy-agent-commission', JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Capture one hierarchy role row (Agency / Sales Leader / Agent).
   * Order fallback: Agency=1, Sales Leader=2, Agent=3.
   * Used by @validate-commission-report-all only — does not change Agent-only capture.
   */
  async captureRoleRowFromCommissionStructure(
    role: CommissionHierarchyRole,
  ): Promise<PolicyRoleCommissionCapture> {
    await this.loc.sectionCommissionConfiguration().scrollIntoViewIfNeeded().catch(() => {});
    await this.page
      .getByText(/Get Commission|Commission Split Hierarchy/i)
      .first()
      .scrollIntoViewIfNeeded()
      .catch(() => {});

    const table = this.commissionSplitHierarchyTable();
    await expect(table).toBeVisible({ timeout: T });

    const order = role === 'Agency' ? 1 : role === 'Sales Leader' ? 2 : 3;
    const uuid = this.policyUuidFromEditUrl();
    const roleRow = uuid
      ? table
          .locator(`[data-testid="split-role-${uuid}-${order}"]`)
          .locator('xpath=ancestor::*[@role="row" or self::tr][1]')
          .or(
            table
              .getByRole('row')
              .filter({ has: this.page.getByRole('button', { name: ROLE_BUTTON_NAME[role] }) })
              .first(),
          )
      : table
          .getByRole('row')
          .filter({ has: this.page.getByRole('button', { name: ROLE_BUTTON_NAME[role] }) })
          .first()
          .or(table.getByRole('row', { name: ROLE_ORDER_FALLBACK[role] }).first());
    await expect(roleRow).toBeVisible({ timeout: T });

    const percentInput = roleRow.getByRole('textbox').last();
    await expect(percentInput).toBeVisible({ timeout: T });
    const splitPercentage = parsePercent(await percentInput.inputValue());

    const dollarCell = uuid
      ? roleRow
          .locator(`[data-testid="split-dollar-${uuid}-${order}"]`)
          .or(roleRow.getByRole('cell').filter({ hasText: /\$/ }).first())
      : roleRow.getByRole('cell').filter({ hasText: /\$/ }).first();
    const dollarText =
      (await dollarCell.innerText().catch(() => '')).replace(/\s+/g, ' ') ||
      (await roleRow.innerText());
    const roleValue = parseMoney(dollarText.match(/\$\s*[\d,]+\.?\d*/)?.[0] ?? dollarText);

    const nameBtn = roleRow
      .getByRole('button')
      .filter({ hasNotText: new RegExp(`^(${role}|Delete split)$`, 'i') })
      .first();
    const roleName =
      (await nameBtn.innerText().catch(() => '')).replace(/\s+/g, ' ').trim() || role;

    if (!Number.isFinite(splitPercentage)) {
      throw new Error(`${role} % (Split) textbox was empty on policy commission structure`);
    }

    const result: PolicyRoleCommissionCapture = {
      role,
      roleName,
      splitPercentage,
      roleValue,
    };
    console.log('[print-captured-data] role-row-split', JSON.stringify(result));
    return result;
  }

  async captureAllRoleRowsFromCommissionStructure(): Promise<PolicyRoleCommissionCapture[]> {
    const roles: PolicyRoleCommissionCapture[] = [];
    for (const role of COMMISSION_HIERARCHY_ROLES) {
      roles.push(await this.captureRoleRowFromCommissionStructure(role));
    }
    return roles;
  }

  async captureAllRoleCommissionsForPeriod(
    period: 'M1-12' | 'M13-No Limit',
  ): Promise<PolicyAllRolesCommissionCapture> {
    const productName = await this.captureProductName();
    await this.openCommissionConfiguration();
    await this.selectCommissionPeriodTab(period);
    await this.waitForHierarchySyncedToActivePeriod(period);
    const roles = await this.captureAllRoleRowsFromCommissionStructure();
    const result: PolicyAllRolesCommissionCapture = {
      productName,
      periodTab: period,
      roles,
    };
    console.log(
      '[print-captured-data] policy-all-roles-commission',
      JSON.stringify(result, null, 2),
    );
    return result;
  }
}

