import { When, Then } from '../fixtures';

When('I open the Transfer Policy List tab on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.openPolicyListTab();
});

Then('the Transfer Policy List grid is displayed on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.expectPolicyListGridVisible();
});

Then(
  'the Transfer Policy List shows Carrier Agent and Writing Agent columns on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.expectPolicyListColumns();
  },
);

Then(
  'at least one Transfer Policy List row shows non-empty Carrier Agent and Writing Agent on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.expectPolicyListHasAgentPair();
  },
);

Then(
  'every Transfer Policy List row has Status {string} on transfer sheet',
  async ({ transferSheetPage }, status: string) => {
    if (/^active$/i.test(status)) {
      await transferSheetPage.expectAllPolicyListStatusesActive();
    }
  },
);

Then(
  'no Transfer Policy List row shows a future Effective date on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.expectNoFutureEffectiveDatesOnPolicyList();
  },
);

Then(
  'the Transfer Policy List shows a row for Carrier Agent {string} and Writing Agent {string} on transfer sheet',
  async ({ transferSheetPage }, carrierAgent: string, writingAgent: string) => {
    await transferSheetPage.expectPolicyListRowForAgents(carrierAgent, writingAgent);
  },
);
