export interface CatalogItem {
  id: string;
  name: string;
  code?: string;
  hexCode?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface Category extends CatalogItem {}

export interface SubCategory extends CatalogItem {
  parentId: string; // references Category.id
}

export interface Attribute extends CatalogItem {}

export interface Color extends CatalogItem {
  hexCode?: string; // Optional visual hex color representation
}

export interface Size extends CatalogItem {}

export interface Gender extends CatalogItem {}

export interface Age extends CatalogItem {}

export interface Season extends CatalogItem {}

export interface CharacterItem extends CatalogItem {}

export interface Product {
  id: string;

  categoryId?: string;
  subcategoryId?: string;
  attributeId?: string;
  colorId?: string;
  sizeId?: string;
  genderId?: string;
  ageId?: string;
  seasonId?: string;
  characterId?: string;
  characterName?: string;

  name: string;
  sku: string;
  barcode: string;
  price: number;

  isActive: boolean;
  needsPrint?: boolean; // آیا نیازمند چاپ لیبل و بارکد است

  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  id: string; // 'default'
  skuTemplate: string;
  barcodeType: 'EAN-13' | 'CODE-128';
  barcodePrefix: string; // e.g., '6261234'
  currency: string; // e.g., 'تومان'
  updatedAt: number;
}

export type CatalogType =
  | 'category'
  | 'subcategory'
  | 'attribute'
  | 'color'
  | 'size'
  | 'gender'
  | 'age'
  | 'season'
  | 'character';

export interface MatrixCombination {
  tempId: string;
  categoryId?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  attributeId?: string;
  colorId?: string;
  sizeId?: string;
  genderId?: string;
  ageId?: string;
  seasonId?: string;
  characterId?: string;
  characterName?: string;

  name: string;
  sku: string;
  barcode: string;
  price: number;
  isDuplicateSku: boolean;
  isDuplicateBarcode: boolean;
  isDuplicateName?: boolean;
  needsPrint?: boolean;
  existingProduct?: Product;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export interface ProductFilter {
  search: string;
  categoryId?: string;
  subcategoryId?: string;
  attributeId?: string;
  colorId?: string;
  sizeId?: string;
  genderId?: string;
  ageId?: string;
  seasonId?: string;
  characterId?: string;
  minPrice?: number;
  maxPrice?: number;
  printStatus?: 'all' | 'needs_print' | 'printed';
}
