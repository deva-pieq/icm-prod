/**
 * Explores Product → Commission Structure → Add Rule flow against live app.
 * Creates a fresh product so all commission types are available.
 * Run: node scripts/explore-commission-structure.mjs
 * Output: graphify-out/commission-structure-explore.json
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const projectRoot = path.resolve(import.meta.dirname, '..');
const outFile = path.join(projectRoot, 'graphify-out', 'commission-structure-explore.json');

function loadEnv() {
  const envPath = path.join(projectRoot, '.env');
  if (!fsSync.existsSync(envPath)) return;
  const text = fsSync.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

const baseURL = (process.env.BASE_URL ?? 'https://preprod.app.pieq.ai/').replace(/\/?$/, '/');
const email = (process.env.E2E_EMAIL ?? process.env.LOGIN_VALID_EMAIL ?? '').trim();
const password = (process.env.E2E_PASSWORD ?? process.env.LOGIN_VALID_PASSWORD ?? '').trim();
const stamp = Date.now();

const findings = {
  timestamp: new Date().toISOString(),
  baseURL,
  productCode: `E2E-EXPLORE-${stamp}`,
  productName: `E2E-Explore-${stamp}`,
  flows: [],
  errors: [],
  conclusions: [],
};

function log(step, data) {
  findings.flows.push({ step, ...data });
  console.log(`\n[${step}]`, JSON.stringify(data, null, 2));
}

async function waitSettled(page, ms = 1500) {
  await page.waitForTimeout(ms);
}

async function login(page) {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  const emailInput = page
    .getByRole('textbox', { name: /email address/i })
    .or(page.locator('#username, #email'))
    .first();
  await emailInput.waitFor({ state: 'visible', timeout: 60_000 });
  await emailInput.fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  const passwordInput = page.getByLabel(/^password$/i).or(page.locator('#password')).first();
  await passwordInput.waitFor({ state: 'visible', timeout: 30_000 });
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  await page.getByRole('navigation', { name: 'Sidebar navigation' }).waitFor({ state: 'visible', timeout: 90_000 });
  log('login', { ok: true, url: page.url() });
}

async function selectDropdown(page, testId, label) {
  const trigger = page.getByTestId(testId).getByRole('button').or(page.getByTestId(testId)).first();
  await trigger.click();
  await waitSettled(page, 600);
  const option = page
    .getByRole('listbox')
    .getByRole('option', { name: new RegExp(`^${label}$`, 'i') })
    .first();
  await option.click();
  await waitSettled(page);
}

async function createFreshProduct(page) {
  await page.goto(new URL('/product/create', baseURL).href, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /add product/i }).waitFor({ state: 'visible', timeout: 60_000 });

  await selectDropdown(page, 'carrier-dropdown', 'Aetna');
  await selectDropdown(page, 'line-of-business-dropdown', 'Health');
  await selectDropdown(page, 'product-type-dropdown', 'ACA');
  await page.getByTestId('product-name-input').getByRole('textbox').fill(findings.productName);
  await page.getByTestId('product-code-input').getByRole('textbox').fill(findings.productCode);
  await page.getByPlaceholder(/enter carrier product name/i).fill(`e2e-explore-${stamp}`);
  const addAlias = page
    .locator('div')
    .filter({ has: page.getByText(/carrier product name/i) })
    .getByRole('button', { name: /^add$/i })
    .first();
  if (await addAlias.isEnabled().catch(() => false)) await addAlias.click();

  await page.getByRole('button', { name: /^save$/i }).click();
  const confirm = page
    .getByRole('dialog')
    .getByRole('button', { name: /^save$/i })
    .or(page.getByRole('button', { name: /^save changes$/i }));
  if (await confirm.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await confirm.first().click();
  }
  await page.waitForURL(/\/product\/?$/i, { timeout: 90_000 });
  log('product-created-on-dashboard', { url: page.url(), productCode: findings.productCode });

  const search = page.getByRole('textbox', { name: /search/i }).or(page.getByPlaceholder(/search/i)).first();
  if (await search.isVisible().catch(() => false)) {
    await search.fill(findings.productCode);
    await page.keyboard.press('Enter');
    await waitSettled(page, 2000);
  }
  const grid = page.getByRole('grid', { name: 'Data grid' });
  const row = grid.getByRole('row').filter({ hasText: findings.productCode }).first();
  await row.click();
  await page.waitForURL(/\/product\/edit\//i, { timeout: 60_000 });
  log('product-edit-opened', { url: page.url() });
}

async function openCommissionStructure(page) {
  const link = page
    .getByRole('button', { name: /commission structure/i })
    .or(page.getByRole('link', { name: /commission structure/i }));
  await link.first().click();
  await page.waitForURL(/commission-structure/i, { timeout: 30_000 });
  log('commission-structure', { url: page.url() });
}

async function openAddRuleDialog(page) {
  await page.getByRole('button', { name: /add rule/i }).click();
  await waitSettled(page);
  const dialog = page.getByRole('dialog').filter({ hasText: /add rule/i });
  await dialog.waitFor({ state: 'visible', timeout: 10_000 });
  log('add-rule-dialog-open', {
    url: page.url(),
    dialogButtons: await dialog.getByRole('button').allInnerTexts().catch(() => []),
  });
  return dialog;
}

async function readDropdownOptionsInOpenDialog(page) {
  const dropdown = page
    .getByTestId('commission-type-dropdown')
    .getByRole('button')
    .or(page.getByRole('button', { name: /select commission type/i }))
    .first();
  await dropdown.click();
  await waitSettled(page, 800);
  const options = await page.getByRole('option').allInnerTexts().catch(() => []);
  await page.keyboard.press('Escape');
  await waitSettled(page, 400);
  return options.map((o) => o.trim()).filter(Boolean);
}

async function addRuleType(page, typeLabel) {
  const dialog = await openAddRuleDialog(page);
  const dropdown = page
    .getByTestId('commission-type-dropdown')
    .getByRole('button')
    .or(page.getByRole('button', { name: /select commission type/i }))
    .first();
  await dropdown.click();
  await waitSettled(page, 800);
  const optionsBefore = (await page.getByRole('option').allInnerTexts().catch(() => []))
    .map((o) => o.trim())
    .filter(Boolean);
  log('dropdown-options', { typeLabel, optionsBefore });

  await page.getByRole('option', { name: new RegExp(`^${typeLabel}$`, 'i') }).first().click();
  await waitSettled(page);

  const saveBtn = dialog
    .getByTestId('save-add-rule-button')
    .or(dialog.getByRole('button', { name: /^save$/i }));
  const saveEnabled = await saveBtn.first().isEnabled().catch(() => false);
  log('after-type-selected-in-dialog', {
    typeLabel,
    url: page.url(),
    stillOnStructurePage: /commission-structure/i.test(page.url()),
    saveButtonEnabled: saveEnabled,
  });

  if (saveEnabled) {
    await saveBtn.first().click();
    await waitSettled(page, 2500);
  }

  const editHeading = page.getByRole('heading', { name: /edit commission rule/i });
  log('after-save-add-rule-dialog', {
    typeLabel,
    url: page.url(),
    onEditPage: await editHeading.isVisible().catch(() => false),
    editUrlSuffix: page.url().split('/').slice(-2).join('/'),
  });
}

async function readEditControls(page) {
  const backBtn = page.getByRole('button', { name: /^back$/i });
  const saveDraft = page.getByRole('button', { name: /save draft/i });
  const publish = page.getByRole('button', { name: /publish rule/i });
  const cancel = page.getByRole('button', { name: /^cancel$/i });
  return {
    backVisible: await backBtn.isVisible().catch(() => false),
    backEnabled: await backBtn.isEnabled().catch(() => false),
    saveDraftVisible: await saveDraft.isVisible().catch(() => false),
    saveDraftEnabled: await saveDraft.isEnabled().catch(() => false),
    publishVisible: await publish.isVisible().catch(() => false),
    publishEnabled: await publish.isEnabled().catch(() => false),
    cancelVisible: await cancel.isVisible().catch(() => false),
    cancelEnabled: await cancel.isEnabled().catch(() => false),
    url: page.url(),
  };
}

async function readStructureGrid(page) {
  const grid = page.getByRole('grid', { name: 'Data grid' });
  const text = await grid.innerText().catch(() => '');
  return {
    onStructurePage: /commission-structure/i.test(page.url()),
    gridVisible: await grid.isVisible().catch(() => false),
    containsDraft: /\bdraft\b/i.test(text),
    containsType: (type) => new RegExp(type, 'i').test(text),
    snippet: text.replace(/\s+/g, ' ').slice(0, 600),
  };
}

async function snapshotNavigation(page, label) {
  const buttons = [];
  for (const b of await page.getByRole('button').all()) {
    const name = (await b.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    if (name && name.length < 60) buttons.push(name);
  }
  const links = [];
  for (const l of await page.getByRole('link').all()) {
    const name = (await l.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    if (name && name.length < 60) links.push(name);
  }
  log(label, {
    url: page.url(),
    buttons: [...new Set(buttons)].slice(0, 40),
    links: [...new Set(links)].slice(0, 20),
  });
}

async function navigateToCommissionStructureFromEdit(page, label) {
  const cancel = page.getByRole('button', { name: /^cancel$/i }).last();
  if (await cancel.isVisible().catch(() => false)) {
    await cancel.click();
    await waitSettled(page, 2500);
    const confirmDialog = page.getByRole('dialog');
    if (await confirmDialog.isVisible().catch(() => false)) {
      const buttons = await confirmDialog.getByRole('button').allInnerTexts();
      log(`${label}-cancel-dialog`, { buttons });
      const saveDraft = confirmDialog.getByRole('button', { name: /save draft/i }).first();
      const discard = confirmDialog
        .getByRole('button', { name: /discard|leave|don't save|do not save|cancel/i })
        .last();
      if (await saveDraft.isVisible().catch(() => false)) {
        await saveDraft.click();
        log(`${label}-saved-draft-from-dialog`, { url: page.url() });
      } else if (await discard.isVisible().catch(() => false)) {
        await discard.click();
        log(`${label}-discarded-from-dialog`, { url: page.url() });
      }
      await waitSettled(page, 2000);
    }
    log(label, { action: 'cancel', url: page.url(), structureGrid: await readStructureGrid(page) });
    return;
  }

  const structureTab = page.getByRole('button', { name: /commission structure/i }).last();
  if (await structureTab.isVisible().catch(() => false)) {
    await structureTab.click();
    await waitSettled(page, 2500);
    log(label, { action: 'commission-structure-tab', url: page.url(), structureGrid: await readStructureGrid(page) });
    return;
  }

  log(`${label}-no-nav-found`, { url: page.url() });
}

async function main() {
  if (!email || !password) {
    console.error('Missing E2E_EMAIL / E2E_PASSWORD in .env');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await login(page);
    await createFreshProduct(page);
    await openCommissionStructure(page);

    // Flow 1: Commission — select in dialog, Save, Back without Save draft
    await addRuleType(page, 'Commission');
    log('edit-controls-before-leave', await readEditControls(page));
    await snapshotNavigation(page, 'edit-page-navigation');
    await navigateToCommissionStructureFromEdit(page, 'leave-edit-without-save-draft');

    // Flow 2: Re-open draft row — return to structure list first if still on edit
    if (!/\/commission-structure$|\/commission-structure\/?$/i.test(page.url()) && !page.url().includes('/commission-structure/') === false) {
      if (page.url().includes('/edit/')) {
        await page.goto(page.url().replace(/\/edit\/[^/]+.*$/, '/commission-structure').replace(
          '/product/commission-structure/',
          '/product/edit/',
        ));
      }
    }
    if (page.url().includes('/product/commission-structure/') && page.url().includes('/edit/')) {
      await page.goto(
        page.url().replace(/\/product\/commission-structure\/([^/]+)\/edit\/[^/]+/, '/product/edit/$1/commission-structure'),
      );
      await waitSettled(page, 2500);
      log('forced-structure-list-url', { url: page.url(), structureGrid: await readStructureGrid(page) });
    }

    const grid = page.getByRole('grid', { name: 'Data grid' });
    const commissionRow = grid.getByRole('row').filter({ hasText: /commission/i }).first();
    const rowVisible = await commissionRow.isVisible().catch(() => false);
    log('draft-row-after-back', { rowVisible, grid: await readStructureGrid(page) });
    if (rowVisible) {
      await commissionRow.click();
      await waitSettled(page, 2000);
      log('reopened-draft-by-row-click', { url: page.url(), controls: await readEditControls(page) });
      await navigateToCommissionStructureFromEdit(page, 'leave-edit-second-time');
    }

    // Flow 3: Bonus — add, edit name, Save draft, Back
    await addRuleType(page, 'Bonus');
    const nameInput = page.getByRole('textbox').filter({ has: page.locator('xpath=ancestor::*[contains(., "Rule Name") or contains(., "rule name")]') }).first()
      .or(page.getByLabel(/rule name/i))
      .or(page.locator('[data-testid*="rule-name"] input, [data-testid*="rule-name"]'));
    if (await page.getByTestId('rule-name-input').isVisible().catch(() => false)) {
      await page.getByTestId('rule-name-input').getByRole('textbox').fill(`E2E-Bonus-${stamp}`);
    } else if (await page.getByLabel(/rule name/i).isVisible().catch(() => false)) {
      await page.getByLabel(/rule name/i).fill(`E2E-Bonus-${stamp}`);
    }
    log('bonus-name-filled', await readEditControls(page));
    const saveDraft = page.getByRole('button', { name: /save draft/i });
    if (await saveDraft.isEnabled().catch(() => false)) {
      await saveDraft.click();
      await waitSettled(page, 2000);
      log('bonus-save-draft-clicked', { url: page.url() });
    }
    await navigateToCommissionStructureFromEdit(page, 'leave-edit-after-save-draft');

    // Flow 4: Add rule dropdown after Commission + Bonus drafts exist
    await openAddRuleDialog(page);
    const remaining = await readDropdownOptionsInOpenDialog(page);
    log('dropdown-after-commission-and-bonus', { remaining });
    await page.getByTestId('cancel-add-rule-button').or(page.getByRole('button', { name: /^cancel$/i })).first().click();

    findings.conclusions.push(
      'Add Rule opens a dialog: select commission type dropdown + Cancel + Save (data-testid save-add-rule-button).',
      'Selecting a type alone does not navigate; click Save in the dialog to open /product/commission-structure/{productId}/edit/{TYPE}.',
      'Edit page has Cancel, Save Draft, Create New Version, Publish Rule — no Back button.',
      'Cancel on edit shows unsaved dialog: Cancel (leave) + Keep Editing; leaving returns to structure grid with Draft chip.',
      'Draft is created when Add Rule is confirmed; Save Draft is initially disabled until mandatory fields are valid.',
      'Types with existing drafts are removed from Add Rule dropdown (e.g. after Commission draft, only Bonus and Override remain).',
    );
  } catch (err) {
    findings.errors.push({ message: String(err), stack: err?.stack });
    console.error(err);
  } finally {
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, JSON.stringify(findings, null, 2));
    console.log(`\nWrote ${outFile}`);
    console.log('\nConclusions:', findings.conclusions);
    await browser.close();
  }
}

main();
