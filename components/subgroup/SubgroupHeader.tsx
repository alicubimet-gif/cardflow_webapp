import React from 'react';

import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';

interface SubgroupHeaderProps {
  subgroupName: string;
  groupName: string;
  userCount: number;
  recordsCount: number;
  children?: React.ReactNode;
}

export function SubgroupHeader({
  subgroupName,
  groupName,
  userCount,
  recordsCount,
  children
}: SubgroupHeaderProps) {
  const { user } = useAuth();
  const { groupLabel, subgroupLabel, recordLabel } = useOrgLabels(user?.organization_type);

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs flex flex-col gap-4 w-full animate-in fade-in duration-200">
      {/* 1. Subgroup Info Section */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {subgroupLabel}
        </span>
        <h2 className="text-xl font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Sora' }}>
          {subgroupName}
        </h2>
      </div>

      {/* 2. Parent Group Section */}
      <div className="border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500 block mb-1">
          Parent {groupLabel}:
        </span>
        <span className="text-sm font-semibold text-slate-800 block" style={{ fontFamily: 'Sora' }}>
          {groupName}
        </span>
      </div>

      {/* 3. Stats Row Section */}
      <div className="border-t border-slate-100 pt-4 flex gap-6 text-sm text-slate-500">
        <div>
          Staff: <span className="font-bold text-slate-800 ml-1">{userCount}</span>
        </div>
        <div>
          {recordLabel}s: <span className="font-bold text-slate-800 ml-1">{recordsCount}</span>
        </div>
      </div>

      {/* 4. Actions Section */}
      {children && (
        <div className="border-t border-slate-100 pt-4 w-full">
          {children}
        </div>
      )}
    </div>
  );
}
