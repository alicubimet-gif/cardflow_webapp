import React from 'react';
import { User, Eye } from 'lucide-react';
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">Recent Records</h3>
        <span className="text-[11px] text-slate-400 font-semibold">Last 5</span>
      </div>

      {recentRecords.length > 0 ? (
        <div className="flex flex-col gap-3">
          {recentRecords.map((rec) => {
            const name = rec.name || rec.full_name || rec.student_name || rec.employee_name || 'Roster';
            const orgField1 = isSchool ? (rec.class_name || 'Class') : (rec.branch_name || 'Branch');
            const orgField2 = isSchool ? (rec.division_name || 'Division') : (rec.department_name || 'Department');
            const status = rec.approval_status || 'draft';
            const photoUrl = rec.photoUrl || rec.profile_photo || rec.photo || '';
            const idNumber = rec.admission_number || rec.employee_id || '—';

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl p-4 flex items-center gap-4"
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}
              >
                {/* Photo */}
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    className="w-12 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                  />
                ) : (
                  <div className="w-12 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <User size={20} className="text-slate-400" />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{idNumber}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                    {orgField1} — {orgField2}
                  </p>
                </div>

                {/* Badge + action */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={status} />
                  <button
                    onClick={() => onViewRecord(rec)}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <Eye size={12} />
                    View
                  </button>
                </div>
              </div>
            );
          })}
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
