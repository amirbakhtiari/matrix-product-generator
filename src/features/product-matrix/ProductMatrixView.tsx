import React, { useState, useMemo } from 'react';
import { useCatalogStore } from '../../stores/catalog-store.ts';
import { useProductStore } from '../../stores/product-store.ts';
import { useUiStore } from '../../stores/ui-store.ts';
import { generateMatrix } from '../../services/matrix-generator.ts';
import { generateStructuredGarmentBarcode, generateUniqueBarcode } from '../../services/barcode-service.ts';
import { formatDimensionCode } from '../../services/sku-generator.ts';
import { exportMatrixCombinationsToExcel } from '../../services/excel-export-service.ts';
import { MultiSelectDropdown } from '../../components/dropdown/MultiSelectDropdown.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import type {
  MatrixCombination,
  Product,
} from '../../types/index.ts';
import {
  Grid3X3,
  Layers,
  Sparkles,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Save,
  FileSpreadsheet,
  RotateCcw,
  Check,
  Barcode,
  Search,
  ExternalLink,
} from 'lucide-react';

export const ProductMatrixView: React.FC = () => {
  const {
    categories,
    subcategories,
    attributes,
    seasons,
    colors,
    genders,
    sizes,
    characters,
    settings,
  } = useCatalogStore();

  const { bulkSaveProducts, refreshCount } = useProductStore();
  const { showToast, setActiveTab } = useUiStore();

  // Multi-selection state for dimensions
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([]);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [selectedSeasonIds, setSelectedSeasonIds] = useState<string[]>([]);
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [selectedGenderIds, setSelectedGenderIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);

  // Base price & custom model name
  const [basePrice, setBasePrice] = useState<string>('450,000');
  const [customModelName, setCustomModelName] = useState<string>('');

  // Generated matrix results
  const [combinations, setCombinations] = useState<MatrixCombination[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  // Selected row ids in the results table
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Helper to ensure strictly unique items by title/name (عنوان یکتا) and ID
  const ensureUniqueItems = <T extends { id: string; name: string }>(items: T[]): T[] => {
    const seenNames = new Set<string>();
    const seenIds = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
      if (!item || !item.name) continue;
      const key = item.name.trim().toLowerCase();
      if (seenIds.has(item.id) || seenNames.has(key)) continue;
      seenIds.add(item.id);
      seenNames.add(key);
      result.push(item);
    }
    return result;
  };

  // Format active items for MultiSelectDropdown with strictly numeric codes and guaranteed unique titles
  const categoryItems = useMemo(() => {
    return ensureUniqueItems(
      categories
        .filter((c) => c.isActive)
        .map((c) => {
          const numCode = formatDimensionCode(c.code, 'category');
          return {
            id: c.id,
            name: c.name,
            code: numCode,
            badge: `کد: ${numCode}`,
          };
        })
    );
  }, [categories]);

  const subcategoryItems = useMemo(() => {
    const filtered = selectedCategoryIds.length > 0
      ? subcategories.filter((s) => s.isActive && (!s.parentId || selectedCategoryIds.includes(s.parentId)))
      : subcategories.filter((s) => s.isActive);

    return ensureUniqueItems(
      filtered.map((s) => {
        const numCode = formatDimensionCode(s.code, 'subcategory');
        const parentCat = categories.find((c) => c.id === s.parentId);
        return {
          id: s.id,
          name: s.name,
          code: numCode,
          badge: parentCat ? `${parentCat.name} | کد: ${numCode}` : `کد: ${numCode}`,
        };
      })
    );
  }, [subcategories, selectedCategoryIds, categories]);

  const attributeItems = useMemo(() => {
    return ensureUniqueItems(
      attributes
        .filter((a) => a.isActive)
        .map((a) => {
          const numCode = formatDimensionCode(a.code, 'attribute');
          return {
            id: a.id,
            name: a.name,
            code: numCode,
            badge: `کد: ${numCode}`,
          };
        })
    );
  }, [attributes]);

  const seasonItems = useMemo(() => {
    return ensureUniqueItems(
      seasons
        .filter((s) => s.isActive)
        .map((s) => {
          const numCode = formatDimensionCode(s.code, 'season');
          return {
            id: s.id,
            name: s.name,
            code: numCode,
            badge: `کد: ${numCode}`,
          };
        })
    );
  }, [seasons]);

  const colorItems = useMemo(() => {
    return ensureUniqueItems(
      colors
        .filter((c) => c.isActive)
        .map((c) => {
          const numCode = formatDimensionCode(c.code, 'color');
          return {
            id: c.id,
            name: c.name,
            code: numCode,
            hexCode: c.hexCode,
            badge: `کد: ${numCode}`,
          };
        })
    );
  }, [colors]);

  const genderItems = useMemo(() => {
    return ensureUniqueItems(
      genders
        .filter((g) => g.isActive)
        .map((g) => {
          const numCode = formatDimensionCode(g.code, 'gender');
          return {
            id: g.id,
            name: g.name,
            code: numCode,
            badge: `کد: ${numCode}`,
          };
        })
    );
  }, [genders]);

  const sizeItems = useMemo(() => {
    return ensureUniqueItems(
      sizes
        .filter((s) => s.isActive)
        .map((s) => {
          const numCode = formatDimensionCode(s.code, 'size');
          return {
            id: s.id,
            name: s.name,
            code: numCode,
            badge: `کد: ${numCode}`,
          };
        })
    );
  }, [sizes]);

  const characterItems = useMemo(() => {
    return ensureUniqueItems(
      characters
        .filter((c) => c.isActive)
        .map((c) => {
          const numCode = formatDimensionCode(c.code, 'character');
          return {
            id: c.id,
            name: c.name,
            code: numCode,
            badge: `کد: ${numCode}`,
          };
        })
    );
  }, [characters]);

  // Estimated Cartesian Product Count
  const estimatedCount = useMemo(() => {
    const catCount = selectedCategoryIds.length || 1;
    const subCount = selectedSubcategoryIds.length || 1;
    const attrCount = selectedAttributeIds.length || 1;
    const seaCount = selectedSeasonIds.length || 1;
    const colCount = selectedColorIds.length || 1;
    const genCount = selectedGenderIds.length || 1;
    const sizCount = selectedSizeIds.length || 1;
    const charCount = selectedCharacterIds.length || 1;

    const anySelected =
      selectedCategoryIds.length > 0 ||
      selectedSubcategoryIds.length > 0 ||
      selectedAttributeIds.length > 0 ||
      selectedSeasonIds.length > 0 ||
      selectedColorIds.length > 0 ||
      selectedGenderIds.length > 0 ||
      selectedSizeIds.length > 0 ||
      selectedCharacterIds.length > 0;

    if (!anySelected) return 0;

    return catCount * subCount * attrCount * seaCount * colCount * genCount * sizCount * charCount;
  }, [
    selectedCategoryIds,
    selectedSubcategoryIds,
    selectedAttributeIds,
    selectedSeasonIds,
    selectedColorIds,
    selectedGenderIds,
    selectedSizeIds,
    selectedCharacterIds,
  ]);

  // Sample Barcode Preview (strictly numeric 19 digits)
  const sampleBarcodePreview = useMemo(() => {
    const sampleCat = categories.find((c) => selectedCategoryIds.includes(c.id)) || categories[0];
    const sampleAttr = attributes.find((a) => selectedAttributeIds.includes(a.id)) || attributes[0];
    const sampleSea = seasons.find((s) => selectedSeasonIds.includes(s.id)) || seasons[0];
    const sampleCol = colors.find((c) => selectedColorIds.includes(c.id)) || colors[0];
    const sampleGen = genders.find((g) => selectedGenderIds.includes(g.id)) || genders[0];
    const sampleSiz = sizes.find((s) => selectedSizeIds.includes(s.id)) || sizes[0];
    const sampleChar = characters.find((c) => selectedCharacterIds.includes(c.id)) || characters[0];

    const catCode = formatDimensionCode(sampleCat?.code, 'category');
    const attrCode = formatDimensionCode(sampleAttr?.code, 'attribute');
    const seaCode = formatDimensionCode(sampleSea?.code, 'season');
    const colCode = formatDimensionCode(sampleCol?.code, 'color');
    const genCode = formatDimensionCode(sampleGen?.code, 'gender');
    const sizCode = formatDimensionCode(sampleSiz?.code, 'size');
    const charCode = formatDimensionCode(sampleChar?.code, 'character');

    return {
      catCode,
      attrCode,
      seaCode,
      colCode,
      genCode,
      sizCode,
      charCode,
      fullBarcode: `${catCode}${attrCode}${seaCode}${colCode}${genCode}${sizCode}${charCode}`,
    };
  }, [
    categories,
    attributes,
    seasons,
    colors,
    genders,
    sizes,
    characters,
    selectedCategoryIds,
    selectedAttributeIds,
    selectedSeasonIds,
    selectedColorIds,
    selectedGenderIds,
    selectedSizeIds,
    selectedCharacterIds,
  ]);

  // Generate Matrix
  const handleGenerateMatrix = async () => {
    if (selectedCategoryIds.length === 0) {
      showToast({ type: 'warning', message: 'لطفاً حداقل یک گروه اصلی انتخاب کنید' });
      return;
    }

    if (
      selectedColorIds.length === 0 &&
      selectedSizeIds.length === 0 &&
      selectedAttributeIds.length === 0
    ) {
      showToast({
        type: 'warning',
        message: 'لطفاً حداقل یکی از مشخصه‌ها (رنگ، سایز، یا ویژگی) را برای تنوع انتخاب کنید',
      });
      return;
    }

    if (estimatedCount > 2500) {
      const confirmGen = window.confirm(
        `تعداد تنوع تخمینی (${estimatedCount.toLocaleString('fa-IR')}) زیاد است. آیا مایل به ادامه تولید ماتریس هستید؟`
      );
      if (!confirmGen) return;
    }

    setIsGenerating(true);
    try {
      const chosenCategories = categories.filter((c) => selectedCategoryIds.includes(c.id));
      const chosenSubcategories = subcategories.filter((s) => selectedSubcategoryIds.includes(s.id));
      const chosenAttributes = attributes.filter((a) => selectedAttributeIds.includes(a.id));
      const chosenSeasons = seasons.filter((s) => selectedSeasonIds.includes(s.id));
      const chosenColors = colors.filter((c) => selectedColorIds.includes(c.id));
      const chosenGenders = genders.filter((g) => selectedGenderIds.includes(g.id));
      const chosenSizes = sizes.filter((s) => selectedSizeIds.includes(s.id));
      const chosenCharacters = characters.filter((c) => selectedCharacterIds.includes(c.id));

      const numericPrice = Number(basePrice.replace(/[^0-9]/g, '')) || 0;

      const result = await generateMatrix({
        categories: chosenCategories,
        subcategories: chosenSubcategories,
        attributes: chosenAttributes,
        seasons: chosenSeasons,
        colors: chosenColors,
        genders: chosenGenders,
        sizes: chosenSizes,
        characters: chosenCharacters,
        modelName: customModelName.trim() || undefined,
        basePrice: numericPrice,
        skuTemplate: settings.skuTemplate,
        barcodeType: settings.barcodeType,
        barcodePrefix: settings.barcodePrefix,
        useStructuredBarcode: true,
      });

      setCombinations(result.combinations);
      setSelectedRowIds(result.combinations.map((c) => c.tempId));
      setHasGenerated(true);

      showToast({
        type: 'success',
        message: `${result.totalCount.toLocaleString('fa-IR')} ترکیب ماتریسی با بارکد ۱۹ رقمی اختصاصی تولید شد (${result.newCount} جدید، ${result.duplicateCount} تکراری)`,
      });
    } catch (err) {
      console.error('Failed to generate matrix:', err);
      showToast({ type: 'error', message: 'خطا در تولید ماتریس محصولات' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset all selections
  const handleResetSelections = () => {
    setSelectedCategoryIds([]);
    setSelectedSubcategoryIds([]);
    setSelectedAttributeIds([]);
    setSelectedSeasonIds([]);
    setSelectedColorIds([]);
    setSelectedGenderIds([]);
    setSelectedSizeIds([]);
    setSelectedCharacterIds([]);
    setCustomModelName('');
    showToast({ type: 'info', message: 'تمامی انتخاب‌های دراپ‌داون ریست شدند' });
  };

  // Row update handlers
  const handleUpdateRow = (tempId: string, field: keyof MatrixCombination, value: any) => {
    setCombinations((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveRow = (tempId: string) => {
    setCombinations((prev) => prev.filter((r) => r.tempId !== tempId));
    setSelectedRowIds((prev) => prev.filter((id) => id !== tempId));
  };

  const handleRemoveAllDuplicates = () => {
    const withoutDuplicates = combinations.filter(
      (r) => !r.isDuplicateSku && !r.isDuplicateBarcode && !r.isDuplicateName
    );
    setCombinations(withoutDuplicates);
    setSelectedRowIds(withoutDuplicates.map((r) => r.tempId));
    showToast({ type: 'info', message: 'اقلام تکراری از پیش‌نمایش حذف شدند' });
  };

  const handleRegenerateBarcodeForRow = (tempId: string) => {
    const row = combinations.find((r) => r.tempId === tempId);
    if (!row) return;

    const cat = categories.find((c) => c.id === row.categoryId);
    const attr = attributes.find((a) => a.id === row.attributeId);
    const sea = seasons.find((s) => s.id === row.seasonId);
    const col = colors.find((c) => c.id === row.colorId);
    const gen = genders.find((g) => g.id === row.genderId);
    const siz = sizes.find((s) => s.id === row.sizeId);
    const char = characters.find((c) => c.id === row.characterId);

    const newBarcode = generateStructuredGarmentBarcode({
      categoryCode: cat?.code,
      attributeCode: attr?.code,
      seasonCode: sea?.code,
      colorCode: col?.code,
      genderCode: gen?.code,
      sizeCode: siz?.code,
      characterCode: char?.code,
    });

    setCombinations((prev) =>
      prev.map((r) =>
        r.tempId === tempId
          ? { ...r, barcode: newBarcode, isDuplicateBarcode: false }
          : r
      )
    );
  };

  const handleApplyBasePriceToAll = () => {
    const numeric = Number(basePrice.replace(/[^0-9]/g, '')) || 0;
    setCombinations((prev) => prev.map((r) => ({ ...r, price: numeric })));
    showToast({ type: 'success', message: 'قیمت پایه روی تمام ردیف‌ها اعمال شد' });
  };

  // Bulk Save Valid Variants to IndexedDB
  const handleBulkSave = async () => {
    const rowsToSave = combinations.filter(
      (c) =>
        selectedRowIds.includes(c.tempId) &&
        !c.isDuplicateSku &&
        !c.isDuplicateBarcode &&
        !c.isDuplicateName &&
        c.name.trim() &&
        c.sku.trim()
    );

    if (rowsToSave.length === 0) {
      showToast({
        type: 'error',
        message: 'هیچ محصول معتبری برای ذخیره انتخاب نشده است. اقلام تکراری را اصلاح یا حذف کنید.',
      });
      return;
    }

    setIsBulkSaving(true);
    try {
      const now = Date.now();
      const productsToSave: Product[] = rowsToSave.map((r, index) => ({
        id: `prod-${now}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        categoryId: r.categoryId,
        subcategoryId: r.subcategoryId,
        attributeId: r.attributeId,
        seasonId: r.seasonId,
        colorId: r.colorId,
        sizeId: r.sizeId,
        genderId: r.genderId,
        characterId: r.characterId,
        characterName: r.characterName,
        name: r.name.trim(),
        sku: r.sku.trim(),
        barcode: r.barcode.trim(),
        price: Number(r.price) || 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }));

      await bulkSaveProducts(productsToSave);
      await refreshCount();

      showToast({
        type: 'success',
        message: `${productsToSave.length.toLocaleString('fa-IR')} محصول با موفقیت در دیتابیس لوکال ذخیره شدند`,
      });

      // Clear matrix or transition
      setCombinations([]);
      setHasGenerated(false);
      setActiveTab('products');
    } catch (err) {
      console.error('Failed to bulk save products:', err);
      showToast({
        type: 'error',
        message: 'خطا در ذخیره‌سازی گروهی محصولات در IndexedDB',
      });
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Export Matrix to Excel
  const handleExportExcel = () => {
    if (combinations.length === 0) {
      showToast({ type: 'warning', message: 'هیچ داده‌ای برای خروجی اکسل وجود ندارد' });
      return;
    }

    try {
      const result = exportMatrixCombinationsToExcel(combinations);
      showToast({
        type: 'success',
        message: `فایل اکسل با ${result.count.toLocaleString('fa-IR')} ردیف بارکد ساخته و دانلود شد`,
      });
    } catch (err) {
      console.error('Failed to export Excel:', err);
      showToast({ type: 'error', message: 'خطا در صدور فایل اکسل' });
    }
  };

  // Filtered combinations in table
  const filteredCombinations = useMemo(() => {
    if (!tableSearch.trim()) return combinations;
    const query = tableSearch.trim().toLowerCase();
    return combinations.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.sku.toLowerCase().includes(query) ||
        c.barcode.includes(query)
    );
  }, [combinations, tableSearch]);

  // Metrics for Preview
  const previewMetrics = useMemo(() => {
    const total = combinations.length;
    const duplicates = combinations.filter(
      (c) => c.isDuplicateSku || c.isDuplicateBarcode || c.isDuplicateName
    ).length;
    const validNew = total - duplicates;
    return { total, duplicates, validNew };
  }, [combinations]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-blue-600" />
            <span>تولید ماتریس تنوع کالا (Product Matrix Generator)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            با انتخاب چندگانه از هر دراپ‌داون، ده‌ها ترکیب محصول کودک و نوزادی را با بارکد استاندارد ساختاریافته ۱۹ رقمی (شامل کد نام محصول)، نام و SKU اختصاصی تولید و به اکسل صادر کنید.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {estimatedCount > 0 && !hasGenerated && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>تعداد ترکیب تخمینی: {estimatedCount.toLocaleString('fa-IR')} کالا</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetSelections}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            ریست انتخاب‌ها
          </Button>
        </div>
      </div>

      {/* 7 Multi-Select Dropdowns Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-800">
              مشخصات و ابعاد ماتریس (انتخاب چندگانه دراپ‌داون‌ها)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            برای هر فیلد، یک یا چند گزینه را انتخاب کنید
          </span>
        </div>

        {/* The 8 Dropdowns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* 1. گروه اصلی (Category) - 4 digits from 1000 */}
          <MultiSelectDropdown
            label="۱. گروه اصلی (کد ۴ رقمی از ۱۰۰۰)"
            placeholder="انتخاب گروه‌های اصلی نوزادی، دخترانه، پسرانه..."
            items={categoryItems}
            selectedIds={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            badgeColor="blue"
            required
          />

          {/* 2. گروه فرعی (Subcategory) */}
          <MultiSelectDropdown
            label="۲. گروه فرعی (بلوز، شلوار، سرهمی...)"
            placeholder="انتخاب گروه‌های فرعی مرتبط..."
            items={subcategoryItems}
            selectedIds={selectedSubcategoryIds}
            onChange={setSelectedSubcategoryIds}
            badgeColor="cyan"
          />

          {/* 3. ویژگی (Attribute) - 3 digits from 101 or STD */}
          <MultiSelectDropdown
            label="۳. ویژگی (ساده، طرح‌دار، STD...)"
            placeholder="انتخاب ویژگی‌ها و الگوها..."
            items={attributeItems}
            selectedIds={selectedAttributeIds}
            onChange={setSelectedAttributeIds}
            badgeColor="purple"
          />

          {/* 4. فصل (Season) - 1 digit */}
          <MultiSelectDropdown
            label="۴. فصل (SS، FW، همه فصول)"
            placeholder="انتخاب فصل‌های فروش..."
            items={seasonItems}
            selectedIds={selectedSeasonIds}
            onChange={setSelectedSeasonIds}
            badgeColor="amber"
          />

          {/* 5. رنگ (Color) - 3 digits from 001, STD, 200 colors! */}
          <MultiSelectDropdown
            label="۵. رنگ (۲۰۰ رنگ متنوع، STD، کالیته)"
            placeholder="جستجو و انتخاب رنگ‌های کودک..."
            items={colorItems}
            selectedIds={selectedColorIds}
            onChange={setSelectedColorIds}
            badgeColor="emerald"
          />

          {/* 6. جنسیت (Gender) - 1 digit */}
          <MultiSelectDropdown
            label="۶. جنسیت (دخترانه، پسرانه، اسپرت...)"
            placeholder="انتخاب جنسیت محصول..."
            items={genderItems}
            selectedIds={selectedGenderIds}
            onChange={setSelectedGenderIds}
            badgeColor="rose"
          />

          {/* 7. سایز (Size) - 3 digits from 001, STD */}
          <MultiSelectDropdown
            label="۷. سایز (نوزادی تا نوجوانی، STD)"
            placeholder="انتخاب سایزبندی‌ها..."
            items={sizeItems}
            selectedIds={selectedSizeIds}
            onChange={setSelectedSizeIds}
            badgeColor="indigo"
          />

          {/* 8. نام محصول / شخصیت کارتونی (Character) - 1000+ items! */}
          <MultiSelectDropdown
            label="۸. نام محصول (بیش از ۱۰۰۰ شخصیت کارتونی)"
            placeholder="جستجو در بین ۱۰۰۰+ شخصیت کارتونی و انیمیشنی..."
            items={characterItems}
            selectedIds={selectedCharacterIds}
            onChange={setSelectedCharacterIds}
            badgeColor="cyan"
          />
        </div>

        {/* Barcode Structure Explainer, Model Name & Base Price Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 items-start">
          {/* Base Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              قیمت پایه تنوع‌ها ({settings.currency})
            </label>
            <Input
              type="text"
              value={basePrice}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, '');
                setBasePrice(digits ? Number(digits).toLocaleString('en-US') : '');
              }}
              placeholder="450,000"
              className="text-left direction-ltr font-mono font-semibold"
              leftElement={<span className="text-xs text-slate-500">{settings.currency}</span>}
              helperText="تفکیک خودکار سه‌رقمی قیمت پایه"
            />
          </div>

          {/* Model Name for Parentheses */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>نام کالا / مدل (داخل پرانتز)</span>
              <span className="text-[10px] text-blue-600 font-normal">اختیاری</span>
            </label>
            <Input
              type="text"
              value={customModelName}
              onChange={(e) => setCustomModelName(e.target.value)}
              placeholder="مثال: تدی، خرسی، بهاره..."
              className="text-xs"
              helperText="الگو: [گروه اصلی] [ویژگی] ([نام کالا])"
            />
          </div>

          {/* Visual Barcode Format Explanation */}
          <div className="md:col-span-2 lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-blue-600" />
                <span>ساختار بارکد ۱۹ رقمی استاندارد کالا (با احتساب کد نام محصول):</span>
              </span>
              <span className="font-mono text-blue-700 font-bold tracking-wider direction-ltr bg-blue-100/70 px-2 py-0.5 rounded">
                {sampleBarcodePreview.fullBarcode}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] pt-1">
              <div className="bg-white p-1 rounded border border-slate-200">
                <div className="text-slate-400 text-[9px] font-sans">گروه اصلی (۴)</div>
                <div className="font-bold text-blue-600">{sampleBarcodePreview.catCode}</div>
              </div>
              <div className="bg-white p-1 rounded border border-slate-200">
                <div className="text-slate-400 text-[9px] font-sans">ویژگی (۳)</div>
                <div className="font-bold text-purple-600">{sampleBarcodePreview.attrCode}</div>
              </div>
              <div className="bg-white p-1 rounded border border-slate-200">
                <div className="text-slate-400 text-[9px] font-sans">فصل (۱)</div>
                <div className="font-bold text-amber-600">{sampleBarcodePreview.seaCode}</div>
              </div>
              <div className="bg-white p-1 rounded border border-slate-200">
                <div className="text-slate-400 text-[9px] font-sans">رنگ (۳)</div>
                <div className="font-bold text-emerald-600">{sampleBarcodePreview.colCode}</div>
              </div>
              <div className="bg-white p-1 rounded border border-slate-200">
                <div className="text-slate-400 text-[9px] font-sans">جنسیت (۱)</div>
                <div className="font-bold text-rose-600">{sampleBarcodePreview.genCode}</div>
              </div>
              <div className="bg-white p-1 rounded border border-slate-200">
                <div className="text-slate-400 text-[9px] font-sans">سایز (۳)</div>
                <div className="font-bold text-indigo-600">{sampleBarcodePreview.sizCode}</div>
              </div>
              <div className="bg-white p-1 rounded border border-slate-200">
                <div className="text-slate-400 text-[9px] font-sans">نام محصول (۴)</div>
                <div className="font-bold text-cyan-600">{sampleBarcodePreview.charCode}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerateMatrix}
            isLoading={isGenerating}
            disabled={isGenerating || selectedCategoryIds.length === 0}
            icon={<Sparkles className="w-5 h-5" />}
            className="w-full sm:w-auto shadow-md"
          >
            <span>تولید ماتریس محصولات</span>
            {estimatedCount > 0 && (
              <span className="mr-2 bg-blue-500/40 text-white text-xs px-2 py-0.5 rounded-full font-mono">
                {estimatedCount.toLocaleString('fa-IR')} کالا
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Generated Matrix Preview & Batch Operations Table */}
      {hasGenerated && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Table Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">پیش‌نمایش اقلام ماتریس</span>
                <Badge variant="default" size="sm">
                  {combinations.length.toLocaleString('fa-IR')} ردیف
                </Badge>
              </div>

              {previewMetrics.duplicates > 0 ? (
                <Badge variant="danger" size="sm" className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{previewMetrics.duplicates.toLocaleString('fa-IR')} مورد تکراری</span>
                </Badge>
              ) : (
                <Badge variant="success" size="sm" className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>همه یکتا و معتبر</span>
                </Badge>
              )}
            </div>

            {/* Actions: Excel Export, Bulk Save, Clean Duplicates */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="جستجو در پیش‌نمایش..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pr-8 text-xs h-8"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyBasePriceToAll}
                title="اعمال قیمت پایه روی تمامی اقلام ماتریس"
              >
                بروزرسانی قیمت‌ها
              </Button>

              {previewMetrics.duplicates > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAllDuplicates}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  حذف موارد تکراری
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                خروجی اکسل (XLSX)
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkSave}
                isLoading={isBulkSaving}
                icon={<Save className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                ذخیره در دیتابیس ({previewMetrics.validNew.toLocaleString('fa-IR')})
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[550px] overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10 border-b border-slate-200 font-semibold select-none">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredCombinations.length > 0 &&
                        filteredCombinations.every((r) => selectedRowIds.includes(r.tempId))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRowIds(combinations.map((r) => r.tempId));
                        } else {
                          setSelectedRowIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">نام محصول تولید شده</th>
                  <th className="p-3 w-36">کد کالا (SKU)</th>
                  <th className="p-3 w-48">بارکد ساختاریافته (۱۹ رقم)</th>
                  <th className="p-3 w-32">قیمت (تومان)</th>
                  <th className="p-3 w-28 text-center">وضعیت</th>
                  <th className="p-3 w-16 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredCombinations.map((row, index) => {
                  const isSelected = selectedRowIds.includes(row.tempId);
                  const isDuplicate = row.isDuplicateSku || row.isDuplicateBarcode || row.isDuplicateName;

                  return (
                    <tr
                      key={row.tempId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isDuplicate ? 'bg-amber-50/40' : isSelected ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRowIds((prev) => [...prev, row.tempId]);
                            } else {
                              setSelectedRowIds((prev) => prev.filter((id) => id !== row.tempId));
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* Index */}
                      <td className="p-3 text-center text-slate-400 font-mono">
                        {index + 1}
                      </td>

                      {/* Product Name (Inline editable) */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleUpdateRow(row.tempId, 'name', e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 text-slate-900 font-medium transition-colors"
                        />
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {row.subcategoryName && (
                            <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-1 rounded">
                              {row.subcategoryName}
                            </span>
                          )}
                          {row.isDuplicateName && (
                            <span className="text-[10px] text-red-600 font-sans">عنوان محصول تکراری است</span>
                          )}
                        </div>
                      </td>

                      {/* SKU (Inline editable) */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.sku}
                          onChange={(e) => handleUpdateRow(row.tempId, 'sku', e.target.value)}
                          className="w-full font-mono text-left direction-ltr bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 text-slate-800 text-xs transition-colors"
                        />
                        {row.isDuplicateSku && (
                          <div className="text-[10px] text-red-600 mt-0.5">SKU تکراری است</div>
                        )}
                      </td>

                      {/* Barcode with Refresh */}
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={row.barcode}
                            onChange={(e) =>
                              handleUpdateRow(row.tempId, 'barcode', e.target.value)
                            }
                            className="w-full font-mono text-left direction-ltr bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 text-blue-700 font-bold text-xs transition-colors tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={() => handleRegenerateBarcodeForRow(row.tempId)}
                            title="تولید مجدد بارکد برای این ردیف"
                            className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-200 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                        {row.isDuplicateBarcode && (
                          <div className="text-[10px] text-red-600 mt-0.5">بارکد تکراری است</div>
                        )}
                      </td>

                      {/* Price */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.price ? row.price.toLocaleString('en-US') : ''}
                          onChange={(e) => {
                            const numeric = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                            handleUpdateRow(row.tempId, 'price', numeric);
                          }}
                          className="w-full text-left direction-ltr font-mono bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 text-slate-900 transition-colors font-medium"
                        />
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        {isDuplicate ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            <span>تکراری</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            <span>جدید</span>
                          </span>
                        )}
                      </td>

                      {/* Delete Action */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.tempId)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                          title="حذف این ردیف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Bar Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 px-1">
            <span>
              نمایش {filteredCombinations.length.toLocaleString('fa-IR')} از {combinations.length.toLocaleString('fa-IR')} تنوع تولید شده
            </span>
            <span>
              {selectedRowIds.length.toLocaleString('fa-IR')} مورد برای ذخیره‌سازی انتخاب شده است
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
