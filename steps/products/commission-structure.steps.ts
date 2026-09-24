import { When, Then } from '../fixtures';

// Cases 16–20: commission structure navigation and Add Rule dialog

When('I open the seeded product commission structure page', async ({ commissionStructurePage }) => {
  await commissionStructurePage.gotoSeedCommissionStructure();
});

When(
  'I ensure a commission rule draft exists for {string}',
  async ({ commissionStructurePage }, type: string) => {
    await commissionStructurePage.ensureDraftRuleForType(type);
  },
);

When(
  'I open the commission rule draft for {string}',
  async ({ commissionStructurePage }, type: string) => {
    await commissionStructurePage.openCommissionRuleDraftForType(type);
  },
);

Then('I am on the commission structure page', async ({ commissionStructurePage }) => {
  await commissionStructurePage.expectOnCommissionStructurePage();
});

When('I click add commission rule', async ({ commissionStructurePage }) => {
  await commissionStructurePage.clickAddRule();
});

Then(
  'the add rule dropdown shows commission types {string}',
  async ({ commissionStructurePage }, types: string) => {
    await commissionStructurePage.expectAddRuleDropdownShowsTypes(types);
  },
);

When(
  'I select commission rule type {string} in the add rule dialog',
  async ({ commissionStructurePage }, type: string) => {
    await commissionStructurePage.selectCommissionRuleTypeInDialog(type);
  },
);

When('I confirm the add commission rule dialog', async ({ commissionStructurePage }) => {
  await commissionStructurePage.confirmAddCommissionRuleDialog();
});

When('I cancel commission rule edit', async ({ commissionRulePage }) => {
  await commissionRulePage.cancelCommissionRuleEdit();
});

When('I confirm leaving commission rule edit', async ({ commissionRulePage }) => {
  await commissionRulePage.confirmLeavingCommissionRuleEdit();
});

Then(
  'I see draft chip for commission type {string} on the structure grid',
  async ({ commissionStructurePage }, type: string) => {
    await commissionStructurePage.expectDraftChipForType(type);
  },
);

When(
  'I open the commission structure draft for {string}',
  async ({ commissionStructurePage }, type: string) => {
    await commissionStructurePage.openDraftForType(type);
  },
);

Then(
  'I am on the edit commission rule page for {string}',
  async ({ commissionRulePage }, type: string) => {
    await commissionRulePage.expectOnEditCommissionRulePageForType(type);
  },
);

Then(
  'the add rule dropdown does not show commission type {string}',
  async ({ commissionStructurePage }, type: string) => {
    await commissionStructurePage.expectAddRuleDropdownDoesNotShowType(type);
  },
);
