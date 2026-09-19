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
      if (filter.printStatus === 'needs_print') {
        items = items.filter((p) => Boolean(p.needsPrint));
      } else if (filter.printStatus === 'printed') {
        items = items.filter((p) => !p.needsPrint);
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
    if (!products || products.length === 0) return;

    // 1. Deduplicate within the incoming batch itself by SKU and Barcode
    const seenBatchSkus = new Set<string>();
    const seenBatchBarcodes = new Set<string>();
    const dedupedIncoming: Product[] = [];

    for (const p of products) {
      const cleanSku = p.sku ? p.sku.trim() : '';
      const cleanBarcode = p.barcode ? p.barcode.trim() : '';

      if (!cleanSku || !cleanBarcode) continue;
      if (seenBatchSkus.has(cleanSku) || seenBatchBarcodes.has(cleanBarcode)) {
        continue;
      }
      seenBatchSkus.add(cleanSku);
      seenBatchBarcodes.add(cleanBarcode);
      dedupedIncoming.push({
        ...p,
        sku: cleanSku,
        barcode: cleanBarcode,
      });
    }

    if (dedupedIncoming.length === 0) return;

    // 2. Fetch existing products from DB to avoid collision on unique indexes (&sku, &barcode)
    const existingProducts = await db.products.toArray();
    const existingSkuMap = new Map<string, Product>();
    const existingBarcodeMap = new Map<string, Product>();

    for (const ep of existingProducts) {
      if (ep.sku) existingSkuMap.set(ep.sku.trim(), ep);
      if (ep.barcode) existingBarcodeMap.set(ep.barcode.trim(), ep);
    }

    // 3. For any incoming product matching an existing SKU/Barcode, use the existing ID so put() updates safely
    const finalToSave: Product[] = dedupedIncoming.map((p) => {
      const existingBySku = existingSkuMap.get(p.sku);
      const existingByBarcode = existingBarcodeMap.get(p.barcode);

      if (existingBySku) {
        return {
          ...p,
          id: existingBySku.id,
          updatedAt: Date.now(),
        };
      }
      if (existingByBarcode) {
        return {
          ...p,
          id: existingByBarcode.id,
          updatedAt: Date.now(),
        };
      }
      return p;
    });

    await db.transaction('rw', db.products, async () => {
      await db.products.bulkPut(finalToSave);
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

  async countNeedsPrint(): Promise<number> {
    return db.products.filter((p) => Boolean(p.needsPrint)).count();
  },

  async updatePrintStatus(id: string, needsPrint: boolean): Promise<void> {
    const product = await db.products.get(id);
    if (product) {
      await db.products.put({
        ...product,
        needsPrint,
        updatedAt: Date.now(),
      });
    }
  },

  async bulkUpdatePrintStatus(ids: string[], needsPrint: boolean): Promise<void> {
    if (!ids || ids.length === 0) return;
    const now = Date.now();
    await db.transaction('rw', db.products, async () => {
      const items = await db.products.where('id').anyOf(ids).toArray();
      const updated = items.map((p) => ({
        ...p,
        needsPrint,
        updatedAt: now,
      }));
      await db.products.bulkPut(updated);
    });
  },
};
