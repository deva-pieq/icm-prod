import { LoginPage } from '../../pages/auth/LoginPage';
import { agency3OpsCredentials, loadProjectEnv } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearMmpContext, clearMmpScenarioArtifacts } from '../../utils/mmp/mmpContext';
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

/** Keep shared agent across @validate-mmp scenarios; only reset file/upload artifacts. */
Before({ tags: '@validate-mmp' }, () => {
  clearMmpScenarioArtifacts();
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000));
});

Before({ tags: '@mmp-settings' }, () => {
  clearMmpContext();
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 300_000));
});

BeforeAll({ tags: '@mmp' }, async ({ browser }) => {
  clearMmpContext();
  const { email, password } = agency3OpsCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@mmp' }, async () => {
  await closeSharedContext();
  clearMmpContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for mmp validation', async ({ loginPage }) => {
  const { email, password } = agency3OpsCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
