import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface CustomDropdownOption {
  value: string | number;
  label: string;
  code?: string;
  badge?: string;
  hexColor?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomDropdownProps {
  id?: string;
  label?: string;
  placeholder?: string;
  options: CustomDropdownOption[];
  value?: string | number;
  onChange: (value: any) => void;
  required?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  error?: string;
  helperText?: string;
  searchable?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  badgeColor?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan';
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  id,
  label,
  placeholder = 'انتخاب کنید...',
  options = [],
  value,
  onChange,
  required = false,
  disabled = false,
  disabledMessage,
  error,
  helperText,
  searchable,
  clearable = false,
  size = 'md',
  className = '',
  badgeColor = 'blue',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLUListElement>(null);

  // Determine if search should be active
  const isSearchEnabled = searchable ?? options.length > 7;

  // Selected option
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === '') return undefined;
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();
    return options.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(q);
      const codeMatch = opt.code ? opt.code.toLowerCase().includes(q) : false;
      const badgeMatch = opt.badge ? opt.badge.toLowerCase().includes(q) : false;
      return labelMatch || codeMatch || badgeMatch;
    });
  }, [options, searchQuery]);

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

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      if (isSearchEnabled) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    } else {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, isSearchEnabled]);

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
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const item = filteredOptions[highlightedIndex];
          if (!item.disabled) {
            onChange(item.value);
            setIsOpen(false);
          }
        }
        break;
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleSelectOption = (option: CustomDropdownOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Size styling
  const sizeStyles = {
    sm: 'min-h-[34px] py-1 px-2.5 text-xs',
    md: 'min-h-[40px] py-2 px-3 text-xs sm:text-sm',
    lg: 'min-h-[46px] py-2.5 px-3.5 text-sm sm:text-base',
  };

  // Color schemes for badge and active states
  const colorMap = {
    blue: {
      activeBg: 'bg-blue-50/90 text-blue-900 font-semibold',
      checkBg: 'bg-blue-600 text-white border-blue-600',
      ring: 'border-blue-500 ring-2 ring-blue-100',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    purple: {
      activeBg: 'bg-purple-50/90 text-purple-900 font-semibold',
      checkBg: 'bg-purple-600 text-white border-purple-600',
      ring: 'border-purple-500 ring-2 ring-purple-100',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    emerald: {
      activeBg: 'bg-emerald-50/90 text-emerald-900 font-semibold',
      checkBg: 'bg-emerald-600 text-white border-emerald-600',
      ring: 'border-emerald-500 ring-2 ring-emerald-100',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    amber: {
      activeBg: 'bg-amber-50/90 text-amber-900 font-semibold',
      checkBg: 'bg-amber-600 text-white border-amber-600',
      ring: 'border-amber-500 ring-2 ring-amber-100',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    rose: {
      activeBg: 'bg-rose-50/90 text-rose-900 font-semibold',
      checkBg: 'bg-rose-600 text-white border-rose-600',
      ring: 'border-rose-500 ring-2 ring-rose-100',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    indigo: {
      activeBg: 'bg-indigo-50/90 text-indigo-900 font-semibold',
      checkBg: 'bg-indigo-600 text-white border-indigo-600',
      ring: 'border-indigo-500 ring-2 ring-indigo-100',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    cyan: {
      activeBg: 'bg-cyan-50/90 text-cyan-900 font-semibold',
      checkBg: 'bg-cyan-600 text-white border-cyan-600',
      ring: 'border-cyan-500 ring-2 ring-cyan-100',
      badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
  };

  const currentTheme = colorMap[badgeColor] || colorMap.blue;

  return (
    <div id={id} ref={containerRef} className={`w-full flex flex-col gap-1 relative ${className}`}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 select-none flex items-center gap-1">
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
          {clearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              پاک کردن
            </button>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full rounded-xl border bg-white flex items-center justify-between gap-2 text-right transition-all cursor-pointer select-none ${
          sizeStyles[size]
        } ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none'
            : error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
            : isOpen
            ? `${currentTheme.ring} shadow-xs`
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/40 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden grow">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {/* Check indicator badge on the selected value */}
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${currentTheme.checkBg} shrink-0`}>
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>

              {/* Visual color circle if present */}
              {selectedOption.hexColor && (
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                  style={{ backgroundColor: selectedOption.hexColor }}
                />
              )}

              {/* Icon if present */}
              {selectedOption.icon && (
                <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
              )}

              {/* Label */}
              <span className="font-semibold text-slate-900 truncate">
                {selectedOption.label}
              </span>

              {/* Code or Badge */}
              {selectedOption.code && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200/80 shrink-0">
                  {selectedOption.code}
                </span>
              )}
              {selectedOption.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${currentTheme.badge}`}>
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate">
              {disabled && disabledMessage ? disabledMessage : placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Helper / Error Text */}
      {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
      {helperText && !error && <span className="text-[11px] text-slate-500">{helperText}</span>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full z-50 mt-1 w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-72 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Search Box */}
          {isSearchEnabled && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/90">
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
                  placeholder="جستجو در گزینه‌ها..."
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white pr-8 pl-8 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 shadow-2xs"
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
            </div>
          )}

          {/* Options List */}
          <ul
            ref={optionsListRef}
            className="overflow-y-auto grow p-1 divide-y divide-slate-50 divide-dashed"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-5 text-xs text-center text-slate-400">
                موردی یافت نشد.
              </li>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected =
                  value !== undefined &&
                  value !== null &&
                  String(option.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={String(option.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(option)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`group px-3 py-2 text-xs rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                      option.disabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-50'
                        : isSelected
                        ? `${currentTheme.activeBg}`
                        : isHighlighted
                        ? 'bg-slate-100/90 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {/* Right side: Checkbox/Check Circle + Color + Name */}
                    <div className="flex items-center gap-2.5 truncate grow">
                      {/* Explicit Checkmark Indicator (تیک دار شدن آیتم هنگام انتخاب) */}
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? `${currentTheme.checkBg} shadow-2xs`
                            : 'border border-slate-300 bg-white group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>

                      {/* Color Hex Circle */}
                      {option.hexColor && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                          style={{ backgroundColor: option.hexColor }}
                        />
                      )}

                      {/* Icon */}
                      {option.icon && (
                        <span className="shrink-0 text-slate-400 group-hover:text-slate-600">
                          {option.icon}
                        </span>
                      )}

                      {/* Label */}
                      <span className="truncate">{option.label}</span>
                    </div>

                    {/* Left side: Code / Badge + Check mark icon */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {option.code && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200/80">
                          {option.code}
                        </span>
                      )}
                      {option.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                          {option.badge}
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
        </div>
      )}
    </div>
  );
};
