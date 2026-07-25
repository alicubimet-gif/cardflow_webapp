import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

export interface ConfirmEditApprovedRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmEditApprovedRecordModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmEditApprovedRecordModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!hasChecked) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      const errorText =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        'An error occurred. Please try again.';
      setErrorMsg(errorText);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-[16px] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-t-[6px] border-amber-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            Edit Approved Record?
          </h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 font-medium">
            This record has already been approved.
          </p>
          <p className="text-sm text-slate-600">
            If you edit this record, the previous approval will no longer be valid
            and the record must be submitted for approval again.
          </p>

          <label className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50 rounded-xl cursor-pointer hover:bg-amber-100/50 transition-colors">
            <div className="pt-0.5">
              <input
                type="checkbox"
                checked={hasChecked}
                onChange={(e) => setHasChecked(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
              />
            </div>
            <span className="text-sm font-semibold text-amber-900">
              I understand that editing this record will require approval again.
            </span>
          </label>

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasChecked || isProcessing}
            className="flex items-center justify-center min-w-[140px] px-4 py-2 text-sm font-bold text-white bg-amber-500 border border-transparent rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              'Continue Editing'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
