import { LoginPage } from '../../pages/auth/LoginPage';
import { loadProjectEnv, smokeCredentialsForRole } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearDashboardContext } from '../../utils/dashboard/dashboardContext';
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

function requireAgencyOwnerCredentials() {
  const creds = smokeCredentialsForRole('E2E_EMAIL_OWNER');
  test.skip(
    !creds,
    'Add E2E_EMAIL_OWNER (Agency Owner) and E2E_PASSWORD to projects/icm/.env — see .env.example',
  );
  return creds!;
}

Before({ tags: '@agency-dashboard' }, () => {
  test.setTimeout(smokeScenarioTimeoutMs);
  clearDashboardContext();
});

BeforeAll({ tags: '@agency-dashboard' }, async ({ browser }) => {
  const { email, password } = requireAgencyOwnerCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.ensureLoggedInAs(email, password, 'Agency Owner');
  });
});

AfterAll({ tags: '@agency-dashboard' }, async () => {
  await closeSharedContext();
});

Given('I am logged into PieQ ICM for agency dashboard tests', async ({ loginPage }) => {
  const { email, password } = requireAgencyOwnerCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
