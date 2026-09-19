import React, { useEffect, useState } from 'react';
import { seedInitialDataIfNeeded } from './db/seed.ts';
import { useCatalogStore } from './stores/catalog-store.ts';
import { useProductStore } from './stores/product-store.ts';
import { useUiStore } from './stores/ui-store.ts';
import { Navbar } from './components/layout/Navbar.tsx';
import { ToastContainer } from './components/ui/ToastContainer.tsx';
import { ConfirmationModal } from './components/ui/ConfirmationModal.tsx';
import { ExcelExportModal } from './features/export/ExcelExportModal.tsx';

// Views
import { ProductGeneratorView } from './features/product-generator/ProductGeneratorView.tsx';
import { ProductMatrixView } from './features/product-matrix/ProductMatrixView.tsx';
import { ProductListView } from './features/product-list/ProductListView.tsx';
import { CatalogManagementView } from './features/catalog/CatalogManagementView.tsx';
import { SettingsView } from './features/settings/SettingsView.tsx';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { activeTab } = useUiStore();

  useEffect(() => {
    let isMounted = true;

    const initApp = async () => {
      try {
        await seedInitialDataIfNeeded();
        if (!isMounted) return;
        await useCatalogStore.getState().loadAllCatalogData();
        if (!isMounted) return;
        await useProductStore.getState().refreshCount();
        if (!isMounted) return;
        await useProductStore.getState().loadProducts();
      } catch (err) {
        console.error('Failed to initialize local IndexedDB database:', err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initApp();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4 max-w-sm w-full">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white mx-auto flex items-center justify-center animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">ماتریس ساز کالا</h2>
            <p className="text-xs text-slate-500 mt-1">
              در حال آماده‌سازی پایگاه داده آفلاین IndexedDB...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header & Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="grow pb-12">
        {activeTab === 'generator' && <ProductGeneratorView />}
        {activeTab === 'matrix' && <ProductMatrixView />}
        {activeTab === 'products' && <ProductListView />}
        {activeTab === 'catalog' && <CatalogManagementView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Global Modals & Notifications */}
      <ExcelExportModal />
      <ConfirmationModal />
      <ToastContainer />
    </div>
  );
}
