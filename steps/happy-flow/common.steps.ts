import { loadProjectEnv } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearHappyFlowContext } from '../../utils/happy-flow/happyFlowContext';
import { deleteGeneratedFiles } from '../../utils/generatedFileCleanup';
import { AfterAll, Before, test } from '../fixtures';

loadProjectEnv();

Before({ tags: '@happy-flow' }, () => {
  test.setTimeout(smokeScenarioTimeoutMs);
  clearHappyFlowContext();
});

AfterAll({ tags: '@happy-flow' }, async () => {
  deleteGeneratedFiles();
});
