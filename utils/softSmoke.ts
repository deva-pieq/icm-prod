import { expect, type Locator, type Page } from '@playwright/test';
import {
  smokeContentReadyTimeoutMs,
  smokeHeaderTimeoutMs,
  smokeShellTimeoutMs,
  smokeStepTimeoutMs,
  smokeUrlTimeoutMs,
} from './smokeTimeouts';
import { waitForPageReady, waitForSmokeContentReady } from './smokeCapture';

const SMOKE_TIMEOUT_MS = smokeStepTimeoutMs;
const SHELL_TIMEOUT_MS = smokeShellTimeoutMs;
const URL_TIMEOUT_MS = smokeUrlTimeoutMs;
const HEADER_TIMEOUT_MS = smokeHeaderTimeoutMs;

export type SmokePageExpectation = {
  url?: RegExp;
  /** Unique page heading/section locator from the page object `loc` map. */
  titleLocator: Locator;
  skipGridReady?: boolean;
  /** Skip global loader poll (large statement grids can keep spinners visible). */
  skipLoaderWait?: boolean;
};

/** Soft URL + document-ready + unique header locator (no shared xpath). */
export async function softExpectSmokePageLoaded(
  page: Page,
  expectation: SmokePageExpectation,
  timeout = SMOKE_TIMEOUT_MS,
) {
  await waitForPageReady(page, Math.min(timeout, SHELL_TIMEOUT_MS), {
    skipLoader: expectation.skipLoaderWait,
  });

  if (expectation.url) {
    await expect.soft(page).toHaveURL(expectation.url, { timeout: URL_TIMEOUT_MS });
  }

  await waitForSmokeContentReady(page, timeout, {
    skipGrid: expectation.skipGridReady,
    skipContentPoll: expectation.skipGridReady,
    skipLoader: expectation.skipLoaderWait,
  });

  await expect.soft(expectation.titleLocator).toBeVisible({
    timeout: Math.min(timeout, HEADER_TIMEOUT_MS),
  });
}

export async function softExpectSmokeEditFromGridLoaded(
  page: Page,
  url: RegExp,
  options?: { pageMarker?: Locator },
  timeout = SMOKE_TIMEOUT_MS,
) {
  await waitForPageReady(page, Math.min(timeout, SHELL_TIMEOUT_MS));
  await expect.soft(page).toHaveURL(url, { timeout: URL_TIMEOUT_MS });
  await waitForSmokeContentReady(page, timeout, { skipGrid: true });
  if (options?.pageMarker) {
    await expect.soft(options.pageMarker).toBeVisible({ timeout: Math.min(timeout, HEADER_TIMEOUT_MS) });
  }
}

export async function softExpectSmokeSectionLoaded(
  page: Page,
  options: { url?: RegExp; sectionLocator: Locator },
  timeout = SMOKE_TIMEOUT_MS,
) {
  await waitForPageReady(page, Math.min(timeout, SHELL_TIMEOUT_MS));
  if (options.url) {
    await expect.soft(page).toHaveURL(options.url, { timeout: URL_TIMEOUT_MS });
  }
  await waitForSmokeContentReady(page, timeout, { skipGrid: true });
  await expect.soft(options.sectionLocator).toBeVisible({
    timeout: Math.min(timeout, HEADER_TIMEOUT_MS),
  });
}

export async function softExpectLocatorVisible(locator: Locator, timeout = HEADER_TIMEOUT_MS) {
  await expect.soft(locator).toBeVisible({ timeout });
}
