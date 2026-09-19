import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftElement, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 select-none">
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {rightElement && (
            <div className="absolute right-3 flex items-center pointer-events-none text-slate-400">
              {rightElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-100 disabled:text-slate-400 ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
            } ${rightElement ? 'pr-9' : ''} ${leftElement ? 'pl-9' : ''} ${className}`}
            {...props}
          />
          {leftElement && (
            <div className="absolute left-3 flex items-center text-slate-400">
              {leftElement}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-slate-500">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
