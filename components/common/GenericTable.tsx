import React from 'react';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { DataTable } from '../ui/DataTable';

interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface GenericTableProps<T> {
  title: string;
  subtitle?: string;
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  searchPlaceholder?: string;
  searchVal: string;
  onSearchChange: (val: string) => void;
  onAddClick?: () => void;
  addLabel?: string;
  onEditClick?: (item: T) => void;
  onDeleteClick?: (item: T) => void;
  onViewClick?: (item: T) => void;
  emptyMessage?: string;
}

export function GenericTable<T>({
  title,
  subtitle,
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Search...',
  searchVal,
  onSearchChange,
  onAddClick,
  addLabel = 'Add',
  onEditClick,
  onDeleteClick,
  onViewClick,
  emptyMessage,
}: GenericTableProps<T>) {
  const allColumns = [...columns];
  if (onEditClick || onDeleteClick || onViewClick) {
    allColumns.push({
      header: 'Actions',
      className: 'text-right w-24',
      accessor: (item: T) => (
        <div className="flex items-center justify-end gap-2">
          {onViewClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewClick(item);
              }}
              className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <Eye size={14} />
            </button>
          )}
          {onEditClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(item);
              }}
              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
            >
              <Edit2 size={14} />
            </button>
          )}
          {onDeleteClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(item);
              }}
              className="p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Sora' }}>
            {title}
          </h1>
          {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchVal}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <Plus size={14} />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      <DataTable
        data={data}
        columns={allColumns}
        keyExtractor={keyExtractor}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
