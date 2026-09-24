import { LoginPage } from '../../pages/auth/LoginPage';
import { loadProjectEnv, smokeCredentialsForRole } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import {
  Before,
  BeforeAll,
  AfterAll,
  test,
  createSharedPage,
  closeSharedContext,
  loginWithRetry,
} from '../fixtures';

loadProjectEnv();

function requireOpsManagerCredentials() {
  const creds = smokeCredentialsForRole('E2E_EMAIL');
  test.skip(
    !creds,
    'Add E2E_EMAIL (Operations Manager) and E2E_PASSWORD to projects/icm/.env — see .env.example',
  );
  return creds!;
}

Before({ tags: '@dashboard' }, () => {
  test.setTimeout(smokeScenarioTimeoutMs);
});

// Isolated context for the whole @dashboard module — login once as Operations Manager.
BeforeAll({ tags: '@dashboard' }, async ({ browser }) => {
  const { email, password } = requireOpsManagerCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.ensureLoggedInAs(email, password, 'Operations Manager');
  });
});

AfterAll({ tags: '@dashboard' }, async () => {
  await closeSharedContext();
});
