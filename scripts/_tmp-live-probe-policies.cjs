/* eslint-disable no-console */
/**
 * TEMP live-app probe (delete after use).
 * Searches the Policies grid for a query and dumps matching rows.
 * Usage: node scripts/_tmp-live-probe-policies.cjs "<query>"
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
function envVal(key) {
  const txt = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  const m = txt.match(new RegExp('^' + key + '=(.*)$', 'm'));
  return m ? m[1].trim() : '';
}

(async () => {
  const queries = process.argv.slice(2);
  const BASE = (envVal('BASE_URL') || 'https://icm.pieq.ai/').replace(/\/$/, '');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1680, height: 1050 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.locator('#username, #email, input[name="username"]').first().fill(envVal('E2E_EMAIL'));
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#password, input[type="password"]').first().waitFor({ timeout: 30000 });
  await page.locator('#password, input[type="password"]').first().fill(envVal('E2E_PASSWORD'));
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/icm\.pieq\.ai/i, { timeout: 60000 });
  await page.waitForTimeout(5000);

  const results = [];
  for (const q of queries) {
    await page.goto(BASE + '/policies', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(9000);
    const search = page
      .getByTestId('data-grid-search-input')
      .locator('input')
      .or(page.getByRole('textbox', { name: /search data grid/i }))
      .first();
    if (!(await search.isVisible().catch(() => false))) {
      results.push({ query: q, error: 'search input not found', url: page.url() });
      continue;
    }
    await search.fill('');
    await search.fill(q);
    await page.waitForTimeout(6000);
    const snap = await page.evaluate(() => {
      const grid =
        document.querySelector('[role="grid"]') ||
        document.querySelector('.ag-root-wrapper') ||
        document.body;
      const headers = [...grid.querySelectorAll('.ag-header-cell-text')]
        .map((h) => (h.textContent || '').trim())
        .filter(Boolean);
      const rows = [...grid.querySelectorAll('.ag-center-cols-container .ag-row')]
        .map((r) =>
          [...r.querySelectorAll('[role="gridcell"]')].map((c) =>
            (c.textContent || '').replace(/\s+/g, ' ').trim(),
          ),
        )
        .filter((r) => r.length);
      const status = document.querySelector('[role="status"]')?.textContent?.trim() || '';
      const empty = /no rows|no records|nothing to show/i.test(document.body.innerText);
      return { headers, rowCount: rows.length, rows: rows.slice(0, 6), status, empty };
    });
    results.push({ query: q, url: page.url(), ...snap });
  }
  console.log(JSON.stringify(results, null, 1));
  await browser.close();
})().catch((e) => {
  console.error('PROBE_ERROR', e && e.message);
  process.exit(1);
});
