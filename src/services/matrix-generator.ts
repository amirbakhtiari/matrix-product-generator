import { db } from '../db/database.ts';
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
  MatrixCombination,
} from '../types/index.ts';
import { generateSku, formatDimensionCode } from './sku-generator.ts';
import { generateProductName } from './product-name-generator.ts';
import { generateStructuredGarmentBarcode, generateUniqueBarcode } from './barcode-service.ts';

export interface MatrixInput {
  categories: Category[];
  attributes: Attribute[];
  seasons: Season[];
  colors: Color[];
  genders: Gender[];
  sizes: Size[];
  characters: CharacterItem[];
  subcategories?: SubCategory[];
  ages?: Age[];
  modelName?: string;
  basePrice: number;
  skuTemplate: string;
  barcodeType: 'EAN-13' | 'CODE-128';
  barcodePrefix: string;
  useStructuredBarcode?: boolean;
}

export interface MatrixResult {
  combinations: MatrixCombination[];
  totalCount: number;
  newCount: number;
  duplicateCount: number;
}

export async function generateMatrix(input: MatrixInput): Promise<MatrixResult> {
  const {
    categories,
    subcategories,
    attributes,
    seasons,
    colors,
    genders,
    sizes,
    characters,
    basePrice,
    skuTemplate,
    barcodeType,
    barcodePrefix,
    useStructuredBarcode = true,
  } = input;

  // Prepare domain arrays: if empty, iterate with [undefined] so Cartesian product still produces valid items
  const catList = categories.length > 0 ? categories : [undefined];
  const subList: (SubCategory | undefined)[] =
    subcategories && subcategories.length > 0 ? subcategories : [undefined];
  const attrList = attributes.length > 0 ? attributes : [undefined];
  const seaList = seasons.length > 0 ? seasons : [undefined];
  const colorList = colors.length > 0 ? colors : [undefined];
  const genderList = genders.length > 0 ? genders : [undefined];
  const sizeList = sizes.length > 0 ? sizes : [undefined];
  const charList = characters.length > 0 ? characters : [undefined];

  const combinations: MatrixCombination[] = [];
  const generatedBarcodes = new Set<string>();

  // Fetch all existing SKUs, Barcodes, and Names from database to detect duplicates efficiently in memory
  const existingProducts = await db.products.toArray();
  const existingSkuMap = new Map<string, typeof existingProducts[0]>();
  const existingBarcodeMap = new Map<string, typeof existingProducts[0]>();
  const existingNameMap = new Map<string, typeof existingProducts[0]>();

  for (const p of existingProducts) {
    if (p.sku) existingSkuMap.set(p.sku.trim(), p);
    if (p.barcode) existingBarcodeMap.set(p.barcode.trim(), p);
    if (p.name) existingNameMap.set(p.name.trim().toLowerCase(), p);
  }

  const generatedNames = new Set<string>();
  let index = 0;

  for (const cat of catList) {
    const matchingSubs: (SubCategory | undefined)[] =
      subList[0] !== undefined && cat
        ? subList.filter((s): s is SubCategory => !!s && (!s.parentId || s.parentId === cat.id))
        : subList;
    const currentSubs = matchingSubs.length > 0 ? matchingSubs : [undefined];

    for (const sub of currentSubs) {
      for (const attr of attrList) {
        for (const sea of seaList) {
          for (const color of colorList) {
            for (const gender of genderList) {
              for (const size of sizeList) {
                for (const char of charList) {
                  index++;
                  const components = {
                    category: cat,
                    subcategory: sub,
                    attribute: attr,
                    season: sea,
                    color,
                    gender,
                    size,
                    character: char,
                    modelName: input.modelName,
                  };

                  const rawName = generateProductName(components);
                  const uniqueName = rawName;

                  const sku = generateSku(components, skuTemplate);

                  let barcode = '';
                  if (useStructuredBarcode) {
                    const rawBarcode = generateStructuredGarmentBarcode({
                      categoryCode: cat?.code,
                      attributeCode: attr?.code,
                      seasonCode: sea?.code,
                      colorCode: color?.code,
                      genderCode: gender?.code,
                      sizeCode: size?.code,
                      characterCode: char?.code,
                    });

                    let uniqueBarcode = rawBarcode;
                    if (generatedBarcodes.has(uniqueBarcode)) {
                      let counter = 1;
                      while (generatedBarcodes.has(`${rawBarcode}${counter}`)) {
                        counter++;
                      }
                      uniqueBarcode = `${rawBarcode}${counter}`;
                    }
                    barcode = uniqueBarcode;
                    generatedBarcodes.add(barcode);
                  } else {
                    barcode = await generateUniqueBarcode(barcodeType, barcodePrefix, generatedBarcodes);
                  }

                  const existingBySku = existingSkuMap.get(sku);
                  const existingByBarcode = existingBarcodeMap.get(barcode);
                  const existingByName = existingNameMap.get(uniqueName.toLowerCase());

                  const isDuplicateSku = !!existingBySku;
                  const isDuplicateBarcode = !!existingByBarcode;
                  const isDuplicateName = !!existingByName;

                  combinations.push({
                    tempId: `mat-${Date.now()}-${index}`,
                    categoryId: cat?.id,
                    subcategoryId: sub?.id,
                    subcategoryName: sub?.name,
                    attributeId: attr?.id,
                    seasonId: sea?.id,
                    colorId: color?.id,
                    genderId: gender?.id,
                    sizeId: size?.id,
                    characterId: char?.id,
                    characterName: char?.name,
                    name: uniqueName,
                    sku,
                    barcode,
                    price: basePrice,
                    isDuplicateSku,
                    isDuplicateBarcode,
                    isDuplicateName,
                    existingProduct: existingBySku || existingByBarcode || existingByName,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  const totalCount = combinations.length;
  const duplicateCount = combinations.filter((c) => c.isDuplicateSku || c.isDuplicateBarcode || c.isDuplicateName).length;
  const newCount = totalCount - duplicateCount;

  return {
    combinations,
    totalCount,
    newCount,
    duplicateCount,
  };
}

