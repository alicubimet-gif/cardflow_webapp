'use client';

import React from 'react';

export interface DisplayField {
  id: string;
  label: string;
  value: unknown;
}

export interface RecordDetailsGridProps {
  fields: DisplayField[];
  title?: string;
  className?: string;
}

function hasValue(value: unknown) {
  return !(value === null || value === undefined || value === '');
}

export function RecordDetailsGrid({ fields, title, className = '' }: RecordDetailsGridProps) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {title && <h2 className="text-base font-bold text-slate-900">{title}</h2>}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id} className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {field.label}
            </p>
            <p className="mt-1 break-words text-sm font-medium text-slate-900">
              {hasValue(field.value) ? String(field.value) : 'Not provided'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
