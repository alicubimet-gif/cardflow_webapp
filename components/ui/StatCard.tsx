import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'blue' | 'amber' | 'emerald' | 'rose' | 'slate';
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = 'slate',
  className = ''
}: StatCardProps) {
  const styles = {
    blue: {
      bg: 'bg-blue-50/50 border-blue-100/70',
      iconBg: 'bg-blue-500 text-white shadow-xs',
      text: 'text-blue-900',
    },
    amber: {
      bg: 'bg-amber-50/50 border-amber-100/70',
      iconBg: 'bg-amber-500 text-white shadow-xs',
      text: 'text-amber-900',
    },
    emerald: {
      bg: 'bg-emerald-50/50 border-emerald-100/70',
      iconBg: 'bg-emerald-500 text-white shadow-xs',
      text: 'text-emerald-900',
    },
    rose: {
      bg: 'bg-rose-50/50 border-rose-100/70',
      iconBg: 'bg-rose-500 text-white shadow-xs',
      text: 'text-rose-900',
    },
    slate: {
      bg: 'bg-slate-50/60 border-slate-100',
      iconBg: 'bg-slate-550 text-white shadow-xs',
      text: 'text-slate-900',
    }
  };

  const currentStyle = styles[variant] || styles.slate;

  return (
    <div className={`p-5 rounded-2xl border ${currentStyle.bg} flex items-center justify-between shadow-3xs hover:shadow-2xs transition-all duration-300 ${className}`}>
      <div className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 block">
          {label}
        </span>
        <span className={`text-2xl font-black ${currentStyle.text} block`}>
          {value}
        </span>
      </div>
      <div className={`p-3 rounded-xl ${currentStyle.iconBg}`}>
        <Icon size={18} />
      </div>
    </div>
  );
}
