import React from 'react';
import { Users, Upload, Plus, Download } from 'lucide-react';

interface SubgroupActionsProps {
  isAdmin: boolean;
  onAssignUser: () => void;
  onBulkUpload: () => void;
  onAddRecord: () => void;
  onExport: () => void;
}

export function SubgroupActions({
  isAdmin,
  onAssignUser,
  onBulkUpload,
  onAddRecord,
  onExport
}: SubgroupActionsProps) {
    return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-[12px] w-full">
      {isAdmin && (
        <button
          onClick={onAssignUser}
          className="w-full lg:w-auto lg:px-6 h-[48px] border border-[#DFE4EA] text-[#0B0F19] hover:bg-slate-50 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Users size={16} />
          <span>Assign User</span>
        </button>
      )}
      <button
        onClick={onBulkUpload}
        className="w-full lg:w-auto lg:px-6 h-[48px] bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
      >
        <Upload size={16} />
        <span>Bulk Upload</span>
      </button>
      <button
        onClick={onExport}
        className="w-full lg:w-auto lg:px-6 h-[48px] border border-[#DFE4EA] text-[#0B0F19] hover:bg-slate-50 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
      >
        <Download size={16} />
        <span>Export</span>
      </button>
      <button
        onClick={onAddRecord}
        className={`w-full lg:w-auto lg:px-6 h-[48px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 ${
          isAdmin ? 'sm:col-span-2 lg:col-span-1' : ''
        }`}
      >
        <Plus size={16} />
        <span>Add {'Record'}</span>
      </button>
    </div>
  );
}
