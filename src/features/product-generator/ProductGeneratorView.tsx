import React, { useState, useEffect, useMemo } from 'react';
import { useCatalogStore } from '../../stores/catalog-store.ts';
import { useProductStore } from '../../stores/product-store.ts';
import { useUiStore } from '../../stores/ui-store.ts';
import { SearchableDropdown } from '../../components/dropdown/SearchableDropdown.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { generateSku } from '../../services/sku-generator.ts';
import { generateProductName } from '../../services/product-name-generator.ts';
import {
  generateUniqueBarcode,
  validateBarcode,
} from '../../services/barcode-service.ts';
import { productRepository } from '../../db/repositories/product-repository.ts';
import type { Product, CatalogItem } from '../../types/index.ts';
import {
  Sparkles,
  Barcode as BarcodeIcon,
  Save,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Tag,
} from 'lucide-react';

export const ProductGeneratorView: React.FC = () => {
  const {
    categories,
    subcategories,
    attributes,
    colors,
    sizes,
    genders,
    ages,
    settings,
  } = useCatalogStore();

  const { saveProduct, refreshCount } = useProductStore();
  const { showToast, editingProductId, setEditingProductId, setActiveTab } = useUiStore();

  // Form selections
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | undefined>();
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | undefined>();
  const [selectedColorId, setSelectedColorId] = useState<string | undefined>();
  const [selectedSizeId, setSelectedSizeId] = useState<string | undefined>();
  const [selectedGenderId, setSelectedGenderId] = useState<string | undefined>();
  const [selectedAgeId, setSelectedAgeId] = useState<string | undefined>();

  // Text inputs
  const [productName, setProductName] = useState('');
  const [customModelName, setCustomModelName] = useState('');
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  const [sku, setSku] = useState('');
  const [isSkuManuallyEdited, setIsSkuManuallyEdited] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [rawPrice, setRawPrice] = useState<string>('');

  // Duplicate checks & Validation
  const [duplicateSkuProduct, setDuplicateSkuProduct] = useState<Product | null>(null);
  const [duplicateBarcodeProduct, setDuplicateBarcodeProduct] = useState<Product | null>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Subcategories filtered by selected Category
  const filteredSubcategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    return subcategories.filter((s) => s.parentId === selectedCategoryId);
  }, [subcategories, selectedCategoryId]);

  // Handle parent category change -> Invalidate incompatible child subcategory
  const handleCategoryChange = (item?: CatalogItem) => {
    const newCatId = item?.id;
    setSelectedCategoryId(newCatId);

    // If current subcategory does not belong to new category, clear it
    if (selectedSubcategoryId) {
      const currentSub = subcategories.find((s) => s.id === selectedSubcategoryId);
      if (!currentSub || currentSub.parentId !== newCatId) {
        setSelectedSubcategoryId(undefined);
      }
    }
  };

  // Find active items objects for generators
  const currentCategory = categories.find((c) => c.id === selectedCategoryId);
  const currentSubcategory = subcategories.find((s) => s.id === selectedSubcategoryId);
  const currentAttribute = attributes.find((a) => a.id === selectedAttributeId);
  const currentColor = colors.find((c) => c.id === selectedColorId);
  const currentSize = sizes.find((s) => s.id === selectedSizeId);
  const currentGender = genders.find((g) => g.id === selectedGenderId);
  const currentAge = ages.find((a) => a.id === selectedAgeId);

  // Auto-generate Name according to rule: گروه اصلی + ویژگی + داخل پرانتز نام محصول
  useEffect(() => {
    if (!isNameManuallyEdited) {
      const generated = generateProductName({
        category: currentCategory,
        subcategory: currentSubcategory,
        attribute: currentAttribute,
        productName: customModelName,
      });
      setProductName(generated);
    }
  }, [
    isNameManuallyEdited,
    currentCategory,
    currentSubcategory,
    currentAttribute,
    customModelName,
  ]);

  // Auto-generate SKU when selections change (unless user manually edited it)
  useEffect(() => {
    if (!isSkuManuallyEdited) {
      const generated = generateSku(
        {
          category: currentCategory,
          subcategory: currentSubcategory,
          attribute: currentAttribute,
          color: currentColor,
          size: currentSize,
          gender: currentGender,
          age: currentAge,
        },
        settings.skuTemplate
      );
      setSku(generated);
    }
  }, [
    isSkuManuallyEdited,
    currentCategory,
    currentSubcategory,
    currentAttribute,
    currentColor,
    currentSize,
    currentGender,
    currentAge,
    settings.skuTemplate,
  ]);

  // Check SKU duplication whenever SKU changes
  useEffect(() => {
    let isCancelled = false;
    const checkSkuDuplicate = async () => {
      if (!sku.trim()) {
        setDuplicateSkuProduct(null);
        return;
      }
      const existing = await productRepository.findBySku(sku.trim());
      if (!isCancelled) {
        if (existing && existing.id !== editingProductId) {
          setDuplicateSkuProduct(existing);
        } else {
          setDuplicateSkuProduct(null);
        }
      }
    };
    checkSkuDuplicate();
    return () => {
      isCancelled = true;
    };
  }, [sku, editingProductId]);

  // Check Barcode duplication and validity whenever barcode changes
  useEffect(() => {
    let isCancelled = false;
    const checkBarcode = async () => {
      if (!barcode.trim()) {
        setBarcodeError(null);
        setDuplicateBarcodeProduct(null);
        return;
      }

      const validation = validateBarcode(barcode, settings.barcodeType);
      if (!validation.isValid) {
        setBarcodeError(validation.error || 'بارکد نامعتبر است');
      } else {
        setBarcodeError(null);
      }

      const existing = await productRepository.findByBarcode(barcode.trim());
      if (!isCancelled) {
        if (existing && existing.id !== editingProductId) {
          setDuplicateBarcodeProduct(existing);
        } else {
          setDuplicateBarcodeProduct(null);
        }
      }
    };
    checkBarcode();
    return () => {
      isCancelled = true;
    };
  }, [barcode, settings.barcodeType, editingProductId]);

  // Auto-generate initial Barcode on mount if empty
  const handleRegenerateBarcode = async () => {
    try {
      const newBarcode = await generateUniqueBarcode(
        settings.barcodeType,
        settings.barcodePrefix
      );
      setBarcode(newBarcode);
      setBarcodeError(null);
      setDuplicateBarcodeProduct(null);
    } catch (err) {
      console.error('Failed to generate barcode:', err);
    }
  };

  useEffect(() => {
    if (!barcode && !editingProductId) {
      handleRegenerateBarcode();
    }
  }, [settings.barcodeType, settings.barcodePrefix, editingProductId]);

  // Load product data if editingProductId is set
  useEffect(() => {
    if (editingProductId) {
      productRepository.getProductById(editingProductId).then((p) => {
        if (p) {
          setSelectedCategoryId(p.categoryId);
          setSelectedSubcategoryId(p.subcategoryId);
          setSelectedAttributeId(p.attributeId);
          setSelectedColorId(p.colorId);
          setSelectedSizeId(p.sizeId);
          setSelectedGenderId(p.genderId);
          setSelectedAgeId(p.ageId);
          setProductName(p.name);
          setIsNameManuallyEdited(true);
          const match = p.name.match(/\(([^)]+)\)/);
          if (match && match[1]) {
            setCustomModelName(match[1]);
          } else {
            setCustomModelName('');
          }
          setSku(p.sku);
          setIsSkuManuallyEdited(true);
          setBarcode(p.barcode);
          setRawPrice(p.price ? Number(p.price).toLocaleString('en-US') : '');
        }
      });
    }
  }, [editingProductId]);

  // Reset form
  const handleResetForm = () => {
    setSelectedCategoryId(undefined);
    setSelectedSubcategoryId(undefined);
    setSelectedAttributeId(undefined);
    setSelectedColorId(undefined);
    setSelectedSizeId(undefined);
    setSelectedGenderId(undefined);
    setSelectedAgeId(undefined);
    setCustomModelName('');
    setProductName('');
    setIsNameManuallyEdited(false);
    setSku('');
    setIsSkuManuallyEdited(false);
    setRawPrice('');
    setEditingProductId(null);
    handleRegenerateBarcode();
  };

  // Format price display
  const numericPrice = Number(rawPrice.replace(/[^0-9]/g, '')) || 0;
  const formattedPriceDisplay = numericPrice > 0 ? numericPrice.toLocaleString('fa-IR') : '۰';

  // Save product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      showToast({ type: 'error', message: 'لطفاً نام محصول را وارد کنید' });
      return;
    }
    if (!sku.trim()) {
      showToast({ type: 'error', message: 'لطفاً کد کالا (SKU) را مشخص نمایید' });
      return;
    }
    if (duplicateSkuProduct) {
      showToast({
        type: 'error',
        message: 'این SKU تکراری است و قبلاً در سامانه ثبت شده است',
      });
      return;
    }
    if (!barcode.trim()) {
      showToast({ type: 'error', message: 'لطفاً بارکد محصول را وارد نمایید' });
      return;
    }
    if (barcodeError) {
      showToast({ type: 'error', message: barcodeError });
      return;
    }
    if (duplicateBarcodeProduct) {
      showToast({
        type: 'error',
        message: 'این بارکد تکراری است و قبلاً ثبت شده است',
      });
      return;
    }
    if (numericPrice <= 0) {
      showToast({ type: 'warning', message: 'قیمت محصول باید یک عدد مثبت باشد' });
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      const productToSave: Product = {
        id: editingProductId || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        categoryId: selectedCategoryId,
        subcategoryId: selectedSubcategoryId,
        attributeId: selectedAttributeId,
        colorId: selectedColorId,
        sizeId: selectedSizeId,
        genderId: selectedGenderId,
        ageId: selectedAgeId,
        name: productName.trim(),
        sku: sku.trim(),
        barcode: barcode.trim(),
        price: numericPrice,
        isActive: true,
        createdAt: editingProductId ? now : now,
        updatedAt: now,
      };

      await saveProduct(productToSave);
      await refreshCount();

      showToast({
        type: 'success',
        message: editingProductId
          ? 'محصول با موفقیت ویرایش شد'
          : 'محصول با موفقیت در دیتابیس محلی ذخیره شد',
      });

      if (editingProductId) {
        setEditingProductId(null);
        setActiveTab('products');
      } else {
        handleResetForm();
      }
    } catch (err) {
      console.error('Failed to save product:', err);
      showToast({
        type: 'error',
        message: 'ذخیره اطلاعات انجام نشد. لطفاً مجدداً تلاش کنید.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* View Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>{editingProductId ? 'ویرایش کالا' : 'تولید محصول جدید (تک کالا)'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مشخصات کالا را انتخاب کنید تا نام، بارکد استاندارد و کد کالا (SKU) به طور خودکار تولید شود.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {editingProductId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingProductId(null);
                handleResetForm();
              }}
            >
              لغو ویرایش
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleResetForm}
          >
            پاک‌سازی فرم
          </Button>
        </div>
      </div>

      <form onSubmit={handleSaveProduct} className="space-y-6">
        {/* Section 1: Catalog Dropdowns */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-blue-600" />
            <span>ویژگی‌ها و دسته‌بندی کاتالوگ</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* 1. گروه اصلی */}
            <SearchableDropdown
              label="گروه اصلی"
              placeholder="انتخاب گروه اصلی..."
              items={categories.filter((c) => c.isActive)}
              selectedId={selectedCategoryId}
              onSelect={handleCategoryChange}
              catalogType="category"
              required
            />

            {/* 2. گروه فرعی (وابسته به گروه اصلی) */}
            <SearchableDropdown
              label="گروه فرعی"
              placeholder="انتخاب گروه فرعی..."
              items={filteredSubcategories.filter((s) => s.isActive)}
              selectedId={selectedSubcategoryId}
              onSelect={(item) => setSelectedSubcategoryId(item?.id)}
              catalogType="subcategory"
              parentId={selectedCategoryId}
              disabled={!selectedCategoryId}
              disabledMessage="ابتدا گروه اصلی را انتخاب کنید"
              required
            />

            {/* 3. ویژگی */}
            <SearchableDropdown
              label="ویژگی"
              placeholder="مثلاً: چاپدار، ساده..."
              items={attributes.filter((a) => a.isActive)}
              selectedId={selectedAttributeId}
              onSelect={(item) => setSelectedAttributeId(item?.id)}
              catalogType="attribute"
            />

            {/* نام / مدل محصول (داخل پرانتز) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>نام محصول (مدل / طرح)</span>
                <span className="text-[10px] text-blue-600 font-normal">درج داخل پرانتز</span>
              </label>
              <Input
                value={customModelName}
                onChange={(e) => {
                  setCustomModelName(e.target.value);
                  setIsNameManuallyEdited(false);
                }}
                placeholder="مثال: تدی، خرسی، اسپایدرمن..."
                className="h-10 text-xs"
              />
            </div>

            {/* 4. رنگ */}
            <SearchableDropdown
              label="رنگ"
              placeholder="انتخاب رنگ..."
              items={colors.filter((c) => c.isActive)}
              selectedId={selectedColorId}
              onSelect={(item) => setSelectedColorId(item?.id)}
              catalogType="color"
            />

            {/* 5. سایز */}
            <SearchableDropdown
              label="سایز"
              placeholder="مثلاً: 2، 4، 8..."
              items={sizes.filter((s) => s.isActive)}
              selectedId={selectedSizeId}
              onSelect={(item) => setSelectedSizeId(item?.id)}
              catalogType="size"
            />

            {/* 6. جنسیت */}
            <SearchableDropdown
              label="جنسیت"
              placeholder="پسر، دختر، یونیسکس..."
              items={genders.filter((g) => g.isActive)}
              selectedId={selectedGenderId}
              onSelect={(item) => setSelectedGenderId(item?.id)}
              catalogType="gender"
            />

            {/* 7. سن */}
            <SearchableDropdown
              label="رده سنی"
              placeholder="انتخاب رده سنی..."
              items={ages.filter((a) => a.isActive)}
              selectedId={selectedAgeId}
              onSelect={(item) => setSelectedAgeId(item?.id)}
              catalogType="age"
            />
          </div>
        </div>

        {/* Section 2: Generated Identifiers & Pricing */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <BarcodeIcon className="w-4 h-4 text-blue-600" />
            <span>شناسه محصول، کد کالا (SKU)، بارکد و قیمت</span>
          </h3>

          <div className="space-y-4">
            {/* 8. نام محصول (خودکار + ویرایش دستی) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">
                    نام محصول <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-normal">
                    (فرمت استاندارد: گروه اصلی + ویژگی + داخل پرانتز نام محصول)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isNameManuallyEdited ? (
                    <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                      ویرایش دستی شده
                    </span>
                  ) : (
                    <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                      تولید خودکار استاندارد
                    </span>
                  )}
                  {isNameManuallyEdited && (
                    <button
                      type="button"
                      onClick={() => setIsNameManuallyEdited(false)}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      بازنشانی به حالت خودکار
                    </button>
                  )}
                </div>
              </div>

              <Input
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  setIsNameManuallyEdited(true);
                }}
                placeholder="مثال: تیشرت چاپدار (تدی)"
                required
              />
            </div>

            {/* Row: SKU & Barcode & Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SKU */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    کد کالا (SKU) <span className="text-rose-500">*</span>
                  </label>
                  {isSkuManuallyEdited && (
                    <button
                      type="button"
                      onClick={() => setIsSkuManuallyEdited(false)}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      تولید مجدد
                    </button>
                  )}
                </div>

                <Input
                  value={sku}
                  onChange={(e) => {
                    setSku(e.target.value.toUpperCase());
                    setIsSkuManuallyEdited(true);
                  }}
                  error={duplicateSkuProduct ? 'این SKU قبلاً ثبت شده است' : undefined}
                  className="font-mono text-left direction-ltr tracking-wider"
                  placeholder="TSH-PR-RD-B-08"
                  required
                />

                {duplicateSkuProduct && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>این SKU قبلاً ثبت شده است</span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      محصول موجود: <strong>{duplicateSkuProduct.name}</strong>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600">
                      SKU: {duplicateSkuProduct.sku}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProductId(duplicateSkuProduct.id)}
                      className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>مشاهده و ویرایش این محصول</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Barcode */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    بارکد ({settings.barcodeType}) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateBarcode}
                    className="text-[11px] text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>تولید تصادفی معتبر</span>
                  </button>
                </div>

                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.trim())}
                  error={
                    barcodeError ||
                    (duplicateBarcodeProduct ? 'این بارکد قبلاً ثبت شده است' : undefined)
                  }
                  className="font-mono text-left direction-ltr tracking-wider"
                  placeholder="6261234567890"
                  required
                />

                {duplicateBarcodeProduct && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>این بارکد تکراری است</span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      مربوط به: <strong>{duplicateBarcodeProduct.name}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    قیمت فروش ({settings.currency})
                  </label>
                  <span className="text-xs text-slate-500 font-bold">
                    {formattedPriceDisplay} {settings.currency}
                  </span>
                </div>

                <Input
                  type="text"
                  value={rawPrice}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, '');
                    setRawPrice(digits ? Number(digits).toLocaleString('en-US') : '');
                  }}
                  className="text-left direction-ltr font-mono font-semibold"
                  placeholder="450,000"
                  leftElement={<span className="text-xs text-slate-500">{settings.currency}</span>}
                  helperText="مبلغ را وارد کنید (تفکیک خودکار سه‌رقمی)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            disabled={!!duplicateSkuProduct || !!duplicateBarcodeProduct || !!barcodeError}
            icon={<Save className="w-4 h-4" />}
            className="w-full sm:w-auto px-8"
          >
            {editingProductId ? 'ذخیره تغییرات محصول' : 'ذخیره محصول در دیتابیس'}
          </Button>
        </div>
      </form>
    </div>
  );
};
