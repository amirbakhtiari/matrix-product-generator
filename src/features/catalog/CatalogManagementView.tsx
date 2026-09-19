import React, { useState } from 'react';
import { useCatalogStore } from '../../stores/catalog-store.ts';
import { useUiStore } from '../../stores/ui-store.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { CustomDropdown } from '../../components/ui/CustomDropdown.tsx';
import { formatDimensionCode } from '../../services/sku-generator.ts';
import type {
  CatalogType,
  CatalogItem,
  Category,
  SubCategory,
  Color,
} from '../../types/index.ts';
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  Tag,
  Palette,
  Ruler,
  Users,
  Calendar,
  Sun,
  Sparkles,
  Search,
} from 'lucide-react';

export const CatalogManagementView: React.FC = () => {
  const {
    categories,
    subcategories,
    attributes,
    colors,
    sizes,
    genders,
    ages,
    seasons,
    characters,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
  } = useCatalogStore();

  const { showToast, showConfirmation } = useUiStore();

  const [activeCatalogTab, setActiveCatalogTab] = useState<CatalogType>('category');
  const [selectedParentCategoryFilter, setSelectedParentCategoryFilter] = useState<string>('all');
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');

  const handleTabChange = (tabId: CatalogType) => {
    if (tabId === activeCatalogTab) return;
    setCatalogSearchTerm('');
    setIsTableLoading(true);
    setActiveCatalogTab(tabId);
    setTimeout(() => {
      setIsTableLoading(false);
    }, 280);
  };

  const handleFilterChange = (val: string) => {
    setIsTableLoading(true);
    setSelectedParentCategoryFilter(val);
    setTimeout(() => {
      setIsTableLoading(false);
    }, 200);
  };

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formParentId, setFormParentId] = useState('');
  const [formColorHex, setFormColorHex] = useState('#3B82F6');
  const [formSortOrder, setFormSortOrder] = useState('1');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const catalogTabs: { id: CatalogType; label: string; icon: React.ReactNode }[] = [
    { id: 'category', label: 'گروه‌های اصلی', icon: <Layers className="w-4 h-4" /> },
    { id: 'subcategory', label: 'گروه‌های فرعی', icon: <Tag className="w-4 h-4" /> },
    { id: 'attribute', label: 'ویژگی‌ها', icon: <Tag className="w-4 h-4" /> },
    { id: 'season', label: 'فصل‌ها', icon: <Sun className="w-4 h-4" /> },
    { id: 'color', label: 'رنگ‌ها', icon: <Palette className="w-4 h-4" /> },
    { id: 'size', label: 'سایزها', icon: <Ruler className="w-4 h-4" /> },
    { id: 'gender', label: 'جنسیت‌ها', icon: <Users className="w-4 h-4" /> },
    { id: 'character', label: 'شخصیت‌ها / نام‌ها', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'age', label: 'سن‌ها', icon: <Calendar className="w-4 h-4" /> },
  ];

  // Get current list based on active tab
  const getItemsForCurrentTab = (): CatalogItem[] => {
    switch (activeCatalogTab) {
      case 'category':
        return categories;
      case 'subcategory':
        if (selectedParentCategoryFilter !== 'all') {
          return subcategories.filter((s) => s.parentId === selectedParentCategoryFilter);
        }
        return subcategories;
      case 'attribute':
        return attributes;
      case 'season':
        return seasons;
      case 'color':
        return colors;
      case 'size':
        return sizes;
      case 'gender':
        return genders;
      case 'character':
        return characters;
      case 'age':
        return ages;
      default:
        return [];
    }
  };

  const currentItems = getItemsForCurrentTab();

  const filteredItems = currentItems.filter((item) => {
    if (!catalogSearchTerm.trim()) return true;
    const term = catalogSearchTerm.trim().toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      (item.code && item.code.toLowerCase().includes(term))
    );
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    let suggestedCode = '';
    if (activeCatalogTab === 'category') {
      const maxCode = categories.reduce((max, c) => Math.max(max, parseInt(c.code?.replace(/\D/g, '') || '1000', 10)), 1000);
      suggestedCode = String(maxCode + 1);
    } else if (activeCatalogTab === 'attribute') {
      const maxCode = attributes.reduce((max, a) => Math.max(max, parseInt(a.code?.replace(/\D/g, '') || '100', 10)), 100);
      suggestedCode = String(maxCode + 1);
    } else if (activeCatalogTab === 'color') {
      const maxCode = colors.reduce((max, c) => Math.max(max, parseInt(c.code?.replace(/\D/g, '') || '0', 10)), 0);
      suggestedCode = String(maxCode + 1).padStart(3, '0');
    } else if (activeCatalogTab === 'size') {
      const maxCode = sizes.reduce((max, s) => Math.max(max, parseInt(s.code?.replace(/\D/g, '') || '0', 10)), 0);
      suggestedCode = String(maxCode + 1).padStart(3, '0');
    } else if (activeCatalogTab === 'season') {
      suggestedCode = String(seasons.length + 1);
    } else if (activeCatalogTab === 'gender') {
      suggestedCode = String(genders.length + 1);
    } else if (activeCatalogTab === 'character') {
      const maxCode = characters.reduce((max, ch) => Math.max(max, parseInt(ch.code?.replace(/\D/g, '') || '0', 10)), 0);
      suggestedCode = String(maxCode + 1).padStart(4, '0');
    } else if (activeCatalogTab === 'subcategory') {
      const maxCode = subcategories.reduce((max, s) => Math.max(max, parseInt(s.code?.replace(/\D/g, '') || '100', 10)), 100);
      suggestedCode = String(maxCode + 1);
    } else if (activeCatalogTab === 'age') {
      const maxCode = ages.reduce((max, a) => Math.max(max, parseInt(a.code?.replace(/\D/g, '') || '0', 10)), 0);
      suggestedCode = String(maxCode + 1).padStart(2, '0');
    } else {
      suggestedCode = String(currentItems.length + 1).padStart(2, '0');
    }
    setFormCode(suggestedCode);
    setFormParentId(categories[0]?.id || '');
    setFormColorHex('#3B82F6');
    setFormSortOrder(String(currentItems.length + 1));
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCode(item.code ? item.code.replace(/\D/g, '') : '');
    setFormSortOrder(String(item.sortOrder || 1));
    setFormIsActive(item.isActive);
    setFormError('');

    if (activeCatalogTab === 'subcategory') {
      const sub = item as SubCategory;
      setFormParentId(sub.parentId || categories[0]?.id || '');
    }
    if (activeCatalogTab === 'color') {
      const col = item as Color;
      setFormColorHex(col.hexCode || '#3B82F6');
    }

    setIsModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formName.trim()) {
      setFormError('نام آیتم الزامی است');
      return;
    }
    const cleanNumericCode = formCode.replace(/\D/g, '').trim();
    if (!cleanNumericCode) {
      setFormError('کد آیتم الزامی است و طبق دستورالعمل نباید از حروف استفاده شود، فقط ارقام عددی مجاز است');
      return;
    }

    // Rule: Codes, except for season and gender, must NOT be single digit!
    if (activeCatalogTab !== 'season' && activeCatalogTab !== 'gender' && cleanNumericCode.length === 1) {
      setFormError('کدها به جز فصل و جنسیت نباید تک‌رقمی باشند. لطفاً کد حداقل ۲ رقم یا بیشتر (مثلاً ۰۱، ۰۰۱ یا ۱۰۱) وارد نمایید');
      return;
    }

    const now = Date.now();
    const code = formatDimensionCode(cleanNumericCode, activeCatalogTab);
    const sortOrder = Number(formSortOrder) || 1;

    // Strict validation: unique title across the active catalog
    const normalizedName = formName.trim().toLowerCase();
    const isDuplicateName = currentItems.some(
      (item) => item.id !== editingItem?.id && item.name.trim().toLowerCase() === normalizedName
    );
    if (isDuplicateName) {
      setFormError(`عنوان "${formName.trim()}" تکراری است. تمامی عنوان‌های کاتالوگ و دراپ‌داون باید کاملاً یونیک باشند.`);
      return;
    }

    // Strict validation: unique code
    const isDuplicateCode = currentItems.some(
      (item) => item.id !== editingItem?.id && item.code === code
    );
    if (isDuplicateCode) {
      setFormError(`کد "${code}" تکراری است. کد اختصاصی باید یونیک باشد.`);
      return;
    }

    try {
      if (editingItem) {
        const updated: any = {
          ...editingItem,
          name: formName.trim(),
          code,
          sortOrder,
          isActive: formIsActive,
          updatedAt: now,
        };
        if (activeCatalogTab === 'subcategory') {
          updated.parentId = formParentId;
        }
        if (activeCatalogTab === 'color') {
          updated.hexCode = formColorHex;
        }

        await updateCatalogItem(activeCatalogTab, updated);
        showToast({ type: 'success', message: `آیتم "${formName}" با موفقیت ویرایش شد` });
      } else {
        const newItem: any = {
          id: `${activeCatalogTab}-${Date.now()}`,
          name: formName.trim(),
          code,
          sortOrder,
          isActive: formIsActive,
          createdAt: now,
          updatedAt: now,
        };
        if (activeCatalogTab === 'subcategory') {
          newItem.parentId = formParentId;
        }
        if (activeCatalogTab === 'color') {
          newItem.hexCode = formColorHex;
        }

        await addCatalogItem(activeCatalogTab, newItem);
        showToast({ type: 'success', message: `آیتم جدید "${formName}" اضافه شد` });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError('خطا در ذخیره‌سازی اطلاعات');
    }
  };

  const handleDeleteItem = (item: CatalogItem) => {
    showConfirmation({
      title: 'حذف آیتم کاتالوگ',
      message: `آیا از حذف "${item.name}" مطمئن هستید؟ در صورتی که این مورد در کالاهایی استفاده شده باشد، ممکن است در نمایش نام محصول تأثیر بگذارد.`,
      isDestructive: true,
      confirmText: 'حذف دائمی',
      onConfirm: async () => {
        await deleteCatalogItem(activeCatalogTab, item.id);
        showToast({ type: 'success', message: 'آیتم حذف شد' });
      },
    });
  };

  const handleToggleActive = async (item: CatalogItem) => {
    const updated = { ...item, isActive: !item.isActive, updatedAt: Date.now() };
    await updateCatalogItem(activeCatalogTab, updated);
    showToast({
      type: 'info',
      message: `وضعیت "${item.name}" به ${!item.isActive ? 'فعال' : 'غیرفعال'} تغییر یافت`,
    });
  };

  const currentTabInfo = catalogTabs.find((t) => t.id === activeCatalogTab);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span>مدیریت داده‌ها و پایگاه کاتالوگ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مدیریت دسته‌بندی‌ها، ویژگی‌ها، رنگ‌ها، سایزها، جنسیت و رده‌های سنی کالا
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAddModal}
          className="text-xs font-bold"
        >
          افزودن {currentTabInfo?.label.slice(0, -2) || 'آیتم'} جدید
        </Button>
      </div>

      {/* Catalog Sub-tabs */}
      <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        {catalogTabs.map((tab) => {
          const isActive = activeCatalogTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                isActive
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subcategory Parent Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={`جستجو در بین ${currentItems.length} ${currentTabInfo?.label}...`}
            value={catalogSearchTerm}
            onChange={(e) => setCatalogSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
          {catalogSearchTerm && (
            <button
              onClick={() => setCatalogSearchTerm('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {activeCatalogTab === 'subcategory' && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-600 shrink-0 text-[11px]">گروه والد:</span>
              <div className="w-48">
                <CustomDropdown
                  size="sm"
                  value={selectedParentCategoryFilter}
                  onChange={(val) => handleFilterChange(val)}
                  options={[
                    { value: 'all', label: 'همه گروه‌ها' },
                    ...categories.map((c) => ({
                      value: c.id,
                      label: c.name,
                      code: c.code,
                    })),
                  ]}
                />
              </div>
            </div>
          )}

          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0">
            {filteredItems.length} از {currentItems.length} مورد
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="p-3 w-12 text-center font-bold">#</th>
                <th className="p-3 min-w-[150px] font-bold">نام</th>
                <th className="p-3 min-w-[110px] font-bold">کد عددی (Barcode & SKU)</th>
                {activeCatalogTab === 'subcategory' && (
                  <th className="p-3 min-w-[140px] font-bold">گروه اصلی والد</th>
                )}
                {activeCatalogTab === 'color' && (
                  <th className="p-3 min-w-[100px] font-bold">پیش‌نمایش رنگ</th>
                )}
                <th className="p-3 w-24 text-center font-bold">ترتیب نمایش</th>
                <th className="p-3 w-28 text-center font-bold">وضعیت</th>
                <th className="p-3 w-28 text-center font-bold">عملیات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {isTableLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="p-3 text-center">
                      <div className="h-4 w-5 bg-slate-200 rounded mx-auto" />
                    </td>
                    <td className="p-3">
                      <div className="h-4 w-36 bg-slate-200 rounded" />
                    </td>
                    <td className="p-3">
                      <div className="h-5 w-16 bg-slate-200 rounded" />
                    </td>
                    {activeCatalogTab === 'subcategory' && (
                      <td className="p-3">
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                      </td>
                    )}
                    {activeCatalogTab === 'color' && (
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-slate-200" />
                          <div className="h-3 w-12 bg-slate-200 rounded" />
                        </div>
                      </td>
                    )}
                    <td className="p-3 text-center">
                      <div className="h-4 w-8 bg-slate-200 rounded mx-auto" />
                    </td>
                    <td className="p-3 text-center">
                      <div className="h-5 w-14 bg-slate-200 rounded-full mx-auto" />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="h-6 w-6 bg-slate-200 rounded" />
                        <div className="h-6 w-6 bg-slate-200 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeCatalogTab === 'subcategory' || activeCatalogTab === 'color' ? 7 : 6}
                    className="p-8 text-center text-slate-400"
                  >
                    هیچ داده‌ای در این بخش یافت نشد
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  let parentName = '';
                  if (activeCatalogTab === 'subcategory') {
                    const sub = item as SubCategory;
                    parentName = categories.find((c) => c.id === sub.parentId)?.name || '-';
                  }

                  const colorItem = item as Color;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      <td className="p-3 font-semibold text-slate-900">
                        {item.name}
                      </td>

                      <td className="p-3">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                          {formatDimensionCode(item.code, activeCatalogTab)}
                        </span>
                      </td>

                      {activeCatalogTab === 'subcategory' && (
                        <td className="p-3 text-slate-600">
                          {parentName}
                        </td>
                      )}

                      {activeCatalogTab === 'color' && (
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border border-slate-300"
                              style={{ backgroundColor: colorItem.hexCode || '#ccc' }}
                            />
                            <span className="font-mono text-[11px] text-slate-500">
                              {colorItem.hexCode || '-'}
                            </span>
                          </div>
                        </td>
                      )}

                      <td className="p-3 text-center font-mono text-slate-600">
                        {item.sortOrder || 1}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className="cursor-pointer"
                        >
                          {item.isActive ? (
                            <Badge variant="success" size="sm">
                              فعال
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              غیرفعال
                            </Badge>
                          )}
                        </button>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? 'ویرایش آیتم کاتالوگ' : `افزودن ${currentTabInfo?.label.slice(0, -2) || 'آیتم'} جدید`}
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveItem}>
                ذخیره اطلاعات
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="نام به فارسی"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="مثال: تیشرت یا قرمز"
              required
              autoFocus
            />

            <Input
              label="کد عددی یکتا (تنها ارقام عددی، بدون حروف)"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.replace(/\D/g, ''))}
              placeholder={
                activeCatalogTab === 'category'
                  ? 'مثال: 1001 (۴ رقم)'
                  : activeCatalogTab === 'attribute'
                  ? 'مثال: 101 (۳ رقم)'
                  : activeCatalogTab === 'color'
                  ? 'مثال: 001 (۳ رقم)'
                  : activeCatalogTab === 'size'
                  ? 'مثال: 001 (۳ رقم)'
                  : activeCatalogTab === 'season'
                  ? 'مثال: 1 (۱ رقم)'
                  : activeCatalogTab === 'gender'
                  ? 'مثال: 1 (۱ رقم)'
                  : activeCatalogTab === 'character'
                  ? 'مثال: 0001 (۴ رقم)'
                  : 'مثال: 101'
              }
              className="font-mono text-left"
              helperText={
                activeCatalogTab === 'season' || activeCatalogTab === 'gender'
                  ? 'کد تک‌رقمی (۱ رقم عددی - استثنای فصل و جنسیت)'
                  : 'کدها به جز فصل و جنسیت نباید تک‌رقمی باشند (حداقل ۲ یا ۳ یا ۴ رقم طبق استاندارد این بخش)'
              }
              required
            />

            {activeCatalogTab === 'subcategory' && (
              <CustomDropdown
                label="گروه اصلی والد"
                required
                placeholder="انتخاب گروه اصلی والد..."
                value={formParentId}
                onChange={(val) => setFormParentId(val)}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  code: c.code,
                }))}
              />
            )}

            {activeCatalogTab === 'color' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">رنگ بصری</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formColorHex}
                    onChange={(e) => setFormColorHex(e.target.value)}
                    className="w-9 h-9 rounded border border-slate-300 cursor-pointer p-0.5"
                  />
                  <Input
                    value={formColorHex}
                    onChange={(e) => setFormColorHex(e.target.value)}
                    className="font-mono text-left"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="ترتیب نمایش"
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
              />

              <div className="flex flex-col gap-1.5 justify-end">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-6">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>وضعیت فعال</span>
                </label>
              </div>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs">
                {formError}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
