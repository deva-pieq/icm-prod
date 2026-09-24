import { LoginPage } from '../../pages/auth/LoginPage';
import { agency3OpsCredentials, loadProjectEnv } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import {
  clearStatementProcessingBulkReviewSession,
  clearStatementProcessingContext,
} from '../../utils/statement-processing/statementProcessingContext';
import { deleteGeneratedFiles } from '../../utils/generatedFileCleanup';
import {
  Before,
  BeforeAll,
  AfterAll,
  Given,
  test,
  createSharedPage,
  closeSharedContext,
  loginWithRetry,
} from '../fixtures';

loadProjectEnv();

function requireCredentials() {
  const creds = agency3OpsCredentials();
  test.skip(!creds, 'Add E2E_PASSWORD to .env');
  return creds;
}

// Non-bulk SP scenarios: full context clear each time.
Before({ tags: '@validate-statement-processing and not @statement-bulk-update' }, () => {
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000));
  clearStatementProcessingContext();
});

// Bulk field cases share one Review upload — clear prep paths only, keep bulk session.
Before({ tags: '@statement-bulk-update' }, () => {
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000));
  clearStatementProcessingContext();
});

BeforeAll({ tags: '@validate-statement-processing' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@validate-statement-processing' }, async () => {
  clearStatementProcessingBulkReviewSession();
  await closeSharedContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for statement processing validation', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
