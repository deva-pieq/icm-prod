import { LoginPage } from '../../pages/auth/LoginPage';
import { loadProjectEnv, smokeCredentials } from '../../utils/loadEnv';
import { clearPolicyMasterContext } from '../../utils/policy-master/policyMasterContext';
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

BeforeAll({ tags: '@policy-master' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@policy-master' }, async () => {
  clearPolicyMasterContext();
  await closeSharedContext();
});

Given('I am logged into PieQ ICM for policy master tests', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
