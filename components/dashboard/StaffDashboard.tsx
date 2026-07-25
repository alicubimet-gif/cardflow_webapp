'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthApi, RecordApi, GroupApi, SubgroupApi, ClassesApi, UserApi, OrganizationApi, DashboardApi, ApprovalLogsApi } from '@/api';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';
import { Building2, FolderOpen, Activity, CheckCircle2, Clock, XCircle, AlertCircle, Download, Upload, Plus } from 'lucide-react';
import { useDashboard } from '@/context/dashboard-context';
import { formatDistanceToNow } from 'date-fns';
import { RecordList } from '@/components/records/RecordList';

export function StaffDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { groupLabel, subgroupLabel, groupLabelPlural, subgroupLabelPlural } = useOrgLabels(user?.organization_type);
  const isSchool = user?.organization_type?.toLowerCase() === 'school';
  const { resolvedTemplate, recordsList, groupsList, subgroupsList } = useDashboard();

  // Keep cache synced with local context mutations
  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-live-data'] });
  }, [recordsList, groupsList, subgroupsList, queryClient]);

  // Fetch Live Data
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-live-data', user?.organization_id],
    queryFn: async () => {
      const [groups, subgroups, records, logs] = await Promise.all([
        (isSchool ? ClassesApi.getClasses() : ClassesApi.getBranches()).catch(() => []),
        (isSchool ? ClassesApi.getDivisions() : ClassesApi.getDepartments()).catch(() => []),
        RecordApi.getRecords().catch(() => []),
        ApprovalLogsApi.getApprovalLogs().catch(() => [])
      ]);
      return { groups, subgroups, records, logs };
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 15000,
  });

  const rawGroups = data?.groups || [];
  const rawSubgroups = data?.subgroups || [];
  const rawRecords = data?.records || [];
  const rawLogs = data?.logs || [];

  // Automatic Hierarchy Detection
  const dashboardLevel = useMemo(() => {
    if (rawGroups.length > 1) return 'organization';
    if (rawSubgroups.length > 1) return 'group';
    return 'subgroup';
  }, [rawGroups.length, rawSubgroups.length]);

  // Derived Statistics based on available data
  const stats = useMemo(() => {
    return {
      totalGroups: rawGroups.length,
      activeGroups: rawGroups.filter((g: any) => g.status === 'active' || !g.status).length,
      totalSubgroups: rawSubgroups.length,
      activeSubgroups: rawSubgroups.filter((s: any) => s.status === 'active' || !s.status).length,
      totalRecords: rawRecords.length,
      activeRecords: rawRecords.filter((r: any) => ['approved', 'active'].includes(normalizeStatus(r.approval_status))).length,
      pendingRecords: rawRecords.filter((r: any) => ['pending', 'pending_review'].includes(normalizeStatus(r.approval_status))).length,
      approvedRecords: rawRecords.filter((r: any) => normalizeStatus(r.approval_status) === 'approved').length,
    };
  }, [rawGroups, rawSubgroups, rawRecords]);

  // View renderers
  const renderOrganizationView = () => (
    <section>
      <h2 className="text-lg font-bold text-slate-800 mb-4 font-sora">All {groupLabelPlural}</h2>
      {rawGroups.length === 0 ? (
        <EmptyState message={`No ${groupLabelPlural.toLowerCase()} assigned.`} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rawGroups.map((g: any) => {
            const groupSubs = rawSubgroups.filter((s: any) => String(s.group || s.groupId || s.group_id) === String(g.id)).length;
            const groupRecs = rawRecords.filter((r: any) => String(r.group || r.group_id) === String(g.id)).length;
            return (
              <div key={g.id} onClick={() => router.push(`/groups/details?groupId=${encodeURIComponent(g.id)}`)} className="bg-white border border-slate-200/60 p-5 rounded-2xl cursor-pointer hover:border-teal-300 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-800 text-base group-hover:text-teal-600 transition-colors">{g.name}</h3>
                  <span className="inline-flex h-6 items-center justify-center rounded-full px-2 bg-green-50 text-green-700 border border-green-200 text-[8px] font-semibold uppercase tracking-wider shrink-0">Active</span>
                </div>
                <div className="flex gap-4 text-sm text-slate-500 pt-3 border-t border-slate-100">
                  <div><span className="font-semibold text-slate-700">{groupSubs}</span> {subgroupLabelPlural}</div>
                  <div><span className="font-semibold text-slate-700">{groupRecs}</span> Records</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const renderGroupView = () => {
    const parentGroup = rawGroups[0];
    return (
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 font-sora">
          {parentGroup ? parentGroup.name : `Assigned ${groupLabel}`} - {subgroupLabelPlural}
        </h2>
        {rawSubgroups.length === 0 ? (
          <EmptyState message={`No ${subgroupLabelPlural.toLowerCase()} assigned.`} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rawSubgroups.map((s: any) => {
              const subRecs = rawRecords.filter((r: any) => String(r.sub_group || r.subgroup_id || r.subgroup) === String(s.id)).length;
              const gId = s.group || s.groupId || s.group_id || parentGroup?.id;
              return (
                <div key={s.id} onClick={() => router.push(`/groups/subgroup?groupId=${encodeURIComponent(gId)}&subgroupId=${encodeURIComponent(s.id)}`)} className="bg-white border border-slate-200/60 p-5 rounded-2xl cursor-pointer hover:border-teal-300 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base group-hover:text-teal-600 transition-colors">{s.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{parentGroup?.name}</p>
                    </div>
                    <span className="inline-flex h-6 items-center justify-center rounded-full px-2 bg-green-50 text-green-700 border border-green-200 text-[8px] font-semibold uppercase tracking-wider shrink-0">Active</span>
                  </div>
                  <div className="text-sm text-slate-500 pt-3 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">{subRecs}</span> Records
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  const renderSubgroupView = () => {
    const parentSubgroup = rawSubgroups[0];
    const parentGroup = rawGroups[0];
    
    let title = "Assigned Records";
    if (parentSubgroup) title = parentSubgroup.name;
    else if (parentGroup) title = parentGroup.name;

    return (
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 font-sora">{title}</h2>
        {rawRecords.length === 0 ? (
          <EmptyState message="No records available." />
        ) : (
          <div className="mt-4">
            <RecordList 
              recordsList={rawRecords}
              isOrganization={!isSchool}
              isAdmin={false}
              onView={(rec) => router.push(`/groups/record?groupId=${encodeURIComponent(rec.group || rec.group_id)}&subgroupId=${encodeURIComponent(rec.sub_group || rec.subgroup_id || rec.subgroup)}&recordId=${encodeURIComponent(rec.id)}`)}
              onEdit={(rec) => router.push(`/groups/record/edit?groupId=${encodeURIComponent(rec.group || rec.group_id)}&subgroupId=${encodeURIComponent(rec.sub_group || rec.subgroup_id || rec.subgroup)}&recordId=${encodeURIComponent(rec.id)}`)}
              onDelete={() => {}}
              onSubmit={() => {}}
              onApprove={() => {}}
              onReject={() => {}}
              onCorrection={() => {}}
              templateFields={resolvedTemplate?.fields || []}
              onUpdatePhoto={(rec) => router.push(`/records/${rec.id}/photo`)}
            />
          </div>
        )}
      </section>
    );
  };

  // -------------------------

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-48 bg-slate-200 rounded-lg mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-2xl" />
          <div className="h-[30rem] bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl flex items-center justify-between border border-red-100">
        <div className="flex items-center gap-3">
          <AlertCircle />
          <span>Unable to load dashboard live data.</span>
        </div>
        <button onClick={() => refetch()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-sora">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {dashboardLevel === 'organization' ? `Overview of all assigned ${groupLabelPlural.toLowerCase()}` : 
             dashboardLevel === 'group' ? `Overview of ${rawGroups[0]?.name || `assigned ${groupLabel.toLowerCase()}`}` :
             `Overview of assigned records`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center mt-3 sm:mt-0">
          <button
            onClick={() => {}}
            className="flex items-center justify-center gap-2 h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => {}}
            className="flex items-center justify-center gap-2 h-10 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
          >
            <Upload size={16} />
            <span>Upload Photo</span>
          </button>

          <button
            onClick={() => {}}
            className="flex items-center justify-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
          >
            <Plus size={16} />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Removed */}

      <div>
        {/* Main Hierarchy Content */}
        <div>
          {dashboardLevel === 'organization' && renderOrganizationView()}
          {dashboardLevel === 'group' && renderGroupView()}
          {dashboardLevel === 'subgroup' && renderSubgroupView()}
        </div>
      </div>
    </div>
  );
}

// --- Helpers ---



function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
      <FolderOpen className="text-slate-300 mb-3" size={32} />
      <span className="text-slate-500 text-sm font-medium">{message}</span>
    </div>
  );
}

const normalizeStatus = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');

const getRecordDisplayName = (record: any, templateFields: any[]): string => {
  const primaryField = templateFields.find((f: any) => f.is_primary === true || f.primary === true) ?? templateFields[0];
  const fieldKey = primaryField?.key ?? primaryField?.name ?? primaryField?.slug ?? primaryField?.field_name;
  return fieldKey
    ? String(record.data?.[fieldKey] ?? record.field_values?.[fieldKey] ?? record[fieldKey] ?? "Unnamed Record")
    : "Unnamed Record";
};

function StatusBadge({ status }: { status: string }) {
  const norm = normalizeStatus(status);
  const baseClass = "inline-flex h-6 items-center justify-center rounded-full px-2 text-[8px] font-semibold uppercase tracking-wider shrink-0 gap-1 w-max";
  switch (norm) {
    case 'approved': return <span className={`${baseClass} bg-green-50 text-green-700 border border-green-200`}><CheckCircle2 size={11} className="shrink-0" /> Approved</span>;
    case 'rejected': return <span className={`${baseClass} bg-red-50 text-red-700 border border-red-200`}><XCircle size={11} className="shrink-0" /> Rejected</span>;
    case 'pending_review':
    case 'pending': return <span className={`${baseClass} bg-amber-50 text-amber-700 border border-amber-200`}><Clock size={11} className="shrink-0" /> Pending</span>;
    default: return <span className={`${baseClass} bg-slate-50 text-slate-700 border border-slate-200`}>{norm || 'Draft'}</span>;
  }
}
