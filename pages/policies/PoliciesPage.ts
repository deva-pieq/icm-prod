import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

export class PoliciesPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    headingList: () => this.page.getByRole('heading', { name: 'Policy', exact: true }),
    headingAdd: () => this.page.getByRole('heading', { name: 'Add Policy', exact: true }),
    addButton: () => this.page.getByTestId('add-policy-button').or(this.page.getByRole('button', { name: /add policy|create policy/i })),
    commissionStructureTab: () =>
      this.page
        .getByTestId('policy-tab-navigation-tab-commission-structure')
        .or(this.page.getByRole('tab', { name: /commission structure/i }))
        .or(this.page.getByRole('button', { name: /commission structure/i }))
        .or(this.page.getByRole('link', { name: /commission structure/i })),
    sectionCommissionConfiguration: () =>
      this.page
        .getByTestId('commission-structure-section')
        .or(this.page.getByRole('heading', { name: /commission (configuration|split hierarchy)/i }))
        .or(this.page.getByText(/Get Commission/))
        .first(),
    policyActionsButton: () =>
      this.page.getByTestId(/policy-actions/i),
    viewLedgerMenuItem: () =>
      this.page.getByRole('button', { name: /view ledger/i }),
    policyLedgerGrid: () =>
      this.page.getByTestId('policy-ledger-transactions-datagrid'),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  async openList() {
    await this.sidebar.openPolicies();
    await waitForAppSettled(this.page);
    await expect(this.page).toHaveURL(AppUrlPatterns.policies);
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
  }

  async openCreate() {
    await this.loc.addButton().click();
    await waitForAppSettled(this.page);
    await expect(this.page).toHaveURL(AppUrlPatterns.policiesCreate);
    await expect(this.loc.headingAdd()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async backToList() {
    await this.clickBack();
    await expect(this.page).toHaveURL(AppUrlPatterns.policies);
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async openEditFromGrid() {
    await super.openEditFromGrid();
    await expect(this.page).toHaveURL(AppUrlPatterns.policiesEdit);
    await waitForAppSettled(this.page);
  }

  /** Smoke-only: list heading visibility. */
  async smokeExpectListHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.policies, { timeout: smokeStepTimeoutMs });
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: create heading visibility. */
  async smokeExpectCreateHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.policiesCreate, { timeout: smokeStepTimeoutMs });
    await expect(this.loc.headingAdd()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: edit by clicking first grid row (does not change openEditFromGrid kebab path). */
  async smokeOpenEditByRowClick() {
    const opened = await this.openGridRecordAt(0);
    expect(opened, 'Policies grid has no data row to open for smoke edit').toBe(true);
    await expect(this.page).toHaveURL(AppUrlPatterns.policiesEdit, { timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
  }

  /** Smoke-only: open edit via row action kebab when present; else row click. */
  async smokeOpenEditViaKebab() {
    await this.scrollGridToActionsColumn();
    const kebab = this.loc.policyActionsButton().first();
    if (await kebab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await kebab.click();
      await this.chooseEditFromRowMenu();
    } else {
      const opened = await this.openGridRecordAt(0);
      expect(opened, 'Policies grid has no data row to open for smoke edit').toBe(true);
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.policiesEdit, { timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
  }

  async openCommissionConfiguration() {
    const trigger = this.loc.commissionStructureTab();
    await expect(trigger.first()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await trigger.first().click();
    await waitForAppSettled(this.page);
    await expect(this.loc.sectionCommissionConfiguration()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async clickPolicyActionsKebeb() {
    const btn = this.loc.policyActionsButton().first();
    await expect(btn).toBeVisible({ timeout: smokeStepTimeoutMs });
    // AG Grid's internal handler requires the full event sequence
    // (mousedown → mouseup → click) but Playwright's click() is intercepted
    // by grid overlays.  Dispatch the sequence via evaluate, retrying until
    // the kebab popup (with "View Ledger") actually appears.
    const viewLedger = () => this.loc.viewLedgerMenuItem();
    await expect
      .poll(
        async () => {
          await this.page.evaluate((t) => {
            const el = document.querySelector(`[data-testid*="${t}"]`);
            if (el) {
              ['mousedown', 'mouseup', 'click'].forEach((type) =>
                el.dispatchEvent(
                  new MouseEvent(type, { bubbles: true, cancelable: true, view: window }),
                ),
              );
            }
          }, 'policy-actions');
          await this.page.waitForTimeout(800);
          return viewLedger().isVisible().catch(() => false);
        },
        { timeout: 15_000, intervals: [1_000, 2_000] },
      )
      .toBe(true);
    await waitForAppSettled(this.page);
  }

  async clickViewLedger() {
    const item = this.loc.viewLedgerMenuItem();
    await expect(item).toBeVisible({ timeout: smokeStepTimeoutMs });
    await item.click();
    await waitForAppSettled(this.page);
  }

  async expectPolicyLedgerHasEntries() {
    const grid = this.loc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: smokeStepTimeoutMs });
    const footer = this.page.getByTestId('data-grid-record-count-footer');
    await expect(footer).toBeVisible({ timeout: smokeStepTimeoutMs });
    const text = await footer.innerText();
    expect(text).not.toMatch(/all 0 records/i);
  }
}
