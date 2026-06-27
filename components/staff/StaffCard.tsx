import React from 'react';
import { Mail, Phone, Edit, KeyRound, Eye, UserMinus, UserCheck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface StaffCardProps {
  staff: any;
  onView: (st: any) => void;
  onEdit: (st: any) => void;
  onResetPassword: (st: any) => void;
  onToggleStatus: (id: string, currentStatus: boolean, name: string) => Promise<void>;
  assignmentsCount: number;
}

export function StaffCard({
  staff,
  onView,
  onEdit,
  onResetPassword,
  onToggleStatus,
  assignmentsCount
}: StaffCardProps) {
  const name = staff.name || staff.full_name || 'Staff Member';
  const email = staff.email || staff.email_address || '—';
  const phone = staff.phone || '—';
  const isActive = staff.status === 'active' || staff.is_active;

  const handleStatusClick = () => {
    onToggleStatus(staff.id, isActive, name);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs hover:shadow-2xs transition-all flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Header Block */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold uppercase text-xs shrink-0" style={{ fontFamily: 'Sora' }}>
              {name.slice(0, 2)}
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs tracking-tight">
                {name}
              </h4>
              <div className="mt-1">
                <StatusBadge status={isActive} />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-[11px] font-semibold text-slate-600 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <Mail size={12} className="text-slate-450 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-slate-455 shrink-0" />
            <span>{phone}</span>
          </div>
        </div>

        {/* Assigned Areas Count Block */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <span>Assigned Areas:</span>
          <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
            {assignmentsCount} {assignmentsCount === 1 ? 'Area' : 'Areas'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onView(staff)}
          className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 border border-slate-150"
          title="View Details"
        >
          <Eye size={12} />
          <span>View</span>
        </button>

        <button
          onClick={() => onEdit(staff)}
          className="py-2 px-3 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-750 text-[10px] font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 border border-indigo-100"
          title="Edit Profile"
        >
          <Edit size={12} />
          <span>Edit</span>
        </button>

        <button
          onClick={() => onResetPassword(staff)}
          className="py-2 px-3 bg-blue-50/50 hover:bg-blue-50 text-blue-750 text-[10px] font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 border border-blue-100"
          title="Reset Password"
        >
          <KeyRound size={12} />
          <span>Reset</span>
        </button>

        <button
          onClick={handleStatusClick}
          className={`py-2 px-3 text-[10px] font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 border ${
            isActive 
              ? 'bg-rose-50/50 hover:bg-rose-50 text-rose-750 border-rose-100' 
              : 'bg-emerald-50/50 hover:bg-emerald-50 text-emerald-750 border-emerald-100'
          }`}
          title={isActive ? 'Deactivate Account' : 'Activate Account'}
        >
          {isActive ? (
            <>
              <UserMinus size={12} />
              <span>Deactivate</span>
            </>
          ) : (
            <>
              <UserCheck size={12} />
              <span>Activate</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
