import { LoginPage } from '../../pages/auth/LoginPage';
import { loadProjectEnv, smokeCredentials } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearLastStatementUpload } from '../../utils/statementUploadContext';
import { clearTransferContext } from '../../utils/transfer-agent/transferSheetContext';
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
  const creds = smokeCredentials();
  test.skip(
    !creds,
    'Add E2E_EMAIL and E2E_PASSWORD to projects/icm-automation-deva/.env — see .env.example',
  );
  return creds!;
}

Before({ tags: '@statement-upload' }, () => {
  test.setTimeout(smokeScenarioTimeoutMs);
  clearLastStatementUpload();
});

Before({ tags: '@transfer-sheet' }, () => {
  // Multi-phase E2E (upload → needs attention → payables → authorize → history) with
  // backend async processing regularly runs > 420s on preprod; give it the full budget
  // like commission-report / policy-cancellation modules.
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000));
  clearTransferContext();
});

BeforeAll({ tags: '@statement-upload' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@statement-upload' }, async () => {
  await closeSharedContext();
  deleteGeneratedFiles();
});

AfterAll({ tags: '@transfer-sheet' }, async () => {
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for statement upload tests', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
