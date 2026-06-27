import React from 'react';
import { SearchBar } from '@/components/ui/SearchBar';

interface RecordFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
}

export function RecordFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}: RecordFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between w-full">
      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search by name, roll ID or employee number..."
        className="flex-1"
      />
      
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-3xs"
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="pending">Pending Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="correction_required">Correction Required</option>
      </select>
    </div>
  );
}
export type RecordFiltersType = typeof RecordFilters;
