import { Given, Then } from '../fixtures';

Given('the transfer agent renewal excel file is prepared for upload', async ({ transferStatementPage }) => {
  await transferStatementPage.prepareTransferRenewalUploadFile();
});

Then(
  'the Policy Transfer Mismatch agent dropdown lists {string} on transfer sheet',
  async ({ transferStatementPage }, agentName: string) => {
    await transferStatementPage.expectTransferringAgentListed(agentName);
  },
);

Then(
  'the stored upload reaches Ready for Payment without Policy Transfer exception on transfer sheet',
  async ({ transferStatementPage }) => {
    await transferStatementPage.expectStoredUploadReadyForPaymentWithoutPolicyTransfer();
  },
);
