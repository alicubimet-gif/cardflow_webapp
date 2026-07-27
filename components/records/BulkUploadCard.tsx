'use client';

import React from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

export interface BulkUploadCardProps {
  recordLabelPlural: string;
  onDownloadTemplate: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
  fileSizeFormatted?: string;
  disabled?: boolean;
}

export function BulkUploadCard({
  recordLabelPlural,
  onDownloadTemplate,
  onFileSelect,
  selectedFile,
  fileSizeFormatted,
  disabled = false,
}: BulkUploadCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Upload size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Create New Records</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Bulk {recordLabelPlural} Upload</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-600 leading-relaxed">
          Download a blank template for creating new {recordLabelPlural.toLowerCase()} in bulk.
        </p>

        <button
          type="button"
          onClick={onDownloadTemplate}
          className="mt-3 h-9 w-full rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <FileSpreadsheet size={15} />
          <span>Download Upload Template</span>
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Upload Filled Template
        </label>
        {!selectedFile ? (
          <label
            htmlFor="bulk-upload-file-input"
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/40"
          >
            <Upload className="h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800">Upload Filled Template</p>
              <p className="text-[10px] text-slate-400 font-medium">XLSX, XLS or CSV</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600">Browse</span>
          </label>
        ) : (
          <label
            htmlFor="bulk-upload-file-input"
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50/60 px-3.5 py-3"
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              {fileSizeFormatted && (
                <p className="text-[10px] text-slate-500 font-medium">{fileSizeFormatted}</p>
              )}
            </div>
            <span className="shrink-0 text-xs font-semibold text-emerald-600">Change</span>
          </label>
        )}
        <input
          id="bulk-upload-file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={onFileSelect}
        />
      </div>
    </div>
  );
}
