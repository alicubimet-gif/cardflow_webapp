import React from 'react';
import { Calendar, Building2, Upload, FolderOpen, FileText, Plus } from 'lucide-react';
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
  onAddRecord: () => void;
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
  hasTemplate = true,
  onAddRecord
}: DashboardCardsProps) {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="bg-white border border-[#DFE4EA] rounded-2xl p-4 sm:p-5 shadow-sm min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
            Administrator
          </span>
        </div>
        <h1 className="text-lg font-bold text-[#0B0F19] sm:text-xl leading-tight" style={{ fontFamily: 'Sora' }}>
          Welcome back, {user.name?.split(' ')[0]}
        </h1>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-xs sm:text-sm text-[#64748B] mt-1.5">
          <p className="flex items-center gap-1.5 min-w-0">
            <Building2 size={13} className="shrink-0" />
            <span className="font-semibold text-[#0B0F19] truncate">{orgName || user.organization_name || 'CardFlow'}</span>
            <span className="hidden sm:inline">•</span>
            <span className="capitalize">{user.organization_type}</span>
          </p>
          <p className="flex items-center gap-1 shrink-0">
            <Calendar size={12} />
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Grid for Recent Records & Approval Activity */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Recent Records Section */}
        <div className="bg-white border border-[#DFE4EA] rounded-2xl p-4 sm:p-5 shadow-sm min-w-0 overflow-hidden">
          <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Recent Records</h2>
          {(!Array.isArray(recordsList) || recordsList.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderOpen className="mb-2 text-[#64748B] opacity-60" size={24} />
              <p className="text-[#64748B] text-xs font-medium">No records found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(recordsList) ? recordsList : []).slice(0, 5).map(rec => {
                const name = rec.name || rec.full_name || rec.student_name || rec.employee_name || 'Record';
                const f1 = isSchool ? (rec.class_name || 'Class') : (rec.branch_name || 'Branch');
                const f2 = isSchool ? (rec.division_name || 'Division') : (rec.department_name || 'Dept');
                const status = rec.approval_status || 'draft';
                return (
                  <div
                    key={rec.id}
                    className="border border-[#DFE4EA] rounded-xl p-3 flex items-start justify-between shadow-xs hover:border-[#2563EB]/40 transition-colors min-w-0 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold leading-tight text-[#0B0F19]">
                        {name}
                      </h4>
                      <p className="mt-1.5 truncate text-[10px] leading-tight text-[#64748B]">
                        {(rec.group_name || rec.group?.name || "-")} • {(rec.sub_group_name || rec.sub_group?.name || "-")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <StatusPill status={status} />
                      <button
                        onClick={() => onOpenViewRecord(rec)}
                        className="h-auto p-0 text-[10px] font-medium leading-none text-[#2563EB] hover:underline cursor-pointer"
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

        {/* Approval Activity Section */}
        <div className="bg-white border border-[#DFE4EA] rounded-2xl p-4 sm:p-5 shadow-sm min-w-0 overflow-hidden">
          <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Approval Activity</h2>
          <LogsView logsList={logsList.slice(0, 5)} isLoading={loading && logsList.length === 0} />
        </div>
      </div>
    </div>
  );
}


function StatusPill({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const cfg: Record<string, string> = {
    approved: 'bg-green-50 text-green-700 border border-green-400',
    pending: 'bg-amber-50 text-amber-700 border border-amber-400',
    rejected: 'bg-red-50 text-red-700 border border-red-400',
    draft: 'bg-slate-50 text-slate-600 border border-slate-200',
    correction_required: 'bg-blue-50 text-blue-700 border border-blue-400',
    active: 'bg-green-50 text-green-700 border border-green-400',
    inactive: 'bg-slate-50 text-slate-500 border border-slate-200',
  };
  const cls = cfg[s] || 'bg-slate-50 text-slate-600 border border-slate-200';
  return (
    <span className={`inline-flex h-4 items-center justify-center rounded-full px-1.5 text-[8px] font-semibold uppercase leading-none shrink-0 ${cls}`}>
      {s.replace('_', ' ')}
    </span>
  );
}

function LogsView({ logsList, isLoading }: { logsList: any[]; isLoading: boolean }) {
  if (isLoading) return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
    </div>
  );
  if (logsList.length === 0) return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <FileText className="mb-2 text-[#64748B] opacity-60" size={24} />
      <p className="text-[#64748B] text-xs font-medium">No approval activity yet</p>
    </div>
  );
  return (
    <div className="space-y-2">
      {logsList.map((log, i) => {
        const rawDate = log.created_at || log.approved_at || log.timestamp || log.date;
        const dateStr = rawDate && rawDate !== '—' ? (isNaN(Date.parse(rawDate)) ? String(rawDate) : new Date(rawDate).toLocaleDateString()) : '';
        const actionColor = log.action?.toLowerCase() === 'approved' ? 'text-[#22C55E]' :
          log.action?.toLowerCase() === 'rejected' ? 'text-[#EF4444]' : 'text-[#2563EB]';
        const actorName = log.done_by_name || log.user_full_name || log.user_name || log.performed_by_name || log.performed_by || log.action_by_name || log.action_by || log.approved_by_name || log.done_by_email || log.user_email || log.user || '—';
        return (
          <div
            key={log.id || i}
            className="border border-[#DFE4EA] rounded-xl p-3 space-y-1 min-w-0"
          >
            <div className="flex items-start justify-between gap-3 min-w-0">
              <p className="text-sm font-semibold text-[#0B0F19] truncate">{log.record_name || 'Roster Record'}</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${actionColor}`}>{log.action}</span>
            </div>
            <p className="text-xs text-[#64748B] truncate">By {actorName}{dateStr ? ` • ${dateStr}` : ''}</p>
            {log.comment && (
              <p className="text-xs text-[#64748B] italic truncate">"{log.comment}"</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
