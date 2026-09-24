import type { Page } from '@playwright/test';
import { LoginPage } from '../../pages/auth/LoginPage';
import { ProcessingCutOffPage } from '../../pages/processing-cut-off/ProcessingCutOffPage';
import { loadProjectEnv, smokeCredentials } from '../../utils/loadEnv';
import { clearPriorCutOffDay } from '../../utils/processing-cut-off/processingCutOffContext';
import {
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
    'Add E2E_EMAIL and E2E_PASSWORD (or LOGIN_VALID_EMAIL / LOGIN_VALID_PASSWORD) to projects/icm/.env — see .env.example',
  );
  return creds!;
}

/** Kept at module scope so AfterAll can restore settings before the shared page dies. */
let moduleSharedPage: Page | null = null;

BeforeAll({ tags: '@processing-cut-off' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    moduleSharedPage = page;
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@processing-cut-off' }, async () => {
  // Restore the cut-off day captured BEFORE the module's first change (falls
  // back to nothing captured → no-op) so other modules keep their expected
  // weekly cycle. Default agency cycle is historically Thursday→Wednesday.
  if (moduleSharedPage && !moduleSharedPage.isClosed()) {
    try {
      await new ProcessingCutOffPage(moduleSharedPage).restorePriorCutOffDay();
    } catch (err) {
      console.warn('[processing-cut-off] Could not restore Processing Cut Off Day:', err);
    }
  }
  clearPriorCutOffDay();
  await closeSharedContext();
});

Given('I am logged into PieQ ICM for processing cut off tests', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
