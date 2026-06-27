import React from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageTitle({ title, subtitle, className = '' }: PageTitleProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-xs font-semibold text-slate-500">{subtitle}</p>}
    </div>
  );
}
