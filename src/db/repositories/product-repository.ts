import { db } from '../database.ts';
import type { Product, ProductFilter } from '../../types/index.ts';

export interface ProductQueryResult {
  products: Product[];
  total: number;
}

export const productRepository = {
  async getProducts(
    page: number = 1,
    pageSize: number = 20,
    filter?: ProductFilter,
    sortField: 'createdAt' | 'name' | 'price' | 'sku' = 'createdAt',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<ProductQueryResult> {
    let collection = db.products.toCollection();

    // If there's a filter, filter in-memory or using index
    let items = await collection.toArray();

    if (filter) {
      const search = filter.search?.trim().toLowerCase();
      if (search) {
        items = items.filter(
          (p) =>
            p.name.toLowerCase().includes(search) ||
            p.sku.toLowerCase().includes(search) ||
            p.barcode.toLowerCase().includes(search)
        );
      }

      if (filter.categoryId) {
        items = items.filter((p) => p.categoryId === filter.categoryId);
      }
      if (filter.subcategoryId) {
        items = items.filter((p) => p.subcategoryId === filter.subcategoryId);
      }
      if (filter.attributeId) {
        items = items.filter((p) => p.attributeId === filter.attributeId);
      }
      if (filter.colorId) {
        items = items.filter((p) => p.colorId === filter.colorId);
      }
      if (filter.sizeId) {
        items = items.filter((p) => p.sizeId === filter.sizeId);
      }
      if (filter.genderId) {
        items = items.filter((p) => p.genderId === filter.genderId);
      }
      if (filter.ageId) {
        items = items.filter((p) => p.ageId === filter.ageId);
      }
      if (filter.minPrice !== undefined && filter.minPrice > 0) {
        items = items.filter((p) => p.price >= filter.minPrice!);
      }
      if (filter.maxPrice !== undefined && filter.maxPrice > 0) {
        items = items.filter((p) => p.price <= filter.maxPrice!);
      }
    }

    // Sort
    items.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
      }
      if (typeof bVal === 'string') {
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const total = items.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      products: paginatedItems,
      total,
    };
  },

  async getAllProducts(): Promise<Product[]> {
    return db.products.toArray();
  },

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    return db.products.where('id').anyOf(ids).toArray();
  },

  async getProductById(id: string): Promise<Product | undefined> {
    return db.products.get(id);
  },

  async findBySku(sku: string): Promise<Product | undefined> {
    return db.products.where('sku').equals(sku.trim()).first();
  },

  async findByBarcode(barcode: string): Promise<Product | undefined> {
    return db.products.where('barcode').equals(barcode.trim()).first();
  },

  async findByName(name: string): Promise<Product | undefined> {
    const clean = name.trim().toLowerCase();
    const all = await db.products.toArray();
    return all.find((p) => p.name.trim().toLowerCase() === clean);
  },

  async saveProduct(product: Product): Promise<void> {
    await db.products.put(product);
  },

  async bulkSaveProducts(products: Product[]): Promise<void> {
    await db.transaction('rw', db.products, async () => {
      await db.products.bulkPut(products);
    });
  },

  async deleteProduct(id: string): Promise<void> {
    await db.products.delete(id);
  },

  async bulkDeleteProducts(ids: string[]): Promise<void> {
    await db.transaction('rw', db.products, async () => {
      await db.products.bulkDelete(ids);
    });
  },

  async count(): Promise<number> {
    return db.products.count();
  },
};
