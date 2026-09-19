import { db } from '../db/database.ts';
import { formatDimensionCode } from './sku-generator.ts';

export interface StructuredBarcodeComponents {
  categoryCode?: string;
  attributeCode?: string;
  seasonCode?: string;
  colorCode?: string;
  genderCode?: string;
  sizeCode?: string;
  characterCode?: string;
}

/**
 * Generates the user-specified 19-digit structured garment barcode:
 * - گروه اصلی: 4 رقم (از 1000 - بدون کد تک‌رقمی)
 * - ویژگی: 3 رقم (از 100/101 - بدون کد تک‌رقمی)
 * - فصل: 1 رقم (1: SS, 2: FW, 3: همه فصول - استثنا تک‌رقمی مجاز)
 * - رنگ: 3 رقم (از 001 تا 200 - بدون کد تک‌رقمی)
 * - جنسیت: 1 رقم (1: دخترانه, 2: پسرانه, 3: یونیسکس, 4: نوزادی - استثنا تک‌رقمی مجاز)
 * - سایز: 3 رقم (از 001 - بدون کد تک‌رقمی)
 * - نام محصول (شخصیت/طرح): 4 رقم (از 0001 تا 9999 - بدون کد تک‌رقمی)
 * Formula: [Category 4][Attribute 3][Season 1][Color 3][Gender 1][Size 3][Character 4] = 19 digits
 */
export function generateStructuredGarmentBarcode(components: StructuredBarcodeComponents): string {
  // Category: 4 digits
  const cat = formatDimensionCode(components.categoryCode, 'category');
  // Attribute: 3 digits (STD -> 000)
  const rawAttr = formatDimensionCode(components.attributeCode, 'attribute');
  const attr = rawAttr.toUpperCase() === 'STD' ? '000' : rawAttr;
  // Season: 1 digit (exception: 1 digit allowed)
  const sea = formatDimensionCode(components.seasonCode, 'season');
  // Color: 3 digits (STD -> 000)
  const rawCol = formatDimensionCode(components.colorCode, 'color');
  const col = rawCol.toUpperCase() === 'STD' ? '000' : rawCol;
  // Gender: 1 digit (exception: 1 digit allowed)
  const gen = formatDimensionCode(components.genderCode, 'gender');
  // Size: 3 digits (STD -> 000)
  const rawSiz = formatDimensionCode(components.sizeCode, 'size');
  const siz = rawSiz.toUpperCase() === 'STD' ? '000' : rawSiz;
  // Product Name / Character: 4 digits
  const chr = formatDimensionCode(components.characterCode, 'character');

  return `${cat}${attr}${sea}${col}${gen}${siz}${chr}`;
}

/**
 * Calculates EAN-13 check digit for a 12-digit string

 */
export function calculateEan13CheckDigit(twelveDigits: string): number {
  if (twelveDigits.length !== 12 || !/^\d{12}$/.test(twelveDigits)) {
    throw new Error('EAN-13 base must be exactly 12 digits');
  }

  let oddSum = 0;
  let evenSum = 0;

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(twelveDigits[i], 10);
    // 1-indexed: position i+1
    if ((i + 1) % 2 === 1) {
      oddSum += digit; // odd positions: 1, 3, 5, 7, 9, 11 (index 0, 2, 4...)
    } else {
      evenSum += digit; // even positions: 2, 4, 6, 8, 10, 12 (index 1, 3, 5...)
    }
  }

  const totalSum = oddSum + evenSum * 3;
  const remainder = totalSum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Validates EAN-13 barcode
 */
export function isValidEan13(barcode: string): boolean {
  if (!barcode || typeof barcode !== 'string') return false;
  const cleaned = barcode.trim();
  if (cleaned.length !== 13 || !/^\d{13}$/.test(cleaned)) {
    return false;
  }

  const base12 = cleaned.substring(0, 12);
  const checkDigit = parseInt(cleaned[12], 10);
  const expectedCheckDigit = calculateEan13CheckDigit(base12);

  return checkDigit === expectedCheckDigit;
}

/**
 * Validates CODE-128 barcode
 */
export function isValidCode128(barcode: string): boolean {
  if (!barcode || typeof barcode !== 'string') return false;
  const cleaned = barcode.trim();
  if (cleaned.length < 3 || cleaned.length > 48) return false;
  // Printable standard characters
  return /^[\x20-\x7E]+$/.test(cleaned);
}

/**
 * Validates any barcode according to requested or auto-detected type
 */
export function validateBarcode(barcode: string, type: 'EAN-13' | 'CODE-128' = 'EAN-13'): {
  isValid: boolean;
  error?: string;
} {
  const cleaned = barcode.trim();
  if (!cleaned) {
    return { isValid: false, error: 'بارکد نمی‌تواند خالی باشد' };
  }

  if (type === 'EAN-13') {
    if (cleaned.length !== 13 || !/^\d{13}$/.test(cleaned)) {
      return { isValid: false, error: 'بارکد EAN-13 باید دقیقاً ۱۳ رقم عددی باشد' };
    }
    if (!isValidEan13(cleaned)) {
      const expected = calculateEan13CheckDigit(cleaned.substring(0, 12));
      return { isValid: false, error: `رقم کنترل بارکد EAN-13 نامعتبر است (رقم کنترل صحیح: ${expected})` };
    }
  } else {
    if (!isValidCode128(cleaned)) {
      return { isValid: false, error: 'فرمت بارکد CODE-128 نامعتبر است' };
    }
  }

  return { isValid: true };
}

/**
 * Generates a unique barcode of the specified type
 * @param type 'EAN-13' | 'CODE-128'
 * @param prefix Company or country prefix (default 6261234)
 * @param existingBarcodes Set of barcodes already generated in a current batch to prevent intra-batch collision
 */
export async function generateUniqueBarcode(
  type: 'EAN-13' | 'CODE-128' = 'EAN-13',
  prefix: string = '6261234',
  existingBarcodes?: Set<string>
): Promise<string> {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let candidate = '';

    if (type === 'EAN-13') {
      // Clean prefix: only numbers, max 7 digits
      const cleanPrefix = prefix.replace(/\D/g, '').padEnd(7, '0').slice(0, 7);
      // Need 12 digits total before check digit (7 prefix + 5 random/sequence)
      const randomSeq = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, '0');
      const base12 = cleanPrefix + randomSeq;
      const checkDigit = calculateEan13CheckDigit(base12);
      candidate = base12 + checkDigit.toString();
    } else {
      // CODE-128
      const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, '') || 'PRD';
      const timestamp = Date.now().toString(36).toUpperCase();
      const rand = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      candidate = `${cleanPrefix}-${timestamp}-${rand}`;
    }

    if (existingBarcodes && existingBarcodes.has(candidate)) {
      continue;
    }

    // Check DB
    const existing = await db.products.where('barcode').equals(candidate).first();
    if (!existing) {
      if (existingBarcodes) {
        existingBarcodes.add(candidate);
      }
      return candidate;
    }
  }

  // Fallback with timestamp for uniqueness
  const timestampSeq = Date.now().toString().slice(-5);
  const base12 = prefix.padEnd(7, '0').slice(0, 7) + timestampSeq;
  const check = calculateEan13CheckDigit(base12);
  const fallback = base12 + check.toString();
  if (existingBarcodes) existingBarcodes.add(fallback);
  return fallback;
}
