import { create } from 'zustand';
import { productRepository } from '../db/repositories/product-repository.ts';
import type { Product, ProductFilter } from '../types/index.ts';

interface ProductStoreState {
  products: Product[];
  totalProducts: number;
  allDatabaseCount: number;
  needsPrintCount: number;
  selectedProductIds: Set<string>;
  filters: ProductFilter;
  page: number;
  pageSize: number;
  sortField: 'createdAt' | 'name' | 'price' | 'sku';
  sortDirection: 'asc' | 'desc';
  isLoading: boolean;

  loadProducts: () => Promise<void>;
  refreshCount: () => Promise<void>;
  setFilter: (newFilters: Partial<ProductFilter>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSorting: (field: 'createdAt' | 'name' | 'price' | 'sku') => void;
  toggleSelectProduct: (id: string) => void;
  selectAllCurrentPage: () => void;
  selectAllMatching: () => Promise<void>;
  deselectAll: () => void;
  saveProduct: (product: Product) => Promise<void>;
  bulkSaveProducts: (products: Product[]) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  bulkDeleteSelected: () => Promise<void>;
  updateProductPrintStatus: (id: string, needsPrint: boolean) => Promise<void>;
  bulkUpdatePrintStatus: (ids: string[], needsPrint: boolean) => Promise<void>;
  markSelectedAsPrinted: () => Promise<void>;
  markSelectedAsNeedsPrint: () => Promise<void>;
}

const defaultFilters: ProductFilter = {
  search: '',
  categoryId: undefined,
  subcategoryId: undefined,
  attributeId: undefined,
  colorId: undefined,
  sizeId: undefined,
  genderId: undefined,
  ageId: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  printStatus: 'all',
};

export const useProductStore = create<ProductStoreState>((set, get) => ({
  products: [],
  totalProducts: 0,
  allDatabaseCount: 0,
  needsPrintCount: 0,
  selectedProductIds: new Set<string>(),
  filters: { ...defaultFilters },
  page: 1,
  pageSize: 20,
  sortField: 'createdAt',
  sortDirection: 'desc',
  isLoading: false,

  loadProducts: async () => {
    set({ isLoading: true });
    try {
      const { page, pageSize, filters, sortField, sortDirection } = get();
      const [result, totalCount, needsPrintCount] = await Promise.all([
        productRepository.getProducts(page, pageSize, filters, sortField, sortDirection),
        productRepository.count(),
        productRepository.countNeedsPrint(),
      ]);

      set({
        products: result.products,
        totalProducts: result.total,
        allDatabaseCount: totalCount,
        needsPrintCount,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load products:', err);
      set({ isLoading: false });
    }
  },

  refreshCount: async () => {
    const [allDatabaseCount, needsPrintCount] = await Promise.all([
      productRepository.count(),
      productRepository.countNeedsPrint(),
    ]);
    set({ allDatabaseCount, needsPrintCount });
  },

  setFilter: (newFilters: Partial<ProductFilter>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      page: 1, // reset to page 1 on filter change
    }));
    get().loadProducts();
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters }, page: 1 });
    get().loadProducts();
  },

  setPage: (page: number) => {
    set({ page });
    get().loadProducts();
  },

  setPageSize: (pageSize: number) => {
    set({ pageSize, page: 1 });
    get().loadProducts();
  },

  setSorting: (field: 'createdAt' | 'name' | 'price' | 'sku') => {
    const { sortField, sortDirection } = get();
    if (sortField === field) {
      set({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      set({ sortField: field, sortDirection: 'desc' });
    }
    get().loadProducts();
  },

  toggleSelectProduct: (id: string) => {
    set((state) => {
      const newSelected = new Set(state.selectedProductIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedProductIds: newSelected };
    });
  },

  selectAllCurrentPage: () => {
    set((state) => {
      const newSelected = new Set(state.selectedProductIds);
      for (const p of state.products) {
        newSelected.add(p.id);
      }
      return { selectedProductIds: newSelected };
    });
  },

  selectAllMatching: async () => {
    const { filters } = get();
    const result = await productRepository.getProducts(1, 100000, filters);
    const newSelected = new Set<string>();
    for (const p of result.products) {
      newSelected.add(p.id);
    }
    set({ selectedProductIds: newSelected });
  },

  deselectAll: () => {
    set({ selectedProductIds: new Set<string>() });
  },

  saveProduct: async (product: Product) => {
    await productRepository.saveProduct(product);
    await get().loadProducts();
  },

  bulkSaveProducts: async (products: Product[]) => {
    await productRepository.bulkSaveProducts(products);
    await get().loadProducts();
  },

  deleteProduct: async (id: string) => {
    await productRepository.deleteProduct(id);
    set((state) => {
      const newSelected = new Set(state.selectedProductIds);
      newSelected.delete(id);
      return { selectedProductIds: newSelected };
    });
    await get().loadProducts();
  },

  bulkDeleteSelected: async () => {
    const { selectedProductIds } = get();
    if (selectedProductIds.size === 0) return;
    await productRepository.bulkDeleteProducts(Array.from(selectedProductIds));
    set({ selectedProductIds: new Set<string>() });
    await get().loadProducts();
  },

  updateProductPrintStatus: async (id: string, needsPrint: boolean) => {
    await productRepository.updatePrintStatus(id, needsPrint);
    await get().loadProducts();
  },

  bulkUpdatePrintStatus: async (ids: string[], needsPrint: boolean) => {
    await productRepository.bulkUpdatePrintStatus(ids, needsPrint);
    await get().loadProducts();
  },

  markSelectedAsPrinted: async () => {
    const { selectedProductIds } = get();
    if (selectedProductIds.size === 0) return;
    await productRepository.bulkUpdatePrintStatus(Array.from(selectedProductIds), false);
    await get().loadProducts();
  },

  markSelectedAsNeedsPrint: async () => {
    const { selectedProductIds } = get();
    if (selectedProductIds.size === 0) return;
    await productRepository.bulkUpdatePrintStatus(Array.from(selectedProductIds), true);
    await get().loadProducts();
  },
}));
