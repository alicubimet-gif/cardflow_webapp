import React from 'react';
import { FolderOpen, Plus, Upload } from 'lucide-react';

interface EmptyStateProps {
  isSchool: boolean;
  onAddRecord: () => void;
  onBulkUpload: () => void;
}

export function EmptyState({
  isSchool,
  onAddRecord,
  onBulkUpload
}: EmptyStateProps) {
  return (
    <div 
      className="w-full h-[220px] bg-white border border-[#DFE4EA] rounded-[16px] shadow-sm flex flex-col items-center justify-center p-5 text-center animate-in fade-in duration-300"
    >
      <div className="w-12 h-12 bg-slate-50 border border-[#DFE4EA] rounded-xl flex items-center justify-center text-[#64748B] mb-3 shrink-0">
        <FolderOpen size={24} />
      </div>

      <h4 
        className="text-[16px] font-semibold text-[#0B0F19] leading-tight" 
        style={{ fontFamily: 'Sora, sans-serif' }}
      >
        {isSchool ? 'No Student Records' : 'No Employee Records'}
      </h4>
      
      <p className="text-[13px] text-[#64748B] mt-1 mb-4">
        {isSchool 
          ? 'Add students manually or use bulk upload.' 
          : 'Add employees manually or use bulk upload.'}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={onAddRecord}
          className="flex items-center justify-center gap-1.5 px-4 h-[38px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Add Record
        </button>
        <button
          onClick={onBulkUpload}
          className="flex items-center justify-center gap-1.5 px-4 h-[38px] bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Upload size={14} />
          Bulk Upload
        </button>
      </div>
    </div>
  );
}
