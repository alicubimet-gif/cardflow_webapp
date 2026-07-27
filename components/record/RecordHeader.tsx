'use client';

import React from 'react';
import { UserRound, Loader2 } from 'lucide-react';
import { RecordStatusBadge } from './RecordStatusBadge';

export interface RecordHeaderProps {
  recordName: string;
  recordTypeLabel: string;
  groupLabel: string;
  subgroupLabel: string;
  hasGroupInfo?: boolean;
  photoUrl?: string | null;
  photoUploading?: boolean;
  status?: string;
  actionButtons?: React.ReactNode;
  className?: string;
}

export function RecordHeader({
  recordName,
  recordTypeLabel,
  groupLabel,
  subgroupLabel,
  hasGroupInfo = true,
  photoUrl,
  photoUploading = false,
  status,
  actionButtons,
  className = '',
}: RecordHeaderProps) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Photo / Avatar */}
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${recordName} profile`}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound className="h-10 w-10 text-slate-500" />
          )}
          {photoUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Record Info & Actions */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {recordTypeLabel}
          </p>

          <h1 className="mt-1 break-words text-xl font-bold text-slate-900 sm:text-2xl">
            {recordName}
          </h1>

          {hasGroupInfo && (
            <p className="mt-1.5 text-sm text-slate-500 font-medium">
              {groupLabel} – {subgroupLabel}
            </p>
          )}

          <div className="mt-3">
            <RecordStatusBadge status={status} />
          </div>

          {actionButtons && <div className="mt-4">{actionButtons}</div>}
        </div>
      </div>
    </section>
  );
}
