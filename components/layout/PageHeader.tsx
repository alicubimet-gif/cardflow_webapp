import React from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface PageHeaderProps {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function PageHeader({ loading, error, onRefresh }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Loading bar */}
      {loading && (
        <div className="rounded-2xl bg-white border border-[#DFE4EA] p-4 flex items-center justify-between shadow-3xs">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
            <span className="text-sm font-medium text-[#64748B]">Syncing with server…</span>
          </div>
          <button onClick={onRefresh} className="p-1 text-[#64748B] hover:bg-slate-100 rounded-lg cursor-pointer">
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* Error bar */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Sync Error</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
          <button onClick={onRefresh} className="text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg cursor-pointer">
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
