import React, { useState } from 'react';
import { useUiStore } from '../../stores/ui-store.ts';
import { useProductStore } from '../../stores/product-store.ts';
import { productRepository } from '../../db/repositories/product-repository.ts';
import { exportProductsToExcel } from '../../services/excel-export-service.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { FileSpreadsheet, Download, Check } from 'lucide-react';
import type { Product } from '../../types/index.ts';

export const ExcelExportModal: React.FC = () => {
  const { isExcelModalOpen, setExcelModalOpen, showToast } = useUiStore();
  const { selectedProductIds, totalProducts, allDatabaseCount, filters } = useProductStore();

  const [exportScope, setExportScope] = useState<'all' | 'selected' | 'filtered'>('all');
  const [isExporting, setIsExporting] = useState(false);

  if (!isExcelModalOpen) return null;

  const hasSelected = selectedProductIds.size > 0;
  const hasFilters = Boolean(
    filters.search ||
      filters.categoryId ||
      filters.subcategoryId ||
      filters.colorId ||
      filters.sizeId ||
      filters.genderId
  );

  // Calculate product count for each scope
  const getScopeCount = () => {
    switch (exportScope) {
      case 'selected':
        return selectedProductIds.size;
      case 'filtered':
        return totalProducts;
      case 'all':
      default:
        return allDatabaseCount;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let targetProducts: Product[] = [];

      if (exportScope === 'selected' && hasSelected) {
        targetProducts = await productRepository.getProductsByIds(
          Array.from(selectedProductIds)
        );
      } else if (exportScope === 'filtered' && hasFilters) {
        const res = await productRepository.getProducts(1, 100000, filters);
        targetProducts = res.products;
      } else {
        targetProducts = await productRepository.getAllProducts();
      }

      if (targetProducts.length === 0) {
        showToast({
          type: 'warning',
          message: 'محصولی برای خروجی اکسل یافت نشد',
        });
        return;
      }

      const result = exportProductsToExcel(targetProducts);

      showToast({
        type: 'success',
        message: `فایل Excel با موفقیت ایجاد شد (${result.count.toLocaleString('fa-IR')} محصول)`,
      });

      setExcelModalOpen(false);
    } catch (err) {
      console.error('Failed to export excel:', err);
      showToast({
        type: 'error',
        message: 'خطا در تولید فایل اکسل بارکدها',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isExcelModalOpen}
      onClose={() => setExcelModalOpen(false)}
      title="خروجی اکسل چاپ لیبل و بارکد"
      maxWidth="md"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExcelModalOpen(false)}
          >
            لغو
          </Button>
          <Button
            variant="success"
            size="sm"
            isLoading={isExporting}
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
            disabled={getScopeCount() === 0}
          >
            دریافت فایل Excel
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            این خروجی منحصراً شامل ستون‌های <strong>بارکد</strong> (با قالب متنی برای جلوگیری از نماد علمی)، <strong>نام محصول</strong> و <strong>قیمت</strong> جهت چاپ لیبل کالا آماده شده است.
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <label className="text-xs font-bold text-slate-700">محدوده محصولات خروجی:</label>

          {/* Scope 1: All */}
          <label
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
              exportScope === 'all'
                ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="exportScope"
                checked={exportScope === 'all'}
                onChange={() => setExportScope('all')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-xs">همه محصولات موجود در پایگاه‌داده</span>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {allDatabaseCount.toLocaleString('fa-IR')} کالا
            </span>
          </label>

          {/* Scope 2: Selected */}
          <label
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
              !hasSelected ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
            } ${
              exportScope === 'selected'
                ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="exportScope"
                disabled={!hasSelected}
                checked={exportScope === 'selected'}
                onChange={() => setExportScope('selected')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-xs">محصولات انتخاب‌شده در جدول</span>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {selectedProductIds.size.toLocaleString('fa-IR')} کالا
            </span>
          </label>

          {/* Scope 3: Filtered */}
          <label
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
              !hasFilters ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
            } ${
              exportScope === 'filtered'
                ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="exportScope"
                disabled={!hasFilters}
                checked={exportScope === 'filtered'}
                onChange={() => setExportScope('filtered')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-xs">محصولات فیلترشده بر اساس شرایط جستجو</span>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {totalProducts.toLocaleString('fa-IR')} کالا
            </span>
          </label>
        </div>

        {/* Count Preview */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">تعداد نهایی محصولات در فایل:</span>
          <span className="font-bold text-slate-900 text-sm">
            {getScopeCount().toLocaleString('fa-IR')} کالا
          </span>
        </div>
      </div>
    </Modal>
  );
};
