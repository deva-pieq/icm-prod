import { LoginPage } from '../../pages/auth/LoginPage';
import { loadProjectEnv, smokeCredentialsForRole } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearAgentDashboardFixtureContext } from '../../utils/dashboard/agentDashboardFixtureContext';
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

function requireAgentCredentials() {
  const creds = smokeCredentialsForRole('E2E_EMAIL_AGENT');
  test.skip(
    !creds,
    'Add E2E_EMAIL_AGENT (Agent) and E2E_PASSWORD to projects/icm/.env — see .env.example',
  );
  return creds!;
}

Before({ tags: '@agent-dashboard' }, () => {
  test.setTimeout(smokeScenarioTimeoutMs);
  clearAgentDashboardFixtureContext();
});

BeforeAll({ tags: '@agent-dashboard' }, async ({ browser }) => {
  const { email, password } = requireAgentCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.ensureLoggedInAs(email, password, 'Agent');
  });
});

AfterAll({ tags: '@agent-dashboard' }, async () => {
  await closeSharedContext();
});

Given('I am logged into PieQ ICM for agent dashboard tests', async ({ loginPage }) => {
  const { email, password } = requireAgentCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
