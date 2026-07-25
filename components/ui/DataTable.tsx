import React from 'react';

interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No records found.',
  onRowClick
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white shadow-3xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {columns.map((col, idx) => (
              <th key={idx} className={`py-3.5 px-6 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
          {data.length > 0 ? (
            data.map((item) => (
              <tr 
                key={keyExtractor(item)}
                onClick={() => onRowClick && onRowClick(item)}
                className={`transition-colors ${onRowClick ? 'hover:bg-slate-50/70 cursor-pointer' : 'hover:bg-slate-50/40'}`}
              >
                {columns.map((col, idx) => {
                  let cellContent: React.ReactNode = null;
                  if (col.accessor) {
                    if (typeof col.accessor === 'function') {
                      cellContent = col.accessor(item);
                    } else {
                      cellContent = item[col.accessor] as any;
                    }
                  }
                  return (
                    <td key={idx} className={`py-4 px-6 align-middle ${col.className || ''}`}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td 
                colSpan={columns.length} 
                className="py-12 text-center text-xs text-slate-400 italic font-medium bg-slate-50/10"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
