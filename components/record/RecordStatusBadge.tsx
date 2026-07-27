'use client';

import React from 'react';

export interface RecordStatusBadgeProps {
  status?: string;
  className?: string;
}

export function isRecordApproved(record: any): boolean {
  if (!record) return false;
  const statusStr = String(
    record.status ||
    record.approval_status ||
    record.approvalStatus ||
    ''
  ).toLowerCase();
  return statusStr === 'approved' || statusStr === 'verified' || record.is_approved === true || Boolean(record.approvedAt || record.approved_at);
}

export function RecordStatusBadge({ status, className = '' }: RecordStatusBadgeProps) {
  const cleanStatus = String(status || 'draft').toLowerCase().replace(/\s+/g, '_');
  let statusClass = 'bg-slate-100 text-slate-600';
  let label = status || 'Draft';

  if (cleanStatus === 'pending_review' || cleanStatus === 'pending' || cleanStatus === 'awaiting_approval') {
    statusClass = 'bg-amber-100 text-amber-700';
    label = 'Pending';
  } else if (cleanStatus === 'approved' || cleanStatus === 'verified') {
    statusClass = 'bg-emerald-100 text-emerald-700';
    label = 'Approved';
  } else if (cleanStatus === 'rejected') {
    statusClass = 'bg-red-100 text-red-700';
    label = 'Rejected';
  } else if (cleanStatus === 'draft') {
    statusClass = 'bg-slate-100 text-slate-600';
    label = 'Draft';
  }

  return (
    <span className={`inline-flex h-6 items-center rounded-md px-2 text-[10px] font-semibold uppercase tracking-wide ${statusClass} ${className}`}>
      {label}
    </span>
  );
}
