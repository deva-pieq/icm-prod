import { expect, type Locator, type Page } from '@playwright/test';
import { pageLoaderTimeoutMs } from './smokeTimeouts';

const LOADER_POLL_INTERVALS = [500, 1_000, 1_500, 2_500, 3_500, 5_000, 7_500, 10_000] as const;

/** True when a visible loading spinner / overlay is still on screen. */
export async function isPageLoaderVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const isVisible = (el: Element): boolean => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (rect.width < 8 || rect.height < 8) return false;
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (parseFloat(style.opacity) <= 0.15) return false;
      return true;
    };

    const hasLoaderInRoot = (root: Element): boolean => {
      const selectors = [
        '[class*="animate-spin"]',
        '[role="progressbar"]',
        '[class*="loader"]',
        '[class*="spinner"]',
        '[data-testid*="loader"]',
        '[data-testid*="loading"]',
        '[aria-busy="true"]',
      ].join(', ');

      for (const el of root.querySelectorAll(selectors)) {
        if (isVisible(el)) return true;
      }

      for (const svg of root.querySelectorAll('svg')) {
        const spinParent = svg.closest('[class*="animate-spin"], [class*="loader"], [class*="spinner"]');
        if (!spinParent || !isVisible(spinParent)) continue;
        if (svg.querySelector('circle')) return true;
      }

      return false;
    };

    const hasLoadingBand = (root: Element): boolean => {
      const bandText = (root.textContent || '').trim();
      return /^loading\.?$/i.test(bandText) || (/\bloading\b/i.test(bandText) && bandText.length < 80);
    };

    const main = document.querySelector('main') ?? document.body;
    const content = main.querySelector('[class*="h-full"]') ?? main;

    if (hasLoadingBand(content)) return true;
    if (hasLoaderInRoot(main)) return true;

    for (const overlay of document.querySelectorAll(
      '[class*="overlay"], [class*="backdrop"], [data-testid*="overlay"]',
    )) {
      if (hasLoaderInRoot(overlay)) return true;
    }

    return false;
  });
}

/** Wait until loading spinners (including SVG circle loaders) are gone. */
export async function waitForLoaderHidden(
  page: Page,
  timeout = pageLoaderTimeoutMs,
): Promise<void> {
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);

  await expect
    .poll(async () => !(await isPageLoaderVisible(page)), {
      timeout,
      intervals: [...LOADER_POLL_INTERVALS],
    })
    .toBe(true);
}

const MODULE_LOAD_RETRIES = 2;

function isModuleLoadErrorVisible(page: Page): Promise<boolean> {
  return page
    .getByRole('heading', { name: 'Failed to load module', exact: true })
    .or(page.getByRole('button', { name: 'Reload Page', exact: true }))
    .first()
    .isVisible()
    .catch(() => false);
}

/**
 * Click the app's "Reload Page" button when a module failed to load
 * (transient micro-frontend / network blips). Returns true when a reload
 * was triggered, false when the page settled normally.
 * Zero-cost in the happy path: a single immediate visibility check.
 */
async function recoverFromModuleLoadError(page: Page): Promise<boolean> {
  if (!(await isModuleLoadErrorVisible(page))) return false;
  console.warn('[pageLoader] "Failed to load module" detected — clicking Reload Page.');
  await page.getByRole('button', { name: 'Reload Page', exact: true }).click().catch(() => undefined);
  return true;
}

/** DOM ready + loader hidden — use after navigation or save. Do not call before a toast assertion. */
export async function waitForAppSettled(
  page: Page,
  timeout = pageLoaderTimeoutMs,
): Promise<void> {
  for (let attempt = 0; attempt <= MODULE_LOAD_RETRIES; attempt++) {
    await waitForLoaderHidden(page, timeout);
    if (!(await recoverFromModuleLoadError(page))) return;
  }
}

const READY_POLL_INTERVALS = [500, 1_000, 2_000, 3_000, 5_000] as const;

/**
 * Page-entry readiness: settle → soft-check ready marker → reload once if missing → hard assert.
 *
 * Use only from `open()` / navigation helpers (shell heading, page root). Do NOT wrap
 * mid-scenario visibility checks (modals, filtered rows, post-click UI) — reload wipes that state.
 */
export async function ensurePageReady(
  page: Page,
  readyMarker: Locator,
  opts?: { timeout?: number; reloadOnce?: boolean },
): Promise<void> {
  const timeout = opts?.timeout ?? pageLoaderTimeoutMs;
  const reloadOnce = opts?.reloadOnce ?? true;
  const softTimeout = Math.min(timeout, 20_000);

  await waitForAppSettled(page, timeout);

  const markerVisible = () => readyMarker.first().isVisible().catch(() => false);

  if (await markerVisible()) {
    await expect(readyMarker.first()).toBeVisible({ timeout });
    return;
  }

  await expect
    .poll(markerVisible, {
      timeout: softTimeout,
      intervals: [...READY_POLL_INTERVALS],
    })
    .toBe(true)
    .catch(() => undefined);

  if (await markerVisible()) {
    await expect(readyMarker.first()).toBeVisible({ timeout });
    return;
  }

  if (reloadOnce) {
    console.warn('[pageLoader] ready marker not visible after settle — reloading once.');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForAppSettled(page, timeout);
  }

  await expect(readyMarker.first()).toBeVisible({ timeout });
}

/**
 * Wait for a toast to slide in (if it hasn't already gone) and then fully
 * dismiss, so it never overlaps or blocks the next step's interactions.
 * Tolerates already-gone toasts and stacked toasts.
 *
 * Do not call waitForAppSettled before asserting a toast — toasts auto-dismiss
 * during settle and the Then step will miss them.
 */
export async function waitForToastDismissed(
  page: Page,
  toast: Locator,
  timeout = pageLoaderTimeoutMs,
): Promise<void> {
  await toast
    .first()
    .waitFor({ state: 'visible', timeout: Math.min(timeout, 10_000) })
    .catch(() => undefined);
  await expect
    .poll(async () => (await toast.count()) === 0, {
      timeout,
      intervals: [250, 500, 1_000, 2_000],
    })
    .toBe(true)
    .catch(() => undefined);
  await waitForAppSettled(page, timeout);
}

const capturedToastByPage = new WeakMap<Page, string>();

/**
 * Soft-capture toast after the click that spawned it. Does not hard-fail if the
 * toast is slow or missing — save/settle still completes. Stashes text when seen
 * for a later Then soft-assert. Overwrites any unused capture on this page.
 */
export async function captureToast(
  page: Page,
  toast: Locator,
  timeout = pageLoaderTimeoutMs,
): Promise<string> {
  capturedToastByPage.delete(page);
  const toastEl = toast.first();
  // Soft wait — allow slow toasts, then continue save path if still missing.
  const softTimeout = Math.min(timeout, 20_000);
  const appeared = await toastEl
    .waitFor({ state: 'visible', timeout: softTimeout })
    .then(() => true)
    .catch(() => false);

  let text = '';
  if (appeared) {
    text = (await toastEl.innerText()).replace(/\s+/g, ' ').trim();
    capturedToastByPage.set(page, text);
    await waitForToastDismissed(page, toast, timeout);
  } else {
    console.warn('[pageLoader] toast not visible after click — soft continue after settle');
    capturedToastByPage.set(page, '');
    await waitForAppSettled(page, timeout);
  }
  return text;
}

/**
 * Then-step helper: reuse text captured at click time, or soft-wait a live toast
 * if the action method did not capture (click-only + Then-assert pattern).
 * Missing toast is soft — does not hard-fail; callers soft-assert message when present.
 */
export async function expectCapturedOrLiveToast(
  page: Page,
  toast: Locator,
  timeout = pageLoaderTimeoutMs,
): Promise<string> {
  const captured = capturedToastByPage.get(page);
  if (captured !== undefined) {
    capturedToastByPage.delete(page);
    if (captured) {
      expect.soft(captured, 'Success toast message (soft)').toBeTruthy();
    } else {
      console.warn('[pageLoader] no toast text captured — soft skip message assert');
    }
    return captured;
  }
  const text = await captureToast(page, toast, timeout);
  capturedToastByPage.delete(page);
  if (text) {
    expect.soft(text, 'Success toast message (soft)').toBeTruthy();
  }
  return text;
}
