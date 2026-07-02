'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { ToastContext, Toast, ToastType } from './ToastContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = (toastId++).toString();
    setToasts((prev) => {
      // Keep max 4 toasts
      const next = [...prev, { id, message, type, duration }];
      if (next.length > 4) return next.slice(1);
      return next;
    });

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 w-80 rounded-2xl shadow-xl animate-in slide-in-from-right-8 fade-in duration-300 ${
              t.type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' :
              t.type === 'error' ? 'bg-rose-50 text-rose-900 border border-rose-200' :
              t.type === 'warning' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
              'bg-blue-50 text-blue-900 border border-blue-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <p className="flex-1 text-sm font-medium pt-0.5">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
