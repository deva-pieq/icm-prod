import { LoginPage } from '../../pages/auth/LoginPage';
import { advanceE2ECredentials, loadProjectEnv } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearPolicyCancellationAgencyCreditContext } from '../../utils/policy-cancellation-agency-credit/policyCancellationAgencyCreditContext';
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

Before({ tags: '@policy-cancellation-agency-credit' }, () => {
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000));
  clearPolicyCancellationAgencyCreditContext();
});

BeforeAll({ tags: '@policy-cancellation-agency-credit' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    // The app shows a browser `beforeunload` prompt when navigating away from the
    // dirty reconciliation form. Playwright auto-dismisses it, which cancels the
    // navigation and leaves the URL stuck. Accept the dialog so navigation proceeds.
    page.on('dialog', (dialog) => {
      void dialog.accept().catch(() => {});
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@policy-cancellation-agency-credit' }, async () => {
  await closeSharedContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for policy cancellation agency credit validation', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
