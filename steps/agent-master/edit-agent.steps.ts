import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';

// ── T025-T033: Edit Agent + shared form validation (unique steps only) ───────
// Shared create/edit steps live in create-agent.steps.ts (Save, confirm, toast,
// Save disabled, emoji name errors).
// Manual date entry restricted in app — former T034 removed.

When('I change editable agent fields with valid inputs in agents', async ({ agentFormPage }) => {
  await agentFormPage.changeEditableFields();
});

Then('the agent form Save button is enabled in agents', async ({ agentFormPage }) => {
  const enabled = await agentFormPage.isSaveEnabled();
  expect(enabled, 'Agent form Save button should be enabled').toBe(true);
});

When('I clear a mandatory agent field in agents', async ({ agentFormPage }) => {
  await agentFormPage.clearMandatoryField();
});

When('I set the phone number to an existing agent phone in agents', async ({ agentFormPage, agentsPage }) => {
  await agentFormPage.setPhoneToExistingAgentPhone(agentsPage);
});

Then('I see agent phone already exists validation in agents', async ({ agentFormPage }) => {
  await agentFormPage.expectPhoneAlreadyExistsValidation();
});

Then('the agent email field is not editable in agents', async ({ agentFormPage }) => {
  await agentFormPage.expectEmailNotEditable();
});

When('I provide emoji and symbols to agent name fields in agents', async ({ agentFormPage }) => {
  await agentFormPage.provideEmojiAndSymbols();
});

Then('I see invalid name input errors on the agent form in agents', async ({ agentFormPage }) => {
  await agentFormPage.expectInvalidNameErrors();
});

When('I enter more than 50 characters in agent first and last name in agents', async ({ agentFormPage }) => {
  await agentFormPage.enterMoreThan50CharactersInNames();
});

Then('I see agent validation {string} in agents', async ({ agentFormPage }, text: string) => {
  await agentFormPage.expectValidationTextVisible(text);
});

When('I enter oversized street address and city with valid zip on agent form in agents', async ({ agentFormPage }) => {
  await agentFormPage.enterOversizedAddressCityAndValidZip();
});

When('I enter invalid bank name account and routing on agent form in agents', async ({ agentFormPage }) => {
  await agentFormPage.enterInvalidBankFields();
});

Then('I see agent bank field validation errors in agents', async ({ agentFormPage }) => {
  await agentFormPage.expectBankValidationErrors();
});

When('I enter invalid tax id and oversized w9 name on agent form in agents', async ({ agentFormPage }) => {
  await agentFormPage.enterInvalidTaxFields();
});

Then('I see agent tax reporting validation errors in agents', async ({ agentFormPage }) => {
  await agentFormPage.expectTaxValidationErrors();
});

When('I open Tax Type dropdown on agent form in agents', async ({ agentFormPage }) => {
  await agentFormPage.openTaxTypeDropdown();
});

When('I hover Tax ID on agent form in agents', async ({ agentFormPage }) => {
  await agentFormPage.hoverTaxId();
});

Then('tax type and tax id fields do not overlap in agents', async ({ agentFormPage }) => {
  await agentFormPage.expectFieldsDoNotOverlap('tax-type-input', 'tax-id-input');
});

Then('I see agent validation matching {string} in agents', async ({ agentFormPage }, text: string) => {
  await agentFormPage.expectValidationMatching(text);
});
