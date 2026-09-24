import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';
import { loadProjectEnv } from './utils/loadEnv';

loadProjectEnv();

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
  outputDir: '.features-gen',
});

/** Detect `-g` / `--grep` from CLI (e.g. `yarn test -g "@agent-master"`). */
function grepPatternFromArgv(): string | undefined {
  const args = process.argv;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-g' || args[i] === '--grep') {
      return args[i + 1];
    }
    if (args[i].startsWith('--grep=')) {
      return args[i].slice('--grep='.length);
    }
  }
  return undefined;
}

const grepPattern = grepPatternFromArgv();
const isAgentMasterRun = grepPattern?.includes('agent-master') ?? false;
/** Bulk field cases share one Review upload + in-process/disk session — one worker. */
const isStatementBulkUpdateRun = grepPattern?.includes('statement-bulk-update') ?? false;
/** @transfer-sheet-regression shares one browser context across Rule List / Policy List / upload-check. */
const isTransferSheetRegressionRun = grepPattern?.includes('transfer-sheet-regression') ?? false;
/** @validate-mmp reuses one activated agent across scenarios in-process. */
const isValidateMmpRun = grepPattern?.includes('validate-mmp') ?? false;
/** @smoke-statement-processing: T092→T096 share fileId/Customer UID captures. */
const isSmokeStatementProcessingRun =
  grepPattern?.includes('smoke-statement-processing') ?? false;

/** Level + licensing need agents from create-agent; enforce via project dependency. */
const AGENT_MASTER_CREATE = '**/agent-master/create-agent.feature.spec.ts';
const AGENT_MASTER_AFTER_CREATE = '**/agent-master/{level-hierarchy,licensing-appointments}.feature.spec.ts';

const chromiumUse = { ...devices['Desktop Chrome'] };

export default defineConfig({
  testDir,
  timeout: 1_800_000,
  retries: 2,
  maxFailures: 0,
  /** Shared-context modules need a single worker. */
  workers:
    isAgentMasterRun ||
    isStatementBulkUpdateRun ||
    isTransferSheetRegressionRun ||
    isValidateMmpRun ||
    isSmokeStatementProcessingRun
      ? 1
      : 5,
  fullyParallel: false,
  reporter: [
    /** Live Gherkin steps + ASCII progress bar (newlines in CI / GitHub Actions). */
    ['./scripts/progress-reporter.ts'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    cucumberReporter('html', { outputFile: 'cucumber-report/index.html' }),
    /** Posts a run summary to Slack; no-op unless SLACK_BOT_TOKEN + SLACK_CHANNEL_ID are set. */
    ['./scripts/slack-reporter.ts'],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://preprod.app.pieq.ai/',
    actionTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'agent-master-create',
      testMatch: AGENT_MASTER_CREATE,
      use: chromiumUse,
    },
    {
      name: 'agent-master-level-license',
      testMatch: AGENT_MASTER_AFTER_CREATE,
      dependencies: ['agent-master-create'],
      use: chromiumUse,
    },
    {
      name: 'chromium',
      testMatch: '**/*.feature.spec.ts',
      testIgnore: [AGENT_MASTER_CREATE, AGENT_MASTER_AFTER_CREATE],
      use: chromiumUse,
    },
  ],
});
