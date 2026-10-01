import { When, Then } from '../fixtures';

When('I open the Transfer Policy List tab on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.openPolicyListTab();
});

Then('the Transfer Policy List grid is displayed on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.expectPolicyListGridVisible();
});

Then(
  'the Transfer Policy List shows Policy Information, Member, Carrier & Product, and Status columns on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.expectPolicyListColumns();
  },
);

Then(
  'at least one Transfer Policy List row shows non-empty Policy Information and Member on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.expectPolicyListHasPolicyAndMember();
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
  'the Transfer Policy List shows a row for the stored transfer policy on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.expectPolicyListRowForStoredPolicy();
  },
);
