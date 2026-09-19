import { create } from 'zustand';
import { catalogRepository } from '../db/repositories/catalog-repository.ts';
import { ensureAllCatalogCodesAreNumeric } from '../db/seed.ts';
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
  Settings,
  CatalogType,
} from '../types/index.ts';

interface CatalogStoreState {
  categories: Category[];
  subcategories: SubCategory[];
  attributes: Attribute[];
  colors: Color[];
  sizes: Size[];
  genders: Gender[];
  ages: Age[];
  seasons: Season[];
  characters: CharacterItem[];
  settings: Settings;
  isLoading: boolean;

  loadAllCatalogData: () => Promise<void>;
  addCatalogItem: (type: CatalogType, item: any) => Promise<any>;
  updateCatalogItem: (type: CatalogType, item: any) => Promise<void>;
  deleteCatalogItem: (type: CatalogType, id: string) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
}

export const useCatalogStore = create<CatalogStoreState>((set, get) => ({
  categories: [],
  subcategories: [],
  attributes: [],
  colors: [],
  sizes: [],
  genders: [],
  ages: [],
  seasons: [],
  characters: [],
  settings: {
    id: 'default',
    skuTemplate: '{category}-{attribute}-{season}-{color}-{gender}-{size}',
    barcodeType: 'CODE-128',
    barcodePrefix: '1000',
    currency: 'تومان',
    updatedAt: Date.now(),
  },
  isLoading: false,

  loadAllCatalogData: async () => {
    set({ isLoading: true });
    try {
      // Guarantee all codes are numeric
      await ensureAllCatalogCodesAreNumeric();

      const [
        categories,
        subcategories,
        attributes,
        colors,
        sizes,
        genders,
        ages,
        seasons,
        characters,
        settings,
      ] = await Promise.all([
        catalogRepository.getCategories(),
        catalogRepository.getSubcategories(),
        catalogRepository.getAttributes(),
        catalogRepository.getColors(),
        catalogRepository.getSizes(),
        catalogRepository.getGenders(),
        catalogRepository.getAges(),
        catalogRepository.getSeasons(),
        catalogRepository.getCharacters(),
        catalogRepository.getSettings(),
      ]);

      set({
        categories,
        subcategories,
        attributes,
        colors,
        sizes,
        genders,
        ages,
        seasons,
        characters,
        settings,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load catalog data:', err);
      set({ isLoading: false });
    }
  },

  addCatalogItem: async (type: CatalogType, item: any) => {
    switch (type) {
      case 'category':
        await catalogRepository.addCategory(item);
        set((state) => ({ categories: [...state.categories, item] }));
        break;
      case 'subcategory':
        await catalogRepository.addSubCategory(item);
        set((state) => ({ subcategories: [...state.subcategories, item] }));
        break;
      case 'attribute':
        await catalogRepository.addAttribute(item);
        set((state) => ({ attributes: [...state.attributes, item] }));
        break;
      case 'color':
        await catalogRepository.addColor(item);
        set((state) => ({ colors: [...state.colors, item] }));
        break;
      case 'size':
        await catalogRepository.addSize(item);
        set((state) => ({ sizes: [...state.sizes, item] }));
        break;
      case 'gender':
        await catalogRepository.addGender(item);
        set((state) => ({ genders: [...state.genders, item] }));
        break;
      case 'age':
        await catalogRepository.addAge(item);
        set((state) => ({ ages: [...state.ages, item] }));
        break;
      case 'season':
        await catalogRepository.addSeason(item);
        set((state) => ({ seasons: [...state.seasons, item] }));
        break;
      case 'character':
        await catalogRepository.addCharacter(item);
        set((state) => ({ characters: [...state.characters, item] }));
        break;
    }
    return item;
  },

  updateCatalogItem: async (type: CatalogType, item: any) => {
    switch (type) {
      case 'category':
        await catalogRepository.updateCategory(item);
        set((state) => ({
          categories: state.categories.map((c) => (c.id === item.id ? item : c)),
        }));
        break;
      case 'subcategory':
        await catalogRepository.updateSubCategory(item);
        set((state) => ({
          subcategories: state.subcategories.map((c) => (c.id === item.id ? item : c)),
        }));
        break;
      case 'attribute':
        await catalogRepository.updateAttribute(item);
        set((state) => ({
          attributes: state.attributes.map((c) => (c.id === item.id ? item : c)),
        }));
        break;
      case 'color':
        await catalogRepository.updateColor(item);
        set((state) => ({
          colors: state.colors.map((c) => (c.id === item.id ? item : c)),
        }));
        break;
      case 'size':
        await catalogRepository.updateSize(item);
        set((state) => ({
          sizes: state.sizes.map((c) => (c.id === item.id ? item : c)),
        }));
        break;
      case 'gender':
        await catalogRepository.updateGender(item);
        set((state) => ({
          genders: state.genders.map((c) => (c.id === item.id ? item : c)),
        }));
        break;
      case 'age':
        await catalogRepository.updateAge(item);
        set((state) => ({
          ages: state.ages.map((c) => (c.id === item.id ? item : c)),
        }));
        break;
      case 'season':
        await catalogRepository.updateSeason(item);
        set((state) => ({
          seasons: state.seasons.map((c) => (c.id === item.id ? item : c)),
        }));
        break;
      case 'character':
        await catalogRepository.updateCharacter(item);
        set((state) => ({
          characters: state.characters.map((c) => (c.id === item.id ? item : c)),
        }));
        break;
    }
  },

  deleteCatalogItem: async (type: CatalogType, id: string) => {
    switch (type) {
      case 'category':
        await catalogRepository.deleteCategory(id);
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
        break;
      case 'subcategory':
        await catalogRepository.deleteSubCategory(id);
        set((state) => ({
          subcategories: state.subcategories.filter((c) => c.id !== id),
        }));
        break;
      case 'attribute':
        await catalogRepository.deleteAttribute(id);
        set((state) => ({
          attributes: state.attributes.filter((c) => c.id !== id),
        }));
        break;
      case 'color':
        await catalogRepository.deleteColor(id);
        set((state) => ({
          colors: state.colors.filter((c) => c.id !== id),
        }));
        break;
      case 'size':
        await catalogRepository.deleteSize(id);
        set((state) => ({
          sizes: state.sizes.filter((c) => c.id !== id),
        }));
        break;
      case 'gender':
        await catalogRepository.deleteGender(id);
        set((state) => ({
          genders: state.genders.filter((c) => c.id !== id),
        }));
        break;
      case 'age':
        await catalogRepository.deleteAge(id);
        set((state) => ({
          ages: state.ages.filter((c) => c.id !== id),
        }));
        break;
      case 'season':
        await catalogRepository.deleteSeason(id);
        set((state) => ({
          seasons: state.seasons.filter((c) => c.id !== id),
        }));
        break;
      case 'character':
        await catalogRepository.deleteCharacter(id);
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
        }));
        break;
    }
  },

  updateSettings: async (settings: Settings) => {
    await catalogRepository.saveSettings(settings);
    set({ settings });
  },
}));

