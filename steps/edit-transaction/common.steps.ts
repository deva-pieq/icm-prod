import { LoginPage } from '../../pages/auth/LoginPage';
import { loadProjectEnv, paymentModuleCredentials } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearEditTransactionContext } from '../../utils/edit-transaction/editTransactionContext';
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
  return paymentModuleCredentials();
}

Before({ tags: '@edit-transaction' }, () => {
  // ACH prep + uploads + Approval edits regularly exceed the default smoke budget.
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000));
});

BeforeAll({ tags: '@edit-transaction' }, async ({ browser }) => {
  clearEditTransactionContext();
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@edit-transaction' }, async () => {
  await closeSharedContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for edit transaction validation', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
