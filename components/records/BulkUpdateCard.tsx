'use client';

import React from 'react';
import { RefreshCw, FileSpreadsheet, Upload } from 'lucide-react';

export interface BulkUpdateCardProps {
  recordLabelPlural: string;
  onDownloadUpdateTemplate: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
  fileSizeFormatted?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function BulkUpdateCard({
  recordLabelPlural,
  onDownloadUpdateTemplate,
  onFileSelect,
  selectedFile,
  fileSizeFormatted,
  disabled = false,
  disabledReason,
}: BulkUpdateCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between ${disabled ? 'opacity-60 bg-slate-50' : ''}`}>
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <RefreshCw size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Update Existing Records</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Bulk {recordLabelPlural} Update</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-600 leading-relaxed">
          {disabled && disabledReason
            ? disabledReason
            : `Download template with existing ${recordLabelPlural.toLowerCase()} and re-upload to batch update.`}
        </p>

        <button
          type="button"
          disabled={disabled}
          onClick={onDownloadUpdateTemplate}
          className="mt-3 h-9 w-full rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet size={15} />
          <span>Download Update Template</span>
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Upload Updated Template
        </label>
        {!selectedFile ? (
          <label
            htmlFor="bulk-update-file-input"
            className={`flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition ${
              disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/40'
            }`}
          >
            <Upload className="h-4 w-4 shrink-0 text-blue-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800">Upload Updated Template</p>
              <p className="text-[10px] text-slate-400 font-medium">XLSX, XLS or CSV</p>
            </div>
            <span className="text-xs font-semibold text-blue-600">Browse</span>
          </label>
        ) : (
          <label
            htmlFor="bulk-update-file-input"
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-blue-300 bg-blue-50/60 px-3.5 py-3"
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-blue-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              {fileSizeFormatted && (
                <p className="text-[10px] text-slate-500 font-medium">{fileSizeFormatted}</p>
              )}
            </div>
            <span className="shrink-0 text-xs font-semibold text-blue-600">Change</span>
          </label>
        )}
        <input
          id="bulk-update-file-input"
          type="file"
          disabled={disabled}
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={onFileSelect}
        />
      </div>
    </div>
  );
}
