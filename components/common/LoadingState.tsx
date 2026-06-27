import React from 'react';

interface LoadingStateProps {
  variant?: 'skeleton' | 'spinner' | 'table';
  rows?: number;
  className?: string;
}

export function LoadingState({
  variant = 'skeleton',
  rows = 3,
  className = ''
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-9 bg-slate-700 rounded-lg animate-pulse w-1/4"></div>
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="h-10 bg-slate-50 border-b border-slate-200"></div>
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="h-14 border-b border-slate-100 flex items-center px-6 justify-between gap-4 animate-pulse">
              <div className="h-4 bg-slate-700 rounded-sm w-1/3"></div>
              <div className="h-4 bg-slate-700 rounded-sm w-1/4"></div>
              <div className="h-4 bg-slate-700 rounded-sm w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 border border-slate-150 rounded-2xl bg-white shadow-3xs flex items-center justify-between animate-pulse"
        >
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-slate-700 rounded-sm w-1/3"></div>
            <div className="h-6 bg-slate-700 rounded-sm w-1/2"></div>
          </div>
          <div className="w-10 h-10 bg-slate-700 rounded-xl"></div>
        </div>
      ))}
    </div>
  );
}
