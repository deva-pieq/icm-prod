import type { Page } from '@playwright/test';
import { ProductEditPage } from '../../pages/products/ProductEditPage';
import { ProductManagementPage } from '../../pages/products/ProductManagementPage';
import { buildValidProduct, productRunStamp, type ProductFormData } from '../../test-data/products/products';
import { setSeedProduct, setSeedProductUrls } from './productContext';

/** Create a product on the dashboard and capture edit + commission-structure URLs for reuse. */
export async function createSeedProductWithUrls(page: Page): Promise<ProductFormData> {
  const productManagementPage = new ProductManagementPage(page);
  const productEditPage = new ProductEditPage(page);

  await productManagementPage.gotoDashboard();
  await productManagementPage.openAddProductForm();
  const data = buildValidProduct();
  const carrierProductName = `e2e-seed-carrier-${productRunStamp()}`;
  await productManagementPage.fillMandatoryFields(data);
  await productManagementPage.addCarrierProductNameEntry(carrierProductName);
  await productManagementPage.clickSaveProduct();

  const seedData = { ...data, carrierProductName };
  setSeedProduct(seedData);

  await productEditPage.openEditForSeedProduct();
  const editUrl = page.url();
  await productEditPage.openCommissionStructure();
  const commissionStructureUrl = page.url();
  setSeedProductUrls(editUrl, commissionStructureUrl);

  return seedData;
}
