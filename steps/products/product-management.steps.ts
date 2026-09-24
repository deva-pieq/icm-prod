import {
  atMaxProductName,
  buildValidProduct,
  overMaxDescription,
  overMaxProductName,
  productRunStamp,
  SPACES_ONLY_NAME,
  SPECIAL_CHARS_NAME,
  type MandatoryFieldKey,
} from '../../test-data/products/products';
import {
  getLastSavedProduct,
  getSeedProduct,
  setLastSavedProduct,
} from '../../utils/products/productContext';
import { When, Then } from '../fixtures';

When('I open the Products dashboard', async ({ productManagementPage }) => {
  await productManagementPage.gotoDashboard();
});

When('I open the add product form', async ({ productManagementPage }) => {
  await productManagementPage.openAddProductForm();
});

Then('I am on the Products dashboard', async ({ productManagementPage }) => {
  await productManagementPage.expectOnProductsDashboard();
});

Then('I am on the add product form', async ({ productManagementPage }) => {
  await productManagementPage.expectOnAddProductForm();
});

When('I fill all mandatory product fields with valid unique data', async ({ productManagementPage }) => {
  const data = await productManagementPage.fillAllMandatoryWithDefaults();
  setLastSavedProduct(data);
});

When('I fill mandatory product fields with valid defaults', async ({ productManagementPage }) => {
  const data = await productManagementPage.fillAllMandatoryWithDefaults();
  setLastSavedProduct(data);
});

When('I fill all mandatory product fields except {string}', async (
  { productManagementPage },
  field: string,
) => {
  const data = buildValidProduct();
  await productManagementPage.fillMandatoryFields(data, field as MandatoryFieldKey);
});

When('I leave all mandatory fields empty', async () => {
  // Form opens empty; status may default to Active.
});

When('I set product name to spaces only', async ({ productManagementPage }) => {
  await productManagementPage.setProductName(SPACES_ONLY_NAME);
});

When('I set product name to special characters', async ({ productManagementPage }) => {
  const name = `${SPECIAL_CHARS_NAME.replace(/!$/, '')}-${productRunStamp()}`;
  await productManagementPage.setProductName(name);
  const base = getLastSavedProduct();
  setLastSavedProduct({ ...base, productName: name });
});

When('I set product name to over max length value', async ({ productManagementPage }) => {
  await productManagementPage.setProductName(overMaxProductName());
});

When('I set product name to max length value', async ({ productManagementPage }) => {
  const name = atMaxProductName();
  await productManagementPage.setProductName(name);
  setLastSavedProduct({ ...getLastSavedProduct(), productName: name });
});

When('I set product code to the seeded duplicate code', async ({ productManagementPage }) => {
  await productManagementPage.setProductCode(getSeedProduct().productCode);
});

When('I set product name to the duplicate product name', async ({ productManagementPage }) => {
  await productManagementPage.setProductName(getSeedProduct().productName);
});

When('I set product code to a new unique code', async ({ productManagementPage }) => {
  const data = buildValidProduct();
  await productManagementPage.setProductCode(data.productCode);
  setLastSavedProduct({ ...getSeedProduct(), productCode: data.productCode, productName: getSeedProduct().productName });
});

When('I set product description to {string}', async ({ productManagementPage }, value: string) => {
  await productManagementPage.setDescription(value);
});

When('I set product description to over max length value', async ({ productManagementPage }) => {
  await productManagementPage.setDescription(overMaxDescription());
});

When('I set effective date to {string}', async ({ productManagementPage }, value: string) => {
  await productManagementPage.setEffectiveDate(value);
});

When('I set expiry date to {string}', async ({ productManagementPage }, value: string) => {
  await productManagementPage.setExpiryDate(value);
});

When(
  'I rapidly change product type dropdown through values and select {string}',
  async ({ productManagementPage }, finalType: string) => {
    await productManagementPage.rapidlyCycleDropdownAndSelectFinal('product-type-dropdown', finalType);
  },
);

When('I add a unique carrier product name', async ({ productManagementPage }) => {
  const name = `e2e-carrier-alias-${productRunStamp()}`;
  await productManagementPage.addCarrierProductNameEntry(name);
  setLastSavedProduct({ ...getLastSavedProduct(), carrierProductName: name });
});

When('I add carrier product name {string}', async ({ productManagementPage }, name: string) => {
  await productManagementPage.addCarrierProductNameEntry(name);
  setLastSavedProduct({ ...getLastSavedProduct(), carrierProductName: name });
});

When('I attempt to add carrier product name with empty field', async () => {
  // Alias Add stays disabled when the input is empty.
});

When('I add the same carrier product name', async ({ productManagementPage }) => {
  const name = `e2e-alias-${Date.now()}`;
  await productManagementPage.addCarrierProductNameEntry(name);
  await productManagementPage.addCarrierProductNameEntry(name);
});

When('I click save product', async ({ productManagementPage }) => {
  await productManagementPage.clickSaveProduct();
});

When('I click save product {int} times quickly', async ({ productManagementPage }, times: number) => {
  await productManagementPage.clickSaveProductQuickly(times);
});

When('I enter invalid product data combination', async ({ productManagementPage }) => {
  await productManagementPage.setProductName(SPACES_ONLY_NAME);
  await productManagementPage.setProductCode('!!!invalid!!!');
});

Then('I see save button is disabled', async ({ productManagementPage }) => {
  await productManagementPage.expectSaveButtonDisabled();
});

Then('the product is saved and I am on the Products dashboard', async ({ productManagementPage }) => {
  const { productCode } = getLastSavedProduct();
  await productManagementPage.expectProductSavedOnDashboard(productCode);
});

Then('I am on the Products dashboard and view the saved product', async ({ productManagementPage }) => {
  const { productCode } = getLastSavedProduct();
  await productManagementPage.expectProductSavedOnDashboard(productCode);
});

Then('I see mandatory field validation for {string}', async (
  { productManagementPage },
  field: string,
) => {
  await productManagementPage.expectMandatoryFieldBlocksSave(field as MandatoryFieldKey);
});

Then('I see validation errors and remain on add product form', async ({ productManagementPage }) => {
  await productManagementPage.expectValidationBlocksSave();
});

Then('I see product name validation error', async ({ productManagementPage }) => {
  await productManagementPage.expectProductNameValidationError();
});

Then('I see duplicate product code error', async ({ productManagementPage }) => {
  await productManagementPage.expectDuplicateProductCodeError();
});

Then('carrier product name {string} is listed', async ({ productManagementPage }, name: string) => {
  await productManagementPage.expectCarrierAliasListed(name);
});

Then('I see carrier product name validation error', async ({ productManagementPage }) => {
  await productManagementPage.expectAddAliasButtonDisabled();
});

Then('I see duplicate carrier product name error', async ({ productManagementPage }) => {
  await productManagementPage.expectDuplicateAliasError();
});

Then('I see date validation error on save', async ({ productManagementPage }) => {
  await productManagementPage.expectDateValidationOnSave();
});

Then('exactly one product exists with the saved product code', async ({ productManagementPage }) => {
  const { productCode } = getLastSavedProduct();
  await productManagementPage.gotoDashboard();
  await productManagementPage.expectExactlyOneGridRowForCode(productCode);
});

Then('I see invalid data blocks save', async ({ productManagementPage }) => {
  await productManagementPage.expectInvalidDataBlocksSave();
});

Then('I see duplicate product name error', async ({ productManagementPage }) => {
  await productManagementPage.expectDuplicateProductNameError();
});
