import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

/**
 * Expandable sidebar parents (chevron) and their children — harvested live:
 *
 * Commissions → Commission Setup, Statement Setup
 * Advance → Overview, Advance Setup
 * Statements → Upload, History, Needs Attention
 * Payment Processing → Payables, Approval, History
 * Settings → Prompts, Commission Templates, Transfer Sheet
 * Agency Configuration → Agency Settings, Data Import
 */
const SIDEBAR = {
  commissions: 'sidebar-nav-item-commission-management',
  commissionSetup: 'sidebar-nav-item-commission',
  statementSetup: 'sidebar-nav-item-commission-statement-setup',
  advance: 'sidebar-nav-item-advance',
  advanceOverview: 'sidebar-nav-item-advance-overview',
  advanceSetup: 'sidebar-nav-item-advance-setup',
  statements: 'sidebar-nav-item-commission-processing',
  uploadStatement: 'sidebar-nav-item-upload-statement',
  statementHistory: 'sidebar-nav-item-statement-history',
  needsAttention: 'sidebar-nav-item-needs-attention',
  paymentProcessing: 'sidebar-nav-item-payment-processing',
  payables: 'sidebar-nav-item-payable-line-items',
  approval: 'sidebar-nav-item-pending-approval',
  disbursementHistory: 'sidebar-nav-item-disbursement-history',
  settings: 'sidebar-nav-item-settings',
  prompts: 'sidebar-nav-item-prompts-library',
  commissionTemplates: 'sidebar-nav-item-commission-templates',
  transferSheet: 'sidebar-nav-item-transfer-sheet',
  agencyConfiguration: 'sidebar-nav-item-agency-configuration',
  agencySettings: 'sidebar-nav-item-agency-settings',
  dataImport: 'sidebar-nav-item-data-import',
  agentInsights: 'sidebar-nav-item-agent-insights',
  bookOfBusiness: 'sidebar-nav-item-book-of-business',
  ledger: 'sidebar-nav-item-ledger',
} as const;

/** Sidebar navigation — data-testid preferred, unique button names as fallback. */
export class IcmSidebarPage {
  private readonly loc = {
    sidebar: (): Locator => this.page.getByRole('navigation', { name: 'Sidebar navigation' }),
    userManagement: (): Locator =>
      this.navItem('sidebar-nav-item-user-management', /^User Management$/i),
    carriers: (): Locator => this.navItem('sidebar-nav-item-carriers', /^Carriers$/i),
    agents: (): Locator => this.navItem('sidebar-nav-item-agents', /^Agents$/i),
    products: (): Locator => this.navItem('sidebar-nav-item-products', /^Products$/i),
    policies: (): Locator => this.navItem('sidebar-nav-item-policy', /^Policies$/i),
    commissionManagement: (): Locator =>
      this.navItem(SIDEBAR.commissions, /^Commissions$/i),
    advance: (): Locator => this.navItem(SIDEBAR.advance, /^Advance$/i),
    advanceOverview: (): Locator => this.loc.sidebar().getByTestId(SIDEBAR.advanceOverview),
    advanceSetup: (): Locator => this.loc.sidebar().getByTestId(SIDEBAR.advanceSetup),
    settings: (): Locator => this.navItem(SIDEBAR.settings, /^Settings$/i),
    dashboard: (): Locator => this.navItem('sidebar-nav-item-dashboard', /^Dashboard$/i),
    statementSetup: (): Locator =>
      this.loc
        .sidebar()
        .getByTestId(SIDEBAR.statementSetup)
        .or(this.loc.sidebar().getByRole('button', { name: /statement setup/i })),
    subNavButton: (name: RegExp | string): Locator =>
      this.loc.sidebar().getByRole('button', { name: name }),
    /** App-wide Cancel Changes route guard (heading "Cancel Changes"). */
    unsavedChangesModal: (): Locator => this.page.getByTestId('unsaved-changes-modal'),
    /** Live label "Cancel" — discard draft and continue navigation. */
    unsavedChangesConfirm: (): Locator => this.page.getByTestId('unsaved-changes-confirm'),
  };

  constructor(private readonly page: Page) {}

  private navItem(testId: string, buttonName: RegExp): Locator {
    return this.loc
      .sidebar()
      .getByTestId(testId)
      .or(this.loc.sidebar().getByRole('button', { name: buttonName }));
  }

  async waitForSidebar() {
    await expect(this.loc.sidebar()).toBeVisible({ timeout: T });
  }

  async clickModule(nav: Locator) {
    await this.waitForSidebar();
    await expect(nav.first()).toBeVisible({ timeout: T });
    await this.confirmUnsavedChangesIfPresent();
    const leavingDirtyForm = /\/(create|add|edit)\b/i.test(this.page.url());
    await nav.first().click();
    if (leavingDirtyForm) {
      await this.confirmUnsavedChangesIfPresent(5_000);
      await waitForAppSettled(this.page, T);
      return;
    }
    if (await this.confirmUnsavedChangesIfPresent()) {
      await waitForAppSettled(this.page, T);
      return;
    }
    await nav.first().click();
    if (await this.confirmUnsavedChangesIfPresent()) {
      await waitForAppSettled(this.page, T);
      return;
    }
    await nav.first().click();
    await this.confirmUnsavedChangesIfPresent();
    await waitForAppSettled(this.page, T);
  }

  /**
   * Dirty add/edit: sidebar click opens Cancel Changes (`unsaved-changes-modal`).
   * Click Cancel (`unsaved-changes-confirm`) so navigation proceeds.
   * Returns true when the modal was present and dismissed.
   */
  private async confirmUnsavedChangesIfPresent(timeoutMs = 0): Promise<boolean> {
    const modal = this.loc.unsavedChangesModal();
    const visible =
      timeoutMs > 0
        ? await modal.isVisible({ timeout: timeoutMs }).catch(() => false)
        : await modal.isVisible().catch(() => false);
    if (!visible) return false;
    await this.loc.unsavedChangesConfirm().click();
    await modal.waitFor({ state: 'hidden', timeout: 10_000 });
    return true;
  }

  async openUserManagement() {
    await this.clickModule(this.loc.userManagement());
  }

  async openCarriers() {
    await this.clickModule(this.loc.carriers());
  }

  async openAgents() {
    await this.clickModule(this.loc.agents());
  }

  async openProducts() {
    await this.clickModule(this.loc.products());
  }

  async openPolicies() {
    await this.clickModule(this.loc.policies());
  }

  async openCommissionManagement() {
    await this.clickModule(this.page.getByTestId(SIDEBAR.commissions));
  }

  async openDashboard() {
    await this.clickModule(this.loc.dashboard());
  }

  /**
   * Open Book of Business under Agent Insights.
   * Agent role sometimes treats Agent Insights as a direct landing (children not in DOM);
   * in that case parent click already navigates to BoB, or we fall back to URL.
   */
  async openBookOfBusiness() {
    await this.waitForSidebar();
    await this.ensureSidebarExpanded();
    const child = this.page
      .getByTestId(SIDEBAR.bookOfBusiness)
      .or(this.loc.sidebar().getByRole('button', { name: /book of business/i }));
    if (await child.first().isVisible().catch(() => false)) {
      await child.first().click();
      await this.afterSubNavClick();
      return;
    }

    const parent = this.page.getByTestId(SIDEBAR.agentInsights);
    await expect(parent).toBeVisible({ timeout: T });
    await parent.click();
    await this.settleSidebarNav();

    if (AppUrlPatterns.bookOfBusiness.test(this.page.url())) {
      await waitForAppSettled(this.page, T);
      return;
    }
    if (await child.first().isVisible().catch(() => false)) {
      await child.first().click();
      await this.afterSubNavClick();
      return;
    }

    // Toggle may have collapsed an already-open section — expand once more.
    await parent.click();
    await this.settleSidebarNav();
    if (await child.first().isVisible().catch(() => false)) {
      await child.first().click();
      await this.afterSubNavClick();
      return;
    }
    if (AppUrlPatterns.bookOfBusiness.test(this.page.url())) {
      await waitForAppSettled(this.page, T);
      return;
    }

    await this.page.goto('/book-of-business', { waitUntil: 'domcontentloaded' });
    await waitForAppSettled(this.page, T);
  }

  /** Expand Agent Insights when needed, then open Ledger. */
  async openLedger() {
    await this.waitForSidebar();
    await this.ensureSidebarExpanded();
    const ledgerByTestId = this.page.getByTestId(SIDEBAR.ledger);
    const ledgerByName = this.loc.sidebar().getByRole('button', { name: /^ledger$/i });
    const ledger = ledgerByTestId.or(ledgerByName);

    if (await ledger.first().isVisible().catch(() => false)) {
      await ledger.first().click();
      await this.afterSubNavClick();
      return;
    }

    const parent = this.page.getByTestId(SIDEBAR.agentInsights);
    await expect(parent).toBeVisible({ timeout: T });
    await parent.click();
    await this.settleSidebarNav();

    if (AppUrlPatterns.ledger.test(this.page.url())) {
      await waitForAppSettled(this.page, T);
      return;
    }
    if (await ledger.first().isVisible().catch(() => false)) {
      await ledger.first().click();
      await this.afterSubNavClick();
      return;
    }

    await parent.click();
    await this.settleSidebarNav();
    if (await ledger.first().isVisible().catch(() => false)) {
      await ledger.first().click();
      await this.afterSubNavClick();
      return;
    }
    if (AppUrlPatterns.ledger.test(this.page.url())) {
      await waitForAppSettled(this.page, T);
      return;
    }

    await this.page.goto('/ledger', { waitUntil: 'domcontentloaded' });
    await waitForAppSettled(this.page, T);
  }

  async openSettings() {
    await this.ensureSectionExpanded(SIDEBAR.settings, SIDEBAR.prompts);
  }

  /** Short settle for sidebar expand/collapse — avoid waiting on page loaders. */
  private async settleSidebarNav() {
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.page.waitForTimeout(300);
  }

  /**
   * Expand a chevron parent until `childTestId` is visible, then return the child locator.
   * If the first click collapses an already-open section, clicks once more to re-expand.
   */
  async ensureSectionExpanded(parentTestId: string, childTestId: string): Promise<Locator> {
    await this.waitForSidebar();
    await this.ensureSidebarExpanded();
    const parent = this.page.getByTestId(parentTestId);
    const child = this.page.getByTestId(childTestId);

    if (await child.isVisible().catch(() => false)) return child;

    await expect(parent).toBeVisible({ timeout: T });
    await parent.click();
    await this.settleSidebarNav();

    if (await child.isVisible().catch(() => false)) return child;

    // Toggle went the wrong way (section was already open) — expand again.
    await parent.click();
    await this.settleSidebarNav();
    await expect(child).toBeVisible({ timeout: T });
    return child;
  }

  /** Expand parent (if needed) and click the child by test id. */
  async openSubNav(parentTestId: string, childTestId: string, options?: { lightweight?: boolean }) {
    const child = await this.ensureSectionExpanded(parentTestId, childTestId);
    await expect(child).toBeVisible({ timeout: T });
    await child.click();
    await this.afterSubNavClick(options);
  }

  /** Expand Advance when needed, then open Overview. */
  async openAdvanceOverview() {
    await this.openSubNav(SIDEBAR.advance, SIDEBAR.advanceOverview);
  }

  /** Expand Advance when needed, then open Advance Setup. */
  async openAdvanceSetup() {
    await this.openSubNav(SIDEBAR.advance, SIDEBAR.advanceSetup);
  }

  async openCommissionStatementSetup() {
    await this.openSubNav(SIDEBAR.commissions, SIDEBAR.statementSetup);
  }

  /**
   * Open Commission Setup (tree) under Commissions.
   * Agency owner sidebar exposes this child (`sidebar-nav-item-commission`) rather than
   * Statement Setup — do not change {@link openCommissionStatementSetup}.
   */
  async openCommissionSetup() {
    await this.openSubNav(SIDEBAR.commissions, SIDEBAR.commissionSetup);
  }

  async openAgencySettings() {
    await this.openSubNav(SIDEBAR.agencyConfiguration, SIDEBAR.agencySettings);
  }

  async openDataImport() {
    await this.openSubNav(SIDEBAR.agencyConfiguration, SIDEBAR.dataImport);
  }

  async ensureSidebarExpanded() {
    // Already showing labeled nav items — rail is expanded.
    const labeled = this.page.getByTestId('sidebar-nav-title-dashboard');
    if (await labeled.isVisible().catch(() => false)) return;

    const expand = this.page.getByRole('button', { name: /expand sidebar/i });
    if (await expand.isVisible().catch(() => false)) {
      await expand.click();
      await this.settleSidebarNav();
      return;
    }
    const collapse = this.page.getByRole('button', { name: /collapse sidebar/i });
    if (await collapse.isVisible().catch(() => false)) {
      // Collapse then expand can race with loaders — only expand if labels missing.
      if (!(await labeled.isVisible().catch(() => false)) && (await expand.isVisible().catch(() => false))) {
        await expand.click();
        await this.settleSidebarNav();
      }
    }
  }

  async openAgentNavByTestId(testId: string) {
    await this.waitForSidebar();
    await this.ensureSidebarExpanded();
    const item = this.page.getByTestId(testId);
    await expect(item).toBeVisible({ timeout: T });
    await item.click();
    await waitForAppSettled(this.page, T);
  }

  /**
   * Expand Settings when needed, then click a sub-item (Prompts, Templates, …).
   * Prefer test ids — label matches can collide across sections.
   */
  async clickSettingsSubNav(buttonName: RegExp) {
    const source = buttonName.source.toLowerCase();
    // Widen past `as const` literal so reassignment across SIDEBAR keys typechecks.
    let childTestId: string = SIDEBAR.prompts;
    if (/template/i.test(source)) childTestId = SIDEBAR.commissionTemplates;
    else if (/transfer/i.test(source)) childTestId = SIDEBAR.transferSheet;
    else if (/prompt/i.test(source)) childTestId = SIDEBAR.prompts;
    else {
      // Fallback: expand Settings, then click by role name.
      await this.ensureSectionExpanded(SIDEBAR.settings, SIDEBAR.prompts);
      const item = this.loc.subNavButton(buttonName);
      await expect(item).toBeVisible({ timeout: T });
      await item.click();
      await waitForAppSettled(this.page, T);
      return;
    }
    await this.openSubNav(SIDEBAR.settings, childTestId);
  }

  /** Expand Statements when needed, then click Upload / History / Needs Attention. */
  async clickStatementsSubNav(buttonName: RegExp, options?: { lightweight?: boolean }) {
    const source = buttonName.source.toLowerCase();
    let childTestId: string = SIDEBAR.uploadStatement;
    if (/needs.?attention/i.test(source)) childTestId = SIDEBAR.needsAttention;
    else if (/history/i.test(source)) childTestId = SIDEBAR.statementHistory;
    else if (/upload/i.test(source)) childTestId = SIDEBAR.uploadStatement;
    else {
      await this.ensureSectionExpanded(SIDEBAR.statements, SIDEBAR.uploadStatement);
      const item = this.loc.subNavButton(buttonName);
      await expect(item).toBeVisible({ timeout: T });
      await item.click();
      await this.afterSubNavClick(options);
      return;
    }
    await this.openSubNav(SIDEBAR.statements, childTestId, options);
  }

  /** Expand Statements when needed, then click a sub-item by test id. */
  async clickStatementsSubNavByTestId(testId: string, options?: { lightweight?: boolean }) {
    await this.openSubNav(SIDEBAR.statements, testId, options);
  }

  private async afterSubNavClick(options?: { lightweight?: boolean }) {
    if (options?.lightweight) {
      await this.page.waitForLoadState('domcontentloaded');
      return;
    }
    await waitForAppSettled(this.page, T);
  }

  /** Click a top-level commission-area nav button (e.g. Payment Processing). */
  async clickCommissionSubNav(buttonName: RegExp) {
    await this.waitForSidebar();
    await expect(this.loc.subNavButton(buttonName)).toBeVisible({ timeout: T });
    await this.loc.subNavButton(buttonName).click();
    await waitForAppSettled(this.page, T);
  }

  /**
   * Payment Processing sub-nav items by label → sidebar test id.
   * Name-based lookups are ambiguous: the Statements section also has a
   * "History" sub-item (sidebar-nav-item-statement-history).
   */
  private paymentProcessingSubNavItem(buttonName: RegExp | string): Locator {
    const name = (buttonName instanceof RegExp ? buttonName.source : buttonName).toLowerCase();
    if (/approval/i.test(name)) return this.page.getByTestId(SIDEBAR.approval);
    if (/history/i.test(name)) return this.page.getByTestId(SIDEBAR.disbursementHistory);
    if (/payable/i.test(name)) return this.page.getByTestId(SIDEBAR.payables);
    return this.loc.subNavButton(buttonName);
  }

  private paymentProcessingChildTestId(buttonName: RegExp | string): string | null {
    const name = (buttonName instanceof RegExp ? buttonName.source : buttonName).toLowerCase();
    if (/approval/i.test(name)) return SIDEBAR.approval;
    if (/history/i.test(name)) return SIDEBAR.disbursementHistory;
    if (/payable/i.test(name)) return SIDEBAR.payables;
    return null;
  }

  /** Expand Payment Processing when needed, then click Payables / Approval / History. */
  async clickPaymentProcessingSubNav(buttonName: RegExp | string) {
    const childTestId = this.paymentProcessingChildTestId(buttonName);
    if (childTestId) {
      await this.openSubNav(SIDEBAR.paymentProcessing, childTestId);
      return;
    }
    await this.waitForSidebar();
    const item = this.paymentProcessingSubNavItem(buttonName);
    if (!(await item.isVisible().catch(() => false))) {
      await this.ensureSectionExpanded(SIDEBAR.paymentProcessing, SIDEBAR.payables);
    }
    await expect(item).toBeVisible({ timeout: T });
    await item.click();
    await waitForAppSettled(this.page, T);
  }
}
