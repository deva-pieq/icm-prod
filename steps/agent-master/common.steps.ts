import { LoginPage } from '../../pages/auth/LoginPage';
import { advanceE2ECredentials, loadProjectEnv } from '../../utils/loadEnv';
import { clearAgentContext } from '../../utils/agents/agentContext';
import { createSeedAgent } from '../../utils/agents/seedAgent';
import {
  BeforeAll,
  AfterAll,
  Given,
  createSharedPage,
  closeSharedContext,
  loginWithRetry,
} from '../fixtures';

loadProjectEnv();

/** Agency 1 Ops Manager — env-driven via advanceE2ECredentials() (E2E_EMAIL_ADVANCE fallback E2E_EMAIL; password from E2E_PASSWORD). */
function requireCredentials() {
  return advanceE2ECredentials();
}

BeforeAll({ tags: '@agent-master' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@agent-master' }, async () => {
  clearAgentContext();
  await closeSharedContext();
});

Given('I am logged into PieQ ICM for agent master tests', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});

Given('a unique seed agent exists for level hierarchy', async ({ page }) => {
  await createSeedAgent(page);
});
