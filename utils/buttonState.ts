import { expect, type Locator } from '@playwright/test';

/**
 * Polls a button until it reaches the expected enabled/disabled state instead
 * of a single instant `isEnabled()`/`isDisabled()` read.
 *
 * Why: React-controlled forms can lag flushing the `disabled` attribute behind
 * the field edits (validation debounce / re-render). A single read taken in
 * that window makes the caller branch the WRONG way (e.g. clicking Save while
 * the form is still momentarily valid, or skipping a required-field repair).
 *
 * Returns true when the state was reached within `timeout`, false otherwise —
 * callers then decide their fallback branch. Condition-based: no static waits.
 */
export async function waitForButtonState(
  button: Locator,
  enabled: boolean,
  timeout = 5_000,
): Promise<boolean> {
  try {
    await expect
      .poll(async () => (await button.isEnabled().catch(() => false)) === enabled, {
        timeout,
        intervals: [100, 250, 500, 1_000],
      })
      .toBe(true);
    return true;
  } catch {
    return false;
  }
}