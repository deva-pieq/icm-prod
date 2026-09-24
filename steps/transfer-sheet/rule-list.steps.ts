import { Given, When, Then } from '../fixtures';

Given('I open the Transfer Sheet page on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.openTransferSheetPage();
});

When('I open the Add Transfer form on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.openAddTransferForm();
});

When(
  'I fill mandatory Transfer Sheet fields for agent {string} product {string} status {string} and date 3 years back on transfer sheet',
  async (
    { transferSheetPage },
    agentName: string,
    product: string,
    status: string,
  ) => {
    await transferSheetPage.fillMandatoryFields(agentName, product, status, '3 years back');
  },
);

When(
  'I capture the first Transfer Sheet Rule List record on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.captureFirstRuleListRecord();
  },
);

When(
  'I fill mandatory Transfer Sheet fields from the captured first record with status {string} and date 3 years back on transfer sheet',
  async ({ transferSheetPage }, status: string) => {
    await transferSheetPage.fillMandatoryFieldsFromCapturedRecord(status, '3 years back');
  },
);

When(
  'I fill Transfer Sheet fields for agent {string} product {string} status {string} with effective date {string} on transfer sheet',
  async (
    { transferSheetPage },
    agentName: string,
    product: string,
    status: string,
    dateValue: string,
  ) => {
    await transferSheetPage.fillMandatoryFields(agentName, product, status, dateValue);
  },
);

When('I click Add Transfer on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.clickAddTransferSubmit();
});

When(
  'I add a unique Transfer Sheet rule preferring agent {string} product {string} with status {string} and date 3 years back on transfer sheet',
  async (
    { transferSheetPage },
    agentName: string,
    product: string,
    status: string,
  ) => {
    await transferSheetPage.addUniqueTransferSheetRecord(
      agentName,
      product,
      status,
      '3 years back',
    );
  },
);

When(
  'I add a unique Transfer Sheet rule for same agent {string} preferring product {string} with status {string} and date 3 years back on transfer sheet',
  async (
    { transferSheetPage },
    agentName: string,
    product: string,
    status: string,
  ) => {
    await transferSheetPage.addUniqueTransferSheetRecord(
      agentName,
      product,
      status,
      '3 years back',
      { lockAgent: true },
    );
  },
);

When(
  'I ensure same agent has Transfer Sheet rules for different products on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.ensureSameAgentHasDifferentProducts('Active', '3 years back');
  },
);

Then('the Add Transfer submit button is disabled on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.expectAddSubmitDisabled();
});

Then('the Add Transfer form remains open on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.expectAddFormOpen();
});

Then(
  'the Transfer Sheet Rule List shows agent {string} product {string} with status {string} on transfer sheet',
  async ({ transferSheetPage }, agentName: string, product: string, status: string) => {
    await transferSheetPage.openTransferSheetPage();
    await transferSheetPage.expectGridContainsRecord(agentName, product, status);
  },
);

Then(
  'the Transfer Sheet Rule List shows the newly added record on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.expectNewlyAddedRecordInGrid();
  },
);

Then(
  'the newly added Transfer Sheet record uses agent {string} and a product other than {string} on transfer sheet',
  async ({ transferSheetPage }, agentName: string, excludedProduct: string) => {
    await transferSheetPage.expectNewlyAddedUsesAgentAndOtherProduct(agentName, excludedProduct);
  },
);

Then(
  'the Transfer Sheet Rule List shows an agent with at least two different products on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.expectAgentHasAtLeastTwoDifferentProducts();
  },
);

When(
  'I open the edit form for agent {string} product {string} on transfer sheet',
  async ({ transferSheetPage }, agentName: string, product: string) => {
    await transferSheetPage.openEditForRecord(agentName, product);
  },
);

When(
  'I open the edit form for the first Transfer Sheet Rule List record on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.openEditForFirstRuleListRecord();
  },
);

When(
  'I open the edit form for the same Transfer Sheet record on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.openEditForSameStoredRecord();
  },
);

When(
  'I change the Transfer Sheet status to {string} on transfer sheet',
  async ({ transferSheetPage }, status: string) => {
    await transferSheetPage.changeStatusOnForm(status);
  },
);

When('I flip the Transfer Sheet status and save on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.flipStatusAndSave();
});

When('I click Save on the Transfer Sheet edit form on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.clickSaveOnEditForm();
});

Then(
  'the Transfer Sheet Rule List shows the edited record with the flipped status on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.expectEditedRecordStatus('flipped');
  },
);

Then(
  'the Transfer Sheet Rule List shows the edited record with the original status on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.expectEditedRecordStatus('original');
  },
);

Then('a duplicate Transfer Sheet rule error is shown on transfer sheet', async ({ transferSheetPage }) => {
  await transferSheetPage.expectDuplicateRuleError();
});

When(
  'I add a Transfer Sheet rule for agent {string} product {string} with status {string} and date 3 years back on transfer sheet',
  async (
    { transferSheetPage },
    agentName: string,
    product: string,
    status: string,
  ) => {
    await transferSheetPage.addTransferSheetRecord(agentName, product, status, '3 years back');
  },
);

Then(
  'the invalid Effective Date message {string} is shown on transfer sheet',
  async ({ transferSheetPage }, message: string) => {
    await transferSheetPage.expectInvalidEffectiveDateMessage(message);
  },
);

Then(
  'the Transfer Sheet Rule List S.No values are in ascending order on transfer sheet',
  async ({ transferSheetPage }) => {
    await transferSheetPage.expectSerialNumbersAscending();
  },
);
