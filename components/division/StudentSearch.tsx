import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface StudentSearchProps {
  isSchool: boolean;
  recordSearch: string;
  setRecordSearch: (val: string) => void;
  recordFilterStatus: string;
  setRecordFilterStatus: (val: string) => void;
}

export function StudentSearch({
  isSchool,
  recordSearch,
  setRecordSearch,
  recordFilterStatus,
  setRecordFilterStatus
}: StudentSearchProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
      {/* Search Input Container */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder={isSchool ? "Search Student..." : "Search Employee..."}
          value={recordSearch}
          onChange={(e) => setRecordSearch(e.target.value)}
          className="w-full h-[48px] pl-11 pr-4 bg-white border border-[#DFE4EA] focus:border-[#2563EB] rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
      </div>

      {/* Status Filter Dropdown Container */}
      <div className="relative min-w-full md:min-w-[200px]">
        <select
          value={recordFilterStatus}
          onChange={(e) => setRecordFilterStatus(e.target.value)}
          className="w-full h-[48px] pl-4 pr-10 bg-white border border-[#DFE4EA] focus:border-[#2563EB] rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer transition-all"
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
