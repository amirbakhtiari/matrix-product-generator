import { db } from '../database.ts';
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
  CatalogItem,
} from '../../types/index.ts';

export const catalogRepository = {
  async getCategories(): Promise<Category[]> {
    return db.categories.orderBy('sortOrder').toArray();
  },

  async getSubcategories(categoryId?: string): Promise<SubCategory[]> {
    if (categoryId) {
      return db.subcategories.where('parentId').equals(categoryId).sortBy('sortOrder');
    }
    return db.subcategories.orderBy('sortOrder').toArray();
  },

  async getAttributes(): Promise<Attribute[]> {
    return db.attributes.orderBy('sortOrder').toArray();
  },

  async getColors(): Promise<Color[]> {
    return db.colors.orderBy('sortOrder').toArray();
  },

  async getSizes(): Promise<Size[]> {
    return db.sizes.orderBy('sortOrder').toArray();
  },

  async getGenders(): Promise<Gender[]> {
    return db.genders.orderBy('sortOrder').toArray();
  },

  async getAges(): Promise<Age[]> {
    return db.ages.orderBy('sortOrder').toArray();
  },

  async getSeasons(): Promise<Season[]> {
    return db.seasons.orderBy('sortOrder').toArray();
  },

  async getCharacters(): Promise<CharacterItem[]> {
    return db.characters.orderBy('sortOrder').toArray();
  },

  async getSettings(): Promise<Settings> {
    const s = await db.settings.get('default');
    if (s) return s;
    const defaultSettings: Settings = {
      id: 'default',
      skuTemplate: '{subcategory}-{attribute}-{color}-{gender}-{size}',
      barcodeType: 'EAN-13',
      barcodePrefix: '6261234',
      currency: 'تومان',
      updatedAt: Date.now(),
    };
    await db.settings.put(defaultSettings);
    return defaultSettings;
  },

  async saveSettings(settings: Settings): Promise<void> {
    await db.settings.put({ ...settings, id: 'default', updatedAt: Date.now() });
  },

  async addCategory(item: Category): Promise<void> {
    await db.categories.put(item);
  },
  async updateCategory(item: Category): Promise<void> {
    await db.categories.put(item);
  },
  async deleteCategory(id: string): Promise<void> {
    await db.categories.delete(id);
  },

  async addSubCategory(item: SubCategory): Promise<void> {
    await db.subcategories.put(item);
  },
  async updateSubCategory(item: SubCategory): Promise<void> {
    await db.subcategories.put(item);
  },
  async deleteSubCategory(id: string): Promise<void> {
    await db.subcategories.delete(id);
  },

  async addAttribute(item: Attribute): Promise<void> {
    await db.attributes.put(item);
  },
  async updateAttribute(item: Attribute): Promise<void> {
    await db.attributes.put(item);
  },
  async deleteAttribute(id: string): Promise<void> {
    await db.attributes.delete(id);
  },

  async addColor(item: Color): Promise<void> {
    await db.colors.put(item);
  },
  async updateColor(item: Color): Promise<void> {
    await db.colors.put(item);
  },
  async deleteColor(id: string): Promise<void> {
    await db.colors.delete(id);
  },

  async addSize(item: Size): Promise<void> {
    await db.sizes.put(item);
  },
  async updateSize(item: Size): Promise<void> {
    await db.sizes.put(item);
  },
  async deleteSize(id: string): Promise<void> {
    await db.sizes.delete(id);
  },

  async addGender(item: Gender): Promise<void> {
    await db.genders.put(item);
  },
  async updateGender(item: Gender): Promise<void> {
    await db.genders.put(item);
  },
  async deleteGender(id: string): Promise<void> {
    await db.genders.delete(id);
  },

  async addAge(item: Age): Promise<void> {
    await db.ages.put(item);
  },
  async updateAge(item: Age): Promise<void> {
    await db.ages.put(item);
  },
  async deleteAge(id: string): Promise<void> {
    await db.ages.delete(id);
  },

  async addSeason(item: Season): Promise<void> {
    await db.seasons.put(item);
  },
  async updateSeason(item: Season): Promise<void> {
    await db.seasons.put(item);
  },
  async deleteSeason(id: string): Promise<void> {
    await db.seasons.delete(id);
  },

  async addCharacter(item: CharacterItem): Promise<void> {
    await db.characters.put(item);
  },
  async updateCharacter(item: CharacterItem): Promise<void> {
    await db.characters.put(item);
  },
  async deleteCharacter(id: string): Promise<void> {
    await db.characters.delete(id);
  },
};
