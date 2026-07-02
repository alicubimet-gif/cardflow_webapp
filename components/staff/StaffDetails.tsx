import React from 'react';
import { XCircle, Mail, Phone, Calendar, Clock, UserCheck, Shield } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StaffAssignments } from './StaffAssignments';

interface StaffDetailsProps {
  staff: any;
  isOpen: boolean;
  onClose: () => void;
  isSchool: boolean;
  classesList: any[];
  divisionsList: any[];
  branchesList: any[];
  departmentsList: any[];
  onEdit?: (staff: any) => void;
  onDelete?: (id: string) => void;
  onRemoveAssignment: (id: string, name: string) => Promise<void>;
  onOpenAssignClass: () => void;
  onOpenAssignDivision: () => void;
  onOpenAssignBranch: () => void;
  onOpenAssignDepartment: () => void;
  getClassName: (id: string) => string;
  getDivName: (id: string) => string;
  getBranchName: (id: string) => string;
  getDeptName: (id: string) => string;
}

export function StaffDetails({
  staff,
  isOpen,
  onClose,
  isSchool,
  classesList,
  divisionsList,
  branchesList,
  departmentsList,
  onEdit,
  onDelete,
  onRemoveAssignment,
  onOpenAssignClass,
  onOpenAssignDivision,
  onOpenAssignBranch,
  onOpenAssignDepartment,
  getClassName,
  getDivName,
  getBranchName,
  getDeptName
}: StaffDetailsProps) {
  if (!isOpen || !staff) return null;

  const name = staff.name || staff.full_name || 'Staff Member';
  const email = staff.email || staff.email_address || '—';
  const phone = staff.phone || '—';
  const isActive = staff.status === 'active' || staff.is_active;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const dateCreated = formatDate(staff.date_joined || staff.created_at);
  const lastLoginDate = formatDate(staff.last_login);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DFE4EA] flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
              Staff Details
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button 
                type="button" 
                onClick={() => onEdit(staff)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                ✏️ Edit Staff
              </button>
            )}
            {onDelete && (
              <button 
                type="button" 
                onClick={() => onDelete(staff.id)}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                🗑 Delete Staff
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose} 
              className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer ml-1"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Main Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-bold text-lg shrink-0" style={{ fontFamily: 'Sora' }}>
              {name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-slate-900 leading-tight">
                {name}
              </h4>
              <StatusBadge status={isActive} />
            </div>
          </div>

          {/* Details Metadata */}
          <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={12} className="text-slate-400 shrink-0" />
                Email
              </span>
              <span className="text-xs font-semibold text-slate-800">{email}</span>
            </div>
            
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={12} className="text-slate-400 shrink-0" />
                Phone
              </span>
              <span className="text-xs font-semibold text-slate-800">{phone}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-400 shrink-0" />
                Created Date
              </span>
              <span className="text-xs font-semibold text-slate-800">{dateCreated}</span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} className="text-slate-400 shrink-0" />
                Last Login
              </span>
              <span className="text-xs font-semibold text-slate-800">{lastLoginDate}</span>
            </div>
          </div>

          {/* Assignments View & Action */}
          <StaffAssignments
            staff={staff}
            isSchool={isSchool}
            onRemoveAssignment={onRemoveAssignment}
            onOpenAssignClass={onOpenAssignClass}
            onOpenAssignDivision={onOpenAssignDivision}
            onOpenAssignBranch={onOpenAssignBranch}
            onOpenAssignDepartment={onOpenAssignDepartment}
            getClassName={getClassName}
            getDivName={getDivName}
            getBranchName={getBranchName}
            getDeptName={getDeptName}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
