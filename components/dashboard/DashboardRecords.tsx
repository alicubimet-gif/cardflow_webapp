import React from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { FolderOpen } from 'lucide-react';

interface DashboardRecordsProps {
  records: any[];
  isSchool: boolean;
  onViewRecord: (rec: any) => void;
}

export function DashboardRecords({
  records,
  isSchool,
  onViewRecord
}: DashboardRecordsProps) {
  const recentRecords = (records || []).slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest">
          Recently Logged Records
        </h3>
        <span className="text-[10px] font-bold text-slate-400">Showing latest 5</span>
      </div>

      {recentRecords.length > 0 ? (
        <div className="overflow-x-auto border border-slate-150 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">{isSchool ? 'Class / Division' : 'Branch / Dept'}</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {recentRecords.map((rec) => {
                const name = rec.name || rec.full_name || rec.student_name || rec.employee_name || 'Roster';
                const orgField1 = isSchool ? (rec.class_name || 'Class') : (rec.branch_name || 'Branch');
                const orgField2 = isSchool ? (rec.division_name || 'Division') : (rec.department_name || 'Department');
                const status = rec.approval_status || 'draft';
                
                return (
                  <tr key={rec.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{orgField1} - {orgField2}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewRecord(rec)}
                        className="px-2 py-1 text-[10px] font-extrabold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState 
          title="No records found" 
          description="Create your first roster record to start card printing processes."
          icon={FolderOpen}
        />
      )}
    </div>
  );
}
export type DashboardRecordsType = typeof DashboardRecords;
