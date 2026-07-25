'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/api/dashboard.api';
import { getTemplateFields } from '@/api/organization.api';
import { apiClient } from '@/api/client';
import { Loader2 } from 'lucide-react';

// Subcomponents
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { TableSkeleton } from '@/components/ui/Skeletons';

// Modals & overlays
import { AddRecordModal } from '@/components/records/AddRecordModal';
import { RecordForm } from '@/components/records/RecordForm';
import { useOrgLabels } from '@/hooks/useOrgLabels';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const labels = useOrgLabels(user?.organization_type);

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  const organizationId = user?.organization_id || '';
  const orgName = user?.organization_name || '';
  const isSchool = user?.organization_type?.toLowerCase() === 'school';
  const isAdmin = user?.role === 'organization_admin';
  const isStaff = user?.role === 'organization_staff';

  // 1. Staff Auto-Redirect Check Query
  const { data: firstPendingRecord, isLoading: isStaffPendingCheckLoading } = useQuery({
    queryKey: ["staff-first-pending-record"],
    queryFn: async () => {
      const res = await apiClient.get('/api/mobile/records/', {
        params: { approval_status: 'pending_review', page_size: 1 }
      });
      const results = res.data?.results || res.data?.records || res.data || [];
      return results[0] || null;
    },
    enabled: !!user && isStaff,
    staleTime: 0,
  });

  // Redirect Staff to first pending record immediately
  useEffect(() => {
    if (isStaff && firstPendingRecord) {
      router.replace(`/groups/record?groupId=${encodeURIComponent(firstPendingRecord.group)}&subgroupId=${encodeURIComponent(firstPendingRecord.sub_group)}&recordId=${encodeURIComponent(firstPendingRecord.id)}&from=dashboard`);
    }
  }, [isStaff, firstPendingRecord, router]);

  // 2. Dashboard Stats query
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!user && (!isStaff || (isStaff && firstPendingRecord === null && !isStaffPendingCheckLoading)),
  });

  // 3. Template Fields query
  const { data: templateFieldsData, isLoading: isTemplateLoading } = useQuery({
    queryKey: ["template-fields", organizationId],
    queryFn: () => getTemplateFields(organizationId, {}),
    enabled: !!user && !!organizationId && !isStaff,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (!user) return null;

  // Render loading state while checking pending approvals for Staff
  if (isStaff && (isStaffPendingCheckLoading || firstPendingRecord)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-500">Checking pending approvals…</p>
      </div>
    );
  }

  const isPageLoading = isDashboardLoading || isTemplateLoading;

  if (isPageLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl space-y-4 px-3 py-4 sm:px-4 md:space-y-6 md:px-6">
        <div className="flex justify-between items-center mb-6">
          <div className="w-1/4 h-8 bg-slate-200 animate-pulse rounded-md"></div>
          <div className="w-24 h-10 bg-slate-200 animate-pulse rounded-md"></div>
        </div>
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  const statsObj = dashboardData?.statistics || dashboardData || {};
  const recordsList = dashboardData?.recentRecords || dashboardData?.records || dashboardData?.recent_updates || [];
  const logsList = dashboardData?.approvalActivity || dashboardData?.approval_activity || [];
  const hasTemplate = templateFieldsData?.has_template ?? false;
  const templateFields = templateFieldsData?.fields || [];

  // Tailored dashboard view for Staff when there are 0 pending records
  if (isStaff) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 px-3 py-4 sm:px-4 md:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold md:text-2xl text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>
            Staff Dashboard
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Overview of your assignments and card operations
          </p>
        </div>

        {/* Today's Summary */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Today's Summary</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col">
              <span className="text-xs font-semibold text-slate-500">Pending Records</span>
              <span className="text-3xl font-extrabold text-slate-900 mt-2">0</span>
            </div>
            <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100/50 flex flex-col">
              <span className="text-xs font-semibold text-emerald-600">Approved Today</span>
              <span className="text-3xl font-extrabold text-emerald-600 mt-2">
                {statsObj.approved_cards ?? statsObj.rec_approved ?? 0}
              </span>
            </div>
            <div className="bg-red-50/50 rounded-xl p-5 border border-red-105/50 flex flex-col">
              <span className="text-xs font-semibold text-red-655">Rejected Today</span>
              <span className="text-3xl font-extrabold text-red-655 mt-2">
                {statsObj.rejected_cards ?? statsObj.rec_rejected ?? 0}
              </span>
            </div>
          </div>
        </section>

        {/* Assigned Groups & Subgroups */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">Assigned {labels.groupLabelPlural}</h3>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                You are assigned to and authorized to view records within your designated parent {labels.groupLabelPlural.toLowerCase()}.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">Total Groups</span>
              <span className="text-sm font-bold text-slate-800">{statsObj.groups ?? 0}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">Assigned {labels.subgroupLabelPlural}</h3>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Direct enrollment and card preview controls are enabled across your active {labels.subgroupLabelPlural.toLowerCase()}.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">Total Subgroups</span>
              <span className="text-sm font-bold text-slate-800">{statsObj.subgroups ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">Recent Activity</h3>
          {logsList.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent activity logged for your assignments.</p>
          ) : (
            <div className="divide-y divide-slate-150 mt-1">
              {logsList.map((log: any) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 break-words">{log.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{log.date} at {log.time}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 shrink-0 bg-slate-100 px-2 py-0.5 rounded-md">
                    {log.action_display || 'Action'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // Normal Admin Dashboard
  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-4 px-3 py-4 sm:px-4 md:space-y-6 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold md:text-2xl text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
            Dashboard
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#64748B]">
            Overview of your organization
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end shrink-0 w-full sm:w-auto">
          <button
            onClick={() => router.push('/groups')}
            className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50 text-slate-700 cursor-pointer flex items-center justify-center shrink-0 w-full sm:w-auto"
          >
            {labels.groupLabel} Setup
          </button>
          <button
            onClick={() => setIsAddRecordModalOpen(true)}
            className="h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 text-sm font-semibold cursor-pointer flex items-center justify-center shrink-0 w-full sm:w-auto"
          >
            Add Record
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <DashboardStats
          isSchool={isSchool}
          statistics={statsObj}
          stats={statsObj}
        />
        <DashboardCards
          user={user}
          orgName={orgName}
          isSchool={isSchool}
          recordsList={recordsList}
          logsList={logsList}
          loading={isDashboardLoading}
          onNavigateToSetup={() => router.push('/groups')}
          onOpenBulkUpload={() => setIsAddRecordModalOpen(true)}
          onOpenViewRecord={(record) => router.push(`/records/${record.id}/preview`)}
          hasTemplate={hasTemplate}
          onAddRecord={() => setIsAddRecordModalOpen(true)}
        />
      </div>

      {isRecordModalOpen && (
        <RecordForm
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onSubmit={async () => {
            await refetchDashboard();
            setIsRecordModalOpen(false);
          }}
          editingRecord={editingRecord}
          requiredFields={templateFields}
          isSchool={isSchool}
          classesList={[]}
          divisionsList={[]}
          branchesList={[]}
          departmentsList={[]}
          hidePhoto={!isAdmin}
        />
      )}

      {isAddRecordModalOpen && (
        <AddRecordModal
          open={isAddRecordModalOpen}
          onClose={() => setIsAddRecordModalOpen(false)}
          onSuccess={async () => {
            await refetchDashboard();
            setIsAddRecordModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
