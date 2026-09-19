import React from 'react';
import { useUiStore } from '../../stores/ui-store.ts';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-200 bg-white text-slate-800',
          error: 'border-rose-200 bg-white text-slate-800',
          warning: 'border-amber-200 bg-white text-slate-800',
          info: 'border-blue-200 bg-white text-slate-800',
        };

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all duration-200 ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="grow text-xs leading-relaxed">
              {toast.title && <div className="font-bold mb-0.5 text-slate-900">{toast.title}</div>}
              <div>{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
              aria-label="بستن پیام"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
