/** TEMPORARY probe-only config: same baseURL/retries as playwright.config.ts, testDir = tests-probe. */
import { defineConfig, devices } from '@playwright/test';
import { loadProjectEnv } from './utils/loadEnv';

loadProjectEnv();

export default defineConfig({
  testDir: 'tests-probe',
  timeout: 900_000,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [['line']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.BASE_URL ?? 'https://preprod.app.pieq.ai/',
    actionTimeout: 30_000,
  },
});
