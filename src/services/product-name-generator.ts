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
  productName?: string;
  modelName?: string;
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
 * Generates Persian product name strictly adhering to the requirement:
 * نام محصول فقط شامل گروه اصلی و ویژگی و داخل پرانتز نام محصول
 * Example: تیشرت چاپدار (تدی)
 * Example with Character: تیشرت چاپدار (باب اسفنجی)
 */
export function generateProductName(components: ProductNameComponents): string {
  // 1. گروه اصلی (Category)
  const categoryPart = (components.category?.name || components.subcategory?.name || '').trim();

  // 2. ویژگی (Attribute)
  const attributePart = (components.attribute?.name || '').trim();

  // 3. نام محصول / مدل / کاراکتر (داخل پرانتز)
  const rawInnerName = (
    components.productName ||
    components.modelName ||
    components.character?.name ||
    components.characterName ||
    ''
  ).trim();

  // Remove any pre-existing parentheses if passed like "(تدی)"
  const cleanInnerName = rawInnerName.replace(/^\(+|\)+$/g, '').trim();

  const parts: string[] = [];
  if (categoryPart) {
    parts.push(categoryPart);
  }
  if (attributePart) {
    parts.push(attributePart);
  }

  // Inside parentheses: use clean inner name if present, otherwise "(نام محصول)"
  const parenthesizedName = cleanInnerName ? `(${cleanInnerName})` : '(نام محصول)';
  parts.push(parenthesizedName);

  return parts.join(' ').replace(/\s{2,}/g, ' ').trim();
}

