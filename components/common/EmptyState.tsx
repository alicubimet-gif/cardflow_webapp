import React from 'react';
import { HelpCircle, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionButton?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = HelpCircle,
  actionButton,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-slate-200 rounded-2xl bg-white shadow-3xs ${className}`}>
      <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 mb-4 shadow-3xs">
        <Icon size={24} />
      </div>
      <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 font-semibold mt-1 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {actionButton && <div className="mt-5">{actionButton}</div>}
    </div>
  );
}
