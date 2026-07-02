import React from 'react';
import { User, ShieldCheck, Edit, Trash2, ArrowUpCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface RecordCardProps {
  record: any;
  isSchool: boolean;
  onView: (rec: any) => void;
  onEdit?: (rec: any) => void;
  onDelete?: (id: string) => void;
  onSubmit?: (id: string) => void;
  isAdmin: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCorrection?: (id: string) => void;
  onUpdatePhoto?: (rec: any) => void;
}

export function RecordCard({
  record,
  isSchool,
  onView,
  onEdit,
  onDelete,
  onSubmit,
  isAdmin,
  onApprove,
  onReject,
  onCorrection,
  onUpdatePhoto
}: RecordCardProps) {
  const name = record.name || record.full_name || record.student_name || record.employee_name || 'Roster Record';
  const subType = isSchool ? 'Student' : 'Employee';
  const orgField1 = isSchool ? (record.class_name || 'Class') : (record.branch_name || 'Branch');
  const orgField2 = isSchool ? (record.division_name || 'Division') : (record.department_name || 'Department');
  const status = record.approval_status || 'draft';
  const photoUrl = record.photoUrl || record.profile_photo || record.photo || '';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4 hover:shadow-2xs transition-shadow">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={name} 
              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-450 shrink-0">
              <User size={18} />
            </div>
          )}
          <div>
            <h4 className="font-extrabold text-slate-900 text-xs tracking-tight">{name}</h4>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">{subType} Record</span>
          </div>
        </div>
        
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <div>
          <span className="text-slate-400 text-[9px] block">Grouping Binding</span>
          <span className="text-slate-800 font-extrabold block mt-0.5 truncate">{orgField1} - {orgField2}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[9px] block">Identifier</span>
          <span className="text-slate-800 font-extrabold block mt-0.5 truncate">{record.admission_number || record.employee_id || '—'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        {!isAdmin ? (
          <div className="space-y-2">
            <button
              onClick={() => onView(record)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>👁</span>
              <span>View Card</span>
            </button>
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(record)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                >
                  <span>✏</span>
                  <span>Edit Details</span>
                </button>
              )}
              {onUpdatePhoto && (
                <button
                  onClick={() => onUpdatePhoto(record)}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                >
                  <span>📷</span>
                  <span>Update Photo</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => onView(record)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              View Card Details
            </button>

            {/* Action Triggers based on status and role */}
            <div className="flex gap-2">
              {isAdmin && status === 'pending' && (
                <>
                  {onApprove && (
                    <button
                      onClick={() => onApprove(record.id)}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <ShieldCheck size={12} />
                      <span>Approve</span>
                    </button>
                  )}
                  {onReject && (
                    <button
                      onClick={() => onReject(record.id)}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Trash2 size={12} />
                      <span>Reject</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
export type RecordCardType = typeof RecordCard;
