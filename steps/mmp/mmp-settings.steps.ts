import { Given, When, Then } from '../fixtures';
import { MMP } from '../../test-data/mmp/validateMmp';

When(
  'I open an existing agent Settings tab in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.openFirstExistingAgentSettings();
  },
);

When(
  'I create a new agent and open Settings tab in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.createNewAgentDraftAndOpenSettings();
  },
);

Then(
  'the Marketing Match Program section is visible in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectMmpSectionVisible();
  },
);

When(
  'I enable the Marketing Match Program toggle in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.enableMmp();
  },
);

When(
  'I disable the Marketing Match Program toggle in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.disableMmp();
  },
);

Then(
  'the Marketing Match Program toggle is enabled in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectMmpEnabled();
  },
);

Then(
  'the Marketing Match Program toggle is disabled in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectMmpDisabled();
  },
);

When(
  'I click the Marketing Match Program label in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.toggleMmpViaLabel();
  },
);

When(
  'I click the Marketing Match Program switch in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.toggleMmpViaSwitch();
  },
);

Then(
  'the Marketing Match Program toggle state has flipped in mmp settings validation',
  async () => {
    // Flip asserted inside toggleMmpViaLabel / toggleMmpViaSwitch
  },
);

Then(
  'the MMP contribution amount and earning type fields are enabled in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectMmpFieldsEnabled();
  },
);

Then(
  'the MMP contribution amount and earning type fields are disabled in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectMmpFieldsDisabled();
  },
);

When(
  'I set MMP contribution amount to {string} in mmp settings validation',
  async ({ mmpSettingsPage }, amount: string) => {
    await mmpSettingsPage.setContributionAmount(amount);
  },
);

When(
  'I set MMP contribution percentage to {string} in mmp settings validation',
  async ({ mmpSettingsPage }, pct: string) => {
    await mmpSettingsPage.setContributionPercentage(Number(pct));
  },
);

When(
  'I select MMP earning types Commission and Bonus in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.selectEarningTypes(['Commission', 'Bonus']);
  },
);

When('I clear MMP earning types in mmp settings validation', async ({ mmpSettingsPage }) => {
  await mmpSettingsPage.clearEarningTypes();
});

When('I click Save on MMP settings in mmp settings validation', async ({ mmpSettingsPage }) => {
  await mmpSettingsPage.clickSaveOnly();
});

Then(
  'the MMP validation error for maximum contribution is shown in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectValidationError(MMP.validationMessages.maxContribution);
  },
);

Then(
  'the MMP validation error for earning type is shown in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectValidationError(MMP.validationMessages.selectEarningType);
  },
);

Then(
  'the MMP validation error for valid contribution amount is shown in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectValidationError(MMP.validationMessages.validContributionAmount);
  },
);

Then(
  'the MMP settings confirmation dialog is visible in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectConfirmationDialogVisible();
  },
);

Then(
  'the MMP earning type dropdown lists Commission Bonus and Override in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectAllEarningTypesListed();
  },
);

When(
  'I click Select All on MMP earning types in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.clickSelectAllEarningTypes();
  },
);

When(
  'I click Clear All on MMP earning types in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.clickClearAllEarningTypes();
  },
);

Then(
  'all MMP earning types are selected in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectAllEarningTypesSelected();
  },
);

Then(
  'no MMP earning types remain selected in mmp settings validation',
  async ({ mmpSettingsPage }) => {
    await mmpSettingsPage.expectNoEarningTypesSelected();
  },
);
