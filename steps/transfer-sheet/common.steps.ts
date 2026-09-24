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
    'Add E2E_EMAIL and E2E_PASSWORD to projects/icm/.env — see .env.example',
  );
  return creds!;
}

Before({ tags: '@transfer-sheet-regression' }, () => {
  test.setTimeout(smokeScenarioTimeoutMs);
  clearTransferContext();
  clearLastStatementUpload();
});

Before({ tags: '@upload-check' }, () => {
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000));
});

BeforeAll({ tags: '@transfer-sheet-regression' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@transfer-sheet-regression' }, async () => {
  await closeSharedContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for transfer sheet regression tests', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
