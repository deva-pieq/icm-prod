import {
  buildValidProduct,
  overMaxCarrierProductName,
  overMaxDescription,
  overMaxProductCode,
  overMaxProductName,
  productRunStamp,
  SPACES_ONLY_NAME,
} from '../../test-data/products/products';
import {
  getLastSavedProduct,
  getSeedProduct,
  setLastSavedProduct,
} from '../../utils/products/productContext';
import { When, Then } from '../fixtures';

When('I open edit product via {string}', async ({ productEditPage }, entry: string) => {
  if (entry.toLowerCase().includes('kebab')) {
    await productEditPage.openEditViaKebabMenu();
    return;
  }
  await productEditPage.openEditByFirstGridRow();
});

When('I open edit for the last saved product', async ({ productEditPage }) => {
  await productEditPage.openEditForLastSavedProduct();
});

When('I open edit for the seeded product', async ({ productEditPage }) => {
  await productEditPage.openEditForSeedProduct();
  setLastSavedProduct(getSeedProduct());
});

When('I open the seeded product edit page', async ({ productEditPage }) => {
  await productEditPage.gotoSeedProductEdit();
  setLastSavedProduct(getSeedProduct());
});

Then('I am on the edit product page', async ({ productEditPage }) => {
  await productEditPage.expectOnEditProductPage();
});

Then('carrier and product type fields are not editable', async ({ productEditPage }) => {
  await productEditPage.expectCarrierAndProductTypeNotEditable();
});

When('I set line of business to a different value', async ({ productEditPage }) => {
  const lineOfBusiness = await productEditPage.selectDifferentLineOfBusiness();
  setLastSavedProduct({ ...getLastSavedProduct(), lineOfBusiness });
});

When('I toggle status between active and inactive', async ({ productEditPage }) => {
  const status = await productEditPage.toggleStatusBetweenActiveAndInactive();
  setLastSavedProduct({ ...getLastSavedProduct(), status });
});

When('I enable apply latest commission on renewal toggle', async ({ productEditPage }) => {
  await productEditPage.enableRenewalCommissionToggle();
});

When('I set product name to a new unique value on edit', async ({ productEditPage }) => {
  const productName = `E2E-Edit-Name-${productRunStamp()}`;
  await productEditPage.setProductName(productName);
  setLastSavedProduct({ ...getLastSavedProduct(), productName });
});

When('I set product code to a new unique value on edit', async ({ productEditPage }) => {
  const productCode = `E2E-EDIT-CODE-${productRunStamp()}`;
  await productEditPage.setProductCode(productCode);
  setLastSavedProduct({ ...getLastSavedProduct(), productCode });
});

When('I set carrier product name to a new unique value on edit', async ({ productEditPage }) => {
  const carrierProductName = `e2e-edit-carrier-${productRunStamp()}`;
  await productEditPage.setCarrierProductNameOnEdit(carrierProductName);
  setLastSavedProduct({ ...getLastSavedProduct(), carrierProductName });
});

When('I set product description to a new unique value on edit', async ({ productEditPage }) => {
  const description = `E2E edit description ${productRunStamp()}`;
  await productEditPage.setDescription(description);
  setLastSavedProduct({ ...getLastSavedProduct(), description });
});

When('I set product code to over max length value', async ({ productEditPage }) => {
  await productEditPage.setProductCode(overMaxProductCode());
});

When('I set carrier product name to over max length value', async ({ productEditPage }) => {
  await productEditPage.setCarrierProductNameOnEdit(overMaxCarrierProductName());
});

When('I set product name to the seeded duplicate product name on edit', async ({ productEditPage }) => {
  await productEditPage.setProductName(getSeedProduct().productName);
});

When('I set product code to the seeded duplicate product code on edit', async ({ productEditPage }) => {
  await productEditPage.setProductCode(getSeedProduct().productCode);
});

When('I set carrier product name to the seeded duplicate value on edit', async ({ productEditPage }) => {
  const alias = getSeedProduct().carrierProductName ?? `e2e-seed-alias-${productRunStamp()}`;
  await productEditPage.setCarrierProductNameOnEdit(alias);
});

When('I set product code to spaces only', async ({ productEditPage }) => {
  await productEditPage.setProductCode(SPACES_ONLY_NAME);
});

When('I set carrier product name to spaces only', async ({ productEditPage }) => {
  await productEditPage.setCarrierProductNameOnEdit(SPACES_ONLY_NAME);
});

When('I clear effective date', async ({ productEditPage }) => {
  await productEditPage.clearEffectiveDate();
});

When('I clear expiry date', async ({ productEditPage }) => {
  await productEditPage.clearExpiryDate();
});

When('I toggle states in coverage on edit', async ({ productEditPage }) => {
  await productEditPage.toggleStateInCoverage();
});

When('I edit product {string} field with valid unique data on edit', async (
  { productEditPage },
  field: string,
) => {
  const base = getLastSavedProduct();
  const data = buildValidProduct();
  switch (field.toLowerCase()) {
    case 'product name':
      await productEditPage.setProductName(data.productName);
      setLastSavedProduct({ ...base, productName: data.productName });
      break;
    case 'product code':
      await productEditPage.setProductCode(data.productCode);
      setLastSavedProduct({ ...base, productCode: data.productCode });
      break;
    case 'carrier product name':
      await productEditPage.setCarrierProductNameOnEdit(`e2e-edit-carrier-${productRunStamp()}`);
      setLastSavedProduct({ ...base, carrierProductName: `e2e-edit-carrier-${productRunStamp()}` });
      break;
    case 'description':
      await productEditPage.setDescription(`E2E edit description ${productRunStamp()}`);
      setLastSavedProduct({ ...base, description: `E2E edit description ${productRunStamp()}` });
      break;
    default:
      throw new Error(`Unsupported edit field: ${field}`);
  }
});

When('I edit product {string} field with over max length value on edit', async (
  { productEditPage },
  field: string,
) => {
  switch (field.toLowerCase()) {
    case 'product name':
      await productEditPage.setProductName(overMaxProductName());
      break;
    case 'product code':
      await productEditPage.setProductCode(overMaxProductCode());
      break;
    case 'carrier product name':
      await productEditPage.setCarrierProductNameOnEdit(overMaxCarrierProductName());
      break;
    case 'description':
      await productEditPage.setDescription(overMaxDescription());
      break;
    default:
      throw new Error(`Unsupported edit field: ${field}`);
  }
});

When('I edit product {string} field with duplicate seeded value on edit', async (
  { productEditPage },
  field: string,
) => {
  const seed = getSeedProduct();
  const unique = buildValidProduct();
  switch (field.toLowerCase()) {
    case 'product name':
      await productEditPage.setProductName(seed.productName);
      setLastSavedProduct({ ...unique, productName: seed.productName, productCode: unique.productCode });
      break;
    case 'product code':
      await productEditPage.setProductCode(seed.productCode);
      setLastSavedProduct({ ...unique, productCode: seed.productCode });
      break;
    case 'carrier product name':
      await productEditPage.setCarrierProductNameOnEdit(
        seed.carrierProductName ?? `e2e-seed-carrier-${productRunStamp()}`,
      );
      break;
    default:
      throw new Error(`Unsupported duplicate edit field: ${field}`);
  }
});

When('I edit product {string} field with spaces only on edit', async (
  { productEditPage },
  field: string,
) => {
  switch (field.toLowerCase()) {
    case 'product name':
      await productEditPage.setProductName(SPACES_ONLY_NAME);
      break;
    case 'product code':
      await productEditPage.setProductCode(SPACES_ONLY_NAME);
      break;
    case 'carrier product name':
      await productEditPage.setCarrierProductNameOnEdit(SPACES_ONLY_NAME);
      break;
    default:
      throw new Error(`Unsupported whitespace edit field: ${field}`);
  }
});

Then('the edited product is saved and I am on the Products dashboard', async ({ productEditPage }) => {
  const { productCode } = getLastSavedProduct();
  await productEditPage.expectEditedProductSavedOnDashboard(productCode);
});

Then('I see duplicate field error on edit for {string}', async ({ productEditPage }, field: string) => {
  switch (field.toLowerCase()) {
    case 'product name':
      await productEditPage.expectDuplicateProductNameErrorOnEdit();
      break;
    case 'product code':
      await productEditPage.expectDuplicateProductCodeErrorOnEdit();
      break;
    case 'carrier product name':
      await productEditPage.expectDuplicateCarrierProductNameErrorOnEdit();
      break;
    default:
      throw new Error(`Unsupported duplicate field on edit: ${field}`);
  }
});

Then('I see over max length blocks save for {string} on edit', async ({ productEditPage }, field: string) => {
  await productEditPage.expectOverMaxLengthBlocksSaveOnEdit(field);
});

Then('I see validation errors and remain on edit product page', async ({ productEditPage }) => {
  await productEditPage.expectEditValidationBlocksSave();
});

Then('I see carrier product name sliding notification error', async ({ productEditPage }) => {
  await productEditPage.expectCarrierProductNameSlidingNotification();
});

Then('I see the save button got disabled', async ({ productEditPage }) => {
  await productEditPage.expectSaveButtonDisabled();
});

Then('I see date validation error on edit save', async ({ productEditPage }) => {
  await productEditPage.expectDateValidationOnEditSave();
});
