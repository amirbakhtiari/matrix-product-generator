import React from 'react';
import { useUiStore, type ActiveTab } from '../../stores/ui-store.ts';
import { useProductStore } from '../../stores/product-store.ts';
import {
  PlusCircle,
  Grid3X3,
  ListFilter,
  FileSpreadsheet,
  Database,
  Settings as SettingsIcon,
  Layers,
  HardDriveDownload,
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, setExcelModalOpen, setEditingProductId } = useUiStore();
  const { allDatabaseCount } = useProductStore();

  const handleNewProductClick = () => {
    setEditingProductId(null);
    setActiveTab('generator');
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'generator',
      label: 'محصول تکی',
      icon: <PlusCircle className="w-4 h-4" />,
    },
    {
      id: 'matrix',
      label: 'ماتریس تنوع',
      icon: <Grid3X3 className="w-4 h-4" />,
    },
    {
      id: 'products',
      label: 'لیست محصولات',
      icon: <ListFilter className="w-4 h-4" />,
    },
    {
      id: 'catalog',
      label: 'مدیریت داده‌ها',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'تنظیمات',
      icon: <SettingsIcon className="w-4 h-4" />,
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  ماتریس ساز کالا
                </h1>
                <span className="hidden sm:inline-flex text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-1.5 py-0.5 rounded">
                  آفلاین (IndexedDB)
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                پوشاک کودکان • {allDatabaseCount.toLocaleString('fa-IR')} محصول ثبت‌شده
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'generator') {
                      setEditingProductId(null);
                    }
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => setExcelModalOpen(true)}
              className="text-xs"
            >
              <span className="hidden sm:inline">خروجی</span> اکسل
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={handleNewProductClick}
              className="text-xs font-bold"
            >
              <span className="hidden sm:inline">تولید</span> محصول جدید
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Tabs (Scrollable on small screens) */}
        <div className="md:hidden flex items-center gap-1 py-2 overflow-x-auto border-t border-slate-100">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'generator') setEditingProductId(null);
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
