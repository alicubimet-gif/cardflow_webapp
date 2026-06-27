import React from 'react';
import { Calendar, Building2, Upload, GraduationCap, FolderOpen, FileText } from 'lucide-react';
import { WebAppUser } from '@/context/auth-context';

interface DashboardCardsProps {
  user: WebAppUser;
  orgName: string;
  isSchool: boolean;
  recordsList: any[];
  logsList: any[];
  loading: boolean;
  onNavigateToSetup: (tab: any) => void;
  onOpenBulkUpload: () => void;
  onOpenViewRecord: (record: any) => void;
  hasTemplate?: boolean;
}

export function DashboardCards({
  user,
  orgName,
  isSchool,
  recordsList,
  logsList,
  loading,
  onNavigateToSetup,
  onOpenBulkUpload,
  onOpenViewRecord,
  hasTemplate = true
}: DashboardCardsProps) {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="bg-white border border-[#DFE4EA] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Administrator
          </span>
        </div>
        <h1 className="text-xl font-bold text-[#0B0F19] leading-tight" style={{ fontFamily: 'Sora' }}>
          Welcome back, {user.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-[#64748B] mt-1 flex items-center gap-1.5">
          <Building2 size={13} />
          <span className="font-semibold text-[#0B0F19]">{orgName || user.organization_name || 'CardFlow'}</span>
          <span>•</span>
          <span className="capitalize">{user.organization_type}</span>
        </p>
        <p className="text-xs text-[#64748B] mt-2 flex items-center gap-1">
          <Calendar size={12} />
          {formattedDate}
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <QuickAction
            label={isSchool ? "Classes Setup" : "Branches Setup"}
            icon={isSchool ? GraduationCap : Building2}
            onClick={() => onNavigateToSetup(isSchool ? 'classes' : 'branches')}
            variant="primary"
          />
          <QuickAction
            label="Bulk Upload"
            icon={Upload}
            onClick={onOpenBulkUpload}
            variant="teal"
            disabled={!hasTemplate}
          />
        </div>
      </div>

      {/* Recent Records */}
      <div>
        <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">Recent Records</h2>
        {recordsList.length === 0 ? (
          <div className="bg-white border border-[#DFE4EA] rounded-2xl p-8 text-center shadow-sm">
            <FolderOpen className="mx-auto mb-2 text-[#64748B]" size={28} />
            <p className="text-[#64748B] text-sm">No records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordsList.slice(0, 5).map(rec => {
              const name = rec.name || rec.full_name || rec.student_name || rec.employee_name || 'Record';
              const f1 = isSchool ? (rec.class_name || 'Class') : (rec.branch_name || 'Branch');
              const f2 = isSchool ? (rec.division_name || 'Division') : (rec.department_name || 'Dept');
              const status = rec.approval_status || 'draft';
              return (
                <div
                  key={rec.id}
                  className="bg-white border border-[#DFE4EA] rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm hover:border-[#2563EB]/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0B0F19]">{name}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{f1} – {f2}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusPill status={status} />
                    <button
                      onClick={() => onOpenViewRecord(rec)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approval Activity */}
      <div>
        <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">Approval Activity</h2>
        <LogsView logsList={logsList.slice(0, 5)} isLoading={loading && logsList.length === 0} />
      </div>
    </div>
  );
}

function QuickAction({ label, icon: Icon, onClick, variant = 'default', disabled = false }: {
  label: string; icon: any; onClick: () => void; variant?: 'default' | 'primary' | 'teal'; disabled?: boolean
}) {
  const variantCls = disabled
    ? 'bg-slate-700 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
    : {
      default: 'border border-[#DFE4EA] text-[#0B0F19] hover:border-[#2563EB] hover:text-[#2563EB]',
      primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] border border-[#2563EB]',
      teal: 'bg-[#14B8A6] text-white hover:bg-teal-600 border border-[#14B8A6]',
    }[variant];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-semibold transition-colors ${disabled ? '' : 'cursor-pointer'} ${variantCls}`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const cfg: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
    draft: 'bg-slate-700 text-slate-600 border border-slate-200',
    correction_required: 'bg-blue-50 text-blue-700 border border-blue-200',
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    inactive: 'bg-slate-700 text-slate-500 border border-slate-200',
  };
  const cls = cfg[s] || 'bg-slate-100 text-slate-600 border border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {s.replace('_', ' ')}
    </span>
  );
}

function LogsView({ logsList, isLoading }: { logsList: any[]; isLoading: boolean }) {
  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
    </div>
  );
  if (logsList.length === 0) return (
    <div className="bg-white border border-[#DFE4EA] rounded-2xl p-10 text-center shadow-sm">
      <FileText className="mx-auto mb-3 text-[#64748B]" size={32} />
      <p className="text-[#64748B] text-sm font-medium">No approval activity yet</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {logsList.map((log, i) => {
        const date = log.created_at ? new Date(log.created_at).toLocaleDateString() : '—';
        const actionColor = log.action?.toLowerCase() === 'approved' ? 'text-[#22C55E]' :
          log.action?.toLowerCase() === 'rejected' ? 'text-[#EF4444]' : 'text-[#2563EB]';
        return (
          <div
            key={log.id || i}
            className="bg-white border border-[#DFE4EA] rounded-2xl px-4 py-3 space-y-1.5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[#0B0F19]">{log.record_name || 'Roster Record'}</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${actionColor}`}>{log.action}</span>
            </div>
            <p className="text-xs text-[#64748B]">By {log.done_by_name || log.done_by_email || '—'} • {date}</p>
            {log.comment && (
              <p className="text-xs text-[#64748B] italic">"{log.comment}"</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
