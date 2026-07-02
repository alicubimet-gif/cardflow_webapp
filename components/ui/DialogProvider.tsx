'use client';

import { useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { DialogContext, DialogOptions, AlertDialogOptions, PromptDialogOptions } from './DialogContext';
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';

export function DialogProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<{ options: DialogOptions; resolve: (val: boolean) => void } | null>(null);
  const [alertState, setAlertState] = useState<{ options: AlertDialogOptions; resolve: () => void } | null>(null);
  const [promptState, setPromptState] = useState<{ options: PromptDialogOptions; resolve: (val: string | null) => void } | null>(null);

  const [promptValue, setPromptValue] = useState('');

  const confirm = useCallback((options: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const alertMsg = useCallback((options: AlertDialogOptions) => {
    return new Promise<void>((resolve) => {
      setAlertState({ options, resolve });
    });
  }, []);

  const promptMsg = useCallback((options: PromptDialogOptions) => {
    setPromptValue(options.defaultValue || '');
    return new Promise<string | null>((resolve) => {
      setPromptState({ options, resolve });
    });
  }, []);

  const closeConfirm = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  const closeAlert = () => {
    if (alertState) {
      alertState.resolve();
      setAlertState(null);
    }
  };

  const closePrompt = (result: string | null) => {
    if (promptState) {
      promptState.resolve(result);
      setPromptState(null);
      setPromptValue('');
    }
  };

  // Focus trap and escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmState) closeConfirm(false);
        if (alertState) closeAlert();
        if (promptState) closePrompt(null);
      }
    };
    if (confirmState || alertState || promptState) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [confirmState, alertState, promptState]);

  return (
    <DialogContext.Provider value={{ confirm, alert: alertMsg, prompt: promptMsg }}>
      {children}
      
      {/* Confirm Dialog */}
      {confirmState && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmState.options.title}</h3>
              <p className="text-slate-600 text-sm mb-4">{confirmState.options.message}</p>
              {confirmState.options.detail && (
                <p className="text-slate-500 text-xs mb-4">{confirmState.options.detail}</p>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => closeConfirm(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                {confirmState.options.cancelText || 'Cancel'}
              </button>
              <button
                onClick={() => closeConfirm(true)}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors ${
                  confirmState.options.variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' :
                  confirmState.options.variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmState.options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      {alertState && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                {alertState.options.variant === 'error' && <AlertCircle className="w-6 h-6 text-rose-600" />}
                {alertState.options.variant === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-600" />}
                {alertState.options.variant === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                {(!alertState.options.variant || alertState.options.variant === 'info') && <Info className="w-6 h-6 text-blue-600" />}
                <h3 className="text-lg font-bold text-slate-900">{alertState.options.title}</h3>
              </div>
              <p className="text-slate-600 text-sm">{alertState.options.message}</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={closeAlert}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
              >
                {alertState.options.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Dialog */}
      {promptState && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">{promptState.options.title}</h3>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">{promptState.options.label}</label>
                <textarea
                  autoFocus
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={promptState.options.placeholder}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (promptValue.trim()) closePrompt(promptValue.trim());
                    }
                  }}
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => closePrompt(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                {promptState.options.cancelText || 'Cancel'}
              </button>
              <button
                onClick={() => closePrompt(promptValue.trim())}
                disabled={!promptValue.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promptState.options.confirmText || 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
