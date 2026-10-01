/* eslint-disable no-console */
/**
 * TEMP live-app probe (delete after use).
 * Dumps the review-statement record grid for a carrierfile uuid.
 * Usage: node scripts/_tmp-live-probe-records.cjs <uuid>
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
  const uuid = process.argv[2];
  if (!uuid) throw new Error('pass uuid');
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

  await page.goto(`${BASE}/commission-processing/review/${uuid}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(12000);

  const out = await page.evaluate(() => {
    const grid = document.querySelector('[data-testid="review-statement-grid"]') || document.body;
    const headers = [...grid.querySelectorAll('[role="columnheader"], .ag-header-cell-text')]
      .map((h) => (h.textContent || '').trim())
      .filter(Boolean);
    const rows = [...grid.querySelectorAll('.ag-center-cols-container .ag-row, .ag-full-width-container .ag-row')]
      .map((r) =>
        [...r.querySelectorAll('[role="gridcell"]')].map((c) => (c.textContent || '').replace(/\s+/g, ' ').trim()),
      )
      .filter((r) => r.length);
    const icons = [...grid.querySelectorAll('.lucide-triangle-alert, [data-testid*="warning"], svg.lucide')]
      .map((i) => i.getAttribute('data-testid') || i.className.baseVal || i.className)
      .slice(0, 10);
    const h1 = document.querySelector('h1')?.textContent?.trim() || '';
    const paras = [...document.querySelectorAll('main p, main h2, main h3')]
      .map((p) => (p.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 12);
    const buttons = [...document.querySelectorAll('main button')]
      .map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 20);
    return { url: location.href, h1, headers, rowCount: rows.length, rows, icons, paras, buttons };
  });
  console.log(JSON.stringify(out, null, 1));
  await page.screenshot({ path: path.join(ROOT, '.generated', `review-${uuid}.png`), fullPage: true }).catch(() => {});
  await browser.close();
})().catch((e) => {
  console.error('PROBE_ERROR', e && e.message);
  process.exit(1);
});
