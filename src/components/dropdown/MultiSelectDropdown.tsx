import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X, CheckSquare, Square } from 'lucide-react';

export interface MultiSelectItem {
  id: string;
  name: string;
  code?: string;
  hexCode?: string;
  isActive?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export interface MultiSelectDropdownProps {
  id?: string;
  label: string;
  placeholder?: string;
  items: MultiSelectItem[];
  selectedIds: string[];
  onChange: (newSelectedIds: string[]) => void;
  required?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  error?: string;
  searchPlaceholder?: string;
  badgeColor?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan';
  maxVisibleItems?: number;
  className?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  id,
  label,
  placeholder = 'انتخاب کنید...',
  items = [],
  selectedIds = [],
  onChange,
  required = false,
  disabled = false,
  disabledMessage,
  error,
  searchPlaceholder = 'جستجو در موارد...',
  badgeColor = 'blue',
  maxVisibleItems = 100,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Guarantee all items in the dropdown have strictly UNIQUE titles and IDs
  const uniqueItems = useMemo(() => {
    const seenNames = new Set<string>();
    const seenIds = new Set<string>();
    const result: MultiSelectItem[] = [];

    for (const item of items) {
      if (!item || !item.name) continue;
      const normalizedName = item.name.trim().toLowerCase();
      if (seenIds.has(item.id) || seenNames.has(normalizedName)) {
        continue;
      }
      seenIds.add(item.id);
      seenNames.add(normalizedName);
      result.push(item);
    }
    return result;
  }, [items]);

  // Map for rapid lookup
  const itemMap = useMemo(() => {
    const map = new Map<string, MultiSelectItem>();
    for (const item of uniqueItems) {
      map.set(item.id, item);
    }
    return map;
  }, [uniqueItems]);

  // Selected items objects
  const selectedItems = useMemo(() => {
    return selectedIds
      .map((id) => itemMap.get(id))
      .filter((item): item is MultiSelectItem => Boolean(item));
  }, [selectedIds, itemMap]);

  // Filtered items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return uniqueItems;
    const q = searchQuery.trim().toLowerCase();
    return uniqueItems.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(q);
      const codeMatch = item.code ? item.code.toLowerCase().includes(q) : false;
      return nameMatch || codeMatch;
    });
  }, [uniqueItems, searchQuery]);

  // Display limited subset for ultra-fast rendering when lists are huge (1000+ items)
  const displayItems = useMemo(() => {
    return filteredItems.slice(0, maxVisibleItems);
  }, [filteredItems, maxVisibleItems]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleToggleItem = (itemId: string) => {
    const item = itemMap.get(itemId);
    if (item?.disabled) return;

    if (selectedIds.includes(itemId)) {
      onChange(selectedIds.filter((id) => id !== itemId));
    } else {
      onChange([...selectedIds, itemId]);
    }
  };

  const handleSelectAllFiltered = () => {
    const selectableItems = filteredItems.filter((i) => !i.disabled);
    const filteredIdSet = new Set(selectableItems.map((i) => i.id));
    const newSelected = Array.from(new Set([...selectedIds, ...filteredIdSet]));
    onChange(newSelected);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleRemoveSingle = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== itemId));
  };

  const selectableFilteredItems = useMemo(
    () => filteredItems.filter((i) => !i.disabled),
    [filteredItems]
  );

  const isAllFilteredSelected =
    selectableFilteredItems.length > 0 &&
    selectableFilteredItems.every((item) => selectedIds.includes(item.id));

  // Color schemes
  const colorStyles = {
    blue: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      activeRing: 'border-blue-500 ring-2 ring-blue-100',
      check: 'text-blue-600',
      btn: 'hover:bg-blue-50 text-blue-700',
      rowSelected: 'bg-blue-50/90 text-blue-950 font-semibold',
      boxSelected: 'bg-blue-600 border-blue-600 text-white',
    },
    purple: {
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      activeRing: 'border-purple-500 ring-2 ring-purple-100',
      check: 'text-purple-600',
      btn: 'hover:bg-purple-50 text-purple-700',
      rowSelected: 'bg-purple-50/90 text-purple-950 font-semibold',
      boxSelected: 'bg-purple-600 border-purple-600 text-white',
    },
    emerald: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      activeRing: 'border-emerald-500 ring-2 ring-emerald-100',
      check: 'text-emerald-600',
      btn: 'hover:bg-emerald-50 text-emerald-700',
      rowSelected: 'bg-emerald-50/90 text-emerald-950 font-semibold',
      boxSelected: 'bg-emerald-600 border-emerald-600 text-white',
    },
    amber: {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      activeRing: 'border-amber-500 ring-2 ring-amber-100',
      check: 'text-amber-600',
      btn: 'hover:bg-amber-50 text-amber-700',
      rowSelected: 'bg-amber-50/90 text-amber-950 font-semibold',
      boxSelected: 'bg-amber-600 border-amber-600 text-white',
    },
    rose: {
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      activeRing: 'border-rose-500 ring-2 ring-rose-100',
      check: 'text-rose-600',
      btn: 'hover:bg-rose-50 text-rose-700',
      rowSelected: 'bg-rose-50/90 text-rose-950 font-semibold',
      boxSelected: 'bg-rose-600 border-rose-600 text-white',
    },
    indigo: {
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      activeRing: 'border-indigo-500 ring-2 ring-indigo-100',
      check: 'text-indigo-600',
      btn: 'hover:bg-indigo-50 text-indigo-700',
      rowSelected: 'bg-indigo-50/90 text-indigo-950 font-semibold',
      boxSelected: 'bg-indigo-600 border-indigo-600 text-white',
    },
    cyan: {
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      activeRing: 'border-cyan-500 ring-2 ring-cyan-100',
      check: 'text-cyan-600',
      btn: 'hover:bg-cyan-50 text-cyan-700',
      rowSelected: 'bg-cyan-50/90 text-cyan-950 font-semibold',
      boxSelected: 'bg-cyan-600 border-cyan-600 text-white',
    },
  }[badgeColor];

  return (
    <div id={id} ref={containerRef} className={`w-full flex flex-col gap-1 relative ${className}`}>
      {/* Label (Clean, uniform height, no shifting clear button) */}
      <div className="flex items-center justify-between h-5">
        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1 truncate">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
          <span className="text-[11px] font-normal text-slate-500">
            ({uniqueItems.length} مورد)
          </span>
        </label>
        {selectedIds.length > 0 && (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
            {selectedIds.length} انتخاب
          </span>
        )}
      </div>

      {/* Trigger Button (Fixed height h-10, strictly single-line, continuous inline display) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-10 min-h-[40px] max-h-[40px] px-3 py-1.5 rounded-xl border bg-white text-sm flex items-center justify-between gap-2 text-right transition-all cursor-pointer focus:outline-none ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : error
            ? 'border-rose-300 ring-2 ring-rose-100'
            : isOpen
            ? colorStyles.activeRing
            : 'border-slate-300 hover:border-slate-400 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap grow min-w-0">
          {selectedItems.length === 0 ? (
            <span className="text-slate-400 text-xs truncate">
              {disabled && disabledMessage ? disabledMessage : placeholder}
            </span>
          ) : (
            <div className="flex items-center gap-1.5 overflow-hidden min-w-0 grow">
              <span
                className={`text-[11px] px-2 py-0.5 rounded-md font-bold border flex items-center gap-1 shrink-0 ${colorStyles.badge}`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>{selectedItems.length}</span>
              </span>
              <span className="text-xs text-slate-800 truncate font-medium">
                {selectedItems.map((item) => item.name).join('، ')}
              </span>
            </div>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full z-50 mt-1 w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-80 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/90 flex flex-col gap-2">
            <div className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white pr-8 pl-8 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Action Bar */}
            <div className="flex items-center justify-between text-[11px] px-1 text-slate-600">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                disabled={selectableFilteredItems.length === 0}
                className={`font-medium transition-colors flex items-center gap-1 ${
                  isAllFilteredSelected || selectableFilteredItems.length === 0
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-800 cursor-pointer'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>انتخاب همه مجاز ({selectableFilteredItems.length})</span>
              </button>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-400 hover:text-rose-600 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>عدم انتخاب</span>
                </button>
              )}

              <span className="text-[10px] text-slate-400 font-mono">
                {selectedIds.length} از {items.length}
              </span>
            </div>
          </div>

          {/* Items List */}
          <ul className="overflow-y-auto grow p-1.5 divide-y divide-slate-50 divide-dashed">
            {filteredItems.length === 0 ? (
              <li className="px-4 py-6 text-xs text-center text-slate-400">
                موردی با عبارت «{searchQuery}» پیدا نشد.
              </li>
            ) : (
              displayItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isDisabled = Boolean(item.disabled);

                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                    onClick={() => !isDisabled && handleToggleItem(item.id)}
                    className={`px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                      isDisabled
                        ? 'bg-slate-50/80 text-slate-400 cursor-not-allowed select-none opacity-65'
                        : isSelected
                        ? `${colorStyles.rowSelected} cursor-pointer`
                        : 'text-slate-700 hover:bg-slate-100/70 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* Checkbox */}
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                          isDisabled
                            ? 'border-slate-200 bg-slate-100 text-slate-300'
                            : isSelected
                            ? `${colorStyles.boxSelected} shadow-2xs`
                            : 'border-slate-300 bg-white hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* Color Hex Circle if present */}
                      {item.hexCode && (
                        <span
                          className={`w-4 h-4 rounded-full border border-black/15 shrink-0 shadow-2xs ${
                            isDisabled ? 'opacity-30' : ''
                          }`}
                          style={{ backgroundColor: item.hexCode }}
                          title={item.hexCode}
                        />
                      )}

                      {/* Name */}
                      <span
                        className={`truncate ${
                          isDisabled ? 'line-through text-slate-400 font-normal' : ''
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDisabled && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 font-medium">
                          {item.disabledReason || 'قبلاً استفاده شده'}
                        </span>
                      )}
                      {item.code && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono border border-slate-200/80">
                          {item.code}
                        </span>
                      )}
                      {!isDisabled && isSelected && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-white/90 border border-slate-200 text-slate-700 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3] text-emerald-600" />
                          تیک‌خورده
                        </span>
                      )}
                    </div>
                  </li>
                );
              })
            )}

            {filteredItems.length > maxVisibleItems && (
              <li className="px-3 py-2 text-[11px] text-center text-slate-400 bg-slate-50 rounded-lg mt-1">
                نمایش {maxVisibleItems} مورد از {filteredItems.length} مورد. برای نتایج دقیق‌تر جستجو کنید.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
