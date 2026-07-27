'use client';

import React from 'react';

export interface RecordTemplateInfoProps {
  templateName?: string | null;
  templateId?: string | null;
  resolutionLevel?: string | null;
  hasTemplate?: boolean;
  fieldsCount?: number;
  className?: string;
}

export function RecordTemplateInfo({
  templateName,
  templateId,
  resolutionLevel,
  hasTemplate = true,
  fieldsCount,
  className = '',
}: RecordTemplateInfoProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="text-sm font-bold text-slate-900">Card Template Information</h3>
      {hasTemplate ? (
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Template Name</span>
            <span className="font-semibold text-slate-900">{templateName || templateId || 'Default Template'}</span>
          </div>
          {resolutionLevel && (
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Assignment Level</span>
              <span className="font-semibold text-slate-900 capitalize">{resolutionLevel}</span>
            </div>
          )}
          {typeof fieldsCount === 'number' && (
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Total Dynamic Fields</span>
              <span className="font-semibold text-slate-900">{fieldsCount}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500 italic">No template is linked to this subgroup or record.</p>
      )}
    </div>
  );
}
