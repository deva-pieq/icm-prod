import { LoginPage } from '../../pages/auth/LoginPage';
import { advanceE2ECredentials, loadProjectEnv } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearAdvanceAdjustmentContext } from '../../utils/advance-adjustment/advanceAdjustmentContext';
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
  return advanceE2ECredentials();
}

Before({ tags: '@validate-advance-adjustment' }, () => {
  test.setTimeout(smokeScenarioTimeoutMs);
  clearAdvanceAdjustmentContext();
});

BeforeAll({ tags: '@validate-advance-adjustment' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@validate-advance-adjustment' }, async () => {
  await closeSharedContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for advance adjustment validation', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
