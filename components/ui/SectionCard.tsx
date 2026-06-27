import React from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  subtitle,
  children,
  headerActions,
  className = ''
}: SectionCardProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-3xs p-6 space-y-6 ${className}`}>
      {(title || subtitle || headerActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5">
          <div className="space-y-0.5">
            {title && <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-2 self-start sm:self-center">{headerActions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
