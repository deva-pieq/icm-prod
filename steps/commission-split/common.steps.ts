import { LoginPage } from '../../pages/auth/LoginPage';
import { loadProjectEnv, smokeCredentials } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearCommissionTruthContext } from '../../utils/commission-split/commissionTruthContext';
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

Before({ tags: '@validate-commission-truth' }, () => {
  // Oscar inbox runs can validate 25+ commission-detail rows (product lookup per unique product).
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000));
  clearCommissionTruthContext();
});

BeforeAll({ tags: '@validate-commission-truth' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@validate-commission-truth' }, async () => {
  await closeSharedContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for commission truth validation', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
