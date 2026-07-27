'use client';

import React from 'react';

export interface RecordTimelineProps {
  createdAt?: string | null;
  approvedAt?: string | null;
  serialId?: string | null;
  createdBy?: string | null;
  approvedBy?: string | null;
  formatDateFn?: (dateStr?: string | null) => string | null;
  className?: string;
}

export function RecordTimeline({
  createdAt,
  approvedAt,
  serialId,
  createdBy,
  approvedBy,
  formatDateFn,
  className = '',
}: RecordTimelineProps) {
  const defaultFmt = (d?: string | null) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const fmt = formatDateFn || defaultFmt;

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div>
        <h2 className="text-base font-bold text-slate-900">Metadata Trail</h2>
        <p className="mt-1 text-xs text-slate-500">Administrative tracking information</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 px-3.5 py-3 border border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 block">Created</span>
          <span className="mt-1 text-xs font-semibold text-slate-900 block">{fmt(createdAt) || '—'}</span>
          {createdBy && <span className="text-[10px] text-slate-400 block mt-0.5">By: {createdBy}</span>}
        </div>

        <div className="rounded-xl bg-slate-50 px-3.5 py-3 border border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 block">Updated / Approved</span>
          <span className="mt-1 text-xs font-semibold text-slate-900 block">{fmt(approvedAt) || '—'}</span>
          {approvedBy && <span className="text-[10px] text-slate-400 block mt-0.5">By: {approvedBy}</span>}
        </div>

        <div className="rounded-xl bg-slate-50 px-3.5 py-3 border border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 block">Record Serial ID</span>
          <span className="mt-1 text-xs font-semibold text-slate-900 block truncate">{serialId || '—'}</span>
        </div>
      </div>
    </section>
  );
}
