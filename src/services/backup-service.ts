import { db } from '../db/database.ts';
import type {
  Category,
  SubCategory,
  Attribute,
  Color,
  Size,
  Gender,
  Age,
  Product,
  Settings,
} from '../types/index.ts';

export interface DatabaseBackup {
  version: number;
  exportedAt: string;
  settings?: Settings;
  categories: Category[];
  subcategories: SubCategory[];
  attributes: Attribute[];
  colors: Color[];
  sizes: Size[];
  genders: Gender[];
  ages: Age[];
  products: Product[];
}

export async function exportDatabaseBackup(): Promise<string> {
  const [
    settings,
    categories,
    subcategories,
    attributes,
    colors,
    sizes,
    genders,
    ages,
    products,
  ] = await Promise.all([
    db.settings.get('default'),
    db.categories.toArray(),
    db.subcategories.toArray(),
    db.attributes.toArray(),
    db.colors.toArray(),
    db.sizes.toArray(),
    db.genders.toArray(),
    db.ages.toArray(),
    db.products.toArray(),
  ]);

  const backupData: DatabaseBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: settings || undefined,
    categories,
    subcategories,
    attributes,
    colors,
    sizes,
    genders,
    ages,
    products,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const filename = `product-matrix-backup-${year}-${month}-${day}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return filename;
}

export function validateBackupData(data: unknown): data is DatabaseBackup {
  if (!data || typeof data !== 'object') return false;
  const b = data as Partial<DatabaseBackup>;
  return (
    Array.isArray(b.categories) &&
    Array.isArray(b.subcategories) &&
    Array.isArray(b.attributes) &&
    Array.isArray(b.colors) &&
    Array.isArray(b.sizes) &&
    Array.isArray(b.genders) &&
    Array.isArray(b.ages) &&
    Array.isArray(b.products)
  );
}

export async function importDatabaseBackup(
  backup: DatabaseBackup,
  mode: 'replace' | 'merge'
): Promise<{ productsCount: number }> {
  if (!validateBackupData(backup)) {
    throw new Error('فایل پشتیبان نامعتبر است');
  }

  await db.transaction(
    'rw',
    [
      db.settings,
      db.categories,
      db.subcategories,
      db.attributes,
      db.colors,
      db.sizes,
      db.genders,
      db.ages,
      db.products,
    ],
    async () => {
      if (mode === 'replace') {
        // Clear all existing data
        await db.categories.clear();
        await db.subcategories.clear();
        await db.attributes.clear();
        await db.colors.clear();
        await db.sizes.clear();
        await db.genders.clear();
        await db.ages.clear();
        await db.products.clear();
      }

      if (backup.settings) {
        await db.settings.put(backup.settings);
      }

      // Add or bulkPut
      if (backup.categories.length) await db.categories.bulkPut(backup.categories);
      if (backup.subcategories.length) await db.subcategories.bulkPut(backup.subcategories);
      if (backup.attributes.length) await db.attributes.bulkPut(backup.attributes);
      if (backup.colors.length) await db.colors.bulkPut(backup.colors);
      if (backup.sizes.length) await db.sizes.bulkPut(backup.sizes);
      if (backup.genders.length) await db.genders.bulkPut(backup.genders);
      if (backup.ages.length) await db.ages.bulkPut(backup.ages);
      if (backup.products.length) await db.products.bulkPut(backup.products);
    }
  );

  return { productsCount: backup.products.length };
}
