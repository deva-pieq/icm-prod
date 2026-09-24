import { LoginPage } from '../../pages/auth/LoginPage';
import { advanceE2ECredentials, loadProjectEnv } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearPolicyCancellationAgencyAdvanceContext } from '../../utils/policy-cancellation-agency-advance/policyCancellationAgencyAdvanceContext';
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

Before({ tags: '@policy-cancellation-agency-advance' }, () => {
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000));
  clearPolicyCancellationAgencyAdvanceContext();
});

BeforeAll({ tags: '@policy-cancellation-agency-advance' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@policy-cancellation-agency-advance' }, async () => {
  await closeSharedContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for policy cancellation with advance validation', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
