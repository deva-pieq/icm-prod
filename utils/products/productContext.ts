import type { ProductFormData } from '../../test-data/products/products';

let seedProduct: ProductFormData | null = null;
let lastSavedProduct: ProductFormData | null = null;
let seedProductEditUrl: string | null = null;
let seedCommissionStructureUrl: string | null = null;

export function setSeedProduct(data: ProductFormData): void {
  seedProduct = data;
}

export function getSeedProduct(): ProductFormData {
  if (!seedProduct) {
    throw new Error('Seed product not prepared — run product-management BeforeAll or @needs-fresh-product hook first');
  }
  return seedProduct;
}

export function hasSeedProduct(): boolean {
  return seedProduct !== null;
}

export function setSeedProductUrls(editUrl: string, commissionStructureUrl: string): void {
  seedProductEditUrl = editUrl;
  seedCommissionStructureUrl = commissionStructureUrl;
}

export function getSeedProductEditUrl(): string {
  if (!seedProductEditUrl) {
    throw new Error('Seed product edit URL not captured — create seed product first');
  }
  return seedProductEditUrl;
}

export function getSeedCommissionStructureUrl(): string {
  if (!seedCommissionStructureUrl) {
    throw new Error('Seed commission structure URL not captured — create seed product first');
  }
  return seedCommissionStructureUrl;
}

export function setLastSavedProduct(data: ProductFormData): void {
  lastSavedProduct = data;
}

export function getLastSavedProduct(): ProductFormData {
  if (!lastSavedProduct) {
    throw new Error('No product saved in this scenario yet');
  }
  return lastSavedProduct;
}

export function clearProductContext(): void {
  seedProduct = null;
  lastSavedProduct = null;
  seedProductEditUrl = null;
  seedCommissionStructureUrl = null;
}
