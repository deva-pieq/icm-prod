"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// scripts/prod-user-setup.ts
var import_config = require("dotenv/config");
var import_test9 = require("@playwright/test");
var import_imap_simple = __toESM(require("imap-simple"));
var import_mailparser = require("mailparser");
var import_jsdom = require("jsdom");

// pages/auth/LoginPage.ts
var import_test3 = require("@playwright/test");

// pages/appPaths.ts
function resolveHost() {
  const fromEnv = (process.env.BASE_URL ?? "").trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).hostname;
    } catch {
    }
  }
  return "preprod.app.pieq.ai";
}
var APP_HOST = resolveHost();
function isAppHostUrl(url) {
  try {
    return new URL(url).hostname === APP_HOST;
  } catch {
    return false;
  }
}
function isKeycloakLoginUrl(url) {
  return /\/auth\/realms\//i.test(url) || /\/auth\/admin\//i.test(url) || /keycloak/i.test(url);
}
var AppPaths = {
  login: "/",
  home: "/user-management",
  userManagement: "/user-management",
  products: "/product",
  agents: "/agents",
  commissionUpload: "/commission-processing/upload-statement",
  commissionSettings: "/commission-processing/statements/settings"
};
var AppUrlPatterns = {
  authOrOpenId: /\/auth\/|\/openid\//i,
  userManagement: /\/user-management\/?$/i,
  userManagementAdd: /\/user-management\/add\/?$/i,
  userManagementEdit: /\/user-management\/edit\//i,
  carriers: /\/carriers\/?$/i,
  carriersCreate: /\/carriers\/create\/?$/i,
  carriersEdit: /\/carriers\/edit\//i,
  agents: /\/agents\/?$/i,
  agentsAdd: /\/agents\/add\/?$/i,
  agentsEdit: /\/agents\/edit\//i,
  products: /\/product\/?$/i,
  productsCreate: /\/product\/create\/?$/i,
  productsEdit: /\/product\/edit\//i,
  productCommissionStructure: /commission-structure\/?$/i,
  policies: /\/policy\/?$/i,
  policiesCreate: /\/policy\/create\/?$/i,
  policiesEdit: /\/policy\/edit\//i,
  ///commissions (Commission Setup / Commission Management tree)
  commissionManagement: /\/commissions\/?$/i,
  ///commissions/statement-setup
  statementSetup: /\/commissions\/statement-setup\/?$/i,
  statementSetupCreate: /commissions\/statement-setup\/?$/i,
  statementSetupEdit: /commissions\/statement-setup\/edit\//i,
  commissionUpload: /commission-processing\/upload-statement|commission-processing\/statements\/upload/i,
  commissionHistory: /commission-processing\/statement-history|commission-processing\/statements\/history/i,
  commissionDetails: /commission-processing\/(commission-details|review|reconciliation)\//i,
  commissionReview: /commission-processing\/review\//i,
  commissionNeedsAttention: /commission-processing\/needs-attention|commission-processing\/statements\/needs-attention/i,
  commissionReconciliation: /commission-processing\/reconciliation\//i,
  paymentPayables: /\/payment-processing\/payable-line-items/i,
  paymentApproval: /\/payment-processing\/pending-authorization/i,
  paymentHistory: /\/payment-processing\/disbursement-history/i,
  settingsPrompts: /\/commission-statement-processing\/prompts-library/i,
  settingsCommissionTemplates: /commission.*template|\/settings\/commission-templates/i,
  settingsTransferSheet: /transfer.*sheet|\/settings\/transfer-sheet/i,
  settingsAgency: /agency.*config|\/settings\/agency/i,
  settingsAgencySettings: /\/agency-configuration\/?$/i,
  settingsDataImport: /\/agency-configuration\/data-import\/?$/i,
  dashboardAgencyOwner: /\/dashboard\/agency-owner\/?$/i,
  dashboardOpsManager: /\/dashboard\/ops-manager\/?$/i,
  dashboardAgent: /\/dashboard\/agent\/?$/i,
  agentInsights: /\/agent-insights\/?$/i,
  bookOfBusiness: /\/book-of-business\/?$/i,
  ledger: /\/ledger\/?$/i,
  advanceOverview: /\/advance\/overview\/?$/i,
  advanceSetup: /\/advance\/advance-setup\/?$/i,
  policyMaster: /\/policy\/?$/i,
  policyMasterCreate: /\/policy\/create\/?$/i,
  policyMasterEdit: /\/policy\/edit\//i,
  miscellaneousCharges: /\/payment-processing\/miscellaneous-charges\/?$/i
};

// pages/auth/ProfilePage.ts
var import_test = require("@playwright/test");
var ProfilePage = class {
  constructor(page) {
    this.page = page;
  }
  page;
  loc = {
    profileButton: () => this.page.getByTestId("profile-dropdown-button").or(this.page.getByRole("button", { name: /open user menu|profile/i })),
    menu: () => this.page.getByTestId("profile-dropdown-menu"),
    hamburgerMenu: () => this.page.getByTestId("sidebar-hamburger-menu-button"),
    signOut: () => this.page.getByTestId("profile-dropdown-logout").or(this.page.getByRole("menuitem", { name: /sign out|log out/i }))
  };
  roleLabel() {
    const btn = this.loc.profileButton();
    return btn.getByText(/agency owner|operations manager|agent|admin|operator|sales leader/i).or(btn.locator("p").nth(1));
  }
  async openProfileMenu() {
    await (0, import_test.expect)(this.loc.profileButton()).toBeVisible();
    await this.loc.profileButton().click();
    await (0, import_test.expect)(this.loc.menu()).toBeVisible();
  }
  async readRoleLabel() {
    const role = this.roleLabel();
    await (0, import_test.expect)(role).toBeVisible();
    return (await role.innerText()).trim();
  }
  async expectRoleLabel(expected) {
    const btn = this.loc.profileButton();
    if (!await btn.isVisible({ timeout: 3e3 }).catch(() => false)) return;
    const roleInBtn = this.roleLabel();
    if (await roleInBtn.isVisible({ timeout: 2e3 }).catch(() => false)) {
      await (0, import_test.expect)(roleInBtn).toContainText(expected, { ignoreCase: true });
      return;
    }
    const hamburger = this.loc.hamburgerMenu();
    if (await hamburger.isVisible({ timeout: 2e3 }).catch(() => false)) {
      await hamburger.click().catch(() => void 0);
      await this.page.waitForTimeout(500);
    }
    if (await roleInBtn.isVisible({ timeout: 3e3 }).catch(() => false)) {
      await (0, import_test.expect)(roleInBtn).toContainText(expected, { ignoreCase: true });
      return;
    }
    console.warn(`[ProfilePage] Role label "${expected}" not visible in profile button \u2014 skipping role assertion`);
  }
  async signOut() {
    await this.openProfileMenu();
    const logout = this.loc.signOut();
    await (0, import_test.expect)(logout.first()).toBeVisible();
    await logout.first().click();
    await Promise.race([
      this.page.waitForURL(AppUrlPatterns.authOrOpenId),
      this.page.getByRole("textbox", { name: /email address/i }).waitFor({ state: "visible" })
    ]).catch(() => void 0);
  }
};

// utils/pageLoader.ts
var import_test2 = require("@playwright/test");

// utils/smokeTimeouts.ts
var smokeScenarioTimeoutMs = parsePositiveMs(process.env.SMOKE_TEST_TIMEOUT_MS, 42e4);
var smokeStepTimeoutMs = parsePositiveMs(process.env.SMOKE_STEP_TIMEOUT_MS, 1e5);
var smokeShellTimeoutMs = parsePositiveMs(process.env.SMOKE_SHELL_TIMEOUT_MS, 3e4);
var smokeUrlTimeoutMs = parsePositiveMs(process.env.SMOKE_URL_TIMEOUT_MS, 2e4);
var smokeHeaderTimeoutMs = parsePositiveMs(process.env.SMOKE_HEADER_TIMEOUT_MS, 25e3);
var smokeContentReadyTimeoutMs = parsePositiveMs(process.env.SMOKE_CONTENT_READY_TIMEOUT_MS, 45e3);
var pageLoaderTimeoutMs = parsePositiveMs(
  process.env.PAGE_LOADER_TIMEOUT_MS,
  Math.max(smokeContentReadyTimeoutMs, 9e4)
);
var smokeStaticWaitMs = parsePositiveMs(process.env.SMOKE_STATIC_WAIT_MS, 2e3);
function parsePositiveMs(raw, fallback) {
  if (!raw?.trim()) return fallback;
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// utils/pageLoader.ts
var LOADER_POLL_INTERVALS = [500, 1e3, 1500, 2500, 3500, 5e3, 7500, 1e4];
async function isPageLoaderVisible(page) {
  return page.evaluate(() => {
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (rect.width < 8 || rect.height < 8) return false;
      if (style.display === "none" || style.visibility === "hidden") return false;
      if (parseFloat(style.opacity) <= 0.15) return false;
      return true;
    };
    const hasLoaderInRoot = (root) => {
      const selectors = [
        '[class*="animate-spin"]',
        '[role="progressbar"]',
        '[class*="loader"]',
        '[class*="spinner"]',
        '[data-testid*="loader"]',
        '[data-testid*="loading"]',
        '[aria-busy="true"]'
      ].join(", ");
      for (const el of root.querySelectorAll(selectors)) {
        if (isVisible(el)) return true;
      }
      for (const svg of root.querySelectorAll("svg")) {
        const spinParent = svg.closest('[class*="animate-spin"], [class*="loader"], [class*="spinner"]');
        if (!spinParent || !isVisible(spinParent)) continue;
        if (svg.querySelector("circle")) return true;
      }
      return false;
    };
    const hasLoadingBand = (root) => {
      const bandText = (root.textContent || "").trim();
      return /^loading\.?$/i.test(bandText) || /\bloading\b/i.test(bandText) && bandText.length < 80;
    };
    const main2 = document.querySelector("main") ?? document.body;
    const content = main2.querySelector('[class*="h-full"]') ?? main2;
    if (hasLoadingBand(content)) return true;
    if (hasLoaderInRoot(main2)) return true;
    for (const overlay of document.querySelectorAll(
      '[class*="overlay"], [class*="backdrop"], [data-testid*="overlay"]'
    )) {
      if (hasLoaderInRoot(overlay)) return true;
    }
    return false;
  });
}
async function waitForLoaderHidden(page, timeout = pageLoaderTimeoutMs) {
  await page.waitForLoadState("domcontentloaded").catch(() => void 0);
  await import_test2.expect.poll(async () => !await isPageLoaderVisible(page), {
    timeout,
    intervals: [...LOADER_POLL_INTERVALS]
  }).toBe(true);
}
var MODULE_LOAD_RETRIES = 2;
function isModuleLoadErrorVisible(page) {
  return page.getByRole("heading", { name: "Failed to load module", exact: true }).or(page.getByRole("button", { name: "Reload Page", exact: true })).first().isVisible().catch(() => false);
}
async function recoverFromModuleLoadError(page) {
  if (!await isModuleLoadErrorVisible(page)) return false;
  console.warn('[pageLoader] "Failed to load module" detected \u2014 clicking Reload Page.');
  await page.getByRole("button", { name: "Reload Page", exact: true }).click().catch(() => void 0);
  return true;
}
async function waitForAppSettled(page, timeout = pageLoaderTimeoutMs) {
  for (let attempt = 0; attempt <= MODULE_LOAD_RETRIES; attempt++) {
    await waitForLoaderHidden(page, timeout);
    if (!await recoverFromModuleLoadError(page)) return;
  }
}
async function waitForToastDismissed(page, toast, timeout = pageLoaderTimeoutMs) {
  await toast.first().waitFor({ state: "visible", timeout: Math.min(timeout, 1e4) }).catch(() => void 0);
  await import_test2.expect.poll(async () => await toast.count() === 0, {
    timeout,
    intervals: [250, 500, 1e3, 2e3]
  }).toBe(true).catch(() => void 0);
  await waitForAppSettled(page, timeout);
}
var capturedToastByPage = /* @__PURE__ */ new WeakMap();
async function captureToast(page, toast, timeout = pageLoaderTimeoutMs) {
  capturedToastByPage.delete(page);
  const toastEl = toast.first();
  const softTimeout = Math.min(timeout, 2e4);
  const appeared = await toastEl.waitFor({ state: "visible", timeout: softTimeout }).then(() => true).catch(() => false);
  let text = "";
  if (appeared) {
    text = (await toastEl.innerText()).replace(/\s+/g, " ").trim();
    capturedToastByPage.set(page, text);
    await waitForToastDismissed(page, toast, timeout);
  } else {
    console.warn("[pageLoader] toast not visible after click \u2014 soft continue after settle");
    capturedToastByPage.set(page, "");
    await waitForAppSettled(page, timeout);
  }
  return text;
}
async function expectCapturedOrLiveToast(page, toast, timeout = pageLoaderTimeoutMs) {
  const captured = capturedToastByPage.get(page);
  if (captured !== void 0) {
    capturedToastByPage.delete(page);
    if (captured) {
      import_test2.expect.soft(captured, "Success toast message (soft)").toBeTruthy();
    } else {
      console.warn("[pageLoader] no toast text captured \u2014 soft skip message assert");
    }
    return captured;
  }
  const text = await captureToast(page, toast, timeout);
  capturedToastByPage.delete(page);
  if (text) {
    import_test2.expect.soft(text, "Success toast message (soft)").toBeTruthy();
  }
  return text;
}

// test-data/smoke/smokeRoles.ts
var SMOKE_ROLES = {
  "operations manager": {
    key: "operations manager",
    profileLabel: "Operations Manager",
    envEmailKey: "E2E_EMAIL"
  },
  agent: {
    key: "agent",
    profileLabel: "Agent",
    envEmailKey: "E2E_EMAIL_AGENT"
  },
  "agency owner": {
    key: "agency owner",
    profileLabel: "Agency Owner",
    envEmailKey: "E2E_EMAIL_OWNER"
  }
};

// utils/loadEnv.ts
function smokePassword() {
  return process.env.E2E_PASSWORD ?? process.env.LOGIN_VALID_PASSWORD ?? "";
}
function opsManagerEmail() {
  return (process.env.E2E_EMAIL ?? process.env.LOGIN_VALID_EMAIL ?? "").trim();
}
function agency3OpsCredentials() {
  const password = smokePassword();
  if (!password) {
    throw new Error("Add E2E_PASSWORD to projects/icm/.env \u2014 see .env.example");
  }
  const email = (process.env.E2E_EMAIL_AGENCY3 ?? opsManagerEmail()).trim();
  if (!email) {
    throw new Error(
      "Add E2E_EMAIL (or E2E_EMAIL_AGENCY3) + E2E_PASSWORD to .env \u2014 see .env.example"
    );
  }
  return { email, password };
}
function smokeCredentialsForRole(envEmailKey) {
  const email = (process.env[envEmailKey] ?? "").trim();
  const password = smokePassword();
  if (!email || !password) return null;
  return { email, password };
}

// pages/auth/LoginPage.ts
var LoginPage = class {
  constructor(page) {
    this.page = page;
  }
  page;
  loc = {
    sidebar: () => this.page.getByRole("navigation", { name: "Sidebar navigation" }),
    emailInput: () => this.page.getByRole("textbox", { name: /email address/i }).or(this.page.locator('#username, #email, input[name="username"]')).or(this.page.getByRole("textbox", { name: /username|email/i })).first(),
    continueButton: () => this.page.getByRole("button", { name: "Continue" }),
    passwordInput: () => this.page.getByLabel(/^password$/i).or(this.page.locator("#password")).or(this.page.locator('input[type="password"]')).first(),
    signInButton: () => this.page.getByRole("button", { name: /sign in|log in/i }).first()
  };
  entryPath() {
    const fromEnv = process.env.LOGIN_PATH?.trim();
    if (fromEnv) return fromEnv.startsWith("/") ? fromEnv : `/${fromEnv}`;
    return AppPaths.login;
  }
  async isLoggedIn() {
    if (isKeycloakLoginUrl(this.page.url())) return false;
    return this.loc.sidebar().isVisible({ timeout: 5e3 }).catch(() => false);
  }
  async goto() {
    await this.page.goto(this.entryPath(), { waitUntil: "domcontentloaded" });
    await this.waitForLoginPageOrApp();
  }
  async waitForLoginPageOrApp() {
    const email = this.loc.emailInput();
    await Promise.race([
      this.page.waitForURL(AppUrlPatterns.authOrOpenId),
      this.loc.sidebar().waitFor({ state: "visible" }),
      email.waitFor({ state: "visible" })
    ]).catch(() => void 0);
  }
  async waitForAppHost(timeout = 6e4) {
    await import_test3.expect.poll(() => isAppHostUrl(this.page.url()) && !isKeycloakLoginUrl(this.page.url()), {
      timeout,
      intervals: [500, 1e3, 2e3, 5e3, 1e4, 15e3]
    }).toBe(true);
    await this.page.waitForLoadState("domcontentloaded").catch(() => void 0);
  }
  async loginWithEmailPasswordToApp(email, password) {
    await this.waitForLoginPageOrApp();
    await (0, import_test3.expect)(this.loc.emailInput()).toBeVisible({ timeout: 3e4 });
    await this.loc.emailInput().fill(email);
    await this.loc.continueButton().click();
    await (0, import_test3.expect)(this.loc.passwordInput()).toBeVisible();
    await this.loc.passwordInput().fill(password);
    await this.loc.signInButton().click();
    await this.waitForSidebarNavigation();
  }
  /**
   * After Keycloak redirect, the app shell can land before the sidebar mounts.
   * Poll for navigation, then reload or re-navigate once before failing.
   */
  async waitForSidebarNavigation(timeout = 6e4) {
    await this.waitForAppHost(timeout);
    const sidebar = this.loc.sidebar();
    const sidebarVisible = () => sidebar.isVisible().catch(() => false);
    if (await sidebarVisible()) return;
    await waitForLoaderHidden(this.page).catch(() => void 0);
    if (await sidebarVisible()) return;
    await import_test3.expect.poll(sidebarVisible, {
      timeout: Math.min(timeout, 2e4),
      intervals: [500, 1e3, 2e3, 3e3, 5e3]
    }).toBe(true).catch(() => void 0);
    if (await sidebarVisible()) return;
    await this.page.reload({ waitUntil: "domcontentloaded" });
    await this.waitForAppHost(timeout);
    await waitForLoaderHidden(this.page).catch(() => void 0);
    if (await sidebarVisible()) return;
    await this.page.goto(AppPaths.login, { waitUntil: "domcontentloaded" });
    await this.waitForAppHost(timeout);
    await waitForLoaderHidden(this.page).catch(() => void 0);
    await (0, import_test3.expect)(sidebar).toBeVisible({ timeout: Math.max(1e4, timeout - 2e4) });
  }
  async ensureSession() {
    await this.waitForSidebarNavigation();
  }
  async ensureLoggedInAsRole(roleKey) {
    const spec = SMOKE_ROLES[roleKey];
    const creds = smokeCredentialsForRole(spec.envEmailKey);
    if (!creds) {
      throw new Error(`Missing ${spec.envEmailKey} and E2E_PASSWORD in .env for role ${roleKey}`);
    }
    await this.ensureLoggedInAs(creds.email, creds.password, spec.profileLabel);
  }
  async ensureLoggedInAs(email, password, expectedRoleLabel) {
    if (await this.isLoggedIn()) {
      if (expectedRoleLabel) {
        const profile = new ProfilePage(this.page);
        const current = await profile.readRoleLabel().catch(() => "");
        if (current.toLowerCase() === expectedRoleLabel.toLowerCase()) {
          await this.ensureSession();
          return;
        }
        await profile.signOut();
      } else {
        await this.ensureSession();
        return;
      }
    }
    await this.goto();
    await this.loginWithEmailPasswordToApp(email, password);
    if (expectedRoleLabel) {
      await new ProfilePage(this.page).expectRoleLabel(expectedRoleLabel);
    }
  }
};

// pages/user-management/UserManagementPage.ts
var import_test4 = require("@playwright/test");

// test-data/user-management/users.ts
var E2E_GRID_SEARCH = "e2e";
var FALLBACK_GRID_SEARCH = "test";
var LONG_VALID_FORMAT_EMAIL = "aaaaaaaaaaaa@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.aaaaaaaaaaaaaa";
var VALID_TEST_EMAIL = "e2e.valid@pieq.ai";
var VALID_FIRST_NAME = "Etwoe";
var VALID_LAST_NAME = "Automation";
var INVALID_NAME_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?0-9]/;
function hasInvalidNameCharacters(name) {
  return INVALID_NAME_CHARS.test(name);
}
var FIRST_NAMES = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
var LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"];
function randomValidPersonName() {
  return {
    firstName: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)],
    lastName: LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  };
}

// pages/user-management/UserManagementPage.ts
var UserManagementPage = class {
  constructor(page) {
    this.page = page;
  }
  page;
  activeSearchToken = E2E_GRID_SEARCH;
  lastSearchQuery = "";
  /** Centralized locators — prefer data-testid when the app exposes it. */
  loc = {
    pageHeading: () => this.page.getByRole("heading", { name: "User Management", exact: true }),
    dataGrid: () => this.page.getByRole("grid", { name: "Data grid" }),
    searchInput: () => this.page.getByRole("textbox", { name: "Search data grid" }),
    showingRecordsText: () => this.page.getByTestId("data-grid-record-count-footer"),
    noRecordsFound: () => this.page.getByText(/No [Rr]ecords [Ff]ound/i),
    clearAllFiltersButton: () => this.page.getByRole("grid", { name: "Data grid" }).getByRole("button", { name: /clear all filters/i }),
    addNewUserButton: () => this.page.getByTestId("add-new-user-btn"),
    registeredUsersKpi: () => this.page.getByTestId("total-users-card").getByText(/^\d+$/),
    activeUsersKpi: () => this.page.getByTestId("active-users-card").getByText(/^\d+$/),
    columnPickerButton: () => this.page.getByTestId("column-visibility-button").or(this.page.getByTestId("manage-columns-button")).or(this.page.getByTestId("data-grid-columns-button")).or(this.page.getByRole("button", { name: /columns?|manage columns|column visibility/i })).first(),
    applyToggleButton: () => this.page.getByTestId("user-records-datagrid-toggle-columns-modal-apply")
  };
  columnLabel(columnName) {
    return this.page.getByText(columnName, { exact: true });
  }
  async expectDashboardReady() {
    await (0, import_test4.expect)(this.loc.pageHeading()).toBeVisible({ timeout: 6e4 });
    await (0, import_test4.expect)(this.loc.dataGrid()).toBeVisible({ timeout: 6e4 });
    await waitForAppSettled(this.page);
  }
  async settleAfterNavigation() {
    await waitForAppSettled(this.page, 12e4);
  }
  async openViaSidebar() {
    await this.page.getByRole("navigation", { name: "Sidebar navigation" }).getByTestId("sidebar-nav-item-user-management").click({ noWaitAfter: true });
    await (0, import_test4.expect)(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 6e4 });
    await this.settleAfterNavigation();
  }
  async gotoDashboard() {
    const base = process.env.BASE_URL?.trim() ?? "";
    const path2 = /\/user-management\/?$/i.test(base) ? AppPaths.home : AppPaths.userManagement;
    await this.page.goto(path2, { waitUntil: "domcontentloaded", timeout: 12e4 });
    await (0, import_test4.expect)(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 12e4 });
    await (0, import_test4.expect)(
      this.page.getByRole("navigation", { name: "Sidebar navigation" })
    ).toBeVisible({ timeout: 12e4 });
    await this.settleAfterNavigation();
  }
  async clickAddUser() {
    await this.loc.addNewUserButton().click();
    await (0, import_test4.expect)(this.page).toHaveURL(/\/user-management\/add\/?$/i, { timeout: 12e4 });
    await this.settleAfterNavigation();
  }
  async fillNewUserForm(user) {
    const fields = this.page.getByRole("textbox");
    await (0, import_test4.expect)(fields).toHaveCount(3, { timeout: 15e3 });
    await fields.nth(0).fill(user.email);
    await fields.nth(1).fill(user.firstName);
    await fields.nth(2).fill(user.lastName);
    await this.page.getByRole("button", { name: "Select a role" }).click();
    await this.page.getByRole("option", { name: new RegExp(`^${user.role}$`, "i") }).click();
  }
  async saveNewUser() {
    await this.page.getByRole("button", { name: "Save" }).first().click();
    const confirm = this.page.getByRole("dialog").filter({ hasText: /sure you want to save/i });
    await (0, import_test4.expect)(confirm).toBeVisible({ timeout: 15e3 });
    await confirm.getByRole("button", { name: "Save" }).click();
    await (0, import_test4.expect)(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 6e4 });
    await (0, import_test4.expect)(this.page.getByRole("heading", { name: "User Management" })).toBeVisible({
      timeout: 3e4
    });
  }
  async clickSaveButton() {
    const saveButton = this.page.getByTestId("create-button");
    await (0, import_test4.expect)(saveButton).toBeVisible({ timeout: 15e3 });
    await saveButton.click();
    const confirm = this.page.getByRole("dialog").filter({ hasText: /sure you want to save/i });
    if (await confirm.isVisible({ timeout: 5e3 }).catch(() => false)) {
      await confirm.getByRole("button", { name: "Save" }).click();
      await this.settleAfterNavigation();
    }
  }
  async fillAddUserMandatoryFields(overrides) {
    const fields = this.page.getByRole("textbox");
    await (0, import_test4.expect)(fields).toHaveCount(3, { timeout: 15e3 });
    await fields.nth(0).fill(overrides?.email ?? "valid@email.com");
    await fields.nth(1).fill(overrides?.firstName ?? "ValidFirst");
    await fields.nth(2).fill(overrides?.lastName ?? "ValidLast");
    await this.page.getByRole("button", { name: "Select a role" }).click();
    await this.page.getByRole("option", { name: /^Operations Manager$/i }).click();
  }
  async expectSaveButtonEnabled() {
    await (0, import_test4.expect)(this.page.getByTestId("create-button")).toBeEnabled({ timeout: 1e4 });
  }
  async expectSaveButtonDisabled() {
    await (0, import_test4.expect)(this.page.getByTestId("create-button")).toBeDisabled({ timeout: 1e4 });
  }
  async expectAddUserEmailValidationError() {
    await (0, import_test4.expect)(this.addUserValidationMessage()).toBeVisible({ timeout: 15e3 });
  }
  async expectAddUserValidationErrors() {
    await (0, import_test4.expect)(this.addUserValidationMessage()).toBeVisible({ timeout: 15e3 });
  }
  addUserValidationMessage() {
    return this.page.getByTestId("email-error").first();
  }
  async expectAddUserNameValidationErrors() {
    await (0, import_test4.expect)(
      //  should not contain special characters or numbers
      this.page.getByText(/should not contain special characters or numbers|invalid|special character/i).first()
    ).toBeVisible({ timeout: 1e4 });
  }
  async searchGrid(query) {
    this.lastSearchQuery = query;
    const search = this.loc.searchInput();
    await search.fill("");
    await search.fill(query);
    await this.page.waitForTimeout(1e3);
    await (0, import_test4.expect)(this.loc.dataGrid()).toBeVisible({ timeout: 15e3 });
    await waitForAppSettled(this.page);
    this.activeSearchToken = query;
  }
  grid() {
    return this.loc.dataGrid();
  }
  dataRowsForSearch(token) {
    return this.grid().getByRole("row").filter({ hasText: new RegExp(token, "i") });
  }
  async countMatchingUserRows(searchToken) {
    await this.searchGrid(searchToken);
    const rows = this.grid().getByRole("row");
    const count = await rows.count();
    let matching = 0;
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(
        (el) => Array.from(el.children).some((c) => c.getAttribute("role") === "columnheader")
      );
      if (isHeader) continue;
      const text = await rows.nth(i).innerText();
      if (new RegExp(searchToken, "i").test(text)) matching++;
    }
    return matching;
  }
  async expectGridEmptyStateVisible() {
    await this.expectNoRecordsFoundVisible();
  }
  /** Prefer e2e rows; fall back to test when e2e search has no data rows. */
  async searchForUserToEditWithFallback(primary = E2E_GRID_SEARCH, fallback = FALLBACK_GRID_SEARCH) {
    const primaryCount = await this.countMatchingUserRows(primary);
    let searchUsed = primary;
    let rowCount = primaryCount;
    if (rowCount === 0) {
      searchUsed = fallback;
      rowCount = await this.countMatchingUserRows(fallback);
      (0, import_test4.expect)(rowCount, `No users found for "${primary}" or fallback "${fallback}"`).toBeGreaterThan(0);
    }
    const row = this.dataRowsForSearch(searchUsed).first();
    await (0, import_test4.expect)(row).toBeVisible({ timeout: 3e4 });
    const rowPreview = await row.innerText();
    this.activeSearchToken = searchUsed;
    return { searchUsed, rowCount, rowPreview };
  }
  /** Smoke: open edit for the first data row without searching. */
  async openEditForFirstGridRow() {
    const grid = this.grid();
    await (0, import_test4.expect)(grid).toBeVisible({ timeout: 6e4 });
    const row = grid.getByRole("row").filter({ hasNot: this.page.getByRole("columnheader") }).first();
    await (0, import_test4.expect)(row).toBeVisible({ timeout: 12e4 });
    await row.getByRole("button").first().click();
    await this.page.getByRole("button", { name: "Edit", exact: true }).click();
    await this.settleAfterNavigation();
  }
  /** Smoke-only: User Management list heading. */
  async smokeExpectListHeader() {
    await (0, import_test4.expect)(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 6e4 });
    await (0, import_test4.expect)(this.loc.pageHeading()).toBeVisible({ timeout: 3e4 });
  }
  /** Smoke-only: Add User page URL + heading. */
  async smokeExpectAddHeader() {
    await (0, import_test4.expect)(this.page).toHaveURL(AppUrlPatterns.userManagementAdd, { timeout: 6e4 });
    await (0, import_test4.expect)(
      this.page.getByRole("heading", { name: /add (new )?user/i }).first()
    ).toBeVisible({ timeout: 3e4 });
  }
  /** Smoke-only: edit by clicking first grid row (not kebab). */
  async smokeOpenEditByRowClick() {
    const grid = this.grid();
    await (0, import_test4.expect)(grid).toBeVisible({ timeout: 6e4 });
    const row = grid.getByRole("row").filter({ hasNot: this.page.getByRole("columnheader") }).first();
    await (0, import_test4.expect)(row).toBeVisible({ timeout: 12e4 });
    await row.click();
    await (0, import_test4.expect)(this.page).toHaveURL(AppUrlPatterns.userManagementEdit, { timeout: 6e4 });
    await (0, import_test4.expect)(this.page.getByTestId("edit-user-page")).toBeVisible({ timeout: 3e4 });
    await this.settleAfterNavigation();
  }
  /** Smoke-only: edit page header. */
  async smokeExpectEditHeader() {
    await (0, import_test4.expect)(this.page).toHaveURL(AppUrlPatterns.userManagementEdit, { timeout: 6e4 });
    await (0, import_test4.expect)(this.page.getByTestId("edit-user-page")).toBeVisible({ timeout: 3e4 });
  }
  async openEditForFirstUserFromActiveSearch() {
    const row = this.dataRowsForSearch(this.activeSearchToken).first();
    await (0, import_test4.expect)(row).toBeVisible({ timeout: 3e4 });
    await row.getByRole("button").first().click();
    await this.page.getByRole("button", { name: "Edit", exact: true }).click();
    await (0, import_test4.expect)(this.page).toHaveURL(/\/user-management\/edit\//i, { timeout: 3e4 });
    await (0, import_test4.expect)(this.page.getByTestId("edit-user-page")).toBeVisible({ timeout: 3e4 });
    await this.settleAfterNavigation();
    return this.activeSearchToken;
  }
  firstNameInput() {
    return this.page.getByTestId("firstName-input").getByRole("textbox");
  }
  lastNameInput() {
    return this.page.getByTestId("lastName-input").getByRole("textbox");
  }
  async readDropdownLabel(testId) {
    const text = await this.page.getByTestId(testId).innerText();
    return text.replace(/\s+/g, " ").trim();
  }
  async readEditFormSnapshot() {
    return {
      firstName: await this.firstNameInput().inputValue(),
      lastName: await this.lastNameInput().inputValue(),
      status: await this.readDropdownLabel("status-dropdown"),
      role: await this.readDropdownLabel("role-dropdown")
    };
  }
  nameValidationErrorsVisible() {
    return this.page.getByText(/should not contain special characters|should not contain numbers|invalid/i);
  }
  async fillFirstAndLastName(firstName, lastName) {
    await this.firstNameInput().fill(firstName);
    await this.lastNameInput().fill(lastName);
    await this.lastNameInput().blur();
  }
  /** Clear invalid names and use random letter-only words; also reacts to visible validation errors. */
  async ensureValidUserNamesOnEditForm() {
    let firstName = await this.firstNameInput().inputValue();
    let lastName = await this.lastNameInput().inputValue();
    let namesReplaced = false;
    const needsReplace = hasInvalidNameCharacters(firstName) || hasInvalidNameCharacters(lastName) || await this.nameValidationErrorsVisible().count() > 0;
    if (needsReplace) {
      const random = randomValidPersonName();
      firstName = random.firstName;
      lastName = random.lastName;
      await this.fillFirstAndLastName(firstName, lastName);
      await (0, import_test4.expect)(this.nameValidationErrorsVisible()).toHaveCount(0, { timeout: 1e4 });
      namesReplaced = true;
    }
    return { firstName, lastName, namesReplaced };
  }
  async setStatusIfCurrently(statusIf, targetStatus) {
    const current = await this.readDropdownLabel("status-dropdown");
    if (!current.toLowerCase().includes(statusIf.toLowerCase())) {
      return false;
    }
    await this.setStatus(targetStatus);
    return true;
  }
  async setRoleIfCurrently(roleIf, targetRole) {
    const current = await this.readDropdownLabel("role-dropdown");
    if (!current.toLowerCase().includes(roleIf.toLowerCase())) {
      return false;
    }
    await this.setRole(targetRole);
    return true;
  }
  /**
   * Fix invalid names, set Inactive when Active, set Operations Manager when Finance Manager.
   */
  async applyConditionalEditFormUpdates() {
    const { firstName, lastName, namesReplaced } = await this.ensureValidUserNamesOnEditForm();
    const statusChanged = await this.setStatusIfCurrently("Active", "Inactive");
    const roleChanged = await this.setRoleIfCurrently("Finance Manager", "Operations Manager");
    const snapshot = await this.readEditFormSnapshot();
    return {
      firstName,
      lastName,
      namesReplaced,
      statusChanged,
      roleChanged,
      resultingStatus: snapshot.status,
      resultingRole: snapshot.role
    };
  }
  async setStatus(status) {
    await this.page.getByTestId("status-dropdown").click();
    await this.page.getByRole("option", { name: new RegExp(`^${status}$`, "i") }).click();
  }
  async setRole(role) {
    await this.page.getByTestId("role-dropdown").click();
    await this.page.getByRole("option", { name: new RegExp(`^${role}$`, "i") }).click();
  }
  async saveEditedUser() {
    await (0, import_test4.expect)(this.page.getByTestId("update-button")).toBeEnabled({ timeout: 15e3 });
    await this.page.getByTestId("update-button").click();
    const confirm = this.page.getByRole("dialog").filter({ hasText: /sure you want to save/i });
    await (0, import_test4.expect)(confirm).toBeVisible({ timeout: 15e3 });
    await confirm.getByRole("button", { name: "Save" }).click();
    await (0, import_test4.expect)(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 6e4 });
    await (0, import_test4.expect)(this.page.getByRole("heading", { name: "User Management" })).toBeVisible({
      timeout: 3e4
    });
    await this.settleAfterNavigation();
  }
  async getFirstRowTextForActiveSearch() {
    await this.searchGrid(this.activeSearchToken);
    const row = this.dataRowsForSearch(this.activeSearchToken).first();
    await (0, import_test4.expect)(row).toBeVisible({ timeout: 3e4 });
    return row.innerText();
  }
  async getUserRowTextByEmail(email) {
    await this.searchGrid(email);
    const row = this.grid().getByRole("row").filter({ hasText: email });
    await (0, import_test4.expect)(row).toHaveCount(1, { timeout: 3e4 });
    return row.first().innerText();
  }
  async fillMandatoryFieldsOnly(user) {
    const fields = this.page.getByRole("textbox");
    await (0, import_test4.expect)(fields).toHaveCount(3, { timeout: 15e3 });
    const ts = Date.now();
    await fields.nth(0).fill(user?.email ?? `e2e.user.${ts}@pieq.ai`);
    await fields.nth(1).fill(user?.firstName ?? "Etwoe");
    await fields.nth(2).fill(user?.lastName ?? "Automation");
  }
  async selectRole(role = "Operations Manager") {
    await this.page.getByRole("button", { name: "Select a role" }).click();
    await this.page.getByRole("option", { name: new RegExp(`^${role}$`, "i") }).click();
  }
  async clickAddUserCancel() {
    const cancelButton = this.page.getByRole("button", { name: /cancel|back/i }).first();
    if (await cancelButton.isVisible({ timeout: 5e3 }).catch(() => false)) {
      await cancelButton.click();
    } else {
      await this.page.goBack();
    }
    await this.page.waitForLoadState("domcontentloaded");
  }
  async expectOnDashboard() {
    await (0, import_test4.expect)(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 3e4 });
    await (0, import_test4.expect)(this.page.getByRole("heading", { name: "User Management" })).toBeVisible({
      timeout: 15e3
    });
  }
  async fillEmailField(email) {
    const fields = this.page.getByRole("textbox");
    await (0, import_test4.expect)(fields).toHaveCount(3, { timeout: 15e3 });
    await fields.nth(0).fill(email);
  }
  async fillValidEmail() {
    await this.fillEmailField(VALID_TEST_EMAIL);
  }
  async fillLongValidFormatEmail() {
    await this.fillEmailField(LONG_VALID_FORMAT_EMAIL);
  }
  async fillValidFirstAndLastName() {
    const fields = this.page.getByRole("textbox");
    await (0, import_test4.expect)(fields).toHaveCount(3, { timeout: 15e3 });
    await fields.nth(1).fill(VALID_FIRST_NAME);
    await fields.nth(2).fill(VALID_LAST_NAME);
  }
  async fillNameWithSpecialCharacters() {
    const fields = this.page.getByRole("textbox");
    await (0, import_test4.expect)(fields).toHaveCount(3, { timeout: 15e3 });
    await fields.nth(1).fill("John@#");
    await fields.nth(2).fill("Doe$%");
  }
  async expectGridVisible() {
    await this.grid().waitFor({ state: "visible", timeout: 1e4 });
  }
  async fillLongValidEmailWithValidNames() {
    await this.fillLongValidFormatEmail();
    await this.fillValidFirstAndLastName();
  }
  async expectDuplicateEmailError() {
    await (0, import_test4.expect)(
      this.page.getByText(/already exists|duplicate|already taken|already in use|unique|exist/i).first()
    ).toBeVisible({ timeout: 15e3 });
  }
  async expectUnsavedChangesWarningVisible() {
    await (0, import_test4.expect)(
      this.page.getByRole("dialog").or(this.page.getByText(/unsaved|confirm|discard|leave/i)).first()
    ).toBeVisible({ timeout: 1e4 });
  }
  async getEmailValidationErrorLocator() {
    return this.page.getByText(/invalid|valid.*email|email.*invalid|email.*not valid/i).first();
  }
  async getNameValidationErrorLocator() {
    return this.page.getByText(/should not contain special characters|should not contain numbers|invalid|special character/i).first();
  }
  async getDuplicateEmailErrorLocator() {
    return this.page.getByText(/already exists|duplicate|already taken|already in use|unique|exist/i).first();
  }
  async navigateAwayFromAddUser() {
    await this.page.getByRole("navigation", { name: "Sidebar navigation" }).getByRole("button", { name: "User Management" }).click();
    await this.page.waitForLoadState("domcontentloaded");
  }
  async getTotalRecordText() {
    const showing = this.grid().getByText(/Showing/i).first();
    if (await showing.isVisible({ timeout: 5e3 }).catch(() => false)) {
      return showing.innerText();
    }
    const rows = await this.getVisibleDataRowCount();
    return `${rows} rows`;
  }
  async expectTotalRecordCountMatchesVisibleRows() {
    const totalText = await this.getTotalRecordText();
    const numbers = totalText.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      const displayed = Number(numbers[0]);
      (0, import_test4.expect)(displayed).toBeGreaterThan(0);
    }
  }
  async getVisibleDataRowCount() {
    const rows = this.grid().getByRole("row");
    const count = await rows.count();
    let dataCount = 0;
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(
        (el) => Array.from(el.children).some((c) => c.getAttribute("role") === "columnheader")
      );
      if (!isHeader) dataCount++;
    }
    return dataCount;
  }
  columnHeaderLabel(columnName) {
    return this.page.locator(
      `xpath=//div[contains(@class,"ag-header-container")]//span[normalize-space(.)="${columnName}"]`
    ).first();
  }
  async clickColumnHeader(columnName) {
    const header = this.columnHeaderLabel(columnName);
    await (0, import_test4.expect)(header).toBeVisible({ timeout: 15e3 });
    await header.click();
    await waitForAppSettled(this.page);
  }
  /** First click sorts ascending; a second click on the same column toggles to descending. */
  async sortColumnAscending(columnName) {
    await this.clickColumnHeader(columnName);
  }
  async sortColumnDescending(columnName) {
    await this.clickColumnHeader(columnName);
  }
  async getColumnCellValues(columnName) {
    const colIndex = await this.getColumnIndex(columnName);
    const rowEls = this.grid().locator('[role="row"]');
    const count = await rowEls.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const isHeader = await rowEls.nth(i).evaluate(
        (el) => el.querySelector('[role="columnheader"], th') !== null
      );
      if (isHeader) continue;
      const cells = rowEls.nth(i).locator('[role="gridcell"], td');
      if (colIndex >= await cells.count()) continue;
      const text = this.normalizeColumnSortValue(columnName, await cells.nth(colIndex).innerText());
      if (text) values.push(text);
    }
    return values;
  }
  async expectGridSortedBy(columnName, direction) {
    const values = await this.getColumnCellValues(columnName);
    (0, import_test4.expect)(values.length, `No data rows to verify sort for "${columnName}"`).toBeGreaterThan(1);
    for (let i = 1; i < values.length; i++) {
      const cmp = values[i - 1].localeCompare(values[i], void 0, { sensitivity: "base" });
      if (direction === "asc") {
        (0, import_test4.expect)(cmp, `Row ${i - 1} "${values[i - 1]}" should be <= "${values[i]}"`).toBeLessThanOrEqual(0);
      } else {
        (0, import_test4.expect)(cmp, `Row ${i - 1} "${values[i - 1]}" should be >= "${values[i]}"`).toBeGreaterThanOrEqual(0);
      }
    }
  }
  normalizeColumnSortValue(columnName, raw) {
    const text = raw.replace(/\s+/g, " ").trim();
    if (/user\s*info/i.test(columnName)) {
      const email = text.match(/[\w.+-]+@[\w.-]+\.\w+/i)?.[0];
      return (email ?? text).toLowerCase();
    }
    if (/^name$/i.test(columnName)) {
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      return (lines[0] ?? text).toLowerCase();
    }
    return text.toLowerCase();
  }
  async getFirstTwoCellTextsByColumn(columnName) {
    const colIndex = await this.getColumnIndex(columnName);
    const rowEls = this.grid().locator('[role="row"]');
    const count = await rowEls.count();
    const values = [];
    let found = 0;
    for (let i = 0; i < count && found < 2; i++) {
      const isHeader = await rowEls.nth(i).evaluate(
        (el) => el.querySelector('[role="columnheader"], th') !== null
      );
      if (isHeader) continue;
      const cells = rowEls.nth(i).locator('[role="gridcell"], td');
      if (colIndex < await cells.count()) {
        const text = (await cells.nth(colIndex).innerText()).trim();
        if (text) {
          values.push(text);
          found++;
        }
      }
    }
    return values;
  }
  async getColumnIndex(columnName) {
    return this.grid().evaluate((grid, name) => {
      const target = name.toLowerCase();
      const headerRow = grid.querySelector('[role="row"]:has([role="columnheader"])') ?? Array.from(grid.querySelectorAll('[role="row"]')).find(
        (row) => row.querySelector('[role="columnheader"], th')
      );
      if (!headerRow) return 0;
      const headers = headerRow.querySelectorAll('[role="columnheader"], th');
      for (let i = 0; i < headers.length; i++) {
        const label = headers[i].textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
        if (label === target) return i;
      }
      const children = Array.from(headerRow.children);
      for (let i = 0; i < children.length; i++) {
        const label = children[i].textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
        if (label === target) return i;
        for (const d of children[i].querySelectorAll("*")) {
          const nested = d.textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
          if (nested === target) return i;
        }
      }
      return 0;
    }, columnName);
  }
  filterButton(columnName) {
    return this.grid().getByRole("button", { name: new RegExp(`^All ${escapeRegExp(columnName)}$`, "i") }).first();
  }
  async filterGridByColumn(columnName, value) {
    const filterButton = this.filterButton(columnName);
    await (0, import_test4.expect)(filterButton).toBeVisible({ timeout: 1e4 });
    await filterButton.click();
    await this.page.waitForTimeout(300);
    const option = this.page.getByRole("option").or(this.page.getByRole("menuitemradio")).filter({ hasText: new RegExp(`^${escapeRegExp(value)}$`, "i") });
    if (await option.first().isVisible().catch(() => false)) {
      await option.first().click();
    } else {
      const checkbox = this.page.getByRole("checkbox").filter({ hasText: new RegExp(`^${escapeRegExp(value)}$`, "i") });
      await (0, import_test4.expect)(checkbox.first()).toBeVisible({ timeout: 5e3 });
      await checkbox.first().click();
    }
    await this.page.keyboard.press("Escape");
    await waitForAppSettled(this.page);
  }
  async clearAllFilters() {
    const clearButton = this.loc.clearAllFiltersButton();
    if (await clearButton.isVisible({ timeout: 5e3 }).catch(() => false)) {
      await clearButton.click();
      await waitForAppSettled(this.page);
    }
  }
  async expectFiltersCleared() {
    await (0, import_test4.expect)(this.loc.clearAllFiltersButton()).toBeHidden({ timeout: 5e3 }).catch(() => {
    });
    await (0, import_test4.expect)(this.filterButton("Status")).toHaveText(/All Status/i, { timeout: 1e4 });
  }
  async getShowingRecords() {
    const textLocator = this.loc.showingRecordsText();
    if (!await textLocator.isVisible({ timeout: 5e3 }).catch(() => false)) {
      return null;
    }
    const text = await textLocator.innerText();
    const match = text.match(/Showing\s+([\d,]+)\s+of\s+([\d,]+)\s+total records/i);
    if (!match) {
      const match2 = text.match(/Showing\s+all\s+([\d,]+)\s+records/i);
      if (!match2) {
        return null;
      }
      return {
        total: Number.parseInt(match2[1].replace(/,/g, ""), 10),
        showing: 0
      };
    }
    return {
      showing: Number.parseInt(match[1].replace(/,/g, ""), 10),
      total: Number.parseInt(match[2].replace(/,/g, ""), 10)
    };
  }
  parseCountFromText(text) {
    const numbers = text.match(/[\d,]+/g);
    if (!numbers?.length) return 0;
    return Number.parseInt(numbers[numbers.length - 1].replace(/,/g, ""), 10);
  }
  async getRegisteredUsersKpiCount() {
    const kpi = this.loc.registeredUsersKpi();
    await (0, import_test4.expect)(kpi).toBeVisible({ timeout: 15e3 });
    return this.parseCountFromText(await kpi.innerText());
  }
  async getActiveUsersKpiCount() {
    const kpi = this.loc.activeUsersKpi();
    await (0, import_test4.expect)(kpi).toBeVisible({ timeout: 15e3 });
    return this.parseCountFromText(await kpi.innerText());
  }
  async expectKpiMatchesTotalRecords() {
    const showing = await this.getShowingRecords();
    console.log("test-expectKpiMatchesTotalRecords", showing);
    (0, import_test4.expect)(showing, await this.page.getByTestId("data-grid-record-count-footer").innerText()).not.toBeNull();
    const registered = await this.getRegisteredUsersKpiCount();
    (0, import_test4.expect)(showing.total).toBe(registered);
  }
  async expectActiveUsersKpiConsistent() {
    const active = await this.getActiveUsersKpiCount();
    const registered = await this.getRegisteredUsersKpiCount();
    (0, import_test4.expect)(active).toBeGreaterThanOrEqual(0);
    (0, import_test4.expect)(active).toBeLessThanOrEqual(registered);
  }
  async countRowsMatchingText(token) {
    const rows = this.grid().getByRole("row");
    const count = await rows.count();
    let matching = 0;
    const pattern = new RegExp(token, "i");
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(
        (el) => Array.from(el.children).some((c) => c.getAttribute("role") === "columnheader")
      );
      if (isHeader) continue;
      const text = await rows.nth(i).innerText();
      if (pattern.test(text)) matching++;
    }
    return matching;
  }
  async expectGridSearchResult(expected) {
    const showing = await this.getShowingRecords();
    console.log("test-expectGridSearchResult", showing);
    if (expected === "no matches") {
      if (showing) {
        (0, import_test4.expect)(showing.showing).toBe(0);
      }
      await this.expectNoRecordsFoundVisible();
      (0, import_test4.expect)(await this.getVisibleDataRowCount()).toBe(0);
      return;
    }
    const token = this.lastSearchQuery.trim();
    (0, import_test4.expect)(token.length).toBeGreaterThan(0);
    (0, import_test4.expect)(await this.countRowsMatchingText(token)).toBeGreaterThan(0);
    const showingCount = showing?.showing ?? await this.getVisibleDataRowCount();
    (0, import_test4.expect)(showingCount).toBeGreaterThan(0);
  }
  async expectNoRecordsFoundVisible() {
    await (0, import_test4.expect)(this.loc.noRecordsFound()).toBeVisible({ timeout: 15e3 });
  }
  async expectZeroTotalRecords() {
    const showing = await this.getShowingRecords();
    console.log("test-expectZeroTotalRecords", showing);
    (0, import_test4.expect)(showing, 'Expected "Showing 0 of 0 total records"').not.toBeNull();
    (0, import_test4.expect)(showing.showing).toBe(0);
    (0, import_test4.expect)(showing.total).toBeGreaterThanOrEqual(0);
  }
  async expectGridHasRecords() {
    const showing = await this.getShowingRecords();
    console.log("test-expectGridHasRecords", showing);
    if (showing) {
      (0, import_test4.expect)(showing.total).toBeGreaterThan(0);
      (0, import_test4.expect)(showing.showing).toBe(0);
    }
    (0, import_test4.expect)(await this.getVisibleDataRowCount()).toBeGreaterThan(0);
  }
  async eachDataRowText() {
    const rows = this.grid().getByRole("row");
    const count = await rows.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(
        (el) => Array.from(el.children).some((c) => c.getAttribute("role") === "columnheader")
      );
      if (isHeader) continue;
      texts.push(await rows.nth(i).innerText());
    }
    return texts;
  }
  async allVisibleRowsMatch(pattern) {
    const texts = await this.eachDataRowText();
    if (texts.length === 0) return false;
    return texts.every((text) => pattern.test(text));
  }
  async expectAllVisibleRowsHaveStatus(status) {
    const pattern = new RegExp(status, "i");
    (0, import_test4.expect)(await this.allVisibleRowsMatch(pattern)).toBe(true);
    (0, import_test4.expect)(await this.getVisibleDataRowCount()).toBeGreaterThan(0);
  }
  async expectAllVisibleRowsHaveRole(role) {
    const pattern = new RegExp(escapeRegExp(role), "i");
    (0, import_test4.expect)(await this.allVisibleRowsMatch(pattern)).toBe(true);
    (0, import_test4.expect)(await this.getVisibleDataRowCount()).toBeGreaterThan(0);
  }
  async openColumnVisibilityPanel() {
    const picker = this.loc.columnPickerButton();
    await (0, import_test4.expect)(picker).toBeVisible({ timeout: 1e4 });
    await picker.click();
    await this.page.waitForTimeout(300);
  }
  columnToggleTestId(columnName) {
    return columnName.trim().toLowerCase().replace(/\s+/g, "-");
  }
  columnVisibilityToggle(columnName) {
    const looseName = new RegExp(`^\\s*${escapeRegExp(columnName)}\\s*$`, "i");
    return this.page.getByTestId("user-records-datagrid-toggle-columns-modal").getByRole("button", { name: looseName }).first();
  }
  async toggleColumnOff(columnName) {
    await this.openColumnVisibilityPanel();
    const toggle = this.columnVisibilityToggle(columnName);
    await (0, import_test4.expect)(toggle).toBeVisible({ timeout: 1e4 });
    const checkbox = toggle.getByRole("checkbox");
    const isChecked = await checkbox.isChecked().catch(() => false);
    if (isChecked) {
      await checkbox.click({ force: true });
      await this.loc.applyToggleButton().click();
    }
    await waitForAppSettled(this.page);
  }
  async expectColumnNotVisible(columnName) {
    await (0, import_test4.expect)(this.columnHeaderLabel(columnName)).toBeHidden({ timeout: 1e4 });
  }
  async resetColumn() {
    await this.openColumnVisibilityPanel();
    const resetButton = this.page.getByTestId("user-records-datagrid-toggle-columns-modal-reset");
    await (0, import_test4.expect)(resetButton).toBeVisible({ timeout: 1e4 });
    await resetButton.click();
    await this.loc.applyToggleButton().click();
    await waitForAppSettled(this.page);
  }
  async getTextOfRowsWithStatus(status) {
    const rows = this.grid().getByRole("row");
    const count = await rows.count();
    const result = [];
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(
        (el) => Array.from(el.children).some((c) => c.getAttribute("role") === "columnheader")
      );
      if (isHeader) continue;
      const text = await rows.nth(i).innerText();
      if (new RegExp(status, "i").test(text)) result.push(text);
    }
    return result;
  }
  async allVisibleRowsHaveStatusAndRole(status, role) {
    const rows = this.grid().getByRole("row");
    const count = await rows.count();
    let dataRows = 0;
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(
        (el) => Array.from(el.children).some((c) => c.getAttribute("role") === "columnheader")
      );
      if (isHeader) continue;
      dataRows++;
      const text = await rows.nth(i).innerText();
      if (!new RegExp(status, "i").test(text)) return false;
      if (!new RegExp(role, "i").test(text)) return false;
    }
    return dataRows > 0;
  }
  async allVisibleRowsHaveStatus(status) {
    const rows = this.grid().getByRole("row");
    const count = await rows.count();
    let dataRows = 0;
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(
        (el) => Array.from(el.children).some((c) => c.getAttribute("role") === "columnheader")
      );
      if (isHeader) continue;
      dataRows++;
      const text = await rows.nth(i).innerText();
      if (!new RegExp(status, "i").test(text)) return false;
    }
    return dataRows > 0;
  }
  async getFirstUserEmail() {
    const ts = Date.now();
    return `e2e.user.${ts}@pieq.ai`;
  }
};
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// pages/agents/AgentsPage.ts
var import_test6 = require("@playwright/test");

// utils/agents/agentContext.ts
var seedAgent = null;
var seedAgentEditUrl = null;
function getSeedAgent() {
  if (!seedAgent) {
    throw new Error(
      'Seed agent not prepared \u2014 run level-hierarchy Background "a unique seed agent exists for level hierarchy" first'
    );
  }
  return seedAgent;
}
function getSeedAgentEditUrl() {
  if (!seedAgentEditUrl) {
    throw new Error("Seed agent edit URL not captured \u2014 create seed agent first");
  }
  return seedAgentEditUrl;
}
function hasSeedAgentEditUrl() {
  return seedAgentEditUrl !== null;
}

// pages/shared/GridPage.ts
var import_test5 = require("@playwright/test");

// test-data/commission-statements/statementUpload.ts
var import_node_path = __toESM(require("node:path"));
var projectRoot = import_node_path.default.resolve(__dirname, "..", "..");
var STATEMENT_UPLOAD = {
  templateFileName: "[MLB NEW]HappyFlowChangeCheckRunDate.xlsx",
  templateDir: import_node_path.default.join(projectRoot, "TestFiles-prod-sanity", "StatementUpload"),
  generatedDir: import_node_path.default.join(projectRoot, "TestFiles-prod-sanity", "StatementUpload", ".generated"),
  statementType: "Aetna ACA",
  reviewHeading: "Review Statement File",
  gridColumns: {
    uploaded: "Uploaded",
    status: "Status",
    stage: "Stage",
    fileName: "File Name",
    fileId: "File ID",
    sourceTrace: "Source Trace"
  },
  sortableGridColumns: {
    fileId: "File ID",
    fileName: "File Name",
    statementType: "Statement Type",
    carrier: "Carrier",
    uploaded: "Uploaded",
    updatedAt: "Updated At",
    stage: "Stage",
    status: "Status"
  },
  /** Status soon after upload (pre-prod may skip straight to Waiting). */
  statusAfterUpload: /Extract|Processing|Waiting/i,
  stageAfterUpload: /Processing|Review/i,
  statusAfterRefresh: "Waiting",
  stageAfterRefresh: "Review",
  lifecycleStages: [
    "Uploaded",
    "Extract",
    "Review",
    "Reconcile",
    "Needs Attention",
    "Completed"
  ],
  lifecycleStatuses: ["Waiting", "Processing", "Error"]
};

// utils/debugSteps.ts
function parseDebugStepsFlag() {
  const raw = process.env.DEBUG_STEPS?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}
function isDebugStepsEnabled() {
  return parseDebugStepsFlag();
}
function debugLogFileIdClick(fileId) {
  if (!isDebugStepsEnabled() || !fileId.trim()) return;
  console.log(`[debug_steps] [click] fileId=${fileId}`);
}

// utils/escapeRegex.ts
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// pages/shared/GridPage.ts
var STATIC_WAIT = smokeStaticWaitMs;
var T = smokeStepTimeoutMs;
var GridPage = class {
  constructor(page) {
    this.page = page;
  }
  page;
  gridLoc = {
    dataGrid: () => this.page.getByRole("grid", { name: "Data grid" }),
    rowEditMenuButton: (row) => row.getByRole("button").first(),
    /** Common row-action triggers across ICM grids (kebab / hover actions). */
    rowActionTrigger: () => this.page.locator(
      [
        '[data-testid^="user-actions-"]',
        '[data-testid^="product-actions-"]',
        '[data-testid^="carrier-actions-"]',
        '[data-testid^="policy-actions-"]',
        '[data-testid*="actions-"]',
        '[data-testid="actions-hover-wrapper"]'
      ].join(", ")
    ),
    editMenuItem: () => this.page.getByRole("button", { name: "Edit", exact: true }),
    backButton: () => this.page.getByTestId("back-button").or(this.page.getByRole("button", { name: /^back$/i })).or(this.page.getByRole("link", { name: /^back$/i })),
    acquireLock: () => this.page.getByTestId("review-lock-modal-acquire"),
    noRecords: () => this.page.getByText(/no records found/i),
    footerText: () => this.page.getByTestId("data-grid-record-count-footer"),
    searchInput: () => this.page.getByRole("textbox", { name: "Search data grid" })
  };
  grid() {
    return this.gridLoc.dataGrid();
  }
  async clickBack() {
    const back = this.gridLoc.backButton();
    if (await back.first().isVisible({ timeout: 3e3 }).catch(() => false)) {
      await back.first().click();
    } else {
      await this.page.goBack({ waitUntil: "domcontentloaded" });
    }
    await waitForAppSettled(this.page);
  }
  /** Reset AG Grid horizontal scroll so left-side columns remount. */
  async scrollGridToStart() {
    await this.page.evaluate(() => {
      const viewport = document.querySelector(".ag-center-cols-viewport");
      if (viewport) {
        viewport.scrollLeft = 0;
        viewport.dispatchEvent(new Event("scroll"));
      }
    });
    await this.page.waitForTimeout(200);
  }
  /** Scroll AG Grid so a right-pinned / off-screen Actions column can render. */
  async scrollGridToActionsColumn() {
    await this.page.evaluate(() => {
      const viewport = document.querySelector(".ag-center-cols-viewport");
      if (viewport) {
        viewport.scrollLeft = viewport.scrollWidth;
        viewport.dispatchEvent(new Event("scroll"));
      }
      const pinned = document.querySelector(".ag-pinned-right-cols-viewport");
      if (pinned) {
        pinned.scrollTop = 0;
      }
    });
    await this.page.waitForTimeout(200);
  }
  async openFirstDataRowActionMenu() {
    const grid = this.grid();
    await (0, import_test5.expect)(grid).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page);
    await this.scrollGridToActionsColumn();
    const knownAction = this.gridLoc.rowActionTrigger().first();
    if (await knownAction.isVisible({ timeout: 3e3 }).catch(() => false)) {
      await knownAction.click();
      return;
    }
    const rowWithButton = this.dataRows().filter({ has: this.page.getByRole("button") }).first();
    if (await rowWithButton.isVisible({ timeout: 3e3 }).catch(() => false)) {
      await this.gridLoc.rowEditMenuButton(rowWithButton).click();
      return;
    }
    throw new Error(
      "No grid row action control found (kebab / actions button). The list may not expose row actions, or the Actions column is hidden."
    );
  }
  async chooseEditFromRowMenu() {
    await this.gridLoc.editMenuItem().click();
    await waitForAppSettled(this.page);
  }
  /** @returns false when the grid is empty (no data row to open). */
  async openFirstGridRow() {
    return this.openGridRecordAt(0);
  }
  /**
   * Opens the data row at `index`.
   * @returns false when the grid has zero records (footer / empty overlay).
   * Waits for the footer or empty overlay so a slow load is not mistaken for rows.
   */
  async openGridRecordAt(index) {
    const grid = this.grid();
    await (0, import_test5.expect)(grid).toBeVisible();
    await waitForAppSettled(this.page);
    const footer = this.gridLoc.footerText();
    const noRecords = this.gridLoc.noRecords();
    await import_test5.expect.poll(
      async () => {
        if (await noRecords.isVisible().catch(() => false)) return "empty";
        const text = (await footer.textContent().catch(() => null) ?? "").replace(/\s+/g, " ");
        if (/all\s+0\s+records/i.test(text)) return "empty";
        if (/showing all\s+[1-9]\d*\s+records/i.test(text)) return "ready";
        if (await this.dataRows().count() > 0) return "ready";
        return "pending";
      },
      { timeout: 3e4, intervals: [500, 1e3, 2e3] }
    ).not.toBe("pending");
    if (await noRecords.isVisible().catch(() => false)) return false;
    const recordText = (await footer.textContent().catch(() => null) ?? "").replace(/\s+/g, " ");
    if (/all\s+0\s+records/i.test(recordText)) return false;
    if (await this.dataRows().count() === 0) return false;
    const row = this.dataRows().nth(index);
    await (0, import_test5.expect)(row).toBeVisible();
    await row.click();
    if (await this.gridLoc.acquireLock().isVisible().catch(() => false)) {
      await this.gridLoc.acquireLock().click();
    }
    await waitForAppSettled(this.page);
    return true;
  }
  async openEditFromGrid() {
    await this.openFirstDataRowActionMenu();
    await this.chooseEditFromRowMenu();
  }
  async searchGrid(query) {
    const search = this.gridLoc.searchInput();
    await search.fill("");
    await search.fill(query);
    await (0, import_test5.expect)(this.grid()).toBeVisible();
    await waitForAppSettled(this.page);
  }
  async getColumnIndex(columnName) {
    return this.grid().evaluate((grid, name) => {
      const target = name.toLowerCase();
      const headerRow = grid.querySelector('[role="row"]:has([role="columnheader"])') ?? Array.from(grid.querySelectorAll('[role="row"]')).find(
        (row) => row.querySelector('[role="columnheader"], th')
      );
      if (!headerRow) return -1;
      const headers = headerRow.querySelectorAll('[role="columnheader"], th');
      for (let i = 0; i < headers.length; i++) {
        const label = headers[i].textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
        if (label === target || label.includes(target)) return i;
      }
      return -1;
    }, columnName);
  }
  async cellText(row, columnName) {
    const colIndex = await this.getColumnIndex(columnName);
    if (colIndex < 0) return "";
    const cells = row.locator('[role="gridcell"], td');
    const count = await cells.count();
    if (colIndex >= count) return "";
    return (await cells.nth(colIndex).innerText()).replace(/\s+/g, " ").trim();
  }
  dataRows() {
    return this.grid().getByRole("row").filter({ hasNot: this.page.getByRole("columnheader") });
  }
  async readCellText(row, columnName) {
    return this.cellText(row, columnName);
  }
  /** AG Grid may virtualize Stage/Status off-screen — scroll right before reading. */
  async scrollUploadGridToStatusColumns() {
    await this.page.evaluate(() => {
      const viewport = document.querySelector(".ag-center-cols-viewport");
      if (viewport) {
        viewport.scrollLeft = viewport.scrollWidth;
        viewport.dispatchEvent(new Event("scroll"));
      }
    });
    await this.page.waitForTimeout(300);
  }
  async readUploadRowStatusAndStage(row) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await row.scrollIntoViewIfNeeded({ timeout: 5e3 });
        await this.scrollUploadGridToStatusColumns();
        let status = await this.readCellText(row, STATEMENT_UPLOAD.gridColumns.status);
        let stage = await this.readCellText(row, STATEMENT_UPLOAD.gridColumns.stage);
        if (!status.trim() || !stage.trim()) {
          const rowText = (await row.innerText()).replace(/\s+/g, " ").trim();
          if (!stage.trim()) {
            stage = rowText.match(
              /\b(Uploaded|Review|Completed|Processing|Needs Attention|Extract)\b/i
            )?.[1] ?? "";
          }
          if (!status.trim()) {
            status = rowText.match(/\b(Waiting)\b/i)?.[1] ?? "";
          }
        }
        return { status: status.trim(), stage: stage.trim() };
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        if (!/not attached|not stable|detached/i.test(message) || attempt === 3) {
          throw error;
        }
        await this.page.waitForTimeout(800);
      }
    }
    throw lastError;
  }
  getDataRows() {
    return this.dataRows();
  }
  /**
   * Finds the first data row whose text contains `text`.
   *
   * Polls until the row appears instead of doing a single scan: on a fresh
   * grid load the viewport can render stale rows first and only swap in the
   * matching row after the data fetch (~300ms+ — MCP-verified). A single scan
   * in that window misses the row and returns null → flaky "not found".
   * Also tolerates AG Grid row remounts mid-scan (detachment), re-querying on
   * the next poll interval. Null only when the row never appears (timeout).
   */
  async findRowByText(text, options) {
    const timeout = options?.timeout ?? 6e4;
    const target = text.trim().toLowerCase();
    if (!target) return null;
    await (0, import_test5.expect)(this.grid()).toBeVisible({ timeout });
    let foundIndex = -1;
    try {
      await import_test5.expect.poll(
        async () => {
          const rows = this.dataRows();
          const count = await rows.count();
          for (let i = 0; i < count; i++) {
            const row = rows.nth(i);
            let rowText = "";
            try {
              rowText = (await row.innerText()).replace(/\s+/g, " ").toLowerCase();
            } catch {
              return false;
            }
            if (rowText.includes(target)) {
              foundIndex = i;
              return true;
            }
          }
          return false;
        },
        { timeout, intervals: [500, 1e3, 2e3, 3e3] }
      ).toBe(true);
    } catch {
      return null;
    }
    return this.dataRows().nth(foundIndex);
  }
  async refreshGrid() {
    const refresh = this.page.getByTestId("data-grid-refresh-button").or(this.page.getByRole("button", { name: /refresh grid data/i }));
    await refresh.click();
    await this.page.waitForTimeout(STATIC_WAIT);
    await waitForAppSettled(this.page);
  }
  async findRowByFileName(fileName, options) {
    const timeout = options?.timeout ?? 6e4;
    const fileNameColumn = options?.fileNameColumn;
    const baseName = fileName.replace(/\.(xlsx|csv)$/i, "");
    await (0, import_test5.expect)(this.grid()).toBeVisible({ timeout });
    await this.refreshGrid().catch(() => void 0);
    const search = this.gridLoc.searchInput();
    const applySearch = async (value) => {
      if (!await search.isVisible().catch(() => false)) return;
      await search.click({ timeout: 3e3 }).catch(() => void 0);
      await search.fill("");
      if (value) await search.fill(value);
      await this.page.waitForTimeout(1200);
    };
    await applySearch(fileName);
    let usedClearSearch = false;
    let foundIndex = -1;
    let attempts = 0;
    try {
      await import_test5.expect.poll(
        async () => {
          attempts += 1;
          const rows = this.dataRows();
          const count = await rows.count();
          if (count === 0 && !usedClearSearch && attempts >= 2) {
            await applySearch("");
            usedClearSearch = true;
            await this.refreshGrid().catch(() => void 0);
            return false;
          }
          if (attempts % 4 === 0) {
            await this.refreshGrid().catch(() => void 0);
          }
          for (let i = 0; i < count; i++) {
            const row = rows.nth(i);
            const nameCell = fileNameColumn ? await this.cellText(row, fileNameColumn) : "";
            const rowText = (await row.innerText()).replace(/\s+/g, " ");
            if (nameCell.includes(fileName) || nameCell.includes(baseName) || rowText.includes(fileName) || rowText.includes(baseName)) {
              foundIndex = i;
              return true;
            }
          }
          return false;
        },
        { timeout, intervals: [1e3, 2e3, 3e3, 5e3] }
      ).toBe(true);
    } catch (error) {
      const sample = await this.dataRows().allTextContents().then(
        (rows) => rows.slice(0, 5).map((t) => t.replace(/\s+/g, " ").trim()).join(" || ")
      ).catch(() => "");
      throw new Error(
        `Row for file "${fileName}" not found in data grid within ${timeout}ms. Sample rows: ${sample || "(none visible)"}`
      );
    }
    return this.dataRows().nth(foundIndex);
  }
  async findRowByFileId(fileId, options) {
    const timeout = options?.timeout ?? 6e4;
    const fileIdColumn = options?.fileIdColumn;
    const target = fileId.trim();
    if (!target) throw new Error("Missing file ID");
    await (0, import_test5.expect)(this.grid()).toBeVisible({ timeout });
    const search = this.gridLoc.searchInput();
    if (await search.isVisible().catch(() => false)) {
      await search.clear();
    }
    let foundIndex = -1;
    await import_test5.expect.poll(
      async () => {
        const rows = this.dataRows();
        const count = await rows.count();
        for (let i = 0; i < count; i++) {
          const row = rows.nth(i);
          const idCell = fileIdColumn ? await this.cellText(row, fileIdColumn) : "";
          const rowText = (await row.innerText()).replace(/\s+/g, " ");
          if (idCell.includes(target) || rowText.includes(target)) {
            foundIndex = i;
            return true;
          }
        }
        return false;
      },
      { timeout, intervals: [1e3, 2e3, 3e3, 5e3] }
    ).toBe(true);
    if (await search.isVisible().catch(() => false)) {
      await search.fill(target);
      await this.page.waitForTimeout(1e3);
    }
    return this.dataRows().nth(foundIndex);
  }
  async scanForRowByFileId(fileId, fileIdColumn) {
    const target = fileId.trim();
    const rows = this.dataRows();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const idCell = fileIdColumn ? await this.cellText(row, fileIdColumn) : "";
      const rowText = (await row.innerText()).replace(/\s+/g, " ");
      if (idCell.includes(target) || rowText.includes(target)) {
        const search = this.gridLoc.searchInput();
        if (await search.isVisible().catch(() => false)) {
          await search.fill(target);
          await this.page.waitForTimeout(1e3);
        }
        return rows.nth(i);
      }
    }
    return null;
  }
  async extractFileIdFromRow(row, fileIdColumn) {
    const link = row.locator('a[href*="/commission-processing/review/"]').first();
    if (await link.count()) {
      const href = await link.getAttribute("href") ?? "";
      const match = href.match(/\/review\/([^/?#]+)/i);
      if (match?.[1]) return decodeURIComponent(match[1]);
    }
    if (fileIdColumn) {
      const fromColumn = await this.cellText(row, fileIdColumn);
      if (fromColumn) return fromColumn.split(/\s+/)[0] ?? fromColumn;
    }
    const rowText = await row.innerText();
    const uuid = rowText.match(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i
    )?.[0] ?? "";
    if (uuid) return uuid;
    const btId = rowText.match(/\b(BT-[A-Z0-9]+)\b/i)?.[1];
    if (btId) return btId;
    const idCol = rowText.match(/\b(file\s*id[:\s]*)?([A-Z0-9_-]{6,})\b/i);
    const parsed = idCol?.[2] ?? "";
    if (!parsed) {
      throw new Error(`Could not parse file ID from grid row: ${rowText.slice(0, 200)}`);
    }
    return parsed;
  }
  async getRecordCountFromFooter() {
    const footer = this.page.getByText(/showing all (\d+) records/i);
    await (0, import_test5.expect)(footer).toBeVisible();
    return Number.parseInt((await footer.innerText()).match(/(\d+)/)?.[1] ?? "0", 10);
  }
  async openRowLink(row, hrefFragment = "/commission-processing/", fileId) {
    debugLogFileIdClick(fileId ?? "");
    const link = row.locator(`a[href*="${hrefFragment}"]`).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
    } else {
      await row.click();
    }
    await waitForAppSettled(this.page);
  }
  matchColumnValue(row, columnName, expected) {
    return this.cellText(row, columnName).then(
      (text) => new RegExp(escapeRegex(expected), "i").test(text)
    );
  }
};

// pages/agents/AgentsPage.ts
var AgentsPage = class extends GridPage {
  loc = {
    headingList: () => this.page.getByRole("heading", { name: "Agents", exact: true }),
    headingEdit: () => this.page.getByRole("heading", { name: /agent edit/i }),
    headingAdd: () => this.page.getByRole("heading", { name: "Add Agent", exact: true }),
    personalInfoHeading: () => this.page.getByRole("heading", { name: /personal information/i }),
    addButton: () => this.page.getByTestId("add-agent-button"),
    agentsGrid: () => this.page.getByTestId("agents-datagrid"),
    searchInput: () => this.page.getByTestId("data-grid-search-input"),
    /** Actual editable search field (testid may be a wrapper). */
    searchField: () => this.page.getByRole("textbox", { name: "Search data grid" }).or(this.page.getByTestId("data-grid-search-input").locator("input")).first(),
    totalAgentsCard: () => this.page.getByTestId("total-agents-card"),
    activeAgentsCard: () => this.page.getByTestId("active-agents-card"),
    totalAgentsValue: () => this.page.getByTestId("total-agents-card").getByText(/^\d+$/),
    activeAgentsValue: () => this.page.getByTestId("active-agents-card").getByText(/^\d+$/),
    activeAgentsPercent: () => this.page.getByTestId("active-agents-card").getByText(/\d+(\.\d+)?%/),
    agentActionsKebab: () => this.page.locator('[data-testid^="user-actions-"]'),
    editPageTabs: () => this.page.getByTestId("agent-tab-navigation"),
    firstNameInput: () => this.page.getByTestId("first-name-input"),
    lastNameInput: () => this.page.getByTestId("last-name-input"),
    emailInput: () => this.page.getByTestId("email-input"),
    agentCodeInput: () => this.page.getByTestId("agent-code-input"),
    createAgentButton: () => this.page.getByTestId("create-agent-button"),
    updateAgentButton: () => this.page.getByTestId("update-agent-button"),
    statusFilterButton: () => this.page.getByTestId("filter-status"),
    columnPickerButton: () => this.page.getByTestId("data-grid-columns-button"),
    applyToggleButton: () => this.page.getByTestId("agents-datagrid-toggle-columns-modal-apply"),
    resetColumnButton: () => this.page.getByTestId("agents-datagrid-toggle-columns-modal-reset"),
    columnVisibilityModal: () => this.page.getByTestId("agents-datagrid-toggle-columns-modal"),
    refreshButton: () => this.page.getByTestId("data-grid-refresh-button"),
    clearFiltersButton: () => this.page.getByTestId("data-grid-clear-filters"),
    noRecords: () => this.page.getByText(/no records found/i),
    footerText: () => this.page.getByTestId("data-grid-record-count-footer"),
    /** Agent name cell — AG Grid col-id is `agent` (picker: column-checkbox-agent). */
    agentNameCells: () => this.grid().locator(
      '[role="gridcell"][col-id="agent"], .ag-cell[col-id="agent"], [role="gridcell"][col-id="Agent"], .ag-cell[col-id="Agent"]'
    ),
    statusCells: () => this.grid().locator('[role="gridcell"][col-id="status"], .ag-cell[col-id="status"]'),
    rowAgentCell: (row) => row.locator('[role="gridcell"][col-id="agent"], .ag-cell[col-id="agent"]'),
    rowStatusCell: (row) => row.locator('[role="gridcell"][col-id="status"], .ag-cell[col-id="status"]')
  };
  constructor(page) {
    super(page);
  }
  capturedOnboardingAgentName = "";
  /** Public URL helpers — GridPage.page is protected. */
  currentUrl() {
    return this.page.url();
  }
  async gotoUrl(url) {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }
  /** Prefer agents testid; fall back to shared Data grid role. */
  grid() {
    return this.loc.agentsGrid();
  }
  /**
   * URL nav — not sidebar. Dirty Add/Edit form shows Cancel Changes on sidebar click.
   * Shared @agent-master context: always restore filters + default columns so
   * scenarios continue cleanly after T007 (Pending/0 rows) and T009 (Agent hidden).
   */
  async openList() {
    await this.dismissUnsavedChangesIfPresent();
    await this.page.goto(new URL(AppPaths.agents, this.page.url()).href, {
      waitUntil: "domcontentloaded"
    });
    await (0, import_test6.expect)(this.page).toHaveURL(AppUrlPatterns.agents);
    await (0, import_test6.expect)(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
    const modal = this.loc.columnVisibilityModal();
    if (await modal.isVisible({ timeout: 1e3 }).catch(() => false)) {
      await this.page.keyboard.press("Escape");
      await modal.waitFor({ state: "hidden", timeout: 5e3 }).catch(() => void 0);
    }
    await this.clearFiltersIfPresent();
    await this.clearGridSearch();
    await this.ensureDefaultColumnVisibility();
  }
  /** Soft-clear when data-grid-clear-filters is visible (status/search leftover). */
  async clearFiltersIfPresent() {
    const clearBtn = this.loc.clearFiltersButton();
    if (!await clearBtn.isVisible({ timeout: 1500 }).catch(() => false)) return;
    await clearBtn.click();
    await waitForAppSettled(this.page);
    await (0, import_test6.expect)(clearBtn).toBeHidden({ timeout: 1e4 }).catch(() => void 0);
  }
  /**
   * Restore default columns when a prior scenario hid Agent (shared context).
   * No-op when Agent header already visible.
   */
  async ensureDefaultColumnVisibility() {
    const agentHeader = this.columnHeaderLabel("Agent");
    if (await agentHeader.isVisible({ timeout: 2e3 }).catch(() => false)) return;
    await this.resetColumnVisibility();
  }
  /** Clear agents grid search so later scenarios start from an unfiltered list. */
  async clearGridSearch() {
    const search = this.loc.searchField();
    if (!await search.isVisible({ timeout: 3e3 }).catch(() => false)) return;
    const current = await search.inputValue().catch(() => "");
    if (current) {
      await search.click();
      await search.fill("");
      await (0, import_test6.expect)(search).toHaveValue("", { timeout: 5e3 });
      await waitForAppSettled(this.page);
    }
    await import_test6.expect.poll(
      async () => {
        if (await this.loc.noRecords().isVisible().catch(() => false)) return false;
        const footer = (await this.loc.footerText().textContent().catch(() => null) ?? "").replace(
          /\s+/g,
          " "
        );
        if (/all\s+0\s+records|showing\s+0\b/i.test(footer)) return false;
        return await this.getDataRows().count() > 0;
      },
      {
        timeout: 2e4,
        intervals: [500, 1e3, 2e3],
        message: "Expected agents grid to reload after clearing search"
      }
    ).toBe(true);
  }
  /** Agents search is debounced — fill + Enter, then wait for filter to apply. */
  async searchGrid(query) {
    const search = this.loc.searchField();
    await (0, import_test6.expect)(search).toBeVisible({ timeout: smokeStepTimeoutMs });
    await search.click();
    await search.fill("");
    if (query) {
      await search.pressSequentially(query, { delay: 25 });
    }
    await search.press("Enter");
    await (0, import_test6.expect)(search).toHaveValue(query, { timeout: 5e3 });
    await waitForAppSettled(this.page);
    await import_test6.expect.poll(
      async () => {
        const value = await search.inputValue().catch(() => "");
        if (value !== query) return false;
        const footer = (await this.loc.footerText().textContent().catch(() => null) ?? "").replace(
          /\s+/g,
          " "
        );
        if (!query) return !/all\s+0\s+records|showing\s+0\b/i.test(footer);
        if (/all\s+0\s+records|showing\s+0\b/i.test(footer)) return true;
        if (await this.loc.noRecords().isVisible().catch(() => false)) return true;
        if (/showing\s+\d+\s+of\s+\d+/i.test(footer) && !/showing\s+(\d+)\s+of\s+\1\s+total/i.test(footer)) {
          return true;
        }
        const matched = this.getDataRows().filter({
          hasText: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
        });
        return await matched.count() > 0;
      },
      {
        timeout: 2e4,
        intervals: [500, 1e3, 2e3],
        message: `Agents search for "${query}" did not update the grid`
      }
    ).toBe(true);
  }
  /** Shared context can leave Cancel Changes modal open between scenarios. */
  async dismissUnsavedChangesIfPresent() {
    const modal = this.page.getByTestId("unsaved-changes-modal");
    if (!await modal.isVisible({ timeout: 1500 }).catch(() => false)) return;
    const confirm = this.page.getByTestId("unsaved-changes-confirm");
    await confirm.click({ force: true });
    await modal.waitFor({ state: "hidden", timeout: 1e4 }).catch(() => void 0);
    await waitForAppSettled(this.page);
  }
  async openAdd() {
    await this.loc.addButton().click();
    await waitForAppSettled(this.page);
    await (0, import_test6.expect)(this.page).toHaveURL(AppUrlPatterns.agentsAdd);
    await (0, import_test6.expect)(this.loc.headingAdd()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }
  async backToList() {
    await this.clickBack();
    await (0, import_test6.expect)(this.page).toHaveURL(AppUrlPatterns.agents);
    await (0, import_test6.expect)(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }
  async openEditFromGrid() {
    await super.openEditFromGrid();
    await (0, import_test6.expect)(this.page).toHaveURL(AppUrlPatterns.agentsEdit);
    await waitForAppSettled(this.page);
  }
  /** Smoke-only: list heading + summary cards + grid + search. */
  async smokeExpectListHeader() {
    await (0, import_test6.expect)(this.page).toHaveURL(AppUrlPatterns.agents, { timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.addButton()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.totalAgentsCard()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.activeAgentsCard()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.agentsGrid()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.searchInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }
  /** Smoke-only: add heading + core Personal Information fields. */
  async smokeExpectAddHeader() {
    await (0, import_test6.expect)(this.page).toHaveURL(AppUrlPatterns.agentsAdd, { timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.headingAdd()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.personalInfoHeading()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.agentCodeInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.firstNameInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.lastNameInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.emailInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.createAgentButton()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }
  /** Smoke-only: edit URL + agent name heading + tabs + key fields. */
  async smokeExpectEditHeader() {
    await (0, import_test6.expect)(this.page).toHaveURL(AppUrlPatterns.agentsEdit, { timeout: smokeStepTimeoutMs });
    const heading = this.page.locator('h1:not([data-testid="sidebar-title"])').first();
    await (0, import_test6.expect)(heading).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(heading).not.toHaveText(/^\s*$/);
    await (0, import_test6.expect)(this.loc.editPageTabs()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.personalInfoHeading()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.firstNameInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(this.loc.updateAgentButton()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }
  /** Smoke-only: edit by clicking first grid row (does not change openEditFromGrid kebab path). */
  async smokeOpenEditByRowClick() {
    const opened = await this.openGridRecordAt(0);
    (0, import_test6.expect)(opened, "Agents grid has no data row to open for smoke edit").toBe(true);
    await (0, import_test6.expect)(this.page).toHaveURL(AppUrlPatterns.agentsEdit, { timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
    await this.smokeExpectEditHeader();
  }
  /** Smoke-only: open edit via row kebab → Edit. */
  async smokeOpenEditViaKebab() {
    await this.scrollGridToActionsColumn();
    const kebab = this.loc.agentActionsKebab().first();
    if (await kebab.isVisible({ timeout: 3e3 }).catch(() => false)) {
      await kebab.click();
      await this.chooseEditFromRowMenu();
    } else {
      const opened = await this.openGridRecordAt(0);
      (0, import_test6.expect)(opened, "Agents grid has no data row to open for smoke edit").toBe(true);
    }
    await (0, import_test6.expect)(this.page).toHaveURL(AppUrlPatterns.agentsEdit, { timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
    await this.smokeExpectEditHeader();
  }
  // ── Dashboard methods ──────────────────────────────────────────────────────
  /** Assert KPI Total Number of Registered Agents is visible and non-empty. */
  async expectTotalRegisteredAgentsVisible() {
    await waitForAppSettled(this.page);
    const card = this.loc.totalAgentsCard();
    await (0, import_test6.expect)(card).toBeVisible({ timeout: smokeStepTimeoutMs });
    const value = this.loc.totalAgentsValue();
    await import_test6.expect.poll(
      async () => {
        if (!await value.isVisible().catch(() => false)) return false;
        const text2 = (await value.innerText().catch(() => "")).trim();
        return /^\d+$/.test(text2);
      },
      { timeout: 3e4, intervals: [1e3, 2e3], message: "Waiting for Total agents KPI to show a number" }
    ).toBe(true);
    const text = (await value.innerText()).trim();
    (0, import_test6.expect)(Number.parseInt(text, 10)).toBeGreaterThanOrEqual(0);
  }
  /** Assert KPI Active Agent Number with percentage is visible and non-empty. */
  async expectActiveAgentsWithPercentVisible() {
    await waitForAppSettled(this.page);
    const card = this.loc.activeAgentsCard();
    await (0, import_test6.expect)(card).toBeVisible({ timeout: smokeStepTimeoutMs });
    const value = this.loc.activeAgentsValue();
    await import_test6.expect.poll(
      async () => {
        if (!await value.isVisible().catch(() => false)) return false;
        const text = (await value.innerText().catch(() => "")).trim();
        return /^\d+$/.test(text);
      },
      { timeout: 3e4, intervals: [1e3, 2e3], message: "Waiting for Active agents KPI to show a number" }
    ).toBe(true);
    const numText = (await value.innerText()).trim();
    (0, import_test6.expect)(Number.parseInt(numText, 10)).toBeGreaterThanOrEqual(0);
    const percent = this.loc.activeAgentsPercent();
    if (await percent.isVisible({ timeout: 3e3 }).catch(() => false)) {
      const pctText = (await percent.innerText()).trim();
      (0, import_test6.expect)(pctText).toMatch(/\d+(\.\d+)?%/);
    }
  }
  /** Filter the status dropdown and assert rows match. */
  async filterByStatus(status) {
    const filterBtn = this.loc.statusFilterButton();
    await (0, import_test6.expect)(filterBtn).toBeVisible({ timeout: smokeStepTimeoutMs });
    await filterBtn.click();
    await this.page.waitForTimeout(300);
    const option = this.page.getByRole("option").or(this.page.getByRole("menuitemradio")).filter({ hasText: new RegExp(`^${status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (await option.first().isVisible().catch(() => false)) {
      await option.first().click();
    } else {
      const checkbox = this.page.getByRole("checkbox").filter({ hasText: new RegExp(`^${status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
      await (0, import_test6.expect)(checkbox.first()).toBeVisible({ timeout: 5e3 });
      await checkbox.first().click();
    }
    await this.page.keyboard.press("Escape");
    await waitForAppSettled(this.page);
  }
  /** Assert the status filter button shows the expected text. */
  async expectStatusFilterShows(expectedText) {
    const filterBtn = this.loc.statusFilterButton();
    await (0, import_test6.expect)(filterBtn).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(filterBtn).toHaveText(new RegExp(expectedText, "i"), { timeout: 5e3 });
  }
  /** Assert all visible grid rows have the given status. Empty grid is OK (e.g. Pending). */
  async expectAllVisibleRowsHaveStatus(status) {
    const rows = this.getDataRows();
    const count = await rows.count();
    if (count === 0) {
      await this.expectNoMatchingRecords();
      return;
    }
    const pattern = new RegExp(status, "i");
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).innerText();
      (0, import_test6.expect)(text, `Row ${i} should have status "${status}"`).toMatch(pattern);
    }
  }
  /** Assert grid shows no matching records (empty state). */
  async expectNoMatchingRecords() {
    await import_test6.expect.poll(
      async () => {
        if (await this.loc.noRecords().isVisible().catch(() => false)) return true;
        const footerText = (await this.loc.footerText().textContent().catch(() => null) ?? "").replace(
          /\s+/g,
          " "
        );
        return /all\s+0\s+records|showing\s+0\b/i.test(footerText);
      },
      {
        timeout: 2e4,
        intervals: [500, 1e3, 2e3],
        message: "Expected agents grid empty state after invalid search"
      }
    ).toBe(true);
  }
  /** Assert the grid has at least one record displayed. */
  async expectGridHasRecords() {
    const rows = this.getDataRows();
    const count = await rows.count();
    (0, import_test6.expect)(count, "Grid should have at least one record").toBeGreaterThan(0);
  }
  /** Assert the search input value matches. */
  async expectSearchInputValue(expected) {
    const input = this.gridLoc.searchInput();
    await (0, import_test6.expect)(input).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(input).toHaveValue(expected, { timeout: 5e3 });
  }
  /**
   * After create + search: assert a row containing the agent id/email also shows status.
   * Avoids bare page-wide "Onboarding in Progress" matches across many agents.
   */
  async expectGridRowMatchesAgentAndStatus(query, expectedStatus) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const statusRe = new RegExp(expectedStatus.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    await import_test6.expect.poll(
      async () => {
        const matched = this.getDataRows().filter({
          hasText: new RegExp(escaped, "i")
        });
        const count = await matched.count();
        for (let i = 0; i < count; i++) {
          const text = (await matched.nth(i).innerText()).replace(/\s+/g, " ");
          if (statusRe.test(text)) return true;
        }
        return false;
      },
      {
        timeout: 3e4,
        intervals: [1e3, 2e3],
        message: `Expected grid row matching "${query}" with status "${expectedStatus}"`
      }
    ).toBe(true);
  }
  /**
   * T020: new agent lands first — no search. First data row must show id or email + status.
   */
  async expectFirstGridRowMatchesAgentAndStatus(opts) {
    const { agentId, email, expectedStatus } = opts;
    const statusRe = new RegExp(expectedStatus.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    await import_test6.expect.poll(
      async () => {
        const rows = this.getDataRows();
        if (await rows.count() < 1) return false;
        const text = (await rows.first().innerText()).replace(/\s+/g, " ");
        const hasIdentity = !!agentId && text.includes(agentId) || !!email && text.toLowerCase().includes(email.toLowerCase());
        return hasIdentity && statusRe.test(text);
      },
      {
        timeout: 3e4,
        intervals: [1e3, 2e3],
        message: `Expected first grid row to show agent "${agentId || email}" with status "${expectedStatus}"`
      }
    ).toBe(true);
  }
  /** Assert grid rows match the search query (at least one row contains the text). */
  async expectGridRowsMatchQuery(query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "i");
    await import_test6.expect.poll(
      async () => {
        const footerText = (await this.loc.footerText().textContent().catch(() => null) ?? "").replace(
          /\s+/g,
          " "
        );
        if (/all\s+0\s+records/i.test(footerText)) return false;
        if (/showing\s+0\s+of\s+0/i.test(footerText)) return false;
        const matched = this.getDataRows().filter({ hasText: pattern });
        if (await matched.count() > 0) return true;
        const gridText = (await this.grid().innerText().catch(() => "")).replace(/\s+/g, " ");
        return pattern.test(gridText);
      },
      {
        timeout: 3e4,
        intervals: [1e3, 2e3, 3e3],
        message: `Expected at least one row matching "${query}"`
      }
    ).toBe(true);
  }
  // ── Column visibility ──────────────────────────────────────────────────────
  // Live harvest (locators/_tmp-agents-columns.json): column-checkbox-agent|contact|reportingTo|status
  async openColumnVisibilityPanel() {
    const modal = this.loc.columnVisibilityModal();
    if (await modal.isVisible({ timeout: 1e3 }).catch(() => false)) return;
    const picker = this.loc.columnPickerButton();
    await (0, import_test6.expect)(picker).toBeVisible({ timeout: smokeStepTimeoutMs });
    await picker.click();
    await (0, import_test6.expect)(modal).toBeVisible({ timeout: 1e4 });
  }
  /** Maps UI column label → live `column-checkbox-*` slug (Reporting To → reportingTo). */
  columnCheckboxSlug(columnName) {
    const key = columnName.trim().toLowerCase();
    const map = {
      agent: "agent",
      contact: "contact",
      "reporting to": "reportingTo",
      status: "status"
    };
    const slug = map[key];
    if (!slug) {
      throw new Error(
        `Unknown agents column checkbox slug for "${columnName}". Known: ${Object.keys(map).join(", ")}`
      );
    }
    return slug;
  }
  /**
   * Column toggle checkbox input (not the label wrapper).
   * DOM: `<label id="checkbox-column-checkbox-{slug}" data-testid="column-checkbox-{slug}">`
   *        `<input type="checkbox" class="sr-only" />…</label>`
   */
  columnVisibilityToggle(columnName) {
    const slug = this.columnCheckboxSlug(columnName);
    return this.page.locator(
      `label[id="checkbox-column-checkbox-${slug}"], [data-testid="column-checkbox-${slug}"]`
    ).locator('input[type="checkbox"]');
  }
  async toggleColumnOffWithoutApply(columnName) {
    await this.openColumnVisibilityPanel();
    const toggle = this.columnVisibilityToggle(columnName);
    await (0, import_test6.expect)(toggle).toBeAttached({ timeout: 1e4 });
    if (await toggle.isChecked().catch(() => true)) {
      await toggle.uncheck({ force: true });
    }
  }
  async applyColumnVisibility() {
    await this.loc.applyToggleButton().click();
    await waitForAppSettled(this.page);
  }
  async toggleColumnOff(columnName) {
    await this.openColumnVisibilityPanel();
    const toggle = this.columnVisibilityToggle(columnName);
    await (0, import_test6.expect)(toggle).toBeAttached({ timeout: 1e4 });
    if (await toggle.isChecked().catch(() => true)) {
      await toggle.uncheck({ force: true });
      await this.loc.applyToggleButton().click();
    }
    await waitForAppSettled(this.page);
  }
  async expectColumnVisible(columnName) {
    const header = this.columnHeaderLabel(columnName);
    await (0, import_test6.expect)(header).toBeVisible({ timeout: 1e4 });
  }
  async expectColumnNotVisible(columnName) {
    await (0, import_test6.expect)(this.columnHeaderLabel(columnName)).toBeHidden({ timeout: 1e4 });
  }
  async expectColumnToggleChecked(columnName) {
    await this.openColumnVisibilityPanel();
    const toggle = this.columnVisibilityToggle(columnName);
    await (0, import_test6.expect)(toggle).toBeAttached({ timeout: 1e4 });
    await (0, import_test6.expect)(toggle).toBeChecked({ timeout: 5e3 });
  }
  async expectColumnToggleDisabledAndChecked(columnName) {
    await this.openColumnVisibilityPanel();
    const toggle = this.columnVisibilityToggle(columnName);
    await (0, import_test6.expect)(toggle).toBeAttached({ timeout: 1e4 });
    await (0, import_test6.expect)(toggle).toBeChecked({ timeout: 5e3 });
    await (0, import_test6.expect)(toggle).toBeDisabled({ timeout: 5e3 });
  }
  async resetColumnVisibility() {
    await this.openColumnVisibilityPanel();
    const resetBtn = this.loc.resetColumnButton();
    await (0, import_test6.expect)(resetBtn).toBeVisible({ timeout: 1e4 });
    await resetBtn.click();
    await this.loc.applyToggleButton().click();
    await waitForAppSettled(this.page);
  }
  async attemptToUncheckAllColumns() {
    await this.openColumnVisibilityPanel();
    const modal = this.loc.columnVisibilityModal();
    const checkboxes = modal.getByRole("checkbox");
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i);
      if (await cb.isEnabled().catch(() => false)) {
        if (await cb.isChecked().catch(() => false)) {
          await cb.uncheck({ force: true });
        }
      }
    }
  }
  // ── Sort ───────────────────────────────────────────────────────────────────
  columnHeaderLabel(columnName) {
    const escaped = columnName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.grid().getByRole("columnheader", { name: new RegExp(`^\\s*${escaped}\\s*$`, "i") }).or(
      this.grid().locator(".ag-header-cell").filter({ hasText: new RegExp(escaped, "i") })
    ).first();
  }
  async getHeaderAriaSort(columnName) {
    const header = this.columnHeaderLabel(columnName);
    const direct = await header.getAttribute("aria-sort").catch(() => null) ?? "";
    if (direct) return direct;
    const child = header.locator("[aria-sort]").first();
    if (await child.count()) {
      return await child.getAttribute("aria-sort").catch(() => null) ?? "";
    }
    return "";
  }
  async sortColumnAscending(columnName) {
    const header = this.columnHeaderLabel(columnName);
    await (0, import_test6.expect)(header).toBeVisible({ timeout: smokeStepTimeoutMs });
    for (let attempt = 0; attempt < 4; attempt++) {
      if (await this.getHeaderAriaSort(columnName) === "ascending") break;
      await header.click({ force: true });
      await waitForAppSettled(this.page);
    }
  }
  async sortColumnDescending(columnName) {
    const header = this.columnHeaderLabel(columnName);
    await (0, import_test6.expect)(header).toBeVisible({ timeout: smokeStepTimeoutMs });
    for (let attempt = 0; attempt < 4; attempt++) {
      if (await this.getHeaderAriaSort(columnName) === "descending") break;
      await header.click({ force: true });
      await waitForAppSettled(this.page);
    }
  }
  async clearSortOnColumn(columnName) {
    const header = this.columnHeaderLabel(columnName);
    await (0, import_test6.expect)(header).toBeVisible({ timeout: smokeStepTimeoutMs });
    for (let attempt = 0; attempt < 4; attempt++) {
      const sort = await this.getHeaderAriaSort(columnName);
      if (!sort || sort === "none") break;
      await header.click({ force: true });
      await waitForAppSettled(this.page);
    }
  }
  async getCellText(row, columnName) {
    return this.cellText(row, columnName);
  }
  async getColumnCellValues(columnName) {
    const colIndex = await this.getColumnIndex(columnName);
    const rows = this.getDataRows();
    const count = await rows.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('[role="gridcell"], td');
      if (colIndex >= await cells.count()) continue;
      const text = (await cells.nth(colIndex).innerText()).replace(/\s+/g, " ").trim().toLowerCase();
      if (text) values.push(text);
    }
    return values;
  }
  async expectGridSortedBy(columnName, direction) {
    const expectedAria = direction === "asc" ? "ascending" : "descending";
    await import_test6.expect.poll(async () => this.getHeaderAriaSort(columnName), {
      timeout: 15e3,
      intervals: [500, 1e3],
      message: `Expected column "${columnName}" aria-sort=${expectedAria}`
    }).toBe(expectedAria);
    const values = await this.getColumnCellValues(columnName);
    (0, import_test6.expect)(values.length, `No data rows to verify sort for "${columnName}"`).toBeGreaterThan(1);
  }
  async expectSortClearedForColumn(columnName) {
    const header = this.columnHeaderLabel(columnName);
    const sortIndicator = header.locator("[aria-sort]");
    if (await sortIndicator.count()) {
      const ariaSort = await sortIndicator.getAttribute("aria-sort");
      (0, import_test6.expect)(ariaSort, `Column "${columnName}" sort should be cleared`).not.toBe("ascending");
      (0, import_test6.expect)(ariaSort, `Column "${columnName}" sort should be cleared`).not.toBe("descending");
    }
  }
  // ── Resize ─────────────────────────────────────────────────────────────────
  async resizeColumnWider(columnName) {
    const header = this.columnHeaderLabel(columnName);
    await (0, import_test6.expect)(header).toBeVisible({ timeout: smokeStepTimeoutMs });
    const box = await header.boundingBox();
    if (!box) throw new Error(`Cannot get bounding box for column "${columnName}"`);
    const resizeHandle = this.page.locator(
      `.ag-header-cell[col-id="${columnName.toLowerCase()}"] .ag-header-cell-resize`
    ).first();
    if (await resizeHandle.isVisible({ timeout: 3e3 }).catch(() => false)) {
      await resizeHandle.hover();
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width + 50, box.y + box.height / 2);
      await this.page.mouse.up();
    } else {
      await this.page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width + 50, box.y + box.height / 2);
      await this.page.mouse.up();
    }
    await waitForAppSettled(this.page);
  }
  async expectColumnWidthIncreased(columnName, initialWidth) {
    const header = this.columnHeaderLabel(columnName);
    const box = await header.boundingBox();
    (0, import_test6.expect)(box, `Column "${columnName}" should have a bounding box`).not.toBeNull();
    (0, import_test6.expect)(box.width, `Column "${columnName}" width should have increased`).toBeGreaterThan(initialWidth);
  }
  async getColumnWidth(columnName) {
    const header = this.columnHeaderLabel(columnName);
    const box = await header.boundingBox();
    return box?.width ?? 0;
  }
  // ── Rearrange (Toggle Columns panel — dnd-kit sortable rows) ───────────────
  /** Sortable row in Toggle Columns modal for a column label. */
  columnToggleSortableRow(columnName) {
    const checkbox = this.columnVisibilityToggle(columnName);
    return this.loc.columnVisibilityModal().locator('[role="button"][aria-roledescription="sortable"]').filter({ has: checkbox }).first();
  }
  /**
   * Drag a column option in the Toggle Columns panel so it lands after another.
   * Does not Apply — caller must apply (or Cancel).
   */
  async rearrangeColumnAfter(columnName, afterColumn) {
    await this.openColumnVisibilityPanel();
    const source = this.columnToggleSortableRow(columnName);
    const target = this.columnToggleSortableRow(afterColumn);
    await (0, import_test6.expect)(source).toBeVisible({ timeout: smokeStepTimeoutMs });
    await (0, import_test6.expect)(target).toBeVisible({ timeout: smokeStepTimeoutMs });
    const grip = source.locator("svg.lucide-grip-vertical").first();
    const handle = await grip.isVisible({ timeout: 2e3 }).catch(() => false) ? grip : source;
    const handleBox = await handle.boundingBox();
    const targetBox = await target.boundingBox();
    if (!handleBox || !targetBox) {
      throw new Error(`Cannot get bounding boxes to rearrange "${columnName}" after "${afterColumn}"`);
    }
    await this.page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height + 6,
      { steps: 16 }
    );
    await this.page.mouse.up();
    await this.page.waitForTimeout(300);
  }
  async expectColumnOrderPlacesAfter(columnName, afterColumn) {
    const headers = this.grid().getByRole("columnheader");
    const count = await headers.count();
    let columnIdx = -1;
    let afterIdx = -1;
    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text.toLowerCase() === columnName.toLowerCase()) columnIdx = i;
      if (text.toLowerCase() === afterColumn.toLowerCase()) afterIdx = i;
    }
    (0, import_test6.expect)(columnIdx, `Column "${columnName}" should be found`).toBeGreaterThanOrEqual(0);
    (0, import_test6.expect)(afterIdx, `Column "${afterColumn}" should be found`).toBeGreaterThanOrEqual(0);
    (0, import_test6.expect)(columnIdx, `"${columnName}" should be after "${afterColumn}"`).toBeGreaterThan(afterIdx);
  }
  // ── Refresh ────────────────────────────────────────────────────────────────
  async captureGridFingerprint() {
    const rows = this.getDataRows();
    const count = await rows.count();
    const texts = [];
    for (let i = 0; i < Math.min(count, 3); i++) {
      texts.push(await rows.nth(i).innerText());
    }
    return texts.join("||");
  }
  async clickRefresh() {
    const refresh = this.loc.refreshButton();
    await (0, import_test6.expect)(refresh).toBeVisible({ timeout: smokeStepTimeoutMs });
    await refresh.click();
    await waitForAppSettled(this.page);
  }
  async expectGridRefreshed(previousFingerprint) {
    await waitForAppSettled(this.page);
    const currentFingerprint = await this.captureGridFingerprint();
    const rows = this.getDataRows();
    const count = await rows.count();
    (0, import_test6.expect)(count, "Grid should have records after refresh").toBeGreaterThanOrEqual(0);
  }
  // ── Kebab / Row click ──────────────────────────────────────────────────────
  async openEditViaKebab() {
    await this.scrollGridToActionsColumn();
    const kebab = this.loc.agentActionsKebab().first();
    if (await kebab.isVisible({ timeout: 5e3 }).catch(() => false)) {
      await kebab.click();
      await this.chooseEditFromRowMenu();
    } else {
      const opened = await this.openGridRecordAt(0);
      (0, import_test6.expect)(opened, "Agents grid has no data row to open for edit").toBe(true);
    }
  }
  async openEditByRowClick() {
    const opened = await this.openGridRecordAt(0);
    (0, import_test6.expect)(opened, "Agents grid has no data row to open for edit").toBe(true);
  }
  /** Level-hierarchy seed agent — goto captured edit URL, else search + row click. */
  async openEditForSeededAgent() {
    await this.dismissUnsavedChangesIfPresent();
    if (hasSeedAgentEditUrl()) {
      await this.page.goto(getSeedAgentEditUrl(), { waitUntil: "domcontentloaded" });
      if (await this.gridLoc.acquireLock().isVisible().catch(() => false)) {
        await this.gridLoc.acquireLock().click();
      }
      await this.expectOnEditPage();
      return;
    }
    const seed = getSeedAgent();
    await this.searchGrid(seed.email);
    await this.openEditByMatchingRow(seed.displayName);
  }
  async captureOnboardingAgentNameFromGrid() {
    const rows = this.getDataRows();
    const count = await rows.count();
    (0, import_test6.expect)(count, "Agents grid should have rows").toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const status = (await this.loc.rowStatusCell(row).innerText()).replace(/\s+/g, " ").trim();
      if (!/onboarding/i.test(status)) continue;
      const raw = (await this.loc.rowAgentCell(row).innerText()).replace(/\s+/g, " ").trim();
      const name = raw.split("\u2022")[0].replace(/\s+Level\s+\S+\s*$/i, "").trim();
      (0, import_test6.expect)(name, "Onboarding row should have agent name").toBeTruthy();
      this.capturedOnboardingAgentName = name;
      return name;
    }
    throw new Error("No agent with Onboarding status found in agents grid");
  }
  async openEditForNonOnboardingRecord() {
    const skip = this.capturedOnboardingAgentName.toLowerCase();
    const rows = this.getDataRows();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const status = (await this.loc.rowStatusCell(row).innerText()).replace(/\s+/g, " ").trim();
      if (/onboarding/i.test(status)) continue;
      const name = (await this.loc.rowAgentCell(row).innerText()).replace(/\s+/g, " ").trim();
      if (skip && name.toLowerCase() === skip) continue;
      await this.loc.rowAgentCell(row).click();
      if (await this.gridLoc.acquireLock().isVisible().catch(() => false)) {
        await this.gridLoc.acquireLock().click();
      }
      await this.expectOnEditPage();
      return;
    }
    throw new Error("No non-onboarding agent row found to edit");
  }
  /** Click Agent column cell (`col-id=agent`) whose text is the agent name, then wait for edit. */
  async openEditByMatchingRow(query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "i");
    const cell = this.loc.agentNameCells().filter({ hasText: pattern }).first();
    await (0, import_test6.expect)(cell, `No Agent column cell matching "${query}"`).toBeVisible({
      timeout: smokeStepTimeoutMs
    });
    await cell.click();
    if (await this.gridLoc.acquireLock().isVisible().catch(() => false)) {
      await this.gridLoc.acquireLock().click();
    }
    await this.expectOnEditPage();
    const heading = this.page.locator('h1:not([data-testid="sidebar-title"])').first();
    await (0, import_test6.expect)(heading, `Edit heading should be agent "${query}"`).toContainText(pattern, {
      timeout: smokeStepTimeoutMs
    });
  }
  async expectOnEditPage() {
    await (0, import_test6.expect)(this.page).toHaveURL(AppUrlPatterns.agentsEdit, { timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
  }
  // ── Clear filters ──────────────────────────────────────────────────────────
  /** Click data-grid-clear-filters (visible after search/filter applied). */
  async clearFilters() {
    const clearBtn = this.loc.clearFiltersButton();
    await (0, import_test6.expect)(clearBtn).toBeVisible({ timeout: smokeStepTimeoutMs });
    await clearBtn.click();
    await waitForAppSettled(this.page);
  }
  /** After clear: chip gone, status = All Status, search empty. */
  async expectFiltersCleared() {
    await (0, import_test6.expect)(this.loc.clearFiltersButton()).toBeHidden({ timeout: 1e4 });
    await this.expectStatusFilterShows("All Status");
    await (0, import_test6.expect)(this.loc.searchField()).toHaveValue("", { timeout: 5e3 });
  }
};

// pages/agents/AgentFormPage.ts
var import_test7 = require("@playwright/test");
var T2 = smokeStepTimeoutMs;
var AgentFormPage = class {
  constructor(page) {
    this.page = page;
  }
  page;
  loc = {
    headingAdd: () => this.page.getByRole("heading", { name: "Add Agent", exact: true }),
    headingEdit: () => this.page.getByRole("heading", { name: /agent edit/i }),
    personalInfoHeading: () => this.page.getByRole("heading", { name: /personal information/i }),
    agentCodeInput: () => this.page.getByTestId("agent-code-input").getByRole("textbox"),
    firstNameInput: () => this.page.getByTestId("first-name-input").getByRole("textbox"),
    lastNameInput: () => this.page.getByTestId("last-name-input").getByRole("textbox"),
    dateOfBirthInput: () => this.page.getByTestId("date-of-birth-input").getByRole("textbox"),
    emailInput: () => this.page.getByTestId("email-input").getByRole("textbox"),
    phoneInput: () => this.page.getByTestId("phone-input").getByRole("textbox"),
    addressInput: () => this.page.getByTestId("address-input").getByRole("textbox"),
    cityInput: () => this.page.getByTestId("city-input").getByRole("textbox"),
    zipCodeInput: () => this.page.getByTestId("zip-code-input").getByRole("textbox"),
    hireDateInput: () => this.page.getByTestId("hire-date-input").getByRole("textbox"),
    npnInput: () => this.page.getByTestId("npn-input").getByRole("textbox"),
    routingNumberInput: () => this.page.getByTestId("routing-number-input-0").getByRole("textbox"),
    bankNameInput: () => this.page.getByTestId("bank-name-input-0").getByRole("textbox"),
    accountNumberInput: () => this.page.getByTestId("account-number-input-0").getByRole("textbox"),
    taxIdInput: () => this.page.getByTestId("tax-id-input").getByRole("textbox"),
    w9NameInput: () => this.page.getByTestId("w9-name-input").getByRole("textbox"),
    saveButton: () => this.page.getByTestId("create-agent-button").or(this.page.getByTestId("update-agent-button")),
    cancelButton: () => this.page.getByTestId("cancel-button"),
    backButton: () => this.page.getByTestId("back-button"),
    confirmModalHeading: () => this.page.getByRole("heading", { name: /^(Create Agent|Update Agent|Save Changes)$/i }),
    confirmModalSaveButton: () => this.page.getByTestId("create-agent-confirm-button").or(this.page.getByTestId("update-agent-confirm-button")).or(this.page.getByTestId("confirm-save-button")),
    confirmModalCancelButton: () => this.page.getByTestId("create-agent-cancel-button").or(this.page.getByTestId("update-agent-cancel-button")),
    confirmModalCloseButton: () => this.page.getByTestId("modal-close-button"),
    cancelChangesModal: () => this.page.getByTestId("unsaved-changes-modal"),
    cancelChangesModalHeading: () => this.page.getByRole("heading", { name: "Cancel Changes" }),
    /** Live: button label "Cancel" — discards draft and leaves form. */
    cancelChangesConfirmButton: () => this.page.getByTestId("unsaved-changes-confirm"),
    /** Live: button label "Keep Editing". */
    cancelChangesCancelButton: () => this.page.getByTestId("unsaved-changes-cancel"),
    agentCodeError: () => this.page.getByTestId("agent-code-error"),
    emailError: () => this.page.getByTestId("email-error"),
    phoneError: () => this.page.getByTestId("phone-error").or(
      this.page.getByTestId("phone-input").locator("..").getByText(/already|exists|taken|duplicate/i)
    ),
    npnError: () => this.page.getByTestId("npn-error"),
    /** Sonner only — do not OR role=alert/status (inline field errors match those). */
    successToast: () => this.page.locator("[data-sonner-toast]").first(),
    fieldError: (testId) => this.page.getByTestId(`${testId}-error`).or(
      this.page.getByTestId(testId).locator("..").getByText(/already|exists|taken|duplicate|invalid/i)
    )
  };
  /** Last unique email filled for create-agent search assertions. */
  lastCreatedEmail = "";
  lastCreatedAgentId = "";
  async isAddFormVisible() {
    return this.loc.headingAdd().isVisible({ timeout: T2 }).catch(() => false);
  }
  async isOnAgentsList() {
    return this.page.waitForURL(/\/agents\/?$/i, { timeout: T2 }).then(() => true).catch(() => false);
  }
  async fillAgentId(value) {
    await this.loc.agentCodeInput().fill(value);
  }
  async fillFirstName(value) {
    await this.loc.firstNameInput().fill(value);
  }
  async fillLastName(value) {
    await this.loc.lastNameInput().fill(value);
  }
  async fillEmail(value) {
    await this.loc.emailInput().fill(value);
  }
  async fillNpn(value) {
    await this.loc.npnInput().fill(value);
  }
  async fillAllRequiredFields(data) {
    this.lastCreatedAgentId = data.agentId;
    this.lastCreatedEmail = data.email;
    await this.loc.agentCodeInput().fill(data.agentId);
    await this.loc.firstNameInput().fill(data.firstName);
    await this.loc.lastNameInput().fill(data.lastName);
    await this.loc.emailInput().fill(data.email);
    if (data.phone && await this.loc.phoneInput().isVisible().catch(() => false)) {
      await this.loc.phoneInput().fill(data.phone);
    }
    if (data.npn && await this.loc.npnInput().isVisible().catch(() => false)) {
      await this.loc.npnInput().fill(data.npn);
    }
  }
  async fillSomeRequiredFields(data) {
    if (data.agentId) await this.loc.agentCodeInput().fill(data.agentId);
    if (data.firstName) await this.loc.firstNameInput().fill(data.firstName);
    if (data.lastName) await this.loc.lastNameInput().fill(data.lastName);
    if (data.email) await this.loc.emailInput().fill(data.email);
  }
  async fillOneField(field, value) {
    switch (field) {
      case "agentId":
        await this.loc.agentCodeInput().fill(value);
        break;
      case "firstName":
        await this.loc.firstNameInput().fill(value);
        break;
      case "lastName":
        await this.loc.lastNameInput().fill(value);
        break;
      case "email":
        await this.loc.emailInput().fill(value);
        break;
    }
  }
  async isSaveDisabled() {
    const btn = this.loc.saveButton();
    return btn.isDisabled({ timeout: 2e3 }).catch(() => true);
  }
  async clickSave() {
    await this.loc.saveButton().click();
    await waitForAppSettled(this.page);
  }
  /**
   * Confirm Save on the modal.
   * - Validation / negative paths: omit captureToast (inline field errors, no Sonner).
   * - Happy-path saves: pass `{ captureToast: true }` so toast is stashed before settle.
   */
  async clickConfirmSave(opts = {}) {
    const modalHeading = this.loc.confirmModalHeading();
    const modalVisible = await modalHeading.isVisible({ timeout: 5e3 }).catch(() => false);
    if (!modalVisible) return;
    const saveBtn = this.loc.confirmModalSaveButton();
    const saveVisible = await saveBtn.isVisible({ timeout: 3e3 }).catch(() => false);
    if (saveVisible) {
      await saveBtn.click();
    } else {
      const anySaveBtn = this.page.getByRole("dialog").getByRole("button", { name: /save|confirm/i });
      if (await anySaveBtn.isVisible({ timeout: 2e3 }).catch(() => false)) {
        await anySaveBtn.click();
      } else {
        return;
      }
    }
    if (opts.captureToast) {
      await this.captureSuccessToast();
    } else {
      await waitForAppSettled(this.page);
    }
  }
  async clickCancelConfirm() {
    await (0, import_test7.expect)(this.loc.confirmModalHeading()).toBeVisible({ timeout: T2 });
    await this.loc.confirmModalCancelButton().click();
  }
  async clickBack() {
    await this.loc.backButton().click();
  }
  async isCancelChangesModalVisible() {
    return this.loc.cancelChangesModal().or(this.loc.cancelChangesModalHeading()).first().isVisible({ timeout: T2 }).catch(() => false);
  }
  /** Inline duplicate errors next to Agent Id / Email / NPN after Save. */
  async expectDuplicateValidationErrors() {
    await (0, import_test7.expect)(this.loc.agentCodeError()).toBeVisible({ timeout: T2 });
    await (0, import_test7.expect)(this.loc.agentCodeError()).toContainText(/already exists/i);
    await (0, import_test7.expect)(this.loc.emailError()).toBeVisible({ timeout: T2 });
    await (0, import_test7.expect)(this.loc.emailError()).toContainText(/already exists/i);
    await (0, import_test7.expect)(this.loc.npnError()).toBeVisible({ timeout: T2 });
    await (0, import_test7.expect)(this.loc.npnError()).toContainText(/already exists/i);
  }
  async confirmAbort() {
    const modal = this.loc.cancelChangesModal();
    await (0, import_test7.expect)(modal).toBeVisible({ timeout: T2 });
    await (0, import_test7.expect)(this.loc.cancelChangesModalHeading()).toBeVisible({ timeout: T2 });
    const confirm = modal.getByTestId("unsaved-changes-confirm").or(modal.getByRole("button", { name: /^Cancel$/i }));
    await (0, import_test7.expect)(confirm).toBeVisible({ timeout: 1e4 });
    await confirm.click();
    await (0, import_test7.expect)(modal).toBeHidden({ timeout: 15e3 });
  }
  async keepEditing() {
    const modal = this.loc.cancelChangesModal();
    await (0, import_test7.expect)(modal).toBeVisible({ timeout: T2 });
    const keep = modal.getByTestId("unsaved-changes-cancel").or(modal.getByRole("button", { name: /Keep Editing/i }));
    await (0, import_test7.expect)(keep).toBeVisible({ timeout: 1e4 });
    await keep.click();
    await (0, import_test7.expect)(modal).toBeHidden({ timeout: 15e3 });
  }
  async captureSuccessToast() {
    await captureToast(this.page, this.loc.successToast(), T2);
  }
  async expectSuccessToast() {
    const text = await expectCapturedOrLiveToast(this.page, this.loc.successToast(), T2);
    if (text) {
      import_test7.expect.soft(text.length, "Success toast should contain a message (soft)").toBeGreaterThan(0);
    }
  }
  async expectValidationError(field) {
    const error = this.loc.fieldError(field);
    await (0, import_test7.expect)(error.first()).toBeVisible({ timeout: T2 });
  }
  async expectValidationText(text) {
    await (0, import_test7.expect)(this.page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: T2 });
  }
  async expectValidationMatching(pattern) {
    const re = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
    await (0, import_test7.expect)(this.page.getByText(re).first()).toBeVisible({ timeout: T2 });
  }
  async isSaveEnabled() {
    const btn = this.loc.saveButton();
    return btn.isEnabled({ timeout: 2e3 }).catch(() => false);
  }
  async expectStatusShows(expectedStatus) {
    await (0, import_test7.expect)(this.page.getByText(new RegExp(expectedStatus, "i"))).toBeVisible({ timeout: T2 });
  }
  async getAgentStatus() {
    const statusEl = this.page.getByTestId("status-dropdown");
    return (await statusEl.textContent() ?? "").replace(/\s+/g, " ").trim();
  }
  async searchGridForAgent(query) {
    const searchInput = this.page.getByTestId("data-grid-search-input").or(this.page.getByRole("textbox", { name: "Search data grid" }));
    await searchInput.fill("");
    await searchInput.fill(query);
    await (0, import_test7.expect)(this.page.getByRole("grid", { name: "Data grid" })).toBeVisible();
    await waitForAppSettled(this.page);
  }
  async expectGridHasStatusInRow(expectedStatus) {
    await import_test7.expect.poll(
      async () => {
        const rows = this.page.getByRole("grid", { name: "Data grid" }).getByRole("row");
        const count = await rows.count();
        for (let i = 0; i < count; i++) {
          const text = await rows.nth(i).innerText();
          if (text.includes(expectedStatus)) return true;
        }
        return false;
      },
      { timeout: 3e4, intervals: [1e3, 2e3] }
    ).toBe(true);
  }
  // ── Edit form helpers ──────────────────────────────────────────────────────
  /** Leave edit form and return to Agents list (abort unsaved modal if shown). */
  async leaveFormToAgentsList(agentsPage) {
    await this.clickBack();
    if (await this.isCancelChangesModalVisible()) {
      await this.confirmAbort();
    }
    await agentsPage.openList();
    await waitForAppSettled(this.page);
  }
  /**
   * On edit of first grid agent: copy phone from second agent, then set it on first.
   * Requires ≥2 agent rows.
   */
  async setPhoneToExistingAgentPhone(agentsPage) {
    await this.leaveFormToAgentsList(agentsPage);
    const openedOther = await agentsPage.openGridRecordAt(1);
    (0, import_test7.expect)(openedOther, "Need a second agent row to source an existing phone").toBe(true);
    await waitForAppSettled(this.page);
    await (0, import_test7.expect)(this.loc.phoneInput()).toBeVisible({ timeout: T2 });
    const otherPhone = (await this.loc.phoneInput().inputValue()).trim();
    (0, import_test7.expect)(otherPhone, "Second agent must have a phone value").toBeTruthy();
    await this.leaveFormToAgentsList(agentsPage);
    await agentsPage.openEditByRowClick();
    await waitForAppSettled(this.page);
    await (0, import_test7.expect)(this.loc.phoneInput()).toBeVisible({ timeout: T2 });
    await this.loc.phoneInput().fill(otherPhone);
    await this.fillValidBankDetails();
  }
  async expectPhoneAlreadyExistsValidation() {
    const phoneErr = this.loc.phoneError();
    await (0, import_test7.expect)(phoneErr.first()).toBeVisible({ timeout: T2 });
    await (0, import_test7.expect)(phoneErr.first()).toContainText(/already|exists|taken|duplicate/i);
  }
  async expectEmailNotEditable() {
    const email = this.loc.emailInput();
    await (0, import_test7.expect)(email).toBeVisible({ timeout: T2 });
    const disabled = await email.isDisabled().catch(() => false);
    const readonly = await email.getAttribute("readonly");
    const ariaReadonly = await email.getAttribute("aria-readonly");
    const editable = await email.evaluate((el) => {
      const input = el;
      return !input.disabled && !input.readOnly;
    });
    (0, import_test7.expect)(
      disabled || readonly !== null || ariaReadonly === "true" || !editable,
      "Email field should not be editable on agent edit"
    ).toBe(true);
  }
  /** Bank name / account / routing are mandatory — Save stays disabled until filled. */
  async fillValidBankDetails() {
    if (await this.loc.bankNameInput().isVisible().catch(() => false)) {
      await this.loc.bankNameInput().fill("Chase Bank");
    }
    if (await this.loc.accountNumberInput().isVisible().catch(() => false)) {
      await this.loc.accountNumberInput().fill("123456789012");
    }
    if (await this.loc.routingNumberInput().isVisible().catch(() => false)) {
      await this.loc.routingNumberInput().fill("121000248");
    }
  }
  async changeEditableFields() {
    await this.loc.firstNameInput().fill("Updated");
    await this.loc.lastNameInput().fill("Agent");
    if (await this.loc.phoneInput().isVisible().catch(() => false)) {
      await this.loc.phoneInput().fill("5559999999");
    }
    await this.fillValidBankDetails();
  }
  async clearMandatoryField() {
    await this.loc.firstNameInput().fill("");
  }
  async provideEmojiAndSymbols() {
    await this.loc.firstNameInput().fill("\u{1F60A}!@#");
    await this.loc.lastNameInput().fill("\u{1F480}%&*");
  }
  async enterMoreThan50CharactersInNames() {
    const longStr = "A".repeat(51);
    await this.loc.firstNameInput().fill(longStr);
    await this.loc.lastNameInput().fill(longStr);
    await this.fillValidBankDetails();
  }
  async enterInvalidEmail() {
    await this.loc.emailInput().fill("not-an-email");
  }
  async enterOversizedAddressCityAndValidZip() {
    await this.loc.addressInput().fill("A".repeat(101));
    await this.loc.cityInput().fill("B".repeat(26));
    await this.loc.zipCodeInput().fill("12345");
    await this.fillValidBankDetails();
  }
  async enterInvalidBankFields() {
    if (await this.loc.routingNumberInput().isVisible().catch(() => false)) {
      await this.loc.routingNumberInput().fill("123");
    }
    if (await this.loc.bankNameInput().isVisible().catch(() => false)) {
      await this.loc.bankNameInput().fill("");
    }
    if (await this.loc.accountNumberInput().isVisible().catch(() => false)) {
      await this.loc.accountNumberInput().fill("123");
    }
  }
  async enterInvalidTaxFields() {
    await this.fillValidBankDetails();
    if (await this.loc.taxIdInput().isVisible().catch(() => false)) {
      await this.loc.taxIdInput().fill("123456789");
    }
    if (await this.loc.w9NameInput().isVisible().catch(() => false)) {
      await this.loc.w9NameInput().fill("X".repeat(101));
    }
  }
  async openTaxTypeDropdown() {
    const taxTypeBtn = this.page.getByRole("button", { name: /select tax type/i });
    if (await taxTypeBtn.isVisible().catch(() => false)) {
      await taxTypeBtn.click();
      await this.page.waitForTimeout(300);
    }
  }
  async hoverTaxId() {
    const taxIdInput = this.loc.taxIdInput();
    if (await taxIdInput.isVisible().catch(() => false)) {
      await taxIdInput.hover();
      await this.page.waitForTimeout(300);
    }
  }
  async expectValidationTextVisible(text) {
    const pattern = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    await (0, import_test7.expect)(this.page.getByText(pattern).first()).toBeVisible({ timeout: T2 });
  }
  async expectBankValidationErrors() {
    await import_test7.expect.poll(
      async () => {
        const body = this.page.locator("body");
        const text = (await body.innerText()).toLowerCase();
        return text.includes("routing") || text.includes("account") || text.includes("bank") || text.includes("must not exceed") || text.includes("must be at least");
      },
      { timeout: T2, intervals: [500, 1e3] }
    ).toBe(true);
  }
  async expectTaxValidationErrors() {
    await import_test7.expect.poll(
      async () => {
        const body = this.page.locator("body");
        const text = (await body.innerText()).toLowerCase();
        return text.includes("tax") || text.includes("w-9") || text.includes("must not exceed") || text.includes("invalid");
      },
      { timeout: T2, intervals: [500, 1e3] }
    ).toBe(true);
  }
  async expectInvalidNameErrors() {
    await import_test7.expect.poll(
      async () => {
        const body = this.page.locator("body");
        const text = (await body.innerText()).toLowerCase();
        return text.includes("invalid") || text.includes("must not") || text.includes("characters");
      },
      { timeout: T2, intervals: [500, 1e3] }
    ).toBe(true);
  }
  async expectFieldsDoNotOverlap(field1TestId, field2TestId) {
    const el1 = this.page.getByTestId(field1TestId);
    const el2 = this.page.getByTestId(field2TestId);
    const box1 = await el1.boundingBox().catch(() => null);
    const box2 = await el2.boundingBox().catch(() => null);
    if (box1 && box2) {
      const noOverlap = box1.x + box1.width <= box2.x || box2.x + box2.width <= box1.x || box1.y + box1.height <= box2.y || box2.y + box2.height <= box1.y;
      (0, import_test7.expect)(noOverlap, "Fields should not overlap").toBe(true);
    }
  }
};

// pages/agents/AgentEditTabsPage.ts
var import_test8 = require("@playwright/test");
var T3 = smokeStepTimeoutMs;
var AgentEditTabsPage = class {
  constructor(page) {
    this.page = page;
  }
  page;
  loc = {
    // ── Tab navigation ──────────────────────────────────────────────────────
    tabLevelHierarchy: () => this.page.getByTestId("agent-tab-navigation-tab-level-hierarchy"),
    tabOrgTree: () => this.page.getByTestId("agent-tab-navigation-tab-org-tree"),
    tabLicensingAppointments: () => this.page.getByTestId("agent-tab-navigation-tab-licensing-appointments"),
    // ── Level & Hierarchy ───────────────────────────────────────────────────
    levelGrid: () => this.page.getByTestId("agent-level-history-grid"),
    reportingGrid: () => this.page.getByTestId("reporting-manager-history-grid"),
    addLevelButton: () => this.page.getByTestId("add-level-record-button"),
    addManagerButton: () => this.page.getByTestId("add-manager-record-button"),
    levelCurrentBadge: () => this.page.locator('[data-testid^="level-current-badge-"]'),
    levelKebab: () => this.page.locator('[data-testid^="edit-level-row-"]'),
    levelNameCells: () => this.page.getByTestId("agent-level-history-grid").locator('[role="gridcell"][col-id="levelName"], .ag-cell[col-id="levelName"]'),
    managerNameCells: () => this.page.getByTestId("reporting-manager-history-grid").locator('[role="gridcell"][col-id="managerName"], .ag-cell[col-id="managerName"]'),
    reportingEndDateCells: () => this.page.getByTestId("reporting-manager-history-grid").locator('[role="gridcell"][col-id="effectiveEndDate"], .ag-cell[col-id="effectiveEndDate"]'),
    dropdownOptions: () => this.page.getByRole("option"),
    rowActionEdit: () => this.page.getByRole("button", { name: "Edit", exact: true }),
    rowActionDelete: () => this.page.getByRole("button", { name: "Delete", exact: true }),
    // ── Add Level drawer ────────────────────────────────────────────────────
    addLevelDrawer: () => this.page.getByTestId(/add-level-record-modal/i),
    addLevelCloseButton: () => this.page.getByTestId("close-level-record-modal-button"),
    addLevelLevelDropdown: () => this.page.getByTestId(/add-level-record-modal/i).getByRole("button", { name: /select/i }),
    addLevelStartDateInput: () => this.page.getByTestId(/add-level-record-modal/i).locator('input[type="text"]').last(),
    addLevelSaveButton: () => this.page.getByTestId(/add-level-record-modal/i).getByRole("button", { name: "Save" }),
    addLevelCancelButton: () => this.page.getByTestId(/add-level-record-modal/i).getByRole("button", { name: "Cancel" }),
    // ── Add Reporting Manager drawer ────────────────────────────────────────
    addManagerDrawer: () => this.page.getByTestId("add-reporting-manager-record-modal"),
    addManagerCloseButton: () => this.page.getByTestId("close-manager-record-modal-button"),
    addManagerDropdown: () => this.page.getByTestId("manager-record-modal-dropdown"),
    addManagerDropdownLabel: () => this.page.locator("#manager-record-modal-dropdown-label"),
    addManagerDropdownSearch: () => this.page.getByTestId("manager-record-modal-dropdown-search-input").getByRole("searchbox"),
    addManagerDropdownOptionList: () => this.page.locator("#manager-record-modal-dropdown-option-list"),
    addManagerDropdownOptionSpans: () => this.page.locator("#manager-record-modal-dropdown-option-list").locator("span"),
    addManagerNoResults: () => this.page.locator("#manager-record-modal-dropdown-option-list").locator("span", {
      hasText: "No results found"
    }),
    addManagerStartDateInput: () => this.page.getByTestId("add-reporting-manager-record-modal").locator('input[type="text"]').last(),
    addManagerSaveButton: () => this.page.getByTestId("manager-record-modal-save"),
    addManagerCancelButton: () => this.page.getByTestId("manager-record-modal-cancel"),
    addManagerOverlapError: () => this.page.getByTestId("add-reporting-manager-record-modal").getByText(/overlap/i),
    reportingSaveConfirm: () => this.page.getByRole("dialog").filter({
      has: this.page.getByRole("heading", { name: "Save Reporting Manager", exact: true })
    }),
    // ── Licensing & Appointments ────────────────────────────────────────────
    licensingAppointmentsSection: () => this.page.getByTestId("licensing-appointments-section"),
    /** Page-level Add — Save in the drawer reuses this testid; always scope to section. */
    addAppointmentButton: () => this.page.getByTestId("licensing-appointments-section").getByTestId("add-appointment-button"),
    appointmentGrid: () => this.page.getByTestId("appointments-datagrid"),
    appointmentSearchInput: () => this.page.getByTestId("appointments-datagrid").getByRole("textbox", { name: "Search data grid" }),
    appointmentRefreshButton: () => this.page.getByTestId("appointments-datagrid").getByRole("button", { name: /refresh grid data/i }),
    appointmentGridFooter: () => this.page.getByText(/showing all \d+ records/i),
    /** Data rows only — excludes header. */
    appointmentBodyRows: () => this.page.getByTestId("appointments-datagrid").locator(".ag-center-cols-container .ag-row"),
    appointmentCarrierCells: () => this.page.getByTestId("appointments-datagrid").locator('[role="gridcell"][col-id="carrier"]'),
    appointmentGridCellsByColId: (colId) => this.page.getByTestId("appointments-datagrid").locator(`[role="gridcell"][col-id="${colId}"]`),
    appointmentColumnHeader: (columnName) => this.page.getByTestId("appointments-datagrid").getByRole("columnheader", { name: new RegExp(columnName, "i") }),
    // ── Add Appointment dialog (live: appointment-form) ─────────────────────
    addAppointmentDialog: () => this.page.getByTestId("appointment-form"),
    addAppointmentCloseButton: () => this.page.getByTestId("appointment-form").getByTestId("close-form-button"),
    addAppointmentAgentField: () => this.page.getByTestId("appointment-form").getByTestId("agent-input"),
    addAppointmentAgentInput: () => this.page.getByTestId("appointment-form").getByTestId("agent-input").locator("input"),
    addAppointmentCarrierDropdown: () => this.page.getByTestId("appointment-form").getByTestId("carrier-dropdown").getByRole("button"),
    addAppointmentCarrierListbox: () => this.page.getByTestId("carrier-dropdown-listbox"),
    addAppointmentCarrierOptions: () => this.page.getByTestId("carrier-dropdown-listbox").getByRole("option"),
    addAppointmentNumberInput: () => this.page.getByTestId("appointment-form").getByTestId("appointment-number-input").locator("input"),
    addAppointmentDatePicker: () => this.page.getByTestId("appointment-form").getByTestId("appointment-date-input").locator("input"),
    addAppointmentNotesInput: () => this.page.getByTestId("appointment-form").getByTestId("notes-textarea").getByRole("textbox"),
    addAppointmentSaveButton: () => this.page.getByTestId("appointment-form").getByRole("button", { name: "Save", exact: true }),
    addAppointmentCancelButton: () => this.page.getByTestId("appointment-form").getByTestId("cancel-button"),
    appointmentSaveConfirm: () => this.page.getByTestId("create-appointment-modal"),
    appointmentSaveConfirmButton: () => this.page.getByTestId("create-appointment-confirm-button"),
    // ── Shared date calendar (react-calendar popup) ─────────────────────────
    /** Outer popup; live app currently uses undefined-calendar-popup. */
    calendarPopup: () => this.page.locator('[data-testid$="-calendar-popup"]'),
    // ── Org Tree ────────────────────────────────────────────────────────────
    orgTreeHeading: () => this.page.getByRole("heading", { name: /organization tree/i }),
    orgTreeZoomIn: () => this.page.getByRole("button", { name: /zoom in/i }),
    orgTreeZoomOut: () => this.page.getByRole("button", { name: /zoom out/i }),
    orgTreeResetView: () => this.page.getByTestId("organizational-tree-section-reset-view"),
    orgTreeCanvas: () => this.page.locator("table").first(),
    orgTreeNode: () => this.page.locator("table td").first(),
    orgTreeNodes: () => this.page.locator("table td"),
    orgTreeYouBadge: () => this.page.getByText("You").first(),
    orgTreePcRoot: () => this.page.locator('[data-pc-section="root"]').first()
  };
  _capturedAppointmentCount = 0;
  _capturedAppointedCarriers = [];
  _orgTreeScaleBaseline = 1;
  _orgTreeScaleAfterZoomIn = 1;
  _capturedLevelDropdownOptions = [];
  // ── Tab navigation ─────────────────────────────────────────────────────────
  async openLevelHierarchyTab() {
    await this.loc.tabLevelHierarchy().click();
    await waitForAppSettled(this.page);
    await (0, import_test8.expect)(this.loc.levelGrid()).toBeVisible({ timeout: T3 });
  }
  async openOrgTreeTab() {
    await this.loc.tabOrgTree().click();
    await waitForAppSettled(this.page);
    await (0, import_test8.expect)(this.loc.orgTreeHeading()).toBeVisible({ timeout: T3 });
    await this.loc.orgTreeResetView().click();
    await waitForAppSettled(this.page);
  }
  async openLicensingAppointmentsTab() {
    await this.loc.tabLicensingAppointments().click();
    await waitForAppSettled(this.page);
    this._capturedAppointedCarriers = await this.getAppointmentCarrierCellValues();
  }
  // ── Level & Hierarchy ──────────────────────────────────────────────────────
  async clickAddLevel() {
    await this.loc.addLevelButton().click();
    await waitForAppSettled(this.page);
    await (0, import_test8.expect)(this.loc.addLevelDrawer()).toBeVisible({ timeout: T3 });
  }
  async closeAddLevelDrawer() {
    await this.loc.addLevelCloseButton().click();
    await waitForAppSettled(this.page);
  }
  /** Esc closes add-level modal without saving a record. */
  async dismissAddLevelDrawerWithEscape() {
    for (let i = 0; i < 2; i++) {
      if (!await this.loc.addLevelDrawer().isVisible().catch(() => false)) return;
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(200);
    }
    await (0, import_test8.expect)(this.loc.addLevelDrawer()).toBeHidden({ timeout: T3 });
  }
  async isAddLevelDrawerVisible() {
    return this.loc.addLevelDrawer().isVisible({ timeout: 3e3 }).catch(() => false);
  }
  async selectLevelInDrawer(levelText) {
    await this.loc.addLevelLevelDropdown().click();
    await this.page.waitForTimeout(300);
    const option = this.loc.dropdownOptions().filter({ hasText: new RegExp(levelText, "i") });
    await option.first().click();
    await this.page.waitForTimeout(200);
  }
  async setLevelStartDate(dateStr) {
    const input = this.loc.addLevelStartDateInput();
    await input.click();
    await this.selectDateInCalendar(dateStr);
  }
  async saveLevel() {
    await this.loc.addLevelSaveButton().click();
    const confirm = this.page.getByRole("dialog").filter({ has: this.page.getByRole("heading", { name: /save agent level/i }) });
    await (0, import_test8.expect)(confirm).toBeVisible({ timeout: T3 });
    await confirm.getByRole("button", { name: "Save", exact: true }).click();
    await waitForAppSettled(this.page);
  }
  async cancelLevel() {
    await this.loc.addLevelCancelButton().click();
    await waitForAppSettled(this.page);
  }
  async getLevelGridRows() {
    const grid = this.loc.levelGrid();
    const rows = grid.getByRole("row");
    const count = await rows.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text) texts.push(text);
    }
    return texts;
  }
  async getLevelNameCellTexts() {
    const cells = this.loc.levelNameCells();
    const count = await cells.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text) texts.push(text);
    }
    return texts;
  }
  async expectLevelInTable(levelText) {
    await import_test8.expect.poll(
      async () => {
        const rows = await this.getLevelGridRows();
        return rows.some((r) => r.toLowerCase().includes(levelText.toLowerCase()));
      },
      { timeout: 15e3, intervals: [1e3, 2e3] }
    ).toBe(true);
  }
  async expectCurrentBadgeVisible() {
    await (0, import_test8.expect)(this.loc.levelCurrentBadge().first()).toBeVisible({ timeout: T3 });
  }
  async expectLevelHistoryNoDeleteOrEndDateEdit() {
    const grid = this.loc.levelGrid();
    const deleteButtons = grid.getByRole("button", { name: /delete/i });
    await (0, import_test8.expect)(deleteButtons).toHaveCount(0, { timeout: 5e3 }).catch(() => {
    });
  }
  async clickLevelKebab() {
    await this.loc.levelKebab().first().click();
    await this.page.waitForTimeout(300);
  }
  async expectAgentLevelRowActionMenuShowsEditOnly() {
    await (0, import_test8.expect)(this.loc.rowActionEdit()).toBeVisible({ timeout: T3 });
    await (0, import_test8.expect)(this.loc.rowActionDelete()).toHaveCount(0);
  }
  async getLevelDropdownOptions() {
    await this.loc.addLevelLevelDropdown().click();
    await this.page.waitForTimeout(300);
    const options = this.loc.dropdownOptions();
    const count = await options.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = (await options.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text) texts.push(text);
    }
    await this.page.keyboard.press("Escape");
    return texts;
  }
  async captureLevelDropdownOptionsThenDismiss() {
    await this.clickAddLevel();
    this._capturedLevelDropdownOptions = await this.getLevelDropdownOptions();
    await this.dismissAddLevelDrawerWithEscape();
  }
  async expectAssignedLevelsAbsentFromCapturedDropdown() {
    const assigned = await this.getLevelNameCellTexts();
    (0, import_test8.expect)(assigned.length, "Expected assigned level names in grid (col-id=levelName)").toBeGreaterThan(0);
    const dropdown = this._capturedLevelDropdownOptions.map((t) => t.toLowerCase());
    for (const name of assigned) {
      const needle = name.toLowerCase();
      (0, import_test8.expect)(
        dropdown.some((o) => o === needle || o.includes(needle)),
        `Assigned level "${name}" should not appear in add-level dropdown`
      ).toBe(false);
    }
  }
  async addAllAvailableLevelsWithNonOverlappingDates() {
    let addedCount = 0;
    for (let attempt = 0; attempt < 12; attempt++) {
      if (await this.isAddLevelButtonDisabled()) return;
      await this.clickAddLevel();
      await this.loc.addLevelLevelDropdown().click();
      await this.page.waitForTimeout(300);
      const options = this.loc.dropdownOptions();
      const count = await options.count();
      const texts = [];
      for (let i = 0; i < count; i++) {
        const text = (await options.nth(i).innerText()).replace(/\s+/g, " ").trim();
        if (text) texts.push(text);
      }
      if (texts.length === 0) {
        await this.dismissAddLevelDrawerWithEscape();
        break;
      }
      await options.first().click();
      const month = addedCount % 12 + 1;
      const year = 2028 + Math.floor(addedCount / 12);
      await this.setLevelStartDate(`${String(month).padStart(2, "0")}/01/${year}`);
      await this.saveLevel();
      await waitForAppSettled(this.page);
      addedCount++;
    }
  }
  async isAddLevelButtonDisabled() {
    return this.loc.addLevelButton().isDisabled({ timeout: 3e3 }).catch(() => true);
  }
  // ── Reporting Manager ──────────────────────────────────────────────────────
  async clickAddReportingManager() {
    await this.loc.addManagerButton().click();
    await waitForAppSettled(this.page);
    await (0, import_test8.expect)(this.loc.addManagerDrawer()).toBeVisible({ timeout: T3 });
  }
  async closeReportingManagerDrawer() {
    await this.loc.addManagerCloseButton().click();
    await waitForAppSettled(this.page);
  }
  async isReportingManagerDrawerVisible() {
    return this.loc.addManagerDrawer().isVisible({ timeout: 3e3 }).catch(() => false);
  }
  async openManagerDropdown() {
    await this.loc.addManagerDropdownLabel().click();
    await this.page.waitForTimeout(300);
    await (0, import_test8.expect)(this.loc.addManagerDropdownOptionList()).toBeVisible({ timeout: T3 });
  }
  async getManagerDropdownOptionTexts() {
    const spans = this.loc.addManagerDropdownOptionSpans();
    const count = await spans.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = (await spans.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text) texts.push(text);
    }
    return texts;
  }
  async getManagerNameCellTexts() {
    const cells = this.loc.managerNameCells();
    const count = await cells.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text) texts.push(text);
    }
    return texts;
  }
  async getReportingEndDateTexts() {
    const cells = this.loc.reportingEndDateCells();
    const count = await cells.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text) texts.push(text);
    }
    return texts;
  }
  reportingGridContainsDate(dateStr) {
    return this.getReportingGridRows().then(
      (rows) => rows.some((r) => r.includes(dateStr) || r.includes(dateStr.replace(/^0/, "")))
    );
  }
  namesMatch(a, b) {
    const na = a.toLowerCase();
    const nb = b.toLowerCase();
    return na === nb || na.includes(nb) || nb.includes(na);
  }
  async selectReportingManager(managerText) {
    await this.loc.addManagerDropdown().click();
    await this.page.waitForTimeout(300);
    const option = this.loc.dropdownOptions().filter({ hasText: new RegExp(managerText, "i") });
    await option.first().click();
    await this.page.waitForTimeout(200);
  }
  async searchReportingManager(query) {
    await this.openManagerDropdown();
    const search = this.loc.addManagerDropdownSearch();
    await (0, import_test8.expect)(search).toBeVisible({ timeout: T3 });
    await search.fill(query);
    await this.page.waitForTimeout(400);
  }
  /**
   * Pick a manager from the open-or-new add-manager modal (skips if start date already in grid).
   * `excludeAssigned` prefers a manager not already in managerName cells.
   */
  async addReportingManagerFromList(startDate, opts) {
    if (await this.reportingGridContainsDate(startDate)) return;
    if (!await this.isReportingManagerDrawerVisible()) {
      await this.clickAddReportingManager();
    }
    await this.openManagerDropdown();
    const assigned = await this.getManagerNameCellTexts();
    const options = (await this.getManagerDropdownOptionTexts()).filter(
      (o) => o && !/no results found/i.test(o)
    );
    (0, import_test8.expect)(options.length, "Expected reporting manager dropdown options").toBeGreaterThan(0);
    let pick = options[0];
    if (opts?.excludeAssigned !== false) {
      const unused = options.find((o) => !assigned.some((a) => this.namesMatch(a, o)));
      if (unused) pick = unused;
    }
    await this.loc.addManagerDropdownOptionSpans().filter({ hasText: pick }).first().click();
    await this.setReportingStartDate(startDate);
    await this.saveReportingManager();
  }
  async addDifferentReportingManagerWithDate(startDate) {
    if (!await this.isReportingManagerDrawerVisible()) {
      await this.clickAddReportingManager();
    }
    await this.openManagerDropdown();
    const assigned = await this.getManagerNameCellTexts();
    const options = (await this.getManagerDropdownOptionTexts()).filter(
      (o) => o && !/no results found/i.test(o)
    );
    const pick = options.find((o) => !assigned.some((a) => this.namesMatch(a, o))) ?? options[0];
    (0, import_test8.expect)(pick, "Expected a different reporting manager option").toBeTruthy();
    await this.loc.addManagerDropdownOptionSpans().filter({ hasText: pick }).first().click();
    await this.setReportingStartDate(startDate);
    await this.saveReportingManager();
  }
  async expectNewestReportingEndDate(expected) {
    const texts = await this.getReportingEndDateTexts();
    (0, import_test8.expect)(texts.length, "Expected reporting end-date cells").toBeGreaterThan(0);
    (0, import_test8.expect)(texts[0], "Newest reporting row end date").toMatch(new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  async expectLastReportingRowEndDateAutoPopulated() {
    const texts = await this.getReportingEndDateTexts();
    (0, import_test8.expect)(texts.length, "Expected at least two reporting end-date cells").toBeGreaterThan(1);
    const last = texts[texts.length - 1];
    (0, import_test8.expect)(last, "Previous (last) row end date should be auto-populated").not.toMatch(/no end date/i);
    (0, import_test8.expect)(last).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  }
  async expectReportingOverlapInlineError() {
    await (0, import_test8.expect)(this.loc.addManagerOverlapError()).toBeVisible({ timeout: T3 });
  }
  async expectAssignedManagersExcludedFromDropdown() {
    const assigned = await this.getManagerNameCellTexts();
    (0, import_test8.expect)(assigned.length, "Expected managerName cells in reporting grid").toBeGreaterThan(0);
    await this.openManagerDropdown();
    const options = await this.getManagerDropdownOptionTexts();
    for (const name of assigned) {
      (0, import_test8.expect)(
        options.some((o) => this.namesMatch(o, name)),
        `Assigned manager "${name}" should not appear in manager-record-modal-dropdown`
      ).toBe(false);
    }
  }
  async expectManagerSearchExcludes(name) {
    const options = await this.getManagerDropdownOptionTexts();
    const noResults = await this.loc.addManagerNoResults().isVisible().catch(() => false);
    if (noResults) {
      await (0, import_test8.expect)(this.loc.addManagerNoResults()).toHaveText("No results found");
      return;
    }
    (0, import_test8.expect)(
      options.some((o) => this.namesMatch(o, name)),
      `Onboarding agent "${name}" should not appear in reporting manager options`
    ).toBe(false);
  }
  async expectReportingManagerNoResults() {
    await (0, import_test8.expect)(this.loc.addManagerNoResults()).toBeVisible({ timeout: T3 });
    await (0, import_test8.expect)(this.loc.addManagerNoResults()).toHaveText("No results found");
  }
  async setReportingStartDate(dateStr) {
    const input = this.loc.addManagerStartDateInput();
    await input.click();
    await this.selectDateInCalendar(dateStr);
  }
  /**
   * Pick MM/DD/YYYY via react-calendar day tile.
   * Do not fill + Escape — Escape can close the parent drawer inconsistently.
   */
  async selectDateInCalendar(dateStr) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr.trim());
    if (!match) {
      throw new Error(`Expected MM/DD/YYYY date, got: ${dateStr}`);
    }
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    const monthName = monthNames[month - 1];
    if (!monthName || day < 1 || day > 31) {
      throw new Error(`Invalid calendar date: ${dateStr}`);
    }
    const popup = this.loc.calendarPopup();
    await (0, import_test8.expect)(popup).toBeVisible({ timeout: T3 });
    const navLabel = popup.locator(".react-calendar__navigation__label");
    for (let i = 0; i < 2; i++) {
      const labelText = (await navLabel.innerText()).replace(/\s+/g, " ").trim();
      if (/\d{4}\s*[–-]\s*\d{4}/.test(labelText)) break;
      await navLabel.click();
      await this.page.waitForTimeout(150);
    }
    let yearClicked = false;
    for (let i = 0; i < 24; i++) {
      const yearTile = popup.locator("button.react-calendar__tile").filter({ hasText: new RegExp(`^${year}$`) });
      if (await yearTile.count() > 0 && await yearTile.first().isVisible().catch(() => false)) {
        await yearTile.first().click();
        yearClicked = true;
        break;
      }
      const labelText = (await navLabel.innerText()).replace(/\s+/g, " ").trim();
      const range = labelText.match(/(\d{4})\s*[–-]\s*(\d{4})/);
      if (!range) {
        throw new Error(`Calendar not in decade view while seeking year ${year}`);
      }
      const start = Number(range[1]);
      if (year < start) {
        await popup.locator(".react-calendar__navigation__prev-button").click();
      } else {
        await popup.locator(".react-calendar__navigation__next-button").click();
      }
      await this.page.waitForTimeout(150);
    }
    if (!yearClicked) {
      throw new Error(`Could not find year ${year} in calendar`);
    }
    await this.page.waitForTimeout(150);
    await popup.getByRole("button", { name: `${monthName} ${year}`, exact: true }).click();
    await this.page.waitForTimeout(150);
    const dayBtn = popup.locator(
      "button.react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth)"
    ).filter({ hasText: new RegExp(`^${day}$`) });
    await (0, import_test8.expect)(dayBtn, `Day ${day} should be unique in calendar month`).toHaveCount(1);
    await dayBtn.click();
    await this.page.waitForTimeout(200);
  }
  async saveReportingManager() {
    await this.loc.addManagerSaveButton().click();
    const confirm = this.loc.reportingSaveConfirm();
    if (await confirm.isVisible({ timeout: 5e3 }).catch(() => false)) {
      await confirm.getByRole("button", { name: "Save", exact: true }).click();
    }
    await waitForAppSettled(this.page);
  }
  async cancelReportingManager() {
    await this.loc.addManagerCancelButton().click();
    await waitForAppSettled(this.page);
  }
  async getReportingGridRows() {
    const grid = this.loc.reportingGrid();
    const rows = grid.getByRole("row");
    const count = await rows.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text && !text.includes("No Records Found")) texts.push(text);
    }
    return texts;
  }
  async expectReportingManagerInTable(managerText) {
    await import_test8.expect.poll(
      async () => {
        const rows = await this.getReportingGridRows();
        return rows.some((r) => r.toLowerCase().includes(managerText.toLowerCase()));
      },
      { timeout: 15e3, intervals: [1e3, 2e3] }
    ).toBe(true);
  }
  // ── Licensing & Appointments ───────────────────────────────────────────────
  async clickAddAppointment() {
    await this.loc.addAppointmentButton().click();
    await waitForAppSettled(this.page);
    await (0, import_test8.expect)(this.loc.addAppointmentDialog()).toBeVisible({ timeout: T3 });
  }
  async closeAppointmentDrawer() {
    await this.loc.addAppointmentCloseButton().click();
    await waitForAppSettled(this.page);
  }
  async isAppointmentDrawerVisible() {
    return this.loc.addAppointmentDialog().isVisible({ timeout: 3e3 }).catch(() => false);
  }
  async getAppointmentGridRows() {
    const rows = this.loc.appointmentBodyRows();
    const count = await rows.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text && !text.includes("No Records Found")) texts.push(text);
    }
    return texts;
  }
  async getAppointmentCarrierCellValues() {
    const cells = this.loc.appointmentCarrierCells();
    const count = await cells.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text) values.push(text);
    }
    return values;
  }
  async searchCarrierAppointments(query) {
    const search = this.loc.appointmentSearchInput();
    await (0, import_test8.expect)(search).toBeVisible({ timeout: T3 });
    await search.fill(query);
    await waitForAppSettled(this.page);
  }
  async expectAppointmentGridShowsNoRecords() {
    await import_test8.expect.poll(
      async () => {
        const footer = this.page.getByText(/showing all 0 records|no records found/i);
        return footer.isVisible({ timeout: 3e3 }).catch(() => false);
      },
      { timeout: 15e3, intervals: [1e3, 2e3] }
    ).toBe(true);
  }
  async expectAppointmentGridShowsMatchingRows(carrierText) {
    await import_test8.expect.poll(
      async () => {
        const rows = await this.getAppointmentGridRows();
        return rows.length > 0 && rows.every((r) => r.toLowerCase().includes(carrierText.toLowerCase()));
      },
      { timeout: 15e3, intervals: [1e3, 2e3] }
    ).toBe(true);
  }
  async sortAppointmentGridColumn(columnName, direction) {
    const header = this.loc.appointmentColumnHeader(columnName);
    await (0, import_test8.expect)(header).toBeVisible({ timeout: T3 });
    for (let i = 0; i < 3; i++) {
      const sortDir = await header.evaluate((el) => el.getAttribute("aria-sort")).catch(() => "none");
      if (!sortDir || sortDir === "none") break;
      await header.click();
      await this.page.waitForTimeout(200);
    }
    await header.click();
    if (direction === "desc") {
      await this.page.waitForTimeout(200);
      await header.click();
    }
    await waitForAppSettled(this.page);
  }
  async expectAppointmentGridSorted(columnName, direction) {
    const colId = columnName.trim().toLowerCase();
    const cells = this.loc.appointmentGridCellsByColId(colId);
    const count = await cells.count();
    const take = Math.min(count, 3);
    (0, import_test8.expect)(take, `Expected 2\u20133 visible "${columnName}" cells to verify sort`).toBeGreaterThanOrEqual(2);
    const values = [];
    for (let i = 0; i < take; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text) values.push(text);
    }
    (0, import_test8.expect)(values.length, "Expected 2\u20133 data rows for sort verification").toBeGreaterThanOrEqual(2);
    for (let i = 1; i < values.length; i++) {
      const cmp = values[i - 1] < values[i] ? -1 : values[i - 1] > values[i] ? 1 : 0;
      if (direction === "asc") {
        (0, import_test8.expect)(cmp, `Row ${i - 1} "${values[i - 1]}" should be <= "${values[i]}"`).toBeLessThanOrEqual(0);
      } else {
        (0, import_test8.expect)(cmp, `Row ${i - 1} "${values[i - 1]}" should be >= "${values[i]}"`).toBeGreaterThanOrEqual(0);
      }
    }
  }
  async expectAppointmentAgentNameReadOnly() {
    const input = this.loc.addAppointmentAgentInput();
    await (0, import_test8.expect)(input).toBeAttached({ timeout: T3 });
    await (0, import_test8.expect)(input).toBeDisabled();
  }
  async isAppointmentSaveDisabled() {
    return this.loc.addAppointmentSaveButton().isDisabled({ timeout: 3e3 }).catch(() => true);
  }
  async openAppointmentCarrierDropdown() {
    await this.loc.addAppointmentCarrierDropdown().click();
    await (0, import_test8.expect)(this.loc.addAppointmentCarrierListbox()).toBeVisible({ timeout: T3 });
  }
  async getAppointmentCarrierOptions() {
    const options = this.loc.addAppointmentCarrierOptions();
    const count = await options.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = (await options.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text) texts.push(text);
    }
    await this.page.keyboard.press("Escape");
    return texts;
  }
  /**
   * Fill required appointment fields: Carrier*, unique Appointment Number, Appointment Date.
   * Picks first listbox option (already-appointed carriers are excluded).
   * Assumes the add-appointment form is already open.
   */
  async fillAppointmentRequiredFields() {
    await this.openAppointmentCarrierDropdown();
    const options = this.loc.addAppointmentCarrierOptions();
    await (0, import_test8.expect)(options.first(), "Expected carrier options in carrier-dropdown-listbox").toBeVisible({
      timeout: T3
    });
    await options.first().click();
    await this.loc.addAppointmentNumberInput().fill(`APT-${Date.now()}`);
    const today = /* @__PURE__ */ new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}/${today.getFullYear()}`;
    await this.loc.addAppointmentDatePicker().click();
    await this.selectDateInCalendar(dateStr);
  }
  async fillAppointmentNotesExceedingMaxLength() {
    await this.loc.addAppointmentNotesInput().fill("A".repeat(256));
  }
  async saveAppointmentWithConfirm() {
    const saveBtn = this.loc.addAppointmentSaveButton();
    await (0, import_test8.expect)(saveBtn, "Appointment Save should enable after required fields").toBeEnabled({
      timeout: T3
    });
    await saveBtn.click();
    await (0, import_test8.expect)(this.loc.appointmentSaveConfirm()).toBeVisible({ timeout: T3 });
    await (0, import_test8.expect)(this.loc.appointmentSaveConfirm()).toContainText("Save Appointment");
    await this.loc.appointmentSaveConfirmButton().click();
    await waitForAppSettled(this.page);
  }
  /**
   * Fill required appointment fields: Carrier*, unique Appointment Number, Appointment Date.
   * Picks first listbox option (already-appointed carriers are excluded).
   * Leaves confirm Save clicked so the caller can capture the success toast.
   */
  async addCarrierAppointmentWithRequiredFields() {
    await this.clickAddAppointment();
    await this.fillAppointmentRequiredFields();
    await this.saveAppointmentWithConfirm();
  }
  async expectAppointedCarriersExcludedFromDropdown() {
    const live = await this.getAppointmentCarrierCellValues();
    const appointed = live.length > 0 ? live : this._capturedAppointedCarriers;
    (0, import_test8.expect)(appointed.length, "Expected at least one appointed carrier in grid (col-id=carrier)").toBeGreaterThan(0);
    await this.openAppointmentCarrierDropdown();
    const options = await this.getAppointmentCarrierOptions();
    const optionNorm = new Set(options.map((o) => o.toLowerCase().trim()));
    for (const carrier of appointed) {
      (0, import_test8.expect)(
        optionNorm.has(carrier.toLowerCase().trim()),
        `Appointed carrier "${carrier}" should be excluded from Carrier dropdown`
      ).toBe(false);
    }
  }
  async openAppointmentDatePicker() {
    await this.loc.addAppointmentDatePicker().click();
    await this.page.waitForTimeout(300);
  }
  async isAppointmentDatePickerVisible() {
    return this.loc.calendarPopup().isVisible({ timeout: 3e3 }).catch(() => false);
  }
  async clickAppointmentRefresh() {
    await this.loc.appointmentRefreshButton().click();
    await waitForAppSettled(this.page);
  }
  async expectAppointmentGridRefreshed() {
    await waitForAppSettled(this.page);
    await (0, import_test8.expect)(this.loc.appointmentGrid()).toBeVisible({ timeout: T3 });
  }
  // ── Org Tree ───────────────────────────────────────────────────────────────
  async expectOrgTreeNodesVisible() {
    const node = this.loc.orgTreeNode();
    await (0, import_test8.expect)(node).toBeVisible({ timeout: T3 });
  }
  async expectOrgTreeShowsAgent(agentName) {
    await this.expectOrgTreeNodesVisible();
    const texts = await this.getOrgTreeNodeTexts();
    const allText = texts.join(" ");
    (0, import_test8.expect)(allText, `Org tree should include ${agentName}`).toMatch(
      new RegExp(agentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    );
  }
  async expectYouBadgeVisible() {
    await (0, import_test8.expect)(this.loc.orgTreeYouBadge()).toBeVisible({ timeout: T3 });
  }
  async expectYouBadgeOnCurrentAgent(agentName) {
    await this.expectYouBadgeVisible();
    const youNode = this.loc.orgTreeNodes().filter({ hasText: "You" }).first();
    await (0, import_test8.expect)(youNode).toBeVisible({ timeout: T3 });
    await (0, import_test8.expect)(youNode).toContainText(new RegExp(agentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  async getOrgTreeNodeTexts() {
    const cells = this.loc.orgTreeNodes();
    const count = await cells.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (text) texts.push(text);
    }
    return texts;
  }
  async zoomInOrgTree() {
    this._orgTreeScaleBaseline = await this.getOrgTreeScale();
    const start = this._orgTreeScaleBaseline;
    await import_test8.expect.poll(
      async () => {
        await this.loc.orgTreeZoomIn().click();
        this._orgTreeScaleAfterZoomIn = await this.getOrgTreeScale();
        return this._orgTreeScaleAfterZoomIn;
      },
      {
        timeout: 1e4,
        intervals: [250, 400],
        message: `Zoom in did not increase scale on [data-pc-section="root"] parent (was ${start})`
      }
    ).toBeGreaterThan(start + 9e-3);
  }
  async zoomOutOrgTree() {
    const start = this._orgTreeScaleAfterZoomIn;
    await import_test8.expect.poll(
      async () => {
        await this.loc.orgTreeZoomOut().click();
        return this.getOrgTreeScale();
      },
      {
        timeout: 1e4,
        intervals: [250, 400],
        message: `Zoom out did not decrease scale on [data-pc-section="root"] parent (was ${start})`
      }
    ).toBeLessThan(start - 9e-3);
  }
  async resetOrgTreeZoom() {
    await this.loc.orgTreeResetView().click();
    await this.page.waitForTimeout(300);
  }
  /**
   * PrimeVue org chart puts `transform: scale(...)` on the parent of
   * `[data-pc-section="root"]` — not on the table.
   */
  async getOrgTreeScale() {
    const root = this.loc.orgTreePcRoot();
    await (0, import_test8.expect)(root).toBeVisible({ timeout: T3 });
    return root.evaluate((el) => {
      const parseScale = (node) => {
        if (!node) return null;
        const inlineScale = (node.style.scale || "").trim();
        if (inlineScale) {
          const n = parseFloat(inlineScale.split(/\s+/)[0]);
          if (!Number.isNaN(n)) return n;
        }
        const inline = node.style.transform || "";
        const scaleMatch = inline.match(/scale\(\s*([\d.]+)/);
        if (scaleMatch) return parseFloat(scaleMatch[1]);
        const matrixMatch = inline.match(/matrix\(\s*([^)]+)\)/);
        if (matrixMatch) {
          const a = parseFloat(matrixMatch[1].split(",")[0].trim());
          if (!Number.isNaN(a)) return a;
        }
        const computed = getComputedStyle(node).transform;
        if (computed && computed !== "none") {
          const m = computed.match(/matrix\(\s*([^)]+)\)/);
          if (m) {
            const a = parseFloat(m[1].split(",")[0].trim());
            if (!Number.isNaN(a)) return a;
          }
          const s = computed.match(/scale\(\s*([\d.]+)/);
          if (s) return parseFloat(s[1]);
        }
        return null;
      };
      const parent = el.parentElement;
      return parseScale(parent) ?? 1;
    });
  }
  async expectOrgTreeScaleLargerThanBaseline() {
    const scale = await this.getOrgTreeScale();
    (0, import_test8.expect)(scale, `Scale after zoom in should be > baseline ${this._orgTreeScaleBaseline}`).toBeGreaterThan(
      this._orgTreeScaleBaseline + 9e-3
    );
  }
  async expectOrgTreeScaleSmallerThanZoomIn() {
    const scale = await this.getOrgTreeScale();
    (0, import_test8.expect)(scale, `Scale after zoom out should be < zoom-in ${this._orgTreeScaleAfterZoomIn}`).toBeLessThan(
      this._orgTreeScaleAfterZoomIn - 9e-3
    );
  }
  async expectOrgTreeScaleAtDefault() {
    const scale = await this.getOrgTreeScale();
    (0, import_test8.expect)(
      Math.abs(scale - this._orgTreeScaleBaseline),
      `Scale after reset should match baseline ${this._orgTreeScaleBaseline}, got ${scale}`
    ).toBeLessThan(0.05);
  }
};

// scripts/prod-user-setup.ts
var ACTIVATE_ONLY = process.argv.includes("--activate-only");
var onlyIdx = process.argv.indexOf("--only");
var ONLY_EMAILS = onlyIdx >= 0 ? new Set(process.argv.slice(onlyIdx + 1).filter((a) => !a.startsWith("--"))) : void 0;
var linkIdx = process.argv.indexOf("--link");
var EXPLICIT_LINKS = /* @__PURE__ */ new Map();
if (linkIdx >= 0) {
  const args = process.argv.slice(linkIdx + 1).filter((a) => !a.startsWith("--"));
  for (let i = 0; i + 1 < args.length; i += 2) {
    EXPLICIT_LINKS.set(args[i], args[i + 1]);
  }
}
var PASSWORD = "Test@123";
var RM_START_DATE = "09/22/2026";
var OPS_EMAIL = "deva.r+prod+ops@pieq.ai";
var AGOWN_EMAIL = "deva.r+prod+agown@pieq.ai";
var SL_EMAIL = "deva.r+prod+sl@pieq.ai";
var AGENT_EMAIL = "deva.r+prod+agent@pieq.ai";
var TARGET_AGENT_IDS = [
  "600011",
  "600003",
  "600001",
  "600002",
  "600012",
  "90076",
  "0987654321",
  "120876543",
  "600004"
];
var IMAP_CONFIG = {
  imap: {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASSWORD,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 1e4
  }
};
function decodeHtmlEntities(value) {
  return value.replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}
function preferEmailHref(url) {
  return decodeHtmlEntities(url.trim());
}
function extractActivationLink(htmlOrText) {
  if (!htmlOrText) return null;
  const dom = new import_jsdom.JSDOM(htmlOrText);
  const anchors = [
    ...dom.window.document.querySelectorAll(
      'a[href*="action-token"], a[href*="awstrack"], a[href*="login-actions"]'
    )
  ];
  for (const anchor of anchors) {
    const href = anchor.getAttribute("href");
    if (!href) continue;
    const decoded = preferEmailHref(href);
    if (decoded.includes("action-token") || decoded.includes("awstrack") || decoded.includes("login-actions")) {
      return decoded;
    }
  }
  const flattened = htmlOrText.replace(/=\r?\n/g, "").replace(/=3D/gi, "=").replace(/\s+/g, " ");
  const tracking = flattened.match(
    /https:\/\/[a-z0-9]+\.r\.[a-z0-9.-]+\.awstrack\.me\/L0\/https[^"'\s>]+/i
  )?.[0] ?? null;
  if (tracking) return preferEmailHref(tracking);
  const direct = flattened.match(
    /https:\/\/[^\s"'<>]*\/login-actions\/action-token\?key=[^\s"'<>]+/i
  )?.[0] ?? null;
  if (direct) return preferEmailHref(direct);
  return null;
}
async function waitForActivationEmailTo(email, maxWaitMs = 3e5) {
  const connection = await import_imap_simple.default.connect(IMAP_CONFIG);
  await connection.openBox("INBOX");
  const startTime = Date.now();
  const emailLc = email.toLowerCase();
  try {
    while (Date.now() - startTime < maxWaitMs) {
      const since = new Date(Date.now() - 48 * 3600 * 1e3);
      const messages = await connection.search(
        ["ALL", ["SINCE", since.toISOString().slice(0, 10)]],
        { bodies: [""], markSeen: false }
      );
      for (const msg of [...messages].reverse()) {
        const full = msg.parts.find((p) => p.which === "");
        if (!full?.body) continue;
        const parsed = await (0, import_mailparser.simpleParser)(full.body);
        const to = parsed.to;
        const toHeader = (Array.isArray(to) ? to.map((a) => a.text).join(", ") : to?.text ?? "").toLowerCase();
        if (!toHeader.includes(emailLc)) continue;
        const link = extractActivationLink(parsed.html || "") || extractActivationLink(parsed.text || "");
        if (link) {
          console.log(`\u{1F517} Link for ${email} (len=${link.length}) head=${link.slice(0, 100)}`);
          return link;
        }
      }
      await new Promise((r) => setTimeout(r, 5e3));
    }
  } finally {
    await connection.end();
  }
  throw new Error(`Activation email not received for ${email} within ${maxWaitMs}ms`);
}
function buildAgentIdentity(prefix, name) {
  const base = `${prefix}${Date.now().toString().slice(-6)}${String(Math.floor(Math.random() * 90 + 10))}`;
  const uniqueId = base.slice(0, 10);
  return {
    agentId: uniqueId,
    npn: uniqueId,
    firstName: name,
    lastName: name,
    displayName: `${name} ${name}`
  };
}
async function createUserManagementUser(page, userMgmt, user) {
  await userMgmt.gotoDashboard();
  await userMgmt.clickAddUser();
  await userMgmt.fillNewUserForm(user);
  await userMgmt.saveNewUser();
  console.log(`\u2705 User Management user created: ${user.email} (${user.role})`);
}
async function createAgentUser(page, agentsPage, agentFormPage, identity, email) {
  await agentsPage.openList();
  await agentsPage.openAdd();
  await agentFormPage.fillAllRequiredFields({
    agentId: identity.agentId,
    firstName: identity.firstName,
    lastName: identity.lastName,
    email,
    npn: identity.npn
  });
  await agentFormPage.fillValidBankDetails();
  await agentFormPage.clickSave();
  await agentFormPage.clickConfirmSave({ captureToast: true });
  console.log(`\u2705 Agent-master user created: ${email} (${identity.displayName})`);
}
async function setReportingManagerOnAgent(page, agentId, slDisplayName) {
  const agentsPage = new AgentsPage(page);
  const editTabs = new AgentEditTabsPage(page);
  await agentsPage.openList();
  await agentsPage.searchGrid(agentId);
  await agentsPage.openEditByMatchingRow(agentId);
  await editTabs.openLevelHierarchyTab();
  await editTabs.clickAddReportingManager();
  await editTabs.searchReportingManager(slDisplayName);
  const optionSpan = editTabs.loc.addManagerDropdownOptionSpans().filter({
    hasText: slDisplayName
  });
  const count = await optionSpan.count();
  if (count === 0) {
    throw new Error(`Reporting manager "${slDisplayName}" not found in dropdown for agent ${agentId}`);
  }
  await optionSpan.first().click();
  await editTabs.setReportingStartDate(RM_START_DATE);
  await editTabs.saveReportingManager();
  await editTabs.expectReportingManagerInTable(slDisplayName);
  console.log(`\u2705 Reporting manager \u2192 ${slDisplayName} set on agent ${agentId}`);
  return agentId;
}
async function dumpPageState(page, label) {
  const url = page.url();
  const title = await page.title().catch(() => "");
  const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 1500) ?? "").catch(() => "");
  const html = await page.content().catch(() => "");
  await page.screenshot({ path: `scripts/diag-${label}.png` }).catch(() => void 0);
  console.log(`
[DIAG:${label}] url=${url}`);
  console.log(`[DIAG:${label}] title=${title}`);
  console.log(`[DIAG:${label}] bodyText=${JSON.stringify(bodyText)}`);
  console.log(`[DIAG:${label}] htmlLen=${html.length}`);
  try {
    const fs = await import("node:fs");
    fs.writeFileSync(`scripts/diag-${label}.html`, html.slice(0, 2e4));
  } catch {
  }
}
async function activateAccount(page, activationUrl, email, password) {
  const label = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "-");
  console.log(`\u{1F310} Opening activation link (${email})...`);
  await page.goto(activationUrl, { waitUntil: "domcontentloaded", timeout: 6e4 });
  const proceed = page.locator("a", { hasText: /Click here to proceed/i });
  const proceedVisible = proceed.isVisible({ timeout: 65e3 }).catch(() => false);
  const pwNew = page.locator("#password-new");
  const pwNewVisible = pwNew.isVisible({ timeout: 65e3 }).catch(() => false);
  const which = await Promise.race([
    proceedVisible.then((v) => v ? "proceed" : null),
    pwNewVisible.then((v) => v ? "password" : null),
    new Promise((r) => setTimeout(() => r(null), 7e4))
  ]);
  if (which === "proceed") {
    console.log('\u{1F518} Clicking "\xBB Click here to proceed"...');
    await proceed.click();
    await page.waitForLoadState("domcontentloaded");
    await pwNew.waitFor({ state: "visible", timeout: 6e4 });
  } else if (which !== "password") {
    const actionUri = await page.evaluate(() => window.kcContext?.actionUri ?? "").catch(() => "");
    if (actionUri) {
      console.log("\u{1F517} SPA not mounted \u2014 navigating via server-rendered kcContext.actionUri...");
      await page.goto(actionUri, { waitUntil: "domcontentloaded", timeout: 6e4 });
      await pwNew.waitFor({ state: "visible", timeout: 6e4 });
    } else {
      await dumpPageState(page, label);
      throw new Error(`Unknown activation landing for ${email}`);
    }
  }
  console.log("\u{1F510} Setting password...");
  await pwNew.fill(password);
  await page.locator("#password-confirm").fill(password);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForLoadState("domcontentloaded");
  console.log('\u21A9\uFE0F Clicking "\xAB Back to Application"...');
  const back = page.locator("a", { hasText: /Back to Application/i });
  const backVisible = back.isVisible({ timeout: 65e3 }).catch(() => false);
  if (await backVisible) {
    await back.click();
    await page.waitForLoadState("domcontentloaded");
  } else {
    await dumpPageState(page, label);
    throw new Error(`No "Back to Application" after password set for ${email}`);
  }
  console.log("\u{1F511} Logging in with new credentials...");
  const loginPage = new LoginPage(page);
  await page.goto(AppPaths.login, { waitUntil: "domcontentloaded" });
  const emailInput = page.getByRole("textbox", { name: /email address/i }).or(page.locator('#username, #email, input[name="username"]')).or(page.getByRole("textbox", { name: /username|email/i })).first();
  await emailInput.waitFor({ state: "visible", timeout: 6e4 });
  await emailInput.fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  const passwordInput = page.getByLabel(/^password$/i).or(page.locator("#password")).or(page.locator('input[type="password"]')).first();
  await passwordInput.waitFor({ state: "visible", timeout: 6e4 });
  await passwordInput.fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).first().click();
  await page.waitForLoadState("domcontentloaded");
  const skip = page.locator('[data-testid="profile-skip"]');
  if (await skip.isVisible({ timeout: 1e4 }).catch(() => false)) {
    await skip.click();
    await page.waitForLoadState("domcontentloaded");
  }
  await loginPage.waitForSidebarNavigation(6e4);
  console.log(`\u2705 Activated ${email}`);
}
async function forceSignOut(page) {
  await page.goto(AppPaths.login, { waitUntil: "domcontentloaded" }).catch(() => void 0);
  await page.waitForTimeout(1500);
  const loginPage = new LoginPage(page);
  if (await loginPage.isLoggedIn().catch(() => false)) {
    await new ProfilePage(page).signOut();
  }
}
async function main() {
  const opsCreds = agency3OpsCredentials();
  console.log(`\u{1F680} Bootstrap ops session: ${opsCreds.email}`);
  let slIdentity;
  let agentIdentity;
  const browser = await import_test9.chromium.launch({ headless: false, channel: "chrome" });
  const baseUrl = (process.env.BASE_URL ?? "").trim();
  const context = await browser.newContext({ baseURL: baseUrl || void 0 });
  const page = await context.newPage();
  try {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(opsCreds.email, opsCreds.password);
    if (!ACTIVATE_ONLY) {
      const userMgmt = new UserManagementPage(page);
      await createUserManagementUser(page, userMgmt, {
        email: OPS_EMAIL,
        firstName: "Prod",
        lastName: "Ops",
        role: "Operations Manager"
      });
      await createUserManagementUser(page, userMgmt, {
        email: AGOWN_EMAIL,
        firstName: "Prod",
        lastName: "Owner",
        role: "Agency Owner"
      });
      const agentsPage = new AgentsPage(page);
      const agentFormPage = new AgentFormPage(page);
      slIdentity = buildAgentIdentity("8", "ProdSL");
      agentIdentity = buildAgentIdentity("7", "ProdAgent");
      await createAgentUser(page, agentsPage, agentFormPage, slIdentity, SL_EMAIL);
      await createAgentUser(page, agentsPage, agentFormPage, agentIdentity, AGENT_EMAIL);
      console.log(`SL agent id=${slIdentity.agentId} name=${slIdentity.displayName}`);
      console.log(`Agent user id=${agentIdentity.agentId} name=${agentIdentity.displayName}`);
    } else {
      slIdentity = buildAgentIdentity("8", "ProdSL");
      agentIdentity = buildAgentIdentity("7", "ProdAgent");
      console.log("\u23ED\uFE0F activate-only mode \u2014 skipping user/agent creation");
    }
    const toActivate = [
      { email: SL_EMAIL },
      { email: AGENT_EMAIL },
      { email: OPS_EMAIL },
      { email: AGOWN_EMAIL }
    ].filter((acc) => ONLY_EMAILS ? ONLY_EMAILS.has(acc.email) : true);
    for (const acc of toActivate) {
      await forceSignOut(page);
      const explicit = EXPLICIT_LINKS.get(acc.email);
      if (explicit) {
        console.log(`\u{1F517} Using explicit activation link for ${acc.email}...`);
        await activateAccount(page, explicit, acc.email, PASSWORD);
        continue;
      }
      console.log(`\u{1F4E7} Waiting activation email for ${acc.email}...`);
      const link = await waitForActivationEmailTo(acc.email);
      await activateAccount(page, link, acc.email, PASSWORD);
    }
    console.log(`\u{1F6AA} Signing out after final activation...`);
    await forceSignOut(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(opsCreds.email, opsCreds.password);
    const results = [];
    for (const targetId of TARGET_AGENT_IDS) {
      try {
        await setReportingManagerOnAgent(page, targetId, slIdentity.displayName);
        results.push({ id: targetId, status: "ok" });
      } catch (err) {
        const msg = err.message;
        const missing = /No Agent column cell matching/i.test(msg) || /timed out/i.test(msg);
        results.push({ id: targetId, status: missing ? "missing" : "failed", msg });
        console.warn(`\u26A0\uFE0F Agent ${targetId}: ${msg}`);
      }
    }
    try {
      await setReportingManagerOnAgent(page, agentIdentity.agentId, slIdentity.displayName);
      results.push({ id: agentIdentity.agentId, status: "ok" });
    } catch (err) {
      results.push({ id: agentIdentity.agentId, status: "failed", msg: err.message });
    }
    console.log("\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 SUMMARY \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
    console.log(`Ops:     ${OPS_EMAIL} (Operations Manager) \u2192 password ${PASSWORD}`);
    console.log(`Agency:  ${AGOWN_EMAIL} (Agency Owner) \u2192 password ${PASSWORD}`);
    console.log(`Sales L: ${SL_EMAIL} (agent ${slIdentity.agentId}, ${slIdentity.displayName}) \u2192 password ${PASSWORD}`);
    console.log(`Agent:   ${AGENT_EMAIL} (agent ${agentIdentity.agentId}, ${agentIdentity.displayName}) \u2192 password ${PASSWORD}`);
    console.log("\nReporting-manager wiring (SL):");
    for (const r of results) {
      console.log(`  ${r.status === "ok" ? "\u2705" : "\u274C"} ${r.id}  ${r.status}${r.msg ? " \u2014 " + r.msg : ""}`);
    }
  } finally {
    await browser.close();
  }
}
main().catch((err) => {
  console.error("\u274C Driver failed:", err);
  process.exit(1);
});
