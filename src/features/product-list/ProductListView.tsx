import React, { useState, useEffect } from 'react';
import { useProductStore } from '../../stores/product-store.ts';
import { useCatalogStore } from '../../stores/catalog-store.ts';
import { useUiStore } from '../../stores/ui-store.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { CustomDropdown } from '../../components/ui/CustomDropdown.tsx';
import type { Product } from '../../types/index.ts';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  Copy,
  CopyCheck,
  CheckSquare,
  Square,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Plus,
  RefreshCcw,
  Sparkles,
  Printer,
  CheckCheck,
  CheckCircle2,
  SquareX,
} from 'lucide-react';

export const ProductListView: React.FC = () => {
  const {
    products,
    totalProducts,
    allDatabaseCount,
    needsPrintCount,
    selectedProductIds,
    filters,
    page,
    pageSize,
    sortField,
    sortDirection,
    isLoading,
    loadProducts,
    setFilter,
    resetFilters,
    setPage,
    setPageSize,
    setSorting,
    toggleSelectProduct,
    selectAllCurrentPage,
    selectAllMatching,
    deselectAll,
    deleteProduct,
    bulkDeleteSelected,
    saveProduct,
    updateProductPrintStatus,
    markSelectedAsPrinted,
    markSelectedAsNeedsPrint,
  } = useProductStore();

  const { categories, subcategories, colors, sizes, genders, ages, settings } = useCatalogStore();
  const { setEditingProductId, setActiveTab, setExcelModalOpen, showToast, showConfirmation } = useUiStore();

  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const copyToClipboard = (id: string, field: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField({ id, field });
      showToast({ type: 'info', message: `${field} در کلیپ‌بورد کپی شد` });
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleDeleteSingle = (product: Product) => {
    showConfirmation({
      title: 'حذف محصول',
      message: `آیا از حذف محصول "${product.name}" با کد SKU "${product.sku}" مطمئن هستید؟ این عملیات غیرقابل بازگشت است.`,
      isDestructive: true,
      confirmText: 'حذف کالا',
      onConfirm: async () => {
        await deleteProduct(product.id);
        showToast({ type: 'success', message: 'محصول با موفقیت حذف شد' });
      },
    });
  };

  const handleBulkDelete = () => {
    showConfirmation({
      title: 'حذف گروهی محصولات',
      message: `آیا از حذف ${selectedProductIds.size} محصول انتخاب‌شده مطمئن هستید؟ این عملیات قابل بازگشت نیست.`,
      isDestructive: true,
      confirmText: `حذف ${selectedProductIds.size} کالا`,
      onConfirm: async () => {
        await bulkDeleteSelected();
        showToast({ type: 'success', message: 'محصولات انتخاب‌شده با موفقیت حذف شدند' });
      },
    });
  };

  const handleDuplicateProduct = async (source: Product) => {
    const now = Date.now();
    const newSku = `${source.sku}-COPY`;
    const newBarcode = `${source.barcode.slice(0, 10)}${Math.floor(Math.random() * 900 + 100)}`;
    const duplicated: Product = {
      ...source,
      id: `prod-${now}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${source.name} (کپی)`,
      sku: newSku,
      barcode: newBarcode,
      createdAt: now,
      updatedAt: now,
    };

    await saveProduct(duplicated);
    showToast({ type: 'success', message: `محصول "${duplicated.name}" ایجاد شد` });
  };

  const totalPages = Math.ceil(totalProducts / pageSize) || 1;
  const isAllCurrentPageSelected =
    products.length > 0 && products.every((p) => selectedProductIds.has(p.id));

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-5">
      {/* Header & Main Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>مدیریت و لیست محصولات</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {totalProducts.toLocaleString('fa-IR')} محصول یافت‌شده (از کل {allDatabaseCount.toLocaleString('fa-IR')})
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            جستجو، فیلتر، ویرایش، تکثیر و مدیریت بارکد و قیمت کالاها
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={() => setExcelModalOpen(true)}
          >
            خروجی اکسل
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingProductId(null);
              setActiveTab('generator');
            }}
          >
            محصول جدید
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter({ search: e.target.value })}
              placeholder="جستجو در نام، SKU یا بارکد..."
              className="w-full text-xs rounded-lg border border-slate-300 bg-white pr-9 pl-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>

          {/* Filter Toggles & Quick Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {/* Quick Filter: Needs Print */}
            <button
              type="button"
              onClick={() => {
                setFilter({
                  printStatus: filters.printStatus === 'needs_print' ? 'all' : 'needs_print',
                });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none ${
                filters.printStatus === 'needs_print'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50/90 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
              title="فیلتر محصولات نیازمند چاپ لیبل"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>فیلتر چاپ: نیازمند چاپ</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  filters.printStatus === 'needs_print'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-200 text-amber-950'
                }`}
              >
                {needsPrintCount.toLocaleString('fa-IR')}
              </span>
            </button>

            <Button
              variant={showFiltersPanel ? 'primary' : 'outline'}
              size="sm"
              icon={<Filter className="w-3.5 h-3.5" />}
              onClick={() => setShowFiltersPanel((prev) => !prev)}
              className="text-xs"
            >
              فیلترهای پیشرفته
            </Button>

            {(filters.categoryId ||
              filters.subcategoryId ||
              filters.colorId ||
              filters.sizeId ||
              filters.genderId ||
              (filters.printStatus && filters.printStatus !== 'all') ||
              filters.search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700"
              >
                پاکسازی فیلترها
              </Button>
            )}

            <button
              onClick={() => loadProducts()}
              title="بارگذاری مجدد"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showFiltersPanel && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-slate-100 text-xs">
            {/* Category */}
            <div>
              <CustomDropdown
                label="گروه اصلی"
                size="sm"
                placeholder="همه گروه‌ها"
                value={filters.categoryId || ''}
                onChange={(val) => setFilter({ categoryId: val || undefined })}
                clearable
                options={[
                  { value: '', label: 'همه گروه‌ها' },
                  ...categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                    code: c.code,
                  })),
                ]}
              />
            </div>

            {/* Subcategory */}
            <div>
              <CustomDropdown
                label="گروه فرعی"
                size="sm"
                placeholder="همه زیرگروه‌ها"
                value={filters.subcategoryId || ''}
                onChange={(val) => setFilter({ subcategoryId: val || undefined })}
                clearable
                options={[
                  { value: '', label: 'همه زیرگروه‌ها' },
                  ...subcategories
                    .filter((s) => !filters.categoryId || s.parentId === filters.categoryId)
                    .map((s) => ({
                      value: s.id,
                      label: s.name,
                      code: s.code,
                    })),
                ]}
              />
            </div>

            {/* Color */}
            <div>
              <CustomDropdown
                label="رنگ"
                size="sm"
                placeholder="همه رنگ‌ها"
                value={filters.colorId || ''}
                onChange={(val) => setFilter({ colorId: val || undefined })}
                clearable
                options={[
                  { value: '', label: 'همه رنگ‌ها' },
                  ...colors.map((c) => ({
                    value: c.id,
                    label: c.name,
                    code: c.code,
                    hexColor: c.hexCode,
                  })),
                ]}
              />
            </div>

            {/* Size */}
            <div>
              <CustomDropdown
                label="سایز"
                size="sm"
                placeholder="همه سایزها"
                value={filters.sizeId || ''}
                onChange={(val) => setFilter({ sizeId: val || undefined })}
                clearable
                options={[
                  { value: '', label: 'همه سایزها' },
                  ...sizes.map((s) => ({
                    value: s.id,
                    label: s.name,
                    code: s.code,
                  })),
                ]}
              />
            </div>

            {/* Gender */}
            <div>
              <CustomDropdown
                label="جنسیت"
                size="sm"
                placeholder="همه جنسیت‌ها"
                value={filters.genderId || ''}
                onChange={(val) => setFilter({ genderId: val || undefined })}
                clearable
                options={[
                  { value: '', label: 'همه جنسیت‌ها' },
                  ...genders.map((g) => ({
                    value: g.id,
                    label: g.name,
                    code: g.code,
                  })),
                ]}
              />
            </div>

            {/* Print Status Filter */}
            <div>
              <CustomDropdown
                label="وضعیت چاپ لیبل"
                size="sm"
                placeholder="همه وضعیت‌ها"
                value={filters.printStatus || 'all'}
                onChange={(val) => setFilter({ printStatus: (val as any) || 'all' })}
                options={[
                  { value: 'all', label: 'همه محصولات' },
                  { value: 'needs_print', label: 'نیازمند چاپ لیبل' },
                  { value: 'printed', label: 'چاپ‌شده / عادی' },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bulk Selection Action Bar */}
      <div
        className={`rounded-xl border p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs transition-all ${
          selectedProductIds.size > 0
            ? 'bg-blue-50/90 border-blue-200 text-blue-950 shadow-xs'
            : 'bg-slate-50/80 border-slate-200 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {selectedProductIds.size > 0 ? (
              <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className={selectedProductIds.size > 0 ? 'font-bold text-blue-900' : 'text-slate-600'}>
              {selectedProductIds.size > 0
                ? `${selectedProductIds.size.toLocaleString('fa-IR')} محصول از ${totalProducts.toLocaleString('fa-IR')} انتخاب شده`
                : 'نوار عملیات گروهی (محصولات مورد نظر را از جدول انتخاب کنید)'}
            </span>
          </div>

          {/* Icon Buttons for Select All / Deselect All */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={selectAllMatching}
              title={`انتخاب همه ${totalProducts.toLocaleString('fa-IR')} محصول یافت‌شده`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">انتخاب همه ({totalProducts.toLocaleString('fa-IR')})</span>
            </button>

            <button
              type="button"
              disabled={selectedProductIds.size === 0}
              onClick={deselectAll}
              title="لغو انتخاب همه"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedProductIds.size === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
              }`}
            >
              <SquareX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">لغو انتخاب</span>
            </button>
          </div>
        </div>

        {/* Action Buttons (Active / Inactive based on selection) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mark as Needs Print */}
          <Button
            variant="outline"
            size="sm"
            disabled={selectedProductIds.size === 0}
            onClick={async () => {
              if (selectedProductIds.size === 0) return;
              await markSelectedAsNeedsPrint();
              showToast({
                type: 'success',
                message: `${selectedProductIds.size.toLocaleString('fa-IR')} محصول به عنوان «نیازمند چاپ لیبل» ثبت گردید`,
              });
            }}
            icon={<Printer className="w-3.5 h-3.5 text-amber-600" />}
            className="text-xs bg-white text-amber-900 border-amber-200 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            نیازمند چاپ
          </Button>

          {/* Mark as Printed */}
          <Button
            variant="outline"
            size="sm"
            disabled={selectedProductIds.size === 0}
            onClick={async () => {
              if (selectedProductIds.size === 0) return;
              await markSelectedAsPrinted();
              showToast({
                type: 'success',
                message: `${selectedProductIds.size.toLocaleString('fa-IR')} محصول به عنوان «چاپ‌شده» ثبت گردید`,
              });
            }}
            icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            className="text-xs bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ثبت چاپ‌شده
          </Button>

          {/* Excel Export */}
          <Button
            variant="primary"
            size="sm"
            disabled={selectedProductIds.size === 0}
            icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            onClick={() => setExcelModalOpen(true)}
            className="text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            خروجی اکسل و چاپ لیبل
          </Button>

          {/* Delete */}
          <Button
            variant="danger"
            size="sm"
            disabled={selectedProductIds.size === 0}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handleBulkDelete}
            className="text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            حذف
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {products.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">هنوز محصولی ایجاد نشده است</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              برای شروع، اولین محصول خود را به صورت تکی یا از طریق ماتریس تنوع ایجاد کنید.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingProductId(null);
                  setActiveTab('generator');
                }}
              >
                + ایجاد تک محصول
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('matrix')}
              >
                تولید از ماتریس تنوع
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={isAllCurrentPageSelected ? deselectAll : selectAllCurrentPage}
                      className="cursor-pointer text-slate-500 hover:text-blue-600"
                      aria-label="انتخاب همه این صفحه"
                    >
                      {isAllCurrentPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>

                  <th className="p-3 min-w-[200px]">
                    <button
                      onClick={() => setSorting('name')}
                      className="flex items-center gap-1 font-bold hover:text-blue-600 cursor-pointer"
                    >
                      <span>نام محصول</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>

                  <th className="p-3 min-w-[140px]">
                    <button
                      onClick={() => setSorting('sku')}
                      className="flex items-center gap-1 font-bold hover:text-blue-600 cursor-pointer"
                    >
                      <span>SKU</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>

                  <th className="p-3 min-w-[140px] font-bold">بارکد</th>

                  <th className="p-3 min-w-[110px]">
                    <button
                      onClick={() => setSorting('price')}
                      className="flex items-center gap-1 font-bold hover:text-blue-600 cursor-pointer"
                    >
                      <span>قیمت ({settings.currency})</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>

                  <th className="p-3 min-w-[90px] font-bold">رنگ</th>
                  <th className="p-3 min-w-[70px] font-bold">سایز</th>
                  <th className="p-3 min-w-[80px] font-bold">جنسیت</th>
                  <th className="p-3 min-w-[90px] font-bold">رده سنی</th>
                  <th className="p-3 min-w-[100px] text-center font-bold">وضعیت چاپ</th>
                  <th className="p-3 min-w-[130px] text-center font-bold">عملیات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {products.map((product) => {
                  const isSelected = selectedProductIds.has(product.id);
                  const colorObj = colors.find((c) => c.id === product.colorId);
                  const sizeObj = sizes.find((s) => s.id === product.sizeId);
                  const genderObj = genders.find((g) => g.id === product.genderId);
                  const ageObj = ages.find((a) => a.id === product.ageId);

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectProduct(product.id)}
                          className="cursor-pointer text-slate-500 hover:text-blue-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name */}
                      <td className="p-3">
                        <div className="flex items-center justify-between gap-2 group">
                          <span className="font-semibold text-slate-900">{product.name}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(product.id, 'نام کالا', product.name)}
                            title="کپی نام کالا"
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer transition-opacity"
                          >
                            {copiedField?.id === product.id && copiedField.field === 'نام کالا' ? (
                              <CopyCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="p-3">
                        <div className="flex items-center justify-between gap-1 group">
                          <span className="font-mono text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded tracking-wide direction-ltr text-left">
                            {product.sku}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(product.id, 'SKU', product.sku)}
                            title="کپی SKU"
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer transition-opacity"
                          >
                            {copiedField?.id === product.id && copiedField.field === 'SKU' ? (
                              <CopyCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Barcode */}
                      <td className="p-3">
                        <div className="flex items-center justify-between gap-1 group">
                          <span className="font-mono text-xs text-slate-800 tracking-wider direction-ltr text-left">
                            {product.barcode}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(product.id, 'بارکد', product.barcode)}
                            title="کپی بارکد"
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer transition-opacity"
                          >
                            {copiedField?.id === product.id && copiedField.field === 'بارکد' ? (
                              <CopyCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="p-3 font-semibold text-slate-900">
                        {product.price ? product.price.toLocaleString('fa-IR') : '۰'}
                      </td>

                      {/* Color */}
                      <td className="p-3">
                        {colorObj ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                              style={{ backgroundColor: colorObj.hexCode || '#ccc' }}
                            />
                            <span>{colorObj.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Size */}
                      <td className="p-3 font-medium text-slate-800">
                        {sizeObj?.name || '-'}
                      </td>

                      {/* Gender */}
                      <td className="p-3 text-slate-700">
                        {genderObj?.name || '-'}
                      </td>

                      {/* Age */}
                      <td className="p-3 text-slate-600">
                        {ageObj?.name || '-'}
                      </td>

                      {/* Print Status */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={async () => {
                            const nextStatus = !product.needsPrint;
                            await updateProductPrintStatus(product.id, nextStatus);
                            showToast({
                              type: 'info',
                              message: nextStatus
                                ? 'محصول به عنوان «نیازمند چاپ لیبل» علامت‌گذاری شد'
                                : 'محصول به عنوان «چاپ‌شده» ثبت شد',
                            });
                          }}
                          title={product.needsPrint ? 'کلیک برای تغییر به چاپ‌شده' : 'کلیک برای تغییر به نیازمند چاپ'}
                          className="cursor-pointer transition-transform active:scale-95 inline-flex items-center justify-center"
                        >
                          {product.needsPrint ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full hover:bg-amber-200 shadow-2xs">
                              <Printer className="w-2.5 h-2.5 text-amber-700" />
                              <span>نیازمند چاپ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full hover:bg-slate-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>چاپ شده</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Operations */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingProductId(product.id)}
                            title="ویرایش"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateProduct(product)}
                            title="تکثیر کالا"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(product)}
                            title="حذف"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Page Size */}
        {totalProducts > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="shrink-0">نمایش</span>
              <div className="w-28">
                <CustomDropdown
                  size="sm"
                  value={pageSize}
                  onChange={(val) => setPageSize(Number(val))}
                  options={[
                    { value: 10, label: '۱۰ کالا' },
                    { value: 20, label: '۲۰ کالا' },
                    { value: 50, label: '۵۰ کالا' },
                    { value: 100, label: '۱۰۰ کالا' },
                  ]}
                />
              </div>
              <span className="shrink-0">در هر صفحه</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="ml-2">
                صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
              </span>

              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                aria-label="صفحه قبلی"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                aria-label="صفحه بعدی"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
