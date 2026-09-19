import * as XLSX from 'xlsx';
import type { Product } from '../types/index.ts';

export interface ExportLabelItem {
  barcode: string;
  name: string;
  price: number;
}

/**
 * Prepares product data specifically for barcode/label printing.
 * Strictly excludes internal fields (ID, SKU, Category, timestamps).
 */
export function prepareLabelData(products: Product[]): ExportLabelItem[] {
  return products.map((p) => ({
    barcode: String(p.barcode).trim(),
    name: p.name.trim(),
    price: Number(p.price) || 0,
  }));
}

/**
 * Generates and downloads an Excel file formatted specifically for barcode printers.
 * Preserves barcode as Text to completely prevent Excel scientific notation.
 */
export function exportProductsToExcel(products: Product[]): {
  success: boolean;
  filename: string;
  count: number;
} {
  const labelItems = prepareLabelData(products);

  // Define headers in exact requested order: بارکد | نام محصول | قیمت
  const headers = ['بارکد', 'نام محصول', 'قیمت'];

  // Construct sheet data with explicit cell types
  const wsData: XLSX.CellObject[][] = [];

  // Header row
  wsData.push(
    headers.map((h) => ({
      t: 's',
      v: h,
    }))
  );

  // Data rows
  for (const item of labelItems) {
    wsData.push([
      {
        t: 's', // Explicitly String type to prevent scientific notation (e.g. 6.26E+12)
        v: String(item.barcode),
        z: '@', // Text format
      },
      {
        t: 's',
        v: String(item.name),
      },
      {
        t: 'n', // Numeric type
        v: Number(item.price),
      },
    ]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData as unknown[][]);

  // Set column widths
  ws['!cols'] = [
    { wch: 22 }, // بارکد
    { wch: 45 }, // نام محصول
    { wch: 18 }, // قیمت
  ];

  // Set RTL direction for the worksheet
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ rightToLeft: true });

  XLSX.utils.book_append_sheet(wb, ws, 'بارکد محصولات');

  // Format date YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const filename = `products-barcode-${year}-${month}-${day}.xlsx`;

  XLSX.writeFile(wb, filename);

  return {
    success: true,
    filename,
    count: labelItems.length,
  };
}

/**
 * Exports matrix combinations to Excel
 */
export function exportMatrixCombinationsToExcel(combinations: {
  barcode: string;
  name: string;
  sku: string;
  price: number;
}[]): {
  success: boolean;
  filename: string;
  count: number;
} {
  const headers = ['ردیف', 'بارکد', 'نام محصول', 'کد کالا (SKU)', 'قیمت (تومان)'];

  const wsData: XLSX.CellObject[][] = [];

  // Header row
  wsData.push(headers.map((h) => ({ t: 's', v: h })));

  // Data rows
  combinations.forEach((item, index) => {
    wsData.push([
      { t: 'n', v: index + 1 },
      { t: 's', v: String(item.barcode), z: '@' },
      { t: 's', v: String(item.name) },
      { t: 's', v: String(item.sku) },
      { t: 'n', v: Number(item.price) || 0 },
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData as unknown[][]);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 22 },
    { wch: 45 },
    { wch: 25 },
    { wch: 18 },
  ];

  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ rightToLeft: true });

  XLSX.utils.book_append_sheet(wb, ws, 'ماتریس محصولات');

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const filename = `product-matrix-${year}-${month}-${day}.xlsx`;

  XLSX.writeFile(wb, filename);

  return {
    success: true,
    filename,
    count: combinations.length,
  };
}

