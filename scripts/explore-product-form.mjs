#!/usr/bin/env node
import { chromium } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] === undefined) {
      process.env[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
}

const baseURL = process.env.BASE_URL?.trim() || 'https://preprod.app.pieq.ai';
const email = process.env.E2E_EMAIL?.trim();
const password = process.env.E2E_PASSWORD;

async function login(page) {
  await page.goto(new URL('/', baseURL).href, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const emailBox = page
    .getByRole('textbox', { name: /email address/i })
    .or(page.locator('#username, #email'))
    .first();
  await emailBox.waitFor({ state: 'visible', timeout: 60_000 });
  await emailBox.fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  const pwInput = page.getByLabel(/^password$/i).or(page.locator('input[type="password"]')).first();
  await pwInput.waitFor({ state: 'visible', timeout: 60_000 });
  await pwInput.fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  await page.waitForURL(/\.app\.pieq\.ai/i, { timeout: 120_000 });
  await page.getByRole('navigation', { name: 'Sidebar navigation' }).waitFor({ state: 'visible', timeout: 120_000 });
}

async function dumpTestIds(page, label) {
  const testIds = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid]')].map((el) => el.getAttribute('data-testid')),
  );
  console.log(`\n=== ${label} testids ===`);
  console.log([...new Set(testIds)].sort().join('\n'));
}

async function main() {
  if (!email || !password) {
    console.error('E2E_EMAIL and E2E_PASSWORD required in .env');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await login(page);
    await page.getByTestId('sidebar-nav-item-products').click({ timeout: 60_000 });
    await page.waitForURL(/\/product\/?$/i, { timeout: 120_000 });
    await page.waitForTimeout(8000);
    await dumpTestIds(page, 'products list');

    const addBtn = page.getByTestId('add-new-product').or(page.getByRole('button', { name: /add product/i }));
    await addBtn.first().click();
    await page.waitForURL(/\/product\/create/i, { timeout: 60_000 });
    await page.waitForTimeout(3000);
    await dumpTestIds(page, 'add product form');

    const saveBtn = page.getByTestId('save-button');
    console.log('\nSave enabled before fill:', await saveBtn.isEnabled().catch(() => false));

    // Trigger validation by filling and clearing required fields
    await page.getByTestId('product-name-input').getByRole('textbox').fill('x');
    await page.getByTestId('product-name-input').getByRole('textbox').fill('');
    await page.getByTestId('product-name-input').getByRole('textbox').blur();
    await page.waitForTimeout(1000);

    const errorsAfterBlur = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid]')]
        .filter((el) => /error/i.test(el.getAttribute('data-testid') ?? ''))
        .map((el) => ({ testid: el.getAttribute('data-testid'), text: el.textContent?.trim().slice(0, 150) })),
    );
    console.log('\n=== error testids after blur ===');
    console.log(JSON.stringify(errorsAfterBlur, null, 2));

    const visibleText = await page.evaluate(() =>
      [...document.querySelectorAll('p, span, div')]
        .map((el) => el.textContent?.trim())
        .filter((t) => t && /required|invalid|must|error|duplicate|already/i.test(t))
        .slice(0, 30),
    );
    console.log('\n=== error-like text ===');
    console.log([...new Set(visibleText)]);

    console.log('\n=== aria snapshot (form) ===');
    const snap = await page.locator('main').ariaSnapshot().catch(() => '');
    console.log(snap.slice(0, 12000));

    // Fill valid defaults and check save
    const ts = Date.now();
    const dropdowns = [
      ['carrier-dropdown', 'Aetna'],
      ['line-of-business-dropdown', 'Health'],
      ['product-type-dropdown', 'ACA'],
    ];
    for (const [testId, label] of dropdowns) {
      const trigger = page.getByTestId(testId).getByRole('button').or(page.getByTestId(testId));
      await trigger.first().click();
      await page.getByRole('option', { name: new RegExp(`^${label}$`, 'i') }).first().click();
      await page.waitForTimeout(500);
    }

    await page.getByTestId('product-name-input').getByRole('textbox').fill(`E2E-Explore-${ts}`);
    await page.getByTestId('product-code-input').getByRole('textbox').fill(`E2E-CODE-${ts}`);

    const statusDropdown = page.getByTestId('status-dropdown');
    if (await statusDropdown.isVisible().catch(() => false)) {
      await statusDropdown.click();
      await page.getByRole('option', { name: /^active$/i }).first().click();
      await page.waitForTimeout(500);
      console.log('\nstatus-dropdown: found');
    } else {
      console.log('\nstatus-dropdown: NOT visible');
    }

    const desc = page.getByTestId('description-textarea');
    if (await desc.isVisible().catch(() => false)) {
      console.log('description-textarea: found');
    }

    const expiry = page.getByTestId('expiry-date-input');
    if (await expiry.isVisible().catch(() => false)) {
      console.log('expiry-date-input: found');
    }

    const states = page.getByTestId('state-coverage-dropdown');
    if (await states.isVisible().catch(() => false)) {
      console.log('state-coverage-dropdown: found');
    }

    const aliasInput = page.getByTestId('product-name-alias-input');
    if (await aliasInput.isVisible().catch(() => false)) {
      await aliasInput.getByRole('textbox').fill(`carrier-explore-${ts}`);
      const addAliasBtn = page.getByTestId('add-alias-button');
      console.log('add-alias-button enabled:', await addAliasBtn.isEnabled().catch(() => false));
      if (await addAliasBtn.isEnabled().catch(() => false)) {
        await addAliasBtn.click();
        await page.waitForTimeout(500);
      }
      // duplicate alias
      await aliasInput.getByRole('textbox').fill(`carrier-explore-${ts}`);
      if (await addAliasBtn.isEnabled().catch(() => false)) {
        await addAliasBtn.click();
        await page.waitForTimeout(500);
      }
      const dupErrors = await page.evaluate(() =>
        [...document.querySelectorAll('[data-testid]')]
          .filter((el) => /error|alias/i.test(el.getAttribute('data-testid') ?? ''))
          .map((el) => ({ testid: el.getAttribute('data-testid'), text: el.textContent?.trim().slice(0, 150) })),
      );
      console.log('alias errors:', JSON.stringify(dupErrors));
    }

    console.log('\nSave enabled after fill:', await saveBtn.isEnabled().catch(() => false));

    // Name validation probes
    const nameInput = page.getByTestId('product-name-input').getByRole('textbox');
    for (const [label, value] of [
      ['spaces', '   '],
      ['special', 'Test@#$%'],
      ['max', 'A'.repeat(300)],
    ]) {
      await nameInput.fill(value);
      await nameInput.blur();
      await page.waitForTimeout(800);
      const nameErrors = await page.evaluate(() =>
        [...document.querySelectorAll('[data-testid]')]
          .filter((el) => /error|product-name/i.test(el.getAttribute('data-testid') ?? ''))
          .map((el) => ({ testid: el.getAttribute('data-testid'), text: el.textContent?.trim().slice(0, 150) })),
      );
      console.log(`\nname ${label} save enabled:`, await saveBtn.isEnabled(), 'errors:', JSON.stringify(nameErrors));
    }

    // Restore valid name and save seed product for duplicate code test
    await nameInput.fill(`E2E-Seed-${ts}`);
    await page.getByTestId('product-code-input').getByRole('textbox').fill(`E2E-SEED-${ts}`);
    if (await saveBtn.isEnabled()) {
      await saveBtn.click();
      const confirm = page.getByRole('dialog').getByRole('button', { name: /^save$/i });
      if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) await confirm.click();
      await page.waitForTimeout(5000);
      console.log('\nAfter seed save URL:', page.url());
    }

    // Try duplicate code on new form
    await page.getByTestId('add-new-product').click();
    await page.waitForURL(/\/product\/create/i);
    await page.waitForTimeout(2000);
    for (const [testId, label] of dropdowns) {
      const trigger = page.getByTestId(testId).getByRole('button').or(page.getByTestId(testId));
      await trigger.first().click();
      await page.getByRole('option', { name: new RegExp(`^${label}$`, 'i') }).first().click();
    }
    await nameInput.fill(`E2E-Dup-${ts}`);
    await page.getByTestId('product-code-input').getByRole('textbox').fill(`E2E-SEED-${ts}`);
    console.log('\nDuplicate code save enabled:', await saveBtn.isEnabled());
    if (await saveBtn.isEnabled()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      const dupMsgs = await page.evaluate(() =>
        [...document.querySelectorAll('[data-testid], [role="alert"]')]
          .map((el) => ({ testid: el.getAttribute('data-testid'), role: el.getAttribute('role'), text: el.textContent?.trim().slice(0, 200) }))
          .filter((x) => x.text && /duplicate|already|exist|unique|error/i.test(x.text)),
      );
      console.log('duplicate code messages:', JSON.stringify(dupMsgs, null, 2));
      console.log('URL after dup save:', page.url());
    }

    // Expiry before effective
    await page.getByTestId('back-button').click().catch(() => page.goBack());
    await page.waitForTimeout(2000);
    await page.getByTestId('add-new-product').click();
    await page.waitForURL(/\/product\/create/i);
    for (const [testId, label] of dropdowns) {
      const trigger = page.getByTestId(testId).getByRole('button').or(page.getByTestId(testId));
      await trigger.first().click();
      await page.getByRole('option', { name: new RegExp(`^${label}$`, 'i') }).first().click();
    }
    await nameInput.fill(`E2E-Date-${ts}`);
    await page.getByTestId('product-code-input').getByRole('textbox').fill(`E2E-DATE-${ts}`);
    await page.getByTestId('effective-date-input').getByRole('textbox').fill('01/01/2026');
    await page.getByTestId('expiry-date-input').getByRole('textbox').fill('01/01/2021');
    await page.getByTestId('expiry-date-input').getByRole('textbox').blur();
    await page.waitForTimeout(1000);
    const dateErrors = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid]')]
        .filter((el) => /error|date|expir/i.test(el.getAttribute('data-testid') ?? ''))
        .map((el) => ({ testid: el.getAttribute('data-testid'), text: el.textContent?.trim().slice(0, 150) })),
    );
    console.log('\nexpiry before effective - save enabled:', await saveBtn.isEnabled(), 'errors:', JSON.stringify(dateErrors));
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
