'use client';

import React from 'react';
import { RecordStatusBadge } from './RecordStatusBadge';

export interface RecordInfoPanelProps {
  record: any;
  terminology: {
    recordSingular: string;
    groupSingular: string;
    subgroupSingular: string;
  };
  groupName?: string;
  subgroupName?: string;
  templateName?: string;
  formatDateFn?: (dateStr?: string | null) => string | null;
  className?: string;
}

export function RecordInfoPanel({
  record,
  terminology,
  groupName,
  subgroupName,
  templateName,
  formatDateFn,
  className = '',
}: RecordInfoPanelProps) {
  if (!record) return null;

  const defaultFormatDate = (d?: string | null) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const fmt = formatDateFn || defaultFormatDate;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {terminology.recordSingular} Profile
          </p>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            {record.displayName || record.name || 'Unnamed Record'}
          </h2>
        </div>
        <RecordStatusBadge status={record.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {terminology.groupSingular}
          </span>
          <span className="text-xs font-semibold text-slate-900 mt-0.5 block truncate">
            {groupName || record.groupId || '—'}
          </span>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {terminology.subgroupSingular}
          </span>
          <span className="text-xs font-semibold text-slate-900 mt-0.5 block truncate">
            {subgroupName || record.subgroupId || '—'}
          </span>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Template
          </span>
          <span className="text-xs font-semibold text-slate-900 mt-0.5 block truncate">
            {templateName || record.templateId || '—'}
          </span>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Created
          </span>
          <span className="text-xs font-semibold text-slate-900 mt-0.5 block truncate">
            {fmt(record.createdAt) || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
