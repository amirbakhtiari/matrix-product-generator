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
} from '../types/index.ts';

export interface ProductNameComponents {
  category?: Category;
  subcategory?: SubCategory;
  attribute?: Attribute;
  color?: Color;
  size?: Size;
  gender?: Gender;
  age?: Age;
  season?: Season;
  character?: CharacterItem;
  characterName?: string;
}

export function formatGenderNameForProduct(genderName?: string): string {
  if (!genderName) return '';
  const trimmed = genderName.trim();
  if (trimmed === 'دختر') return 'دخترانه';
  if (trimmed === 'پسر') return 'پسرانه';
  if (trimmed === 'یونیسکس') return 'اسپرت';
  return trimmed;
}

export function formatSizeForProduct(sizeName?: string): string {
  if (!sizeName) return '';
  const trimmed = sizeName.trim();
  if (trimmed.startsWith('سایز')) return trimmed;
  return `سایز ${trimmed}`;
}

/**
 * Generates Persian product name from chosen components.
 * Example: تیشرت بچه‌گانه باب اسفنجی چاپدار قرمز پسرانه سایز 40 (SS)
 */
export function generateProductName(components: ProductNameComponents): string {
  const parts: string[] = [];

  // 1. Subcategory or Category
  if (components.subcategory?.name) {
    parts.push(components.subcategory.name.trim());
  } else if (components.category?.name) {
    parts.push(components.category.name.trim());
  }

  // 2. Character / Cartoon Name if selected
  const charName = components.character?.name || components.characterName;
  if (charName) {
    parts.push(`طرح ${charName.trim()}`);
  }

  // 3. Attribute (چاپدار, ساده, ...)
  if (components.attribute?.name) {
    parts.push(components.attribute.name.trim());
  }

  // 4. Color (قرمز, آبی, ...)
  if (components.color?.name) {
    parts.push(components.color.name.trim());
  }

  // 5. Gender (دخترانه, پسرانه, ...)
  if (components.gender?.name) {
    parts.push(formatGenderNameForProduct(components.gender.name));
  }

  // 6. Size (سایز ۸)
  if (components.size?.name) {
    parts.push(formatSizeForProduct(components.size.name));
  }

  // 7. Season badge (SS / FW / چهارفصل)
  if (components.season?.name) {
    const seasonCode =
      components.season.code === '1'
        ? 'SS'
        : components.season.code === '2'
        ? 'FW'
        : components.season.code === '3' || components.season.name.includes('چهار') || components.season.name.includes('همه')
        ? 'چهارفصل'
        : components.season.name.trim();
    if (seasonCode) {
      parts.push(`(${seasonCode})`);
    }
  }

  // 8. Age (if size not present or additionally specified)
  if (components.age?.name && !components.size?.name) {
    parts.push(`مناسب ${components.age.name.trim()}`);
  }

  return parts.join(' ').replace(/\s{2,}/g, ' ').trim();
}

