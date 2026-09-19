import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus, Check, X } from 'lucide-react';
import { Modal } from '../ui/Modal.tsx';
import { Input } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { useCatalogStore } from '../../stores/catalog-store.ts';
import { useUiStore } from '../../stores/ui-store.ts';
import type { CatalogItem, CatalogType } from '../../types/index.ts';

interface SearchableDropdownProps {
  label: string;
  placeholder?: string;
  items: CatalogItem[];
  selectedId?: string;
  onSelect: (item?: CatalogItem) => void;
  catalogType?: CatalogType;
  parentId?: string; // For subcategories
  required?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  error?: string;
  allowInlineAdd?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  placeholder = 'انتخاب کنید...',
  items,
  selectedId,
  onSelect,
  catalogType,
  parentId,
  required = false,
  disabled = false,
  disabledMessage,
  error,
  allowInlineAdd = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Inline add form states
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemColorHex, setNewItemColorHex] = useState('#3B82F6');
  const [addFormError, setAddFormError] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLUListElement>(null);

  const { addCatalogItem } = useCatalogStore();
  const { showToast } = useUiStore();

  // Deduplicate items by title and ID so all dropdown options are strictly unique
  const uniqueItems = React.useMemo(() => {
    const seenNames = new Set<string>();
    const seenIds = new Set<string>();
    const result: CatalogItem[] = [];
    for (const item of items) {
      if (!item || !item.name) continue;
      const key = item.name.trim().toLowerCase();
      if (seenIds.has(item.id) || seenNames.has(key)) continue;
      seenIds.add(item.id);
      seenNames.add(key);
      result.push(item);
    }
    return result;
  }, [items]);

  const selectedItem = uniqueItems.find((i) => i.id === selectedId);

  // Filter items based on search query
  const filteredItems = uniqueItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(query);
    const codeMatch = item.code ? item.code.toLowerCase().includes(query) : false;
    return nameMatch || codeMatch;
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight when query or open state changes
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && optionsListRef.current && highlightedIndex >= 0) {
      const activeEl = optionsListRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
          const item = filteredItems[highlightedIndex];
          onSelect(item);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleOpenAddModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setNewItemName('');
    setNewItemCode('');
    setAddFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveNewItem = async () => {
    if (!newItemName.trim()) {
      setAddFormError('نام الزامی است');
      return;
    }
    const cleanName = newItemName.trim().toLowerCase();
    if (items.some((i) => i.name.trim().toLowerCase() === cleanName)) {
      setAddFormError(`عنوان "${newItemName.trim()}" تکراری است. لطفاً عنوان یونیک وارد کنید`);
      return;
    }
    if (!newItemCode.trim()) {
      setAddFormError('کد انگلیسی الزامی است (جهت تولید SKU)');
      return;
    }

    if (catalogType === 'subcategory' && !parentId) {
      setAddFormError('ابتدا باید گروه اصلی را انتخاب کنید');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const now = Date.now();
      const code = newItemCode.trim().toUpperCase();
      const id = `${catalogType || 'item'}-${Date.now()}`;

      const newItem: any = {
        id,
        name: newItemName.trim(),
        code,
        isActive: true,
        sortOrder: items.length + 1,
        createdAt: now,
        updatedAt: now,
      };

      if (catalogType === 'subcategory') {
        newItem.parentId = parentId;
      }
      if (catalogType === 'color') {
        newItem.hexCode = newItemColorHex;
      }

      if (catalogType) {
        await addCatalogItem(catalogType, newItem);
      }

      // Auto-select the newly created item
      onSelect(newItem);

      showToast({
        type: 'success',
        message: `${label} "${newItem.name}" با موفقیت اضافه شد`,
      });

      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to add catalog item:', err);
      setAddFormError('خطا در ذخیره‌سازی داده');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-1.5 relative">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 select-none">
          {label}
          {required && <span className="text-rose-500 mr-1">*</span>}
        </label>
        {selectedItem && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(undefined);
            }}
            className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            پاک کردن
          </button>
        )}
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full min-h-[40px] px-3 py-2 rounded-lg border bg-white text-sm flex items-center justify-between gap-2 text-right transition-colors focus:outline-none focus:ring-2 cursor-pointer ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-100'
            : 'border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-100'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden grow">
          {selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white shrink-0 shadow-2xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              {selectedItem.hexCode && (
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                  style={{ backgroundColor: selectedItem.hexCode }}
                />
              )}
              <span className="font-semibold text-slate-900">{selectedItem.name}</span>
              {selectedItem.code && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200/80">
                  {selectedItem.code}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate">
              {disabled && disabledMessage ? disabledMessage : placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full z-40 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-72 animate-fadeIn"
        >
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="جستجو..."
                className="w-full text-xs rounded-md border border-slate-200 bg-white pr-8 pl-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={optionsListRef}
            className="overflow-y-auto grow p-1 divide-y divide-slate-50"
          >
            {filteredItems.length === 0 ? (
              <li className="px-3 py-4 text-xs text-center text-slate-400">
                موردی یافت نشد
              </li>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = item.id === selectedId;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(item);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`group px-3 py-2 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/90 text-blue-900 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* Explicit Checkmark Indicator */}
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'border border-slate-300 bg-white group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>

                      {item.hexCode && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: item.hexCode }}
                        />
                      )}

                      <span className="truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.code && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200/80">
                          {item.code}
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded-md">
                          انتخاب شده
                        </span>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {/* Inline Add Action Button */}
          {allowInlineAdd && catalogType && (
            <div className="p-1.5 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 font-medium py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن {label} جدید</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inline Add Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={`افزودن ${label} جدید`}
          maxWidth="sm"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                لغو
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubmittingAdd}
                onClick={handleSaveNewItem}
              >
                افزودن
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3.5">
            <Input
              label="نام"
              placeholder={`مثلاً: سبز زیتونی`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              autoFocus
              required
            />
            <Input
              label="کد انگلیسی (برای SKU)"
              placeholder={`مثلاً: OL`}
              value={newItemCode}
              onChange={(e) => setNewItemCode(e.target.value.toUpperCase())}
              required
              helperText="از حروف انگلیسی کوتاه و یکتا استفاده نمایید"
            />
            {catalogType === 'color' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">رنگ بصری</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newItemColorHex}
                    onChange={(e) => setNewItemColorHex(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                  />
                  <span className="text-xs text-slate-600 font-mono">{newItemColorHex}</span>
                </div>
              </div>
            )}
            {addFormError && (
              <div className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-md border border-rose-200">
                {addFormError}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
