import React, { useState, useRef } from 'react';
import { useCatalogStore } from '../../stores/catalog-store.ts';
import { useProductStore } from '../../stores/product-store.ts';
import { useUiStore } from '../../stores/ui-store.ts';
import {
  exportDatabaseBackup,
  validateBackupData,
  importDatabaseBackup,
  type DatabaseBackup,
} from '../../services/backup-service.ts';
import { db } from '../../db/database.ts';
import { seedInitialDataIfNeeded } from '../../db/seed.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { CustomDropdown } from '../../components/ui/CustomDropdown.tsx';
import type { Settings } from '../../types/index.ts';
import {
  Settings as SettingsIcon,
  HardDriveDownload,
  UploadCloud,
  Save,
  RotateCcw,
  CheckCircle2,
  FileCode,
  ShieldAlert,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, loadAllCatalogData } = useCatalogStore();
  const { refreshCount, loadProducts, allDatabaseCount } = useProductStore();
  const { showToast, showConfirmation } = useUiStore();

  const [formSettings, setFormSettings] = useState<Settings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);

  // Backup & Restore states
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restorePayload, setRestorePayload] = useState<DatabaseBackup | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formSettings);
      showToast({ type: 'success', message: 'تنظیمات با موفقیت ذخیره شد' });
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'خطا در ذخیره تنظیمات' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      const filename = await exportDatabaseBackup();
      showToast({
        type: 'success',
        message: `فایل پشتیبان با موفقیت تهیه و دانلود شد (${filename})`,
      });
    } catch (err) {
      console.error('Backup failed:', err);
      showToast({ type: 'error', message: 'خطا در تهیه فایل پشتیبان' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const json = JSON.parse(text);

        if (!validateBackupData(json)) {
          showToast({
            type: 'error',
            message: 'فایل پشتیبان نامعتبر است یا ساختار کاتالوگ‌ها در آن یافت نشد',
          });
          return;
        }

        setRestorePayload(json);
        setIsRestoreModalOpen(true);
      } catch (err) {
        showToast({
          type: 'error',
          message: 'خطا در خواندن فایل JSON. ساختار فایل نامعتبر است.',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!restorePayload) return;

    setIsRestoring(true);
    try {
      const result = await importDatabaseBackup(restorePayload, restoreMode);
      await loadAllCatalogData();
      await refreshCount();
      await loadProducts();

      showToast({
        type: 'success',
        message: `بازیابی با موفقیت انجام شد (${result.productsCount.toLocaleString('fa-IR')} کالا وارد دیتابیس شد)`,
      });

      setIsRestoreModalOpen(false);
      setRestorePayload(null);
    } catch (err) {
      console.error('Restore failed:', err);
      showToast({ type: 'error', message: 'خطا در بازیابی اطلاعات' });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleResetDatabase = () => {
    showConfirmation({
      title: 'بازنشانی کامل دیتابیس به تنظیمات کارخانه',
      message:
        'هشدار: تمام محصولات، کاتالوگ‌های سفارشی و تنظیمات شما حذف خواهند شد و اطلاعات اولیه جایگزین می‌شود. آیا مطمئن هستید؟',
      isDestructive: true,
      confirmText: 'پاک‌سازی کامل دیتابیس',
      onConfirm: async () => {
        try {
          await db.delete();
          await db.open();
          await seedInitialDataIfNeeded();
          await loadAllCatalogData();
          await refreshCount();
          await loadProducts();
          showToast({ type: 'success', message: 'دیتابیس با موفقیت به حالت اولیه بازنشانی شد' });
        } catch (err) {
          console.error(err);
          showToast({ type: 'error', message: 'خطا در بازنشانی دیتابیس' });
        }
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-600" />
          <span>تنظیمات سیستم و مدیریت پشتیبان‌گیری</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          شخصی‌سازی الگوی تولید SKU، نوع بارکد استاندارد، ارز سیستم و پشتیبان‌گیری کامل JSON
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
          پیکربندی کد کالا (SKU) و بارکد
        </h3>

        <div className="space-y-4">
          {/* SKU Template */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              الگوی تولید SKU (SKU Template) <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formSettings.skuTemplate}
              onChange={(e) =>
                setFormSettings({ ...formSettings, skuTemplate: e.target.value })
              }
              className="font-mono text-left direction-ltr"
              placeholder="{subcategory}-{attribute}-{color}-{gender}-{size}"
              required
            />
            <div className="text-[11px] text-slate-500 leading-relaxed">
              متغیرهای مجاز:{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">{'{category}'}</code>،{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">{'{subcategory}'}</code>،{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">{'{attribute}'}</code>،{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">{'{color}'}</code>،{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">{'{gender}'}</code>،{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">{'{size}'}</code>،{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">{'{age}'}</code>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Barcode Type */}
            <CustomDropdown
              label="نوع بارکد"
              value={formSettings.barcodeType}
              onChange={(val) =>
                setFormSettings({
                  ...formSettings,
                  barcodeType: val as 'EAN-13' | 'CODE-128',
                })
              }
              options={[
                { value: 'EAN-13', label: 'EAN-13 (استاندارد ۱۳ رقمی فروشگاهی)', badge: '۱۳ رقم' },
                { value: 'CODE-128', label: 'CODE-128 (کدینگ الفبانومریک)', badge: 'متغیر' },
              ]}
            />

            {/* Barcode Prefix */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">پیشوند بارکد</label>
              <Input
                value={formSettings.barcodePrefix}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, barcodePrefix: e.target.value.trim() })
                }
                className="font-mono text-left direction-ltr"
                placeholder="626"
                helperText="مثلاً 626 برای ایران"
              />
            </div>

            {/* Currency */}
            <CustomDropdown
              label="واحد پول"
              value={formSettings.currency}
              onChange={(val) =>
                setFormSettings({ ...formSettings, currency: val })
              }
              options={[
                { value: 'تومان', label: 'تومان' },
                { value: 'ریال', label: 'ریال' },
              ]}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            icon={<Save className="w-4 h-4" />}
          >
            ذخیره تنظیمات
          </Button>
        </div>
      </form>

      {/* Backup & Restore Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-600" />
          <span>پشتیبان‌گیری و بازیابی داده‌ها (JSON Backup & Restore)</span>
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          تمام محصولات ({allDatabaseCount.toLocaleString('fa-IR')} کالا)، دسته‌بندی‌ها، ویژگی‌ها، رنگ‌ها، سایزها و تنظیمات در قالب یک فایل استاندارد JSON ذخیره می‌شوند و می‌توانید آن را در مرورگر دیگر یا برای نگهداری امن بازیابی کنید.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            isLoading={isBackingUp}
            onClick={handleCreateBackup}
            icon={<HardDriveDownload className="w-4 h-4 text-blue-600" />}
          >
            تهیه فایل پشتیبان (دانلود JSON)
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            icon={<UploadCloud className="w-4 h-4 text-emerald-600" />}
          >
            بازیابی از فایل پشتیبان (JSON)
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Danger Zone: Reset Database */}
      <div className="bg-rose-50/50 rounded-xl border border-rose-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-800">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider">منطقه خطر (Danger Zone)</h3>
        </div>

        <p className="text-xs text-rose-700 leading-relaxed">
          با کلیک بر روی دکمه زیر، کل داده‌های ذخیره‌شده در IndexedDB مرورگر شما حذف شده و داده‌های نمونه اولیه بارگذاری می‌گردند.
        </p>

        <Button
          variant="danger"
          size="sm"
          onClick={handleResetDatabase}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          بازنشانی کامل دیتابیس محلی
        </Button>
      </div>

      {/* Restore Options Modal */}
      {isRestoreModalOpen && restorePayload && (
        <Modal
          isOpen={isRestoreModalOpen}
          onClose={() => setIsRestoreModalOpen(false)}
          title="تأیید و تنظیمات بازیابی فایل پشتیبان"
          maxWidth="md"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRestoreModalOpen(false)}
              >
                انصراف
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isRestoring}
                onClick={handleConfirmRestore}
              >
                شروع بازیابی اطلاعات
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>فایل پشتیبان معتبر شناسایی شد</span>
              </div>
              <div>نسخه: {restorePayload.version}</div>
              <div>
                تاریخ تهیه پشتیبان:{' '}
                {new Date(restorePayload.exportedAt).toLocaleString('fa-IR')}
              </div>
              <div>
                تعداد محصولات موجود در فایل: {restorePayload.products.length.toLocaleString('fa-IR')} کالا
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">نحوه بازیابی:</label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer ${
                  restoreMode === 'replace'
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="restoreMode"
                  checked={restoreMode === 'replace'}
                  onChange={() => setRestoreMode('replace')}
                  className="mt-0.5 text-blue-600"
                />
                <div className="text-xs">
                  <div className="font-bold">جایگزینی کامل (Replace)</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    تمام داده‌های فعلی حذف شده و داده‌های موجود در فایل پشتیبان جایگزین می‌شوند.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer ${
                  restoreMode === 'merge'
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="restoreMode"
                  checked={restoreMode === 'merge'}
                  onChange={() => setRestoreMode('merge')}
                  className="mt-0.5 text-blue-600"
                />
                <div className="text-xs">
                  <div className="font-bold">ادغام داده‌ها (Merge)</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    داده‌های فایل با داده‌های موجود ادغام می‌شوند؛ در صورت وجود شناسه یکسان، رکورد به‌روزرسانی می‌شود.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
