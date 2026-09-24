import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';
import { waitForAppSettled } from '../../utils/pageLoader';

// ── T019-T024: Create Agent ──────────────────────────────────────────────────

function randomSuffix(): string {
  return `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
}

When('I click Add Agent in agents', async ({ agentsPage }) => {
  await agentsPage.openAdd();
});

When('I fill all required agent fields with unique valid data in agents', async ({ agentFormPage }) => {
  const suffix = randomSuffix();
  await agentFormPage.fillAllRequiredFields({
    agentId: `9${suffix}`.slice(0, 10),
    firstName: `Test${suffix.slice(-4)}`,
    lastName: `Agent${suffix.slice(-4)}`,
    email: `test.agent+${suffix}@pieq.ai`,
    npn: `8${suffix}`.slice(0, 10),
    phone: `555${suffix.slice(-7)}`.slice(0, 10),
  });
});

When('I click Save on the agent form in agents', async ({ agentFormPage }) => {
  await agentFormPage.clickSave();
});

/** Validation / negative: confirm only — inline errors, no Sonner toast. */
When('I confirm Save on the create agent modal in agents', async ({ agentFormPage }) => {
  await agentFormPage.clickConfirmSave();
});

/** Happy-path create/update: capture Sonner toast immediately after confirm click. */
When('I confirm Save expecting success toast on the create agent modal in agents', async ({
  agentFormPage,
}) => {
  await agentFormPage.clickConfirmSave({ captureToast: true });
});

Then('a success notification appears for agent save in agents', async ({ agentFormPage }) => {
  await agentFormPage.expectSuccessToast();
});

Then('I search the agents grid for the newly created agent in agents', async ({ agentFormPage, agentsPage }) => {
  await agentsPage.openList();
  const query = agentFormPage.lastCreatedEmail || agentFormPage.lastCreatedAgentId;
  expect(query, 'Expected newly created agent email/id to be stored').toBeTruthy();
  await agentsPage.searchGrid(query!);
});

Then(
  'the agents grid shows the new agent with status {string} in agents',
  async ({ agentFormPage, agentsPage }, expectedStatus: string) => {
    const query = agentFormPage.lastCreatedEmail || agentFormPage.lastCreatedAgentId;
    expect(query, 'Expected newly created agent email/id to be stored').toBeTruthy();
    await agentsPage.expectGridRowMatchesAgentAndStatus(query!, expectedStatus);
  },
);

Then(
  'the first agents grid row shows the new agent id or email with status {string} in agents',
  async ({ agentFormPage, agentsPage }, expectedStatus: string) => {
    await agentsPage.openList();
    const agentId = agentFormPage.lastCreatedAgentId;
    const email = agentFormPage.lastCreatedEmail;
    expect(agentId || email, 'Expected newly created agent id/email to be stored').toBeTruthy();
    await agentsPage.expectFirstGridRowMatchesAgentAndStatus({ agentId, email, expectedStatus });
  },
);

Then('the agent form Save button is disabled in agents', async ({ agentFormPage }) => {
  const disabled = await agentFormPage.isSaveDisabled();
  expect(disabled, 'Agent form Save button should be disabled').toBe(true);
});

When('I fill only some mandatory agent fields leaving others empty in agents', async ({ agentFormPage }) => {
  await agentFormPage.fillSomeRequiredFields({
    agentId: `9${randomSuffix()}`.slice(0, 10),
  });
});

When('I fill any one agent field in agents', async ({ agentFormPage }) => {
  await agentFormPage.fillOneField('firstName', `Test${randomSuffix().slice(-4)}`);
});

When('I click back on the agent form in agents', async ({ agentFormPage }) => {
  await agentFormPage.clickBack();
});

Then('the Cancel Changes modal appears in agents', async ({ agentFormPage }) => {
  const visible = await agentFormPage.isCancelChangesModalVisible();
  expect(visible, 'Cancel Changes modal should be visible').toBe(true);
});

When('I confirm abort agent creation in agents', async ({ agentFormPage }) => {
  await agentFormPage.confirmAbort();
  await waitForAppSettled(agentFormPage.page);
});

Then('I am on the Agents list in agents', async ({ agentFormPage, agentsPage }) => {
  await expect
    .poll(async () => agentFormPage.isOnAgentsList(), {
      timeout: 15_000,
      intervals: [500, 1_000],
      message: 'Expected to land on Agents list after abort',
    })
    .toBe(true);
  await expect(agentsPage.loc.headingList()).toBeVisible();
});

When('I choose Keep Editing on cancel changes modal in agents', async ({ agentFormPage }) => {
  await agentFormPage.keepEditing();
});

Then('I remain on the Add Agent form in agents', async ({ agentFormPage }) => {
  const visible = await agentFormPage.isAddFormVisible();
  expect(visible, 'Should remain on the Add Agent form').toBe(true);
});

When(
  'I fill agent form with duplicate agent id {string} email {string} and npn {string} in agents',
  async ({ agentFormPage }, agentId: string, email: string, npn: string) => {
    await agentFormPage.fillAllRequiredFields({
      agentId,
      firstName: 'Duplicate',
      lastName: 'Agent',
      email,
      npn,
    });
  },
);

Then('I see duplicate agent validation errors for user code email and npn in agents', async ({ agentFormPage }) => {
  await agentFormPage.expectDuplicateValidationErrors();
});
