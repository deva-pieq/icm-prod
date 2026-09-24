import { LoginPage } from '../../pages/auth/LoginPage';
import { loadProjectEnv, paymentModuleCredentials } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearPaymentModuleContext } from '../../utils/payment-module/paymentModuleContext';
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

Before({ tags: '@payment-module' }, () => {
  // Two statement uploads + payables/approval/history regularly exceeds the default smoke budget.
  // Do not clear payment-module context here — Background prep is idempotent once per cycle, and
  // later TCs (create → approval → authorize → history) share capturedAmount / batchId.
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000));
});

BeforeAll({ tags: '@payment-module' }, async ({ browser }) => {
  clearPaymentModuleContext();
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@payment-module' }, async () => {
  await closeSharedContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for payment module validation', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
