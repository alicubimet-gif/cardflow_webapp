import React from 'react';
import { Calendar } from 'lucide-react';

interface PageHeaderProps {
  user: {
    name: string;
    organization_name?: string;
    organization_type?: string;
  };
  className?: string;
}

export function PageHeader({ user, className = '' }: PageHeaderProps) {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-3xs relative overflow-hidden ${className}`}>
      {/* Decorative gradient overlay */}
      <div className="absolute top-[-50%] right-[-10%] w-[45%] h-[200%] rounded-full bg-blue-50/50 blur-[120px] pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50/75 px-2.5 py-0.5 rounded-md">
              {user.organization_type || 'Institution'} Binding
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, <span className="text-blue-600 font-black">{user.name}</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Institutional Hub: <span className="text-slate-700 font-bold">{user.organization_name || 'Linked Corporate Org'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-slate-600 text-xs font-bold self-start sm:self-center shadow-3xs">
          <Calendar size={14} className="text-blue-500" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
