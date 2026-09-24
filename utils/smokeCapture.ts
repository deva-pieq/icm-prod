import type { Locator, Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';
import { isAppHostUrl, isKeycloakLoginUrl } from '../pages/appPaths';
import { isPageLoaderVisible, waitForLoaderHidden } from './pageLoader';
import {
  smokeContentReadyTimeoutMs,
  smokeShellTimeoutMs,
} from './smokeTimeouts';

const SHELL_TIMEOUT_MS = smokeShellTimeoutMs;
const CONTENT_READY_TIMEOUT_MS = smokeContentReadyTimeoutMs;
const GRID_STABLE_MS = 5_000;
const GRID_STABLE_POLL_INTERVALS = [350, 500, 750, 1_000, 3_000] as const;

export async function waitForPageReady(
  page: Page,
  timeout = SHELL_TIMEOUT_MS,
  options?: { skipLoader?: boolean },
) {
  await page.waitForLoadState('domcontentloaded');
  const shell = page
    .getByRole('navigation', { name: 'Sidebar navigation' })
    .or(page.locator('main'))
    .or(page.locator('[class*="h-full"]').first());
  await expect(shell.first()).toBeVisible({ timeout });
  if (!options?.skipLoader) {
    await waitForLoaderHidden(page, Math.max(timeout, CONTENT_READY_TIMEOUT_MS));
  }
}

async function isSmokeContentLoading(page: Page): Promise<boolean> {
  if (await isPageLoaderVisible(page)) return true;

  return page.evaluate(() => {
    const main = document.querySelector('main [class*="h-full"]') ?? document.querySelector('main');
    if (!main) return true;

    const placeholders = main.querySelectorAll(
      '[class*="skeleton"], [class*="animate-pulse"], [class*="blur"]',
    );
    for (const el of placeholders) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 12 || rect.height < 8) continue;
      const style = getComputedStyle(el);
      if (style.filter?.includes('blur') || (style.opacity && parseFloat(style.opacity) < 0.85)) {
        return true;
      }
    }

    return false;
  });
}

export async function waitForSmokeContentReady(
  page: Page,
  timeout = CONTENT_READY_TIMEOUT_MS,
  options?: { skipGrid?: boolean; skipContentPoll?: boolean; skipLoader?: boolean },
) {
  await waitForPageReady(page, Math.min(timeout, SHELL_TIMEOUT_MS), {
    skipLoader: options?.skipLoader,
  });

  if (options?.skipContentPoll) {
    if (!options?.skipGrid) {
      await waitForGridDataReady(page, timeout);
    }
    return;
  }

  await waitForLoaderHidden(page, timeout).catch(() => undefined);

  await page
    .waitForFunction(
      () => {
        const main = document.querySelector('main [class*="h-full"]') ?? document.querySelector('main');
        if (!main) return false;

        const placeholders = main.querySelectorAll(
          '[class*="skeleton"], [class*="animate-pulse"], [class*="blur"]',
        );
        for (const el of placeholders) {
          const rect = el.getBoundingClientRect();
          if (rect.width < 12 || rect.height < 8) continue;
          const style = getComputedStyle(el);
          if (style.filter?.includes('blur') || (style.opacity && parseFloat(style.opacity) < 0.85)) {
            return false;
          }
        }

        return true;
      },
      undefined,
      { timeout },
    )
    .catch(() => undefined);

  if (!(await isSmokeContentLoading(page)) && !options?.skipGrid) {
    await waitForGridDataReady(page, timeout);
  }
}

async function waitForGridDataReady(page: Page, timeout: number) {
  const grid = page.getByRole('grid', { name: 'Data grid' });
  if (!(await grid.isVisible({ timeout: 3_000 }).catch(() => false))) return;

  const dataRow = grid
    .getByRole('row')
    .filter({ hasNot: page.getByRole('columnheader') })
    .first();
  await expect(dataRow).toBeVisible({ timeout: Math.min(timeout, 60_000) });

  await page
    .waitForFunction(
      () => {
        const gridEl =
          document.querySelector('[role="grid"][aria-label="Data grid"]') ??
          document.querySelector('main [role="grid"]');
        if (!gridEl) return true;

        const rows = [...gridEl.querySelectorAll('[role="row"]')].filter(
          (r) => !r.querySelector('[role="columnheader"]'),
        );
        if (rows.length === 0) return false;

        const cells = rows[0].querySelectorAll('[role="gridcell"], td');
        if (cells.length === 0) return false;

        for (const cell of cells) {
          const style = getComputedStyle(cell);
          if (style.filter?.includes('blur')) return false;
          if (style.opacity && parseFloat(style.opacity) < 0.6) return false;
          const text = (cell.textContent || '').trim();
          if (text.length > 0 && !/^\.+$|^—+$|^-$|^…+$/.test(text)) return true;
        }
        return false;
      },
      undefined,
      { timeout: Math.min(timeout, 60_000) },
    )
    .catch(() => undefined);

  await waitForGridRowCountStable(grid, page, Math.min(timeout, GRID_STABLE_MS));
}

async function waitForGridRowCountStable(grid: Locator, page: Page, timeoutMs: number) {
  const state = { lastCount: -1, stablePasses: 0 };
  const dataRows = () =>
    grid.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });

  await expect
    .poll(
      async () => {
        const count = await dataRows().count();
        if (count > 0 && count === state.lastCount) {
          state.stablePasses += 1;
        } else {
          state.stablePasses = 0;
          state.lastCount = count;
        }
        return state.stablePasses >= 2;
      },
      { timeout: timeoutMs, intervals: [...GRID_STABLE_POLL_INTERVALS] },
    )
    .toBe(true);
}

export async function attachSmokeScreenshot(page: Page, testInfo: TestInfo, label: string) {
  const url = page.url();
  if (isKeycloakLoginUrl(url) || !isAppHostUrl(url)) return;

  try {
    if (process.env.TAKE_SCREENSHOTS === 'true') {
      await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => undefined);
      const buffer = await page.screenshot({ fullPage: true, timeout: 45_000 });
      const safe = label.replace(/[^\w.-]+/g, '_').slice(0, 120);
      await testInfo.attach(`smoke-${safe}`, { body: buffer, contentType: 'image/png' });
    }
  } catch {
  }
}
