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

export interface SkuComponents {
  category?: Category;
  subcategory?: SubCategory;
  attribute?: Attribute;
  color?: Color;
  size?: Size;
  gender?: Gender;
  age?: Age;
  season?: Season;
  character?: CharacterItem;
}

export const DEFAULT_SKU_TEMPLATE = '{category}-{attribute}-{season}-{color}-{gender}-{size}-{character}';

/**
 * Normalizes a code for SKU and matrix use - strictly numeric digits only!
 * As requested, all dimension codes (category, attribute, season, color, gender, size, etc.) must be strictly NUMERIC.
 */
export function cleanCode(code?: string): string {
  if (!code) return '';
  return code.toString().replace(/\D/g, '').trim();
}

/**
 * Formats dimension code strictly respecting the rule:
 * "کدها به جز فصل و جنسیت نباید تک رقمی داشته باشند"
 * - Season: 1 digit (e.g. '1', '2', '3')
 * - Gender: 1 digit (e.g. '1', '2', '3', '4')
 * - All other dimensions: MUST NOT be single digit!
 *   - Category: 4 digits (e.g. '1001')
 *   - Attribute: 3 digits (e.g. '101')
 *   - Color: 3 digits (e.g. '001', '010', '100')
 *   - Size: 3 digits (e.g. '001', '010', '025')
 *   - Character: 4 digits (e.g. '0001' to '9999')
 *   - Subcategory: 3 digits (e.g. '101', '102')
 *   - Age: 2 digits (e.g. '01', '02', '08')
 *   - Generic fallback: minimum 2 digits (e.g. '01')
 */
export function formatDimensionCode(rawCode: string | undefined | number, dimension?: string): string {
  const rawStr = String(rawCode ?? '').trim();
  if (rawStr.toUpperCase() === 'STD') {
    return 'STD';
  }

  const digits = rawStr.replace(/\D/g, '').trim();

  // Exceptions: Season and Gender are allowed to be 1 digit
  if (dimension === 'season') {
    return digits ? digits.slice(0, 1) : '1';
  }

  if (dimension === 'gender') {
    return digits ? digits.slice(0, 1) : '1';
  }

  // All other dimensions MUST NOT be single-digit:
  if (dimension === 'category') {
    if (!digits) return '1001';
    if (digits.length < 4) return digits.padStart(4, '0');
    return digits.slice(0, 4);
  }

  if (dimension === 'attribute' || dimension === 'subcategory') {
    if (!digits) return '101';
    if (digits.length < 3) return digits.padStart(3, '0');
    return digits.slice(0, 3);
  }

  if (dimension === 'color' || dimension === 'size') {
    if (!digits) return '001';
    return digits.padStart(3, '0').slice(0, 3);
  }

  if (dimension === 'character') {
    if (!digits) return '0001';
    return digits.padStart(4, '0').slice(0, 4);
  }

  if (dimension === 'age') {
    if (!digits) return '01';
    return digits.padStart(2, '0').slice(0, 2);
  }

  // Generic fallback: never single digit!
  if (!digits) return '01';
  if (digits.length === 1) return `0${digits}`;
  return digits;
}

/**
 * Generates an SKU from catalog item codes according to the provided template.
 * Guarantees no single-digit codes except for season and gender.
 */
export function generateSku(
  components: SkuComponents,
  template: string = DEFAULT_SKU_TEMPLATE
): string {
  const tokenValues: Record<string, string> = {
    '{category}': components.category ? formatDimensionCode(components.category.code, 'category') : '',
    '{subcategory}': components.subcategory ? formatDimensionCode(components.subcategory.code, 'subcategory') : '',
    '{attribute}': components.attribute ? formatDimensionCode(components.attribute.code, 'attribute') : '',
    '{color}': components.color ? formatDimensionCode(components.color.code, 'color') : '',
    '{size}': components.size ? formatDimensionCode(components.size.code, 'size') : '',
    '{gender}': components.gender ? formatDimensionCode(components.gender.code, 'gender') : '',
    '{age}': components.age ? formatDimensionCode(components.age.code, 'age') : '',
    '{season}': components.season ? formatDimensionCode(components.season.code, 'season') : '',
    '{character}': components.character ? formatDimensionCode(components.character.code, 'character') : '',
  };

  let sku = template;

  // Replace each token
  for (const [token, value] of Object.entries(tokenValues)) {
    sku = sku.split(token).join(value);
  }

  // If character was provided but the template did not include {character}, append it to guarantee SKU uniqueness
  if (components.character?.code && !template.includes('{character}')) {
    const charCode = formatDimensionCode(components.character.code, 'character');
    if (charCode && !sku.includes(charCode)) {
      sku = `${sku}-${charCode}`;
    }
  }

  // Clean multiple hyphens, underscores, or delimiters left by missing tokens
  sku = sku
    .replace(/[-_]{2,}/g, '-') // collapse consecutive delimiters
    .replace(/^[-_]+|[-_]+$/g, ''); // trim leading or trailing delimiters

  return sku;
}


/**
 * Validates SKU format
 */
export function isValidSku(sku: string): boolean {
  if (!sku || sku.trim().length === 0) return false;
  // SKU should be clean alphanumeric with hyphens/underscores
  return /^[A-Za-z0-9_-]+$/.test(sku.trim());
}
