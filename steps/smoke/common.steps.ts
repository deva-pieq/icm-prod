import { LoginPage } from '../../pages/auth/LoginPage';
import { loadProjectEnv, smokeCredentials } from '../../utils/loadEnv';
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
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { deleteGeneratedFiles } from '../../utils/generatedFileCleanup';

loadProjectEnv();

function requireCredentials() {
  const creds = smokeCredentials();
  test.skip(
    !creds,
    'Add E2E_EMAIL and E2E_PASSWORD (or LOGIN_VALID_EMAIL / LOGIN_VALID_PASSWORD) to projects/icm-automation-deva/.env — see .env.example',
  );
  return creds!;
}

Before({ tags: '@smoke' }, () => {
  test.setTimeout(smokeScenarioTimeoutMs);
});

/** Upload → Completed phases need extract + 60s settle; keep above default smoke cap. */
Before({ tags: '@smoke-statement-processing' }, () => {
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 600_000));
});

BeforeAll({ tags: '@smoke' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@smoke' }, async () => {
  await closeSharedContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for smoke tests', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
