import Dexie, { type Table } from 'dexie';
import type {
  Category,
  SubCategory,
  Attribute,
  Color,
  Size,
  Gender,
  Age,
  Season,
  CharacterItem,
  Product,
  Settings,
} from '../types/index.ts';

export class ProductMatrixDatabase extends Dexie {
  categories!: Table<Category, string>;
  subcategories!: Table<SubCategory, string>;
  attributes!: Table<Attribute, string>;
  colors!: Table<Color, string>;
  sizes!: Table<Size, string>;
  genders!: Table<Gender, string>;
  ages!: Table<Age, string>;
  seasons!: Table<Season, string>;
  characters!: Table<CharacterItem, string>;
  products!: Table<Product, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('ProductMatrixDB');

    this.version(1).stores({
      categories: 'id, name, code, isActive, sortOrder',
      subcategories: 'id, parentId, name, code, isActive, sortOrder',
      attributes: 'id, name, code, isActive, sortOrder',
      colors: 'id, name, code, isActive, sortOrder',
      sizes: 'id, name, code, isActive, sortOrder',
      genders: 'id, name, code, isActive, sortOrder',
      ages: 'id, name, code, isActive, sortOrder',
      products: 'id, &sku, &barcode, name, categoryId, subcategoryId, attributeId, colorId, sizeId, genderId, ageId, price, isActive, createdAt',
      settings: 'id',
    });

    this.version(2).stores({
      categories: 'id, name, code, isActive, sortOrder',
      subcategories: 'id, parentId, name, code, isActive, sortOrder',
      attributes: 'id, name, code, isActive, sortOrder',
      colors: 'id, name, code, isActive, sortOrder',
      sizes: 'id, name, code, isActive, sortOrder',
      genders: 'id, name, code, isActive, sortOrder',
      ages: 'id, name, code, isActive, sortOrder',
      seasons: 'id, name, code, isActive, sortOrder',
      characters: 'id, name, code, isActive, sortOrder',
      products: 'id, &sku, &barcode, name, categoryId, subcategoryId, attributeId, colorId, sizeId, genderId, ageId, seasonId, characterId, price, isActive, createdAt',
      settings: 'id',
    });
  }
}

export const db = new ProductMatrixDatabase();
