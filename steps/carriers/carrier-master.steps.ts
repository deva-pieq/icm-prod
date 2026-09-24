import { expect } from '@playwright/test';
import {
  buildValidCarrier,
  maxLetterName,
  NAME_OVER_MAX_LENGTH,
  notesOverMax,
  notesWithinMax,
  uniqueSpecialCharName,
} from '../../test-data/carriers/carriers';
import {
  getLastEditedCarrierName,
  getLastSavedCarrier,
  setLastEditedCarrierName,
  setLastSavedCarrier,
} from '../../utils/carriers/carrierContext';
import { Given, Then, When } from '../fixtures';

Given('I open the Carriers list in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.openList();
});

When('I open the add carrier form in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.openAddForm();
});

When('I fill mandatory carrier fields with unique valid data in carriers', async ({ carrierMasterPage }) => {
  const data = await carrierMasterPage.fillUniqueMandatory();
  setLastSavedCarrier(data);
});

When('I fill mandatory carrier fields with status {string} in carriers', async ({ carrierMasterPage }, status: string) => {
  const data = await carrierMasterPage.fillUniqueMandatory({ status });
  setLastSavedCarrier(data);
});

When('I fill mandatory carrier fields leaving all blank in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectOnAddForm();
});

When('I fill unique mandatory carrier fields except I set name to {string} in carriers', async (
  { carrierMasterPage },
  name: string,
) => {
  const data = await carrierMasterPage.fillUniqueMandatory({ carrierName: name });
  setLastSavedCarrier(data);
});

When('I fill unique mandatory carrier fields with special characters in the name in carriers', async ({
  carrierMasterPage,
}) => {
  const data = await carrierMasterPage.fillUniqueMandatory({ carrierName: uniqueSpecialCharName() });
  setLastSavedCarrier(data);
});

When('I try to create another carrier with the saved carrier code in carriers', async ({ carrierMasterPage }) => {
  const existing = getLastSavedCarrier();
  await carrierMasterPage.fillUniqueMandatory({ carrierCode: existing.carrierCode });
});

When('I set carrier notes to {int} characters in carriers', async ({ carrierMasterPage }, length: number) => {
  const notes = length > 250 ? notesOverMax(length) : notesWithinMax(length);
  await carrierMasterPage.setNotes(notes);
  if (length <= 250) {
    const saved = getLastSavedCarrier();
    setLastSavedCarrier({ ...saved, notes });
  }
});

When('I set carrier email to {string} in carriers', async ({ carrierMasterPage }, email: string) => {
  await carrierMasterPage.setEmail(email);
});

When('I set carrier phone to {string} in carriers', async ({ carrierMasterPage }, phone: string) => {
  await carrierMasterPage.setPhone(phone);
});

When('I set appointment date to {string} in carriers', async ({ carrierMasterPage }, value: string) => {
  await carrierMasterPage.setAppointmentDate(value);
});

When('I set last review date to {string} in carriers', async ({ carrierMasterPage }, value: string) => {
  await carrierMasterPage.setLastReviewDate(value);
});

When('I set carrier name to {string} in carriers', async ({ carrierMasterPage }, name: string) => {
  await carrierMasterPage.setCarrierName(name);
});

When('I enter a carrier name only on the add form in carriers', async ({ carrierMasterPage }) => {
  const data = buildValidCarrier();
  setLastSavedCarrier(data);
  await carrierMasterPage.setCarrierName(data.carrierName);
});

When('I clear the carrier search in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.searchCarriers('');
});

When('I fill max-length values on the add carrier form in carriers', async ({ carrierMasterPage }) => {
  const data = buildValidCarrier({
    carrierName: maxLetterName(NAME_OVER_MAX_LENGTH),
    notes: notesWithinMax(250),
  });
  await carrierMasterPage.fillMaxLengthFields(data);
  setLastSavedCarrier(data);
});

When('I set the carrier name to {int} characters in carriers', async ({ carrierMasterPage }, length: number) => {
  const name = maxLetterName(length);
  await carrierMasterPage.setCarrierName(name);
  setLastSavedCarrier({ ...getLastSavedCarrier(), carrierName: name });
});

When('I save the carrier in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.saveNewCarrier();
});

When('I save the edited carrier in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.saveEditedCarrier();
});

When('I click Save on the add carrier form in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.clickSave();
});

When('I click Save {int} times quickly on the add carrier form in carriers', async (
  { carrierMasterPage },
  times: number,
) => {
  await carrierMasterPage.clickSaveRapidly(times);
});

When('I click Cancel on the add carrier form in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.clickCancel();
});

When('I refresh the add carrier form in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.reloadForm();
});

When('I open the Carrier Type dropdown in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.openCarrierTypeDropdown();
});

When('I open the Status dropdown on add carrier in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.openFormStatusDropdown();
});

When('I search carriers for {string} in carriers', async ({ carrierMasterPage }, query: string) => {
  await carrierMasterPage.searchCarriers(query);
});

When('I search carriers for the saved carrier name in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.searchCarriers(getLastSavedCarrier().carrierName);
});

When('I search carriers for the saved carrier code in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.searchCarriers(getLastSavedCarrier().carrierCode);
});

When('I search carriers for the edited carrier name in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.searchCarriers(getLastEditedCarrierName());
});

When('I filter carriers by status {string} in carriers', async ({ carrierMasterPage }, status: string) => {
  await carrierMasterPage.filterByStatus(status);
});

When('I sort the {string} column in carriers', async ({ carrierMasterPage }, column: string) => {
  await carrierMasterPage.sortColumn(column);
});

When('I open edit for the saved carrier in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.openEditFor(getLastSavedCarrier().carrierName);
});

When('I change the carrier name on edit in carriers', async ({ carrierMasterPage }) => {
  const next = `${getLastSavedCarrier().carrierName} Edited`;
  await carrierMasterPage.setCarrierName(next);
  setLastEditedCarrierName(next);
});

Then('I am on the Carriers list in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectOnList();
});

Then('I remain on the add carrier form in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectOnAddForm();
});

Then('the carrier Save button is disabled in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectSaveDisabled();
});

Then('the Carrier Type dropdown lists known live categories with more than two options in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectCarrierTypeOptions();
});

Then('the Status dropdown shows Active and Inactive with unset default in carriers', async ({
  carrierMasterPage,
}) => {
  await carrierMasterPage.expectFormStatusOptions();
});

Then('the carrier list shows the saved carrier name with status {string} in carriers', async (
  { carrierMasterPage },
  status: string,
) => {
  const { carrierName } = getLastSavedCarrier();
  await carrierMasterPage.expectRowHasStatus(carrierName, status);
});

Then('the carrier list shows the saved carrier code in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectRowContains(getLastSavedCarrier().carrierCode);
});

Then('the carrier list shows exactly one row for the saved carrier code in carriers', async ({
  carrierMasterPage,
}) => {
  await carrierMasterPage.expectExactlyOneRowMatching(getLastSavedCarrier().carrierCode);
});

Then('the saved carrier name is not in the carrier list in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectNoRecords(getLastSavedCarrier().carrierName);
});

Then('the carrier list shows columns from the CSV in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectListColumns();
});

Then('the carrier grid shows the Actions column after horizontal scroll in carriers', async ({
  carrierMasterPage,
}) => {
  await carrierMasterPage.expectActionsColumnAfterHorizontalScroll();
});

Then('all visible carrier rows have status {string} in carriers', async ({ carrierMasterPage }, status: string) => {
  await carrierMasterPage.expectAllVisibleRowsHaveStatus(status);
});

Then('the {string} column is sorted {word} in carriers', async (
  { carrierMasterPage },
  column: string,
  direction: string,
) => {
  expect(direction === 'asc' || direction === 'desc', 'sort direction').toBe(true);
  await carrierMasterPage.expectColumnSorted(column, direction as 'asc' | 'desc');
});

Then('the carrier grid shows no records found in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectNoRecords();
});

Then('I see the invalid email error on add carrier in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectEmailError();
});

Then('I see the duplicate carrier code error in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectDuplicateCodeError();
});

Then('I see the carrier name max-length inline error in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectNameMaxLengthError();
});

Then('I see the carrier name special-character inline error in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectNameCharsetError();
});

Then('I see the notes over-max inline error in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectNotesOverMaxError();
});

Then('I see last review must be after appointment date in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectReviewAfterAppointmentError();
});

Then('the phone field rejects alphabetic input in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectPhoneRejectsAlpha();
});

Then('the add carrier form fields are empty in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectFormFieldsEmpty();
});

Then('the edited carrier name is shown in the list in carriers', async ({ carrierMasterPage }) => {
  await carrierMasterPage.expectRowContains(getLastEditedCarrierName());
});
