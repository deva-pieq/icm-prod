/**
 * TEMP discovery script — Level & Hierarchy "Add Agent Level" dropdown option labels.
 * NOT part of the suite. Delete after discovery.
 *
 * Usage: npx tsx scripts/tmp-discovery-level-dropdown.ts
 *
 * Prints JSON to stdout: exact option labels + counts/testids used to prove them.
 */
import { chromium, devices } from '@playwright/test';
import { loadProjectEnv, advanceE2ECredentials } from '../utils/loadEnv';

// NOTE: pages/appPaths.ts resolves APP_HOST at MODULE-LOAD time from BASE_URL.
// Static ESM imports would evaluate before loadProjectEnv(), so load env first and
// import the POMs dynamically (the real suite gets this ordering via playwright.config.ts).
loadProjectEnv();

const { LoginPage } = await import('../pages/auth/LoginPage');
const { AgentsPage } = await import('../pages/agents/AgentsPage');
const { AgentEditTabsPage } = await import('../pages/agents/AgentEditTabsPage');
const { AppUrlPatterns, isAppHostUrl } = await import('../pages/appPaths');

const out: Record<string, unknown> = {};
let stage = 'init';
const at = (s: string) => {
  stage = s;
  console.error(`[stage] ${s}`);
};

async function main() {
  const { email, password } = advanceE2ECredentials();
  out.emailDomain = email.split('@')[1] ?? '(none)';
  out.emailVarUsed = email === process.env.E2E_EMAIL_ADVANCE ? 'E2E_EMAIL_ADVANCE' : 'E2E_EMAIL';

const browser = await chromium.launch();
  // Mirror the suite's `devices['Desktop Chrome']` profile (WAF / UA sensitive).
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    baseURL: process.env.BASE_URL,
    viewport: { width: 1600, height: 1000 },
  });
  const page = await context.newPage();

  at('login:goto');
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  at('login:submit');
  try {
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } catch (e) {
    // Capture WHY sign-in never returned to the app host.
    out.loginFailureUrl = page.url();
    out.loginFailureBodyText = (await page.locator('body').innerText().catch(() => ''))
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
    out.loginFailureInputs = await page
      .locator('input')
      .evaluateAll((els) => els.map((e) => ({ name: e.name, type: e.type })))
      .catch(() => []);
    await page.screenshot({ path: '.generated/discovery/login-failure.png', fullPage: false }).catch(() => {});
    throw e;
  }
  at('login:done');
  out.afterLoginUrl = page.url();
  out.isAppHostUrlNow = isAppHostUrl(page.url());

  const agentsPage = new AgentsPage(page);
  const base = (process.env.BASE_URL ?? 'https://icm.pieq.ai/').replace(/\/$/, '');
  await page.goto(`${base}/agents`, { waitUntil: 'domcontentloaded' });

  // Open the first data row's edit page (no seed needed for label discovery).
  await page.waitForTimeout(6000);
  const gridReady = await page.getByTestId('agents-datagrid').isVisible().catch(() => false);
  out.agentsGridVisible = gridReady;

  // Find any non-empty Agent cell and click it to enter edit.
  at('agents:grid');
  const cells = page.getByTestId('agents-datagrid').locator('[role="gridcell"][col-id="agent"]');
  const cellCount = await cells.count();
  out.agentCellCount = cellCount;
  if (cellCount === 0) {
    out.error = 'no agent cells in grid';
    return finish(browser, out);
  }
  let opened = false;
  for (let i = 0; i < cellCount; i++) {
    const text = (await cells.nth(i).innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    await cells.nth(i).click();
    try {
      await page.waitForURL(AppUrlPatterns.agentsEdit, { timeout: 20_000 });
      opened = true;
      out.openedAgentCellText = text;
      out.agentEditUrl = page.url();
      break;
    } catch {
      /* row not clickable, try next */
    }
  }
  if (!opened) {
    out.error = 'could not open any agent edit';
    return finish(browser, out);
  }

  // Acquire grid lock if present (mirrors AgentsPage.openEditByMatchingRow).
  const lock = page.getByRole('button', { name: /acquire lock/i });
  if (await lock.isVisible().catch(() => false)) await lock.click();
  await page.waitForTimeout(3000);

  const tabsPage = new AgentEditTabsPage(page);
  at('tab:levelHierarchy');
  await tabsPage.openLevelHierarchyTab();
  out.onLevelHierarchyTab = true;

  // Grid: what levels are ALREADY assigned (baseline for T039 expectations).
  out.assignedLevelNames = await tabsPage.getLevelNameCellTexts().catch(() => []);
  out.addLevelButtonVisible = await page.getByTestId('add-level-record-button').isVisible().catch(() => false);
  out.addLevelButtonDisabled = await page.getByTestId('add-level-record-button').isDisabled().catch(() => null);
  out.addLevelButtonTestIdCount = await page.getByTestId('add-level-record-button').count();

  at('addLevel:click');
  await tabsPage.clickAddLevel();
  at('addLevel:open');

  // Dump modal internals BEFORE opening dropdown (structure + testids).
  const modal = page.getByTestId(/add-level-record-modal/i);
  out.modalTestIds = await page.evaluate(() => {
    const m = document.querySelector('[data-testid*="add-level-record-modal"]');
    if (!m) return null;
    return [...m.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid'));
  });

  // Locator under test in the POM: modal.getByRole('button', { name: /select/i })
  const pomDropdown = modal.getByRole('button', { name: /select/i });
  out.pomDropdownMatchCount = await pomDropdown.count();
  out.pomDropdownTexts = await pomDropdown.evaluateAll((els) =>
    els.map((e) => ({
      text: (e.textContent || '').replace(/\s+/g, ' ').trim(),
      testid: e.getAttribute('data-testid'),
      tag: e.tagName,
      ariaExpanded: e.getAttribute('aria-expanded'),
      disabled: (e as HTMLButtonElement).disabled,
    })),
  );

  at('dropdown:open');
  await pomDropdown.first().click();
  await page.waitForTimeout(1500);

  // EXACT option labels — role=option (what the POM reads)
  out.pomOptionLocatorCount = await page.getByRole('option').count();
  out.options_role_option = await page.evaluate(() =>
    [...document.querySelectorAll('[role="option"]')].map((e) => ({
      text: (e.textContent || '').replace(/\s+/g, ' ').trim(),
      testid: e.getAttribute('data-testid'),
      id: e.getAttribute('id'),
      ariaSelected: e.getAttribute('aria-selected'),
      disabled: (e as HTMLElement).getAttribute('aria-disabled'),
      hidden: (e as HTMLElement).hidden,
    })),
  );

  // Alternative containers, in case role=option misses rendered rows
  out.listboxOptions = await page.evaluate(() =>
    [...document.querySelectorAll('[role="listbox"] [role="option"]')].map((e) =>
      (e.textContent || '').replace(/\s+/g, ' ').trim(),
    ),
  );
  out.anyListLikeContainers = await page.evaluate(() =>
    [...document.querySelectorAll('[role="listbox"],[role="menu"],[data-testid*="option"],[data-testid*="listbox"],[data-testid*="dropdown"]')]
      .slice(0, 25)
      .map((e) => ({
        tag: e.tagName,
        role: e.getAttribute('role'),
        testid: e.getAttribute('data-testid'),
        id: e.id || null,
        visible: !!(e as HTMLElement).offsetParent,
        childCount: e.children.length,
        text: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
      })),
  );

  // Just the visible popup subtree, to see the real row elements
  out.visibleOptionNodes = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('li,[role="option"],[role="listbox"] *')]
      .filter((e) => (e as HTMLElement).offsetParent !== null)
      .slice(0, 40)
      .map((e) => ({
        tag: e.tagName,
        role: e.getAttribute('role'),
        testid: e.getAttribute('data-testid'),
        text: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      }));
    return nodes;
  });

  return finish(browser, out);
}

async function finish(browser: Awaited<ReturnType<typeof chromium.launch>>, out: Record<string, unknown>) {
  await browser.close();
  console.log('===DISCOVERY_JSON_START===');
  console.log(JSON.stringify(out, null, 2));
  console.log('===DISCOVERY_JSON_END===');
}

main().catch((err) => {
  console.log('===DISCOVERY_JSON_START===');
  console.log(JSON.stringify({ ...out, failedAtStage: stage, fatal: String(err?.message ?? err) }, null, 2));
  console.log('===DISCOVERY_JSON_END===');
  process.exit(1);
});