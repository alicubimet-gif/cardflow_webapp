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
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-rose-100 text-rose-800';
  } else {
    text = status.replace('_', ' ');
    const normalized = status.toLowerCase();
    
    switch (normalized) {
      case 'active':
      case 'approved':
        styleClasses = 'bg-emerald-100 text-emerald-800';
        break;
      case 'inactive':
      case 'rejected':
      case 'denied':
        styleClasses = 'bg-rose-100 text-rose-800';
        break;
      case 'pending':
      case 'pending_review':
      case 'pending review':
        styleClasses = 'bg-amber-100 text-amber-800';
        break;
      case 'correction':
      case 'correction_required':
      case 'correction required':
        styleClasses = 'bg-blue-100 text-blue-800';
        break;
      case 'draft':
      default:
        styleClasses = 'bg-slate-100 text-slate-800';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-[10px] font-bold capitalize whitespace-nowrap shadow-3xs ${styleClasses} ${className}`}>
      <span>{text}</span>
    </span>
  );
}
