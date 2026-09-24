import { defineConfig } from '@playwright/test';
import { loadProjectEnv } from './utils/loadEnv';

loadProjectEnv();

export default defineConfig({
  testDir: './utils/agent-activation',
  timeout: 300000,
  retries: 0,
  workers: 1,
  reporter: 'line',
  use: {
    headless: false,
    baseURL: process.env.BASE_URL || 'https://preprod.app.pieq.ai/',
  },
});