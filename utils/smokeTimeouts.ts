/** Env-driven timeouts for @smoke (slow pre-prod friendly). */
export const smokeScenarioTimeoutMs = parsePositiveMs(process.env.SMOKE_TEST_TIMEOUT_MS, 420_000);
export const smokeStepTimeoutMs = parsePositiveMs(process.env.SMOKE_STEP_TIMEOUT_MS, 100_000);
export const smokeShellTimeoutMs = parsePositiveMs(process.env.SMOKE_SHELL_TIMEOUT_MS, 30_000);
export const smokeUrlTimeoutMs = parsePositiveMs(process.env.SMOKE_URL_TIMEOUT_MS, 20_000);
export const smokeHeaderTimeoutMs = parsePositiveMs(process.env.SMOKE_HEADER_TIMEOUT_MS, 25_000);
export const smokeContentReadyTimeoutMs = parsePositiveMs(process.env.SMOKE_CONTENT_READY_TIMEOUT_MS, 45_000);
/** Max wait for loading spinner / circle to disappear (defaults to content-ready timeout). */
export const pageLoaderTimeoutMs = parsePositiveMs(
  process.env.PAGE_LOADER_TIMEOUT_MS,
  Math.max(smokeContentReadyTimeoutMs, 90_000),
);
export const smokeStaticWaitMs = parsePositiveMs(process.env.SMOKE_STATIC_WAIT_MS, 2_000);

function parsePositiveMs(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
