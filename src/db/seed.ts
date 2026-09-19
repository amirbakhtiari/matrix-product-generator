import { db } from './database.ts';
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
} from '../types/index.ts';
import { SEEDED_COLORS_200 } from '../data/colors-data.ts';
import { SEEDED_CHARACTERS_1000 } from '../data/characters-data.ts';

let seedPromise: Promise<boolean> | null = null;

export async function seedInitialDataIfNeeded(): Promise<boolean> {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    try {
      const now = Date.now();

      // Always guarantee that all existing codes in IndexedDB are strictly numeric
      await ensureAllCatalogCodesAreNumeric();

      // Check if already seeded with new schema
      const seasonCount = await db.seasons.count();
      const colorCount = await db.colors.count();
      const charCount = await db.characters.count();

      // If all new datasets already exist, we don't need to re-seed
      if (seasonCount > 0 && colorCount >= 200 && charCount >= 1000) {
        return false;
      }

      const defaultSettings: Settings = {
        id: 'default',
        skuTemplate: '{category}-{attribute}-{season}-{color}-{gender}-{size}',
        barcodeType: 'CODE-128',
        barcodePrefix: '1000',
        currency: 'تومان',
        updatedAt: now,
      };

      // 1. گروه اصلی (Category): 4 digits starting from 1000
      // نوزادی، بچه‌گانه، دخترانه و پسرانه
      const categories: Category[] = [
        { id: 'cat-1001', name: 'سرهمی و بادی نوزادی', code: '1001', isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
        { id: 'cat-1002', name: 'بلوز و تیشرت بچه‌گانه', code: '1002', isActive: true, sortOrder: 2, createdAt: now, updatedAt: now },
        { id: 'cat-1003', name: 'پیراهن و سارافون دخترانه', code: '1003', isActive: true, sortOrder: 3, createdAt: now, updatedAt: now },
        { id: 'cat-1004', name: 'تیشرت و پولوشرت پسرانه', code: '1004', isActive: true, sortOrder: 4, createdAt: now, updatedAt: now },
        { id: 'cat-1005', name: 'شلوار و شلوارک بچه‌گانه', code: '1005', isActive: true, sortOrder: 5, createdAt: now, updatedAt: now },
        { id: 'cat-1006', name: 'شلوار جین و کتان پسرانه', code: '1006', isActive: true, sortOrder: 6, createdAt: now, updatedAt: now },
        { id: 'cat-1007', name: 'هودی، دورس و سویشرت کودک', code: '1007', isActive: true, sortOrder: 7, createdAt: now, updatedAt: now },
        { id: 'cat-1008', name: 'کاپشن و پالتو زمستانه کودک', code: '1008', isActive: true, sortOrder: 8, createdAt: now, updatedAt: now },
        { id: 'cat-1009', name: 'ست دوتکه و راحتی نوزادی', code: '1009', isActive: true, sortOrder: 9, createdAt: now, updatedAt: now },
        { id: 'cat-1010', name: 'لباس خواب و راحتی بچه‌گانه', code: '1010', isActive: true, sortOrder: 10, createdAt: now, updatedAt: now },
        { id: 'cat-1011', name: 'دامن و شومیز دخترانه', code: '1011', isActive: true, sortOrder: 11, createdAt: now, updatedAt: now },
        { id: 'cat-1012', name: 'جلیقه و کت پسرانه', code: '1012', isActive: true, sortOrder: 12, createdAt: now, updatedAt: now },
        { id: 'cat-1013', name: 'لباس ورزشی و گرمکن کودک', code: '1013', isActive: true, sortOrder: 13, createdAt: now, updatedAt: now },
        { id: 'cat-1014', name: 'لباس زیر و شورت کودک و نوزاد', code: '1014', isActive: true, sortOrder: 14, createdAt: now, updatedAt: now },
        { id: 'cat-1015', name: 'اکسسوری، کلاه و جوراب کودک', code: '1015', isActive: true, sortOrder: 15, createdAt: now, updatedAt: now },
      ];

      // 2. ویژگی (Attribute): 3 digits starting from 101 or STD
      // ساده، طرح‌دار، چاپدار، STD و سایر ویژگی‌ها
      const attributes: Attribute[] = [
        { id: 'attr-std', name: 'STD', code: 'STD', isActive: true, sortOrder: 0, createdAt: now, updatedAt: now },
        { id: 'attr-101', name: 'ساده', code: '101', isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
        { id: 'attr-102', name: 'طرح‌دار', code: '102', isActive: true, sortOrder: 2, createdAt: now, updatedAt: now },
        { id: 'attr-103', name: 'چاپدار', code: '103', isActive: true, sortOrder: 3, createdAt: now, updatedAt: now },
        { id: 'attr-104', name: 'عروسکی و فانتزی', code: '104', isActive: true, sortOrder: 4, createdAt: now, updatedAt: now },
        { id: 'attr-105', name: 'گلدوزی‌شده', code: '105', isActive: true, sortOrder: 5, createdAt: now, updatedAt: now },
        { id: 'attr-106', name: 'راه‌راه', code: '106', isActive: true, sortOrder: 6, createdAt: now, updatedAt: now },
        { id: 'attr-107', name: 'چهارخانه', code: '107', isActive: true, sortOrder: 7, createdAt: now, updatedAt: now },
        { id: 'attr-108', name: 'خال‌خالی', code: '108', isActive: true, sortOrder: 8, createdAt: now, updatedAt: now },
        { id: 'attr-109', name: 'گلدار', code: '109', isActive: true, sortOrder: 9, createdAt: now, updatedAt: now },
        { id: 'attr-110', name: 'پولک‌دوزی', code: '110', isActive: true, sortOrder: 10, createdAt: now, updatedAt: now },
        { id: 'attr-111', name: 'تکه‌دوزی', code: '111', isActive: true, sortOrder: 11, createdAt: now, updatedAt: now },
        { id: 'attr-112', name: 'اکلیلی و شاین', code: '112', isActive: true, sortOrder: 12, createdAt: now, updatedAt: now },
        { id: 'attr-113', name: 'ابروبادی', code: '113', isActive: true, sortOrder: 13, createdAt: now, updatedAt: now },
        { id: 'attr-114', name: 'بافت و ژاکارد', code: '114', isActive: true, sortOrder: 14, createdAt: now, updatedAt: now },
        { id: 'attr-115', name: 'مخمل', code: '115', isActive: true, sortOrder: 15, createdAt: now, updatedAt: now },
        { id: 'attr-116', name: 'جین شسته‌شده', code: '116', isActive: true, sortOrder: 16, createdAt: now, updatedAt: now },
        { id: 'attr-117', name: 'کبریتی', code: '117', isActive: true, sortOrder: 17, createdAt: now, updatedAt: now },
        { id: 'attr-118', name: 'کشباف', code: '118', isActive: true, sortOrder: 18, createdAt: now, updatedAt: now },
        { id: 'attr-119', name: 'نئونی و فسفری', code: '119', isActive: true, sortOrder: 19, createdAt: now, updatedAt: now },
        { id: 'attr-120', name: 'برجسته', code: '120', isActive: true, sortOrder: 20, createdAt: now, updatedAt: now },
      ];

      // 3. فصل (Season): 1 digit
      // SS, FW, همه فصول
      const seasons: Season[] = [
        { id: 'sea-1', name: 'SS (بهار و تابستان)', code: '1', isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
        { id: 'sea-2', name: 'FW (پاییز و زمستان)', code: '2', isActive: true, sortOrder: 2, createdAt: now, updatedAt: now },
        { id: 'sea-3', name: 'همه فصول (چهار فصل)', code: '3', isActive: true, sortOrder: 3, createdAt: now, updatedAt: now },
      ];

      // 4. رنگ (Color): STD + 3 digits starting from 001 - 200 colors!
      const colors: Color[] = [
        { id: 'col-std', name: 'STD', code: 'STD', hexCode: '#94A3B8', isActive: true, sortOrder: 0, createdAt: now, updatedAt: now },
        ...SEEDED_COLORS_200.map((c, index) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          hexCode: c.hexCode,
          isActive: true,
          sortOrder: index + 1,
          createdAt: now,
          updatedAt: now,
        })),
      ];

      // 5. جنسیت (Gender): 1 digit
      const genders: Gender[] = [
        { id: 'gen-1', name: 'دخترانه', code: '1', isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
        { id: 'gen-2', name: 'پسرانه', code: '2', isActive: true, sortOrder: 2, createdAt: now, updatedAt: now },
        { id: 'gen-3', name: 'اسپرت / یونیسکس', code: '3', isActive: true, sortOrder: 3, createdAt: now, updatedAt: now },
        { id: 'gen-4', name: 'نوزادی (مشترک)', code: '4', isActive: true, sortOrder: 4, createdAt: now, updatedAt: now },
      ];

      // 6. سایز (Size): STD + 3 digits starting from 001
      const sizes: Size[] = [
        { id: 'siz-std', name: 'STD', code: 'STD', isActive: true, sortOrder: 0, createdAt: now, updatedAt: now },
        { id: 'siz-001', name: 'سایز 00 (نوزادی بدو تولد)', code: '001', isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
        { id: 'siz-002', name: 'سایز 0 (0 تا 3 ماه)', code: '002', isActive: true, sortOrder: 2, createdAt: now, updatedAt: now },
        { id: 'siz-003', name: 'سایز 1 (3 تا 6 ماه)', code: '003', isActive: true, sortOrder: 3, createdAt: now, updatedAt: now },
        { id: 'siz-004', name: 'سایز 2 (6 تا 9 ماه)', code: '004', isActive: true, sortOrder: 4, createdAt: now, updatedAt: now },
        { id: 'siz-005', name: 'سایز 3 (9 تا 12 ماه)', code: '005', isActive: true, sortOrder: 5, createdAt: now, updatedAt: now },
        { id: 'siz-006', name: 'سایز 4 (12 تا 18 ماه)', code: '006', isActive: true, sortOrder: 6, createdAt: now, updatedAt: now },
        { id: 'siz-007', name: 'سایز 5 (18 تا 24 ماه)', code: '007', isActive: true, sortOrder: 7, createdAt: now, updatedAt: now },
        { id: 'siz-008', name: 'سایز 30 (1 تا 2 سال)', code: '008', isActive: true, sortOrder: 8, createdAt: now, updatedAt: now },
        { id: 'siz-009', name: 'سایز 35 (2 تا 3 سال)', code: '009', isActive: true, sortOrder: 9, createdAt: now, updatedAt: now },
        { id: 'siz-010', name: 'سایز 40 (3 تا 4 سال)', code: '010', isActive: true, sortOrder: 10, createdAt: now, updatedAt: now },
        { id: 'siz-011', name: 'سایز 45 (4 تا 5 سال)', code: '011', isActive: true, sortOrder: 11, createdAt: now, updatedAt: now },
        { id: 'siz-012', name: 'سایز 50 (5 تا 6 سال)', code: '012', isActive: true, sortOrder: 12, createdAt: now, updatedAt: now },
        { id: 'siz-013', name: 'سایز 55 (6 تا 7 سال)', code: '013', isActive: true, sortOrder: 13, createdAt: now, updatedAt: now },
        { id: 'siz-014', name: 'سایز 60 (7 تا 8 سال)', code: '014', isActive: true, sortOrder: 14, createdAt: now, updatedAt: now },
        { id: 'siz-015', name: 'سایز 65 (8 تا 9 سال)', code: '015', isActive: true, sortOrder: 15, createdAt: now, updatedAt: now },
        { id: 'siz-016', name: 'سایز 70 (10 تا 12 سال)', code: '016', isActive: true, sortOrder: 16, createdAt: now, updatedAt: now },
        { id: 'siz-017', name: 'سایز 2 (کودک)', code: '017', isActive: true, sortOrder: 17, createdAt: now, updatedAt: now },
        { id: 'siz-018', name: 'سایز 4 (کودک)', code: '018', isActive: true, sortOrder: 18, createdAt: now, updatedAt: now },
        { id: 'siz-019', name: 'سایز 6 (کودک)', code: '019', isActive: true, sortOrder: 19, createdAt: now, updatedAt: now },
        { id: 'siz-020', name: 'سایز 8 (نوجوان)', code: '020', isActive: true, sortOrder: 20, createdAt: now, updatedAt: now },
        { id: 'siz-021', name: 'سایز 10 (نوجوان)', code: '021', isActive: true, sortOrder: 21, createdAt: now, updatedAt: now },
        { id: 'siz-022', name: 'سایز 12 (نوجوان)', code: '022', isActive: true, sortOrder: 22, createdAt: now, updatedAt: now },
        { id: 'siz-023', name: 'سایز 14 (نوجوان)', code: '023', isActive: true, sortOrder: 23, createdAt: now, updatedAt: now },
        { id: 'siz-024', name: 'سایز 16 (نوجوان)', code: '024', isActive: true, sortOrder: 24, createdAt: now, updatedAt: now },
        { id: 'siz-025', name: 'فری‌سایز', code: '025', isActive: true, sortOrder: 25, createdAt: now, updatedAt: now },
      ];

      // 7. نام محصول (شخصیت‌های کارتونی و انیمیشنی - بیش از ۱۰۰۰ نام)
      const characters: CharacterItem[] = SEEDED_CHARACTERS_1000.map((c, index) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        isActive: true,
        sortOrder: index + 1,
        createdAt: now,
        updatedAt: now,
      }));

      // Rade-senni / Ages (pure numeric 2 digits)
      const ages: Age[] = [
        { id: 'age-001', name: '0 تا 6 ماه', code: '01', isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
        { id: 'age-002', name: '6 تا 12 ماه', code: '02', isActive: true, sortOrder: 2, createdAt: now, updatedAt: now },
        { id: 'age-003', name: '1 تا 2 سال', code: '03', isActive: true, sortOrder: 3, createdAt: now, updatedAt: now },
        { id: 'age-004', name: '2 تا 4 سال', code: '04', isActive: true, sortOrder: 4, createdAt: now, updatedAt: now },
        { id: 'age-005', name: '4 تا 6 سال', code: '05', isActive: true, sortOrder: 5, createdAt: now, updatedAt: now },
        { id: 'age-006', name: '6 تا 8 سال', code: '06', isActive: true, sortOrder: 6, createdAt: now, updatedAt: now },
        { id: 'age-007', name: '8 تا 12 سال', code: '07', isActive: true, sortOrder: 7, createdAt: now, updatedAt: now },
        { id: 'age-008', name: '12 تا 16 سال', code: '08', isActive: true, sortOrder: 8, createdAt: now, updatedAt: now },
      ];

      await db.transaction('rw', [
        db.settings,
        db.categories,
        db.attributes,
        db.seasons,
        db.colors,
        db.genders,
        db.sizes,
        db.ages,
        db.characters,
      ], async () => {
        await db.settings.put(defaultSettings);
        await db.categories.bulkPut(categories);
        await db.attributes.bulkPut(attributes);
        await db.seasons.bulkPut(seasons);
        await db.colors.bulkPut(colors);
        await db.genders.bulkPut(genders);
        await db.sizes.bulkPut(sizes);
        await db.ages.bulkPut(ages);
        await db.characters.bulkPut(characters);
      });

      await ensureAllCatalogCodesAreNumeric();
      return true;
    } catch (err) {
      console.error('Error in seedInitialDataIfNeeded:', err);
      return false;
    } finally {
      seedPromise = null;
    }
  })();

  return seedPromise;
}

/**
 * Ensures that EVERY single code across ALL catalog entities in IndexedDB
 * is strictly numeric (no letters, hyphens, or symbols).
 */
export async function ensureAllCatalogCodesAreNumeric(): Promise<void> {
  try {
    await db.transaction('rw', [
      db.categories,
      db.attributes,
      db.seasons,
      db.colors,
      db.genders,
      db.sizes,
      db.ages,
      db.characters,
      db.subcategories,
    ], async () => {
      // 1. Categories (4 digits from 1001)
      const allCats = await db.categories.toArray();
      const updatedCats: Category[] = [];
      allCats.forEach((cat, index) => {
        const digits = cat.code ? cat.code.replace(/\D/g, '') : '';
        const newCode = digits.length >= 4 ? digits.slice(0, 4) : (digits ? digits.padStart(4, '0') : (1001 + index).toString());
        if (cat.code !== newCode) {
          updatedCats.push({ ...cat, code: newCode });
        }
      });
      if (updatedCats.length > 0) {
        await db.categories.bulkPut(updatedCats);
      }

      // 2. Attributes (3 digits from 101 or STD)
      const allAttrs = await db.attributes.toArray();
      const updatedAttrs: Attribute[] = [];
      allAttrs.forEach((attr, index) => {
        if (attr.name?.trim().toUpperCase() === 'STD' || attr.code?.trim().toUpperCase() === 'STD') {
          if (attr.code !== 'STD') updatedAttrs.push({ ...attr, code: 'STD' });
          return;
        }
        const digits = attr.code ? attr.code.replace(/\D/g, '') : '';
        const newCode = digits.length >= 3 ? digits.slice(0, 3) : (digits ? digits.padStart(3, '0') : (101 + index).toString());
        if (attr.code !== newCode) {
          updatedAttrs.push({ ...attr, code: newCode });
        }
      });
      if (updatedAttrs.length > 0) {
        await db.attributes.bulkPut(updatedAttrs);
      }

      // 3. Seasons (1 digit: 1, 2, 3)
      const allSeas = await db.seasons.toArray();
      const updatedSeas: Season[] = [];
      allSeas.forEach((sea, index) => {
        let newCode = (sea.code || '').replace(/\D/g, '');
        if (!newCode) {
          if (sea.code?.toUpperCase().includes('SS') || sea.name.includes('بهار')) newCode = '1';
          else if (sea.code?.toUpperCase().includes('FW') || sea.name.includes('پاییز')) newCode = '2';
          else newCode = '3';
        }
        const finalCode = newCode.slice(0, 1) || (index + 1).toString().slice(0, 1);
        if (sea.code !== finalCode) {
          updatedSeas.push({ ...sea, code: finalCode });
        }
      });
      if (updatedSeas.length > 0) {
        await db.seasons.bulkPut(updatedSeas);
      }

      // 4. Colors (3 digits from 001 or STD)
      const allCols = await db.colors.toArray();
      const updatedCols: Color[] = [];
      allCols.forEach((col, index) => {
        if (col.name?.trim().toUpperCase() === 'STD' || col.code?.trim().toUpperCase() === 'STD') {
          if (col.code !== 'STD') updatedCols.push({ ...col, code: 'STD' });
          return;
        }
        const digits = col.code ? col.code.replace(/\D/g, '') : '';
        const newCode = digits ? digits.padStart(3, '0').slice(0, 3) : (index + 1).toString().padStart(3, '0');
        if (col.code !== newCode) {
          updatedCols.push({ ...col, code: newCode });
        }
      });
      if (updatedCols.length > 0) {
        await db.colors.bulkPut(updatedCols);
      }

      // 5. Genders (1 digit: 1, 2, 3, 4)
      const allGens = await db.genders.toArray();
      const updatedGens: Gender[] = [];
      allGens.forEach((gen, index) => {
        let newCode = (gen.code || '').replace(/\D/g, '');
        if (!newCode) {
          if (gen.name.includes('دختر')) newCode = '1';
          else if (gen.name.includes('پسر')) newCode = '2';
          else if (gen.name.includes('اسپرت') || gen.name.includes('یونیسکس')) newCode = '3';
          else if (gen.name.includes('نوزاد')) newCode = '4';
          else newCode = (index + 1).toString();
        }
        const finalCode = newCode.slice(0, 1) || (index + 1).toString().slice(0, 1);
        if (gen.code !== finalCode) {
          updatedGens.push({ ...gen, code: finalCode });
        }
      });
      if (updatedGens.length > 0) {
        await db.genders.bulkPut(updatedGens);
      }

      // 6. Sizes (3 digits from 001 or STD)
      const allSizes = await db.sizes.toArray();
      const updatedSizes: Size[] = [];
      allSizes.forEach((siz, index) => {
        if (siz.name?.trim().toUpperCase() === 'STD' || siz.code?.trim().toUpperCase() === 'STD') {
          if (siz.code !== 'STD') updatedSizes.push({ ...siz, code: 'STD' });
          return;
        }
        const digits = siz.code ? siz.code.replace(/\D/g, '') : '';
        const newCode = digits ? digits.padStart(3, '0').slice(0, 3) : (index + 1).toString().padStart(3, '0');
        if (siz.code !== newCode) {
          updatedSizes.push({ ...siz, code: newCode });
        }
      });
      if (updatedSizes.length > 0) {
        await db.sizes.bulkPut(updatedSizes);
      }

      // 7. Ages (2 digits from 01)
      const allAges = await db.ages.toArray();
      const updatedAges: Age[] = [];
      allAges.forEach((age, index) => {
        const digits = age.code ? age.code.replace(/\D/g, '') : '';
        const newCode = digits.length >= 2 ? digits.slice(0, 2) : (digits ? digits.padStart(2, '0') : (index + 1).toString().padStart(2, '0'));
        if (age.code !== newCode) {
          updatedAges.push({ ...age, code: newCode });
        }
      });
      if (updatedAges.length > 0) {
        await db.ages.bulkPut(updatedAges);
      }

      // 8. Characters (4 digits from 0001)
      const allChars = await db.characters.toArray();
      const updatedChars: CharacterItem[] = [];
      allChars.forEach((chr, index) => {
        const digits = chr.code ? chr.code.replace(/\D/g, '') : '';
        const newCode = digits ? digits.padStart(4, '0').slice(0, 4) : (index + 1).toString().padStart(4, '0');
        if (chr.code !== newCode) {
          updatedChars.push({ ...chr, code: newCode });
        }
      });
      if (updatedChars.length > 0) {
        await db.characters.bulkPut(updatedChars);
      }

      // 9. Subcategories (3 digits from 101)
      const allSubs = await db.subcategories.toArray();
      const updatedSubs: SubCategory[] = [];
      allSubs.forEach((sub, index) => {
        const digits = sub.code ? sub.code.replace(/\D/g, '') : '';
        const newCode = digits.length >= 3 ? digits.slice(0, 3) : (digits ? digits.padStart(3, '0') : (101 + index).toString());
        if (sub.code !== newCode) {
          updatedSubs.push({ ...sub, code: newCode });
        }
      });
      if (updatedSubs.length > 0) {
        await db.subcategories.bulkPut(updatedSubs);
      }

      // Ensure all catalog tables have 100% unique titles/names
      const deduplicateTableByName = async (table: any) => {
        const items = await table.toArray();
        const seenNames = new Set<string>();
        const toDeleteIds: string[] = [];
        for (const item of items) {
          if (!item.name) continue;
          const key = item.name.trim().toLowerCase();
          if (seenNames.has(key)) {
            toDeleteIds.push(item.id);
          } else {
            seenNames.add(key);
          }
        }
        if (toDeleteIds.length > 0) {
          await table.bulkDelete(toDeleteIds);
        }
      };

      await deduplicateTableByName(db.categories);
      await deduplicateTableByName(db.attributes);
      await deduplicateTableByName(db.seasons);
      await deduplicateTableByName(db.colors);
      await deduplicateTableByName(db.genders);
      await deduplicateTableByName(db.sizes);
      await deduplicateTableByName(db.ages);
      await deduplicateTableByName(db.characters);
      await deduplicateTableByName(db.subcategories);

      // Ensure STD exists in attributes, colors, and sizes
      const now = Date.now();
      const ensureStdExists = async (table: any, id: string, name: string, code: string, extra = {}) => {
        const all = await table.toArray();
        const hasStd = all.some((item: any) => item.name?.trim().toUpperCase() === 'STD' || item.code?.trim().toUpperCase() === 'STD');
        if (!hasStd) {
          await table.put({
            id,
            name,
            code,
            isActive: true,
            sortOrder: 0,
            createdAt: now,
            updatedAt: now,
            ...extra,
          });
        }
      };

      await ensureStdExists(db.attributes, 'attr-std', 'STD', 'STD');
      await ensureStdExists(db.colors, 'col-std', 'STD', 'STD', { hexCode: '#94A3B8' });
      await ensureStdExists(db.sizes, 'siz-std', 'STD', 'STD');
    });
  } catch (err) {
    console.error('Error in ensureAllCatalogCodesAreNumeric:', err);
  }
}
