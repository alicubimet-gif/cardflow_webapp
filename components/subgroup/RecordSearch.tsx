import React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';

interface RecordSearchProps {
  isOrganization: boolean;
  recordSearch: string;
  setRecordSearch: (val: string) => void;
  recordFilterStatus: string;
  setRecordFilterStatus: (val: string) => void;
}

export function RecordSearch({
  isOrganization,
  recordSearch,
  setRecordSearch,
  recordFilterStatus,
  setRecordFilterStatus
}: RecordSearchProps) {
  const { user } = useAuth();
  const { recordLabel } = useOrgLabels(user?.organization_type);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-2.5 w-full">
      {/* Search Input Container */}
      <div className="relative w-full md:flex-1">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder={`Search ${recordLabel}s...`}
          value={recordSearch}
          onChange={(e) => setRecordSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-3.5 bg-white border border-slate-200/60 focus:border-blue-500 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none transition-colors shadow-xs"
          style={{ paddingLeft: '40px', paddingRight: '14px' }}
        />
      </div>

      {/* Status Filter Dropdown Container */}
      <div className="relative w-full md:w-[200px] shrink-0">
        <select
          value={recordFilterStatus}
          onChange={(e) => setRecordFilterStatus(e.target.value)}
          className="w-full h-11 pl-4 pr-10 bg-white border border-slate-200/60 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none appearance-none cursor-pointer transition-colors text-center shadow-xs"
          style={{ textAlignLast: 'center' }}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="correction_required">Correction Required</option>
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}
