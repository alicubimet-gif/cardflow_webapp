import React from 'react';
import { PlusCircle, Users, FileText, FolderOpen } from 'lucide-react';

interface DashboardActionsProps {
  onAddRecord: () => void;
  onNavigateTab: (tab: any) => void;
  isAdmin: boolean;
}

export function DashboardActions({
  onAddRecord,
  onNavigateTab,
  isAdmin
}: DashboardActionsProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-4">
      <h3 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">
        Quick Action Controls
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onAddRecord}
          className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-150 hover:bg-blue-50/50 hover:border-blue-200 text-slate-800 hover:text-blue-700 transition-all cursor-pointer text-center space-y-2 group shadow-3xs"
        >
          <PlusCircle size={20} className="text-blue-500 group-hover:scale-105 transition-transform" />
          <span className="text-[10px] font-extrabold uppercase tracking-wide">Add Record</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => onNavigateTab('staff')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-150 hover:bg-blue-50/50 hover:border-blue-200 text-slate-800 hover:text-blue-700 transition-all cursor-pointer text-center space-y-2 group shadow-3xs"
          >
            <Users size={20} className="text-blue-500 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-extrabold uppercase tracking-wide">Staff Access</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => onNavigateTab('logs')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-150 hover:bg-blue-50/50 hover:border-blue-200 text-slate-800 hover:text-blue-700 transition-all cursor-pointer text-center space-y-2 group shadow-3xs"
          >
            <FileText size={20} className="text-blue-500 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-extrabold uppercase tracking-wide">Audit Logs</span>
          </button>
        )}

        <button
          onClick={() => onNavigateTab('records')}
          className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-150 hover:bg-blue-50/50 hover:border-blue-200 text-slate-800 hover:text-blue-700 transition-all cursor-pointer text-center space-y-2 group shadow-3xs"
        >
          <FolderOpen size={20} className="text-blue-500 group-hover:scale-105 transition-transform" />
          <span className="text-[10px] font-extrabold uppercase tracking-wide">View Roster</span>
        </button>
      </div>
    </div>
  );
}
export type DashboardActionsType = typeof DashboardActions;
