import React from 'react';

interface StatusBadgeProps {
  status: string | boolean;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  let text = '';
  let styleClasses = '';

  if (typeof status === 'boolean') {
    text = status ? 'Active' : 'Inactive';
    styleClasses = status
      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
      : 'bg-rose-50 border-rose-100 text-rose-700';
  } else {
    text = status.replace('_', ' ');
    const normalized = status.toLowerCase();
    
    switch (normalized) {
      case 'active':
      case 'approved':
        styleClasses = 'bg-emerald-50 border-emerald-100 text-emerald-700';
        break;
      case 'inactive':
      case 'rejected':
      case 'denied':
        styleClasses = 'bg-rose-50 border-rose-100 text-rose-700';
        break;
      case 'pending':
      case 'pending_review':
        styleClasses = 'bg-amber-50 border-amber-200 text-amber-700';
        break;
      case 'correction':
      case 'correction_required':
        styleClasses = 'bg-blue-50 border-blue-200 text-blue-700';
        break;
      case 'draft':
      default:
        styleClasses = 'bg-slate-50 border-slate-200 text-slate-600';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize whitespace-nowrap shadow-3xs ${styleClasses} ${className}`}>
      {text}
    </span>
  );
}
