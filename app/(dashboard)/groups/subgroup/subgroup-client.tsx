'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';
import { RecordList } from '@/components/records/RecordList';
import { RecordCard, getRecordFieldValues, buildRecordDisplayFields } from '@/components/records/RecordCard';
import { AssignStaffDialog } from '@/components/staff/AssignStaffDialog';
import { PhotoEditorModal } from '@/components/records/PhotoEditorModal';
import { useDeleteStaffAssignment } from '@/hooks/queries/useStaffAssignments';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useDialog } from '@/hooks/useDialog';
import { AddRecordModal } from '@/components/records/AddRecordModal';
import { apiClient } from '@/api/client';
import { 
  Building2, 
  Plus, 
  Upload, 
  Users, 
  X, 
  UserPlus,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PaginatedRecords<T> {
  records: T[];
  totalCount: number;
  next: string | null;
  previous: string | null;
}

function normalizeRecordsResponse<T>(response: any): PaginatedRecords<T> {
  const payload =
    response?.data?.data ??
    response?.data ??
    response ??
    {};

  if (Array.isArray(payload)) {
    return {
      records: payload,
      totalCount: payload.length,
      next: null,
      previous: null,
    };
  }

  const records = Array.isArray(payload.results)
    ? payload.results
    : Array.isArray(payload.records)
      ? payload.records
      : [];

  const totalCount =
    typeof payload.count === "number"
      ? payload.count
      : typeof payload.total_count === "number"
        ? payload.total_count
        : typeof payload.total === "number"
          ? payload.total
          : records.length;

  return {
    records,
    totalCount,
    next: payload.next ?? null,
    previous: payload.previous ?? null,
  };
}

function RecordListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-205 space-y-3 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded-md w-2/3" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
            </div>
            <div className="h-5 bg-slate-105 rounded-full w-16" />
          </div>
          <div className="h-16 bg-slate-50 rounded-xl" />
          <div className="h-9 bg-slate-100 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

const RecordCardMobile = RecordCard;

export default function SubgroupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdParam = searchParams.get('groupId');
  const subgroupIdParam = searchParams.get('subgroupId');

  const { user } = useAuth();
  const { toast } = useToast();
  const dialog = useDialog();
  const queryClient = useQueryClient();

  const deleteStaffAssignmentMutation = useDeleteStaffAssignment();

  // Local Page Filter and Search States
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [recordFilterStatus, setRecordFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [modalRecordType, setModalRecordType] = useState<'single' | 'bulk' | 'bulk-update'>('single');
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [selectedRecordForPhoto, setSelectedRecordForPhoto] = useState<any | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Reset page when search or status filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, recordFilterStatus]);

  const subgroupId = subgroupIdParam || '';
  const groupId = groupIdParam || '';

  // Direct Page Queries
  const subgroupQuery = useQuery({
    queryKey: ["subgroup-detail", subgroupId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/mobile/subgroups/${subgroupId}/`);
      return res.data;
    },
    enabled: Boolean(subgroupId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const subgroupDetail = subgroupQuery.data;

  const resolvedGroupId = groupId || subgroupDetail?.group || subgroupDetail?.groupId || subgroupDetail?.group_id;

  const groupQuery = useQuery({
    queryKey: ["group-detail", resolvedGroupId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/mobile/groups/${resolvedGroupId}/`);
      return res.data;
    },
    enabled: Boolean(resolvedGroupId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const groupDetail = groupQuery.data;

  const subgroupRecordsQuery = useQuery({
    queryKey: ["subgroup-records", resolvedGroupId, subgroupId, page, debouncedSearch, recordFilterStatus],
    queryFn: async () => {
      const res = await apiClient.get('/api/mobile/records/', {
        params: {
          group: resolvedGroupId,
          subgroup: subgroupId,
          page,
          search: debouncedSearch,
          status: recordFilterStatus,
        }
      });
      return normalizeRecordsResponse(res);
    },
    enabled: Boolean(resolvedGroupId && subgroupId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const recordsData = subgroupRecordsQuery.data;
  const filteredRecords = recordsData?.records || [];
  const totalRecords = recordsData?.totalCount || 0;

  const subgroupStaffQuery = useQuery({
    queryKey: ["subgroup-staff", subgroupId],
    queryFn: async () => {
      const res = await apiClient.get('/api/mobile/staff-assignments/', {
        params: { subgroup: subgroupId }
      });
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
    enabled: Boolean(subgroupId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const assignedStaffAssignments = subgroupStaffQuery.data || [];

  const templateFieldsQuery = useQuery({
    queryKey: ["resolved-template-fields", user?.organization_id, resolvedGroupId, subgroupId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/studio/organizations/${user?.organization_id}/template-fields/`, {
        params: {
          group: resolvedGroupId,
          subgroup: subgroupId
        }
      });
      const data = res.data?.data ?? res.data ?? {};
      const templateId = data.template_id ?? data.template ?? null;
      const hasTemplate = data.has_template === true || Boolean(templateId);

      return {
        hasTemplate,
        templateId,
        templateName: data.template_name ?? null,
        resolutionLevel: data.resolution_level ?? null,
        fields: Array.isArray(data.fields) ? data.fields : [],
      };
    },
    enabled: Boolean(user?.organization_id && resolvedGroupId && subgroupId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const resolvedTemplate = templateFieldsQuery.data;

  if (!groupIdParam || !subgroupIdParam) {
    return <div className="p-6 text-sm text-slate-600">Invalid route parameters.</div>;
  }

  const isAdmin = user?.role === 'admin' || (user as any)?.is_superuser;
  const isOrganization = user?.role === 'organization';
  const loading = subgroupQuery.isLoading || groupQuery.isLoading;

  const { groupLabel, groupLabelPlural, subgroupLabel, subgroupLabelPlural, recordLabel, recordLabelPlural } = useOrgLabels(user?.organization_type);

  const subgroupName = subgroupDetail?.name || '—';
  const groupName = groupDetail?.name || '—';

  // Terminology Object
  const terminology = {
    groupSingular: groupLabel,
    groupPlural: groupLabelPlural,
    subgroupSingular: subgroupLabel,
    subgroupPlural: subgroupLabelPlural,
    recordSingular: recordLabel,
    recordPlural: recordLabelPlural,
    assignedUserSingular: 'Staff',
    assignedUserPlural: 'Staff',
  };

  const normalizedRole = user?.role === 'organization_staff' ? 'staff' : (user?.role === 'organization_admin' ? 'organization_admin' : user?.role === 'admin' ? 'admin' : user?.role);
  const isAssignedToCurrentSubgroup = assignedStaffAssignments.some(
    (a: any) => String(a.staff || a.user || a.user_id) === String(user?.id)
  );

  const canCreateRecord =
    normalizedRole === "organization_admin" ||
    normalizedRole === "admin" ||
    (
      normalizedRole === "staff" &&
      isAssignedToCurrentSubgroup
    );

  const canUploadPhoto = canCreateRecord;
  const canManageAssignments = isAdmin || isOrganization;

  const handleOpenAddRecord = () => {
    setModalRecordType('single');
    setIsAddRecordOpen(true);
  };

  const handleOpenBulkUpload = () => {
    setModalRecordType('bulk');
    setIsAddRecordOpen(true);
  };

  const handleOpenBulkUpdate = () => {
    setModalRecordType('bulk-update');
    setIsAddRecordOpen(true);
  };

  const assignedStaffList = assignedStaffAssignments.map((a: any) => ({
    id: a.staff || a.user || a.user_id,
    assignmentId: a.id,
    name: a.staff_name || '—',
    email: a.staff_email || '—',
  }));

  const handleAssignStaff = () => {
    setSelectedAssignment({ group_id: resolvedGroupId, subgroup: subgroupId });
    setIsAssignStaffOpen(true);
  };

  const handleRemoveStaff = async (staffMember: any) => {
    const confirmed = await dialog.confirm({
      title: `Remove "${staffMember.name}"?`,
      message: `Are you sure you want to remove this staff member assignment from this ${terminology.subgroupSingular.toLowerCase()}?`,
      variant: 'danger',
    });

    if (confirmed) {
      deleteStaffAssignmentMutation.mutate(staffMember.assignmentId, {
        onSuccess: async () => {
          toast("Staff assignment removed successfully.", "success");
          await queryClient.invalidateQueries({ queryKey: ["subgroup-staff", subgroupId] });
          await queryClient.invalidateQueries({ queryKey: ["subgroup-detail", subgroupId] });
        },
        onError: (err: any) => {
          const data = err?.response?.data;
          toast(data?.detail || data?.message || "Failed to remove staff assignment.", "error");
        }
      });
    }
  };

  // Local Record Action Mutations/Functions
  const handleDeleteRecord = async (id: string) => {
    const confirmed = await dialog.confirm({ title: 'Delete Record', message: 'Are you sure you want to delete this record?', variant: 'danger' });
    if (!confirmed) return;
    try {
      const { RecordApi } = await import('@/api');
      await RecordApi.deleteRecord(id);
      toast('Record deleted successfully.', 'success');
      await queryClient.invalidateQueries({ queryKey: ["subgroup-records", resolvedGroupId, subgroupId] });
      await queryClient.invalidateQueries({ queryKey: ["subgroup-detail", subgroupId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      dialog.alert({ title: 'Delete Failed', message: 'Failed to delete record.', variant: 'error' });
    }
  };

  const handleSubmitRecord = async (id: string) => {
    try {
      const { RecordApi } = await import('@/api');
      const rec = filteredRecords.find((r: any) => String(r.id) === String(id)) as any;
      const cardId = rec?.card_id;
      await RecordApi.submitRecord(id, cardId);
      toast('Record submitted successfully.', 'success');
      await queryClient.invalidateQueries({ queryKey: ["subgroup-records", resolvedGroupId, subgroupId] });
      await queryClient.invalidateQueries({ queryKey: ["subgroup-detail", subgroupId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast('Failed to submit record.', 'error');
    }
  };

  const handleApproveRecord = async (id: string, skipConfirm = false) => {
    if (!skipConfirm) {
      const confirmed = await dialog.confirm({ title: 'Approve Record', message: 'Are you sure you want to approve this record?' });
      if (!confirmed) return;
    }
    try {
      const rec = filteredRecords.find((r: any) => String(r.id) === String(id)) as any;
      const cardId = rec?.card_id;
      await apiClient.post(`/api/mobile/records/${id}/approve/`, {}, { headers: { 'X-Card-ID': cardId } });
      toast('Record approved successfully.', 'success');
      await queryClient.invalidateQueries({ queryKey: ["subgroup-records", resolvedGroupId, subgroupId] });
      await queryClient.invalidateQueries({ queryKey: ["subgroup-detail", subgroupId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast('Failed to approve record.', 'error');
    }
  };

  const handleRejectRecord = async (id: string, reasonFromDetails?: string) => {
    let reason = reasonFromDetails;
    if (reason === undefined) {
      const promptVal = await dialog.prompt({ title: 'Reject Record', label: 'Reason for rejection', placeholder: 'Enter rejection reason' });
      if (!promptVal) return;
      reason = promptVal;
    }
    try {
      await apiClient.post(`/api/mobile/records/${id}/reject/`, { comment: reason, rejection_reason: reason });
      toast('Record rejected successfully.', 'success');
      await queryClient.invalidateQueries({ queryKey: ["subgroup-records", resolvedGroupId, subgroupId] });
      await queryClient.invalidateQueries({ queryKey: ["subgroup-detail", subgroupId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast('Failed to reject record.', 'error');
    }
  };

  const handleCorrectionRecord = async (id: string, noteFromDetails?: string) => {
    let note = noteFromDetails;
    if (note === undefined) {
      const promptVal = await dialog.prompt({ title: 'Request Correction', label: 'Correction instructions', placeholder: 'Enter correction instructions' });
      if (!promptVal) return;
      note = promptVal;
    }
    try {
      await apiClient.post(`/api/mobile/records/${id}/request_correction/`, { comment: note, correction_note: note });
      toast('Correction requested successfully.', 'success');
      await queryClient.invalidateQueries({ queryKey: ["subgroup-records", resolvedGroupId, subgroupId] });
      await queryClient.invalidateQueries({ queryKey: ["subgroup-detail", subgroupId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast('Failed to request correction.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
        <div className="w-1/3 h-10 bg-slate-200 rounded-md mb-6"></div>
        <div className="h-64 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  // Pagination bounds
  const pageSize = 25;
  const start = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRecords);

  const navigateToRecordDetail = (rec: any) => {
    router.push(`/groups/record?groupId=${encodeURIComponent(resolvedGroupId)}&subgroupId=${encodeURIComponent(subgroupId)}&recordId=${encodeURIComponent(rec.id)}`);
  };

  const navigateToRecordEdit = (rec: any) => {
    router.push(`/groups/record/edit?groupId=${encodeURIComponent(resolvedGroupId)}&subgroupId=${encodeURIComponent(subgroupId)}&recordId=${encodeURIComponent(rec.id)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 space-y-4">

        {/* 4. Main Detail Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {terminology.subgroupSingular}
              </p>
              <h1 className="mt-1 break-words text-xl font-bold text-slate-900 sm:text-2xl" style={{ fontFamily: 'Sora, sans-serif' }}>
                {subgroupName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage {terminology.recordPlural.toLowerCase()} and assigned staff
              </p>
            </div>

            {/* 7. Action Buttons Section */}
            <div>
              {/* Mobile Actions Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
                {canManageAssignments && (
                  <button
                    type="button"
                    onClick={handleAssignStaff}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5 touch-manipulation pointer-events-auto cursor-pointer"
                  >
                    <UserPlus size={16} />
                    <span>Assign Staff</span>
                  </button>
                )}
                {canUploadPhoto && (
                  <button
                    type="button"
                    onClick={handleOpenBulkUpload}
                    className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 touch-manipulation pointer-events-auto cursor-pointer"
                  >
                    <Upload size={16} />
                    <span>Bulk Upload</span>
                  </button>
                )}
                {canUploadPhoto && (
                  <button
                    type="button"
                    onClick={handleOpenBulkUpdate}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5 touch-manipulation pointer-events-auto cursor-pointer"
                  >
                    <Upload size={16} />
                    <span>Bulk Update {terminology.recordPlural}</span>
                  </button>
                )}
                {canCreateRecord && (
                  <button
                    type="button"
                    onClick={handleOpenAddRecord}
                    className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 touch-manipulation pointer-events-auto cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Add Record</span>
                  </button>
                )}
              </div>

              {/* Desktop Actions Row */}
              <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                {canManageAssignments && (
                  <button
                    type="button"
                    onClick={handleAssignStaff}
                    className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <UserPlus size={16} />
                    <span>Assign Staff</span>
                  </button>
                )}
                {canUploadPhoto && (
                  <button
                    type="button"
                    onClick={handleOpenBulkUpload}
                    className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Upload size={16} />
                    <span>Bulk Upload</span>
                  </button>
                )}
                {canUploadPhoto && (
                  <button
                    type="button"
                    onClick={handleOpenBulkUpdate}
                    className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Upload size={16} />
                    <span>Bulk Update {terminology.recordPlural}</span>
                  </button>
                )}
                 {canCreateRecord && (
                  <button
                    type="button"
                    onClick={handleOpenAddRecord}
                    className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 text-sm font-semibold text-white transition-colors flex items-center gap-2 cursor-pointer shadow-xs shadow-blue-500/10"
                  >
                    <Plus size={16} />
                    <span>Add Record</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 5. Parent Group Information & 6. Summary Metrics */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 px-4 py-3.5 flex items-center justify-between gap-3 border border-slate-100">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parent {terminology.groupSingular}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{groupName}</p>
              </div>
              <Building2 className="h-5 w-5 text-slate-400 shrink-0" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">{terminology.recordPlural}</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{subgroupDetail?.record_count ?? totalRecords ?? 0}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Assigned Staff</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{assignedStaffList.length}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Status</p>
              <div className="mt-1.5">
                <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-wide ${subgroupDetail?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {subgroupDetail?.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 10. Assigned Users Section */}
        {canManageAssignments && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Assigned Staff
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Staff members assigned directly to this {terminology.subgroupSingular.toLowerCase()}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {assignedStaffList.length}
              </span>
            </div>

            {assignedStaffList.length === 0 ? (
              /* 11. Assigned Staff Empty State */
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">No staff assigned</p>
                <p className="mt-1 text-xs text-slate-500">
                  Assign staff members to manage this {terminology.subgroupSingular.toLowerCase()}.
                </p>
                <button
                  type="button"
                  onClick={handleAssignStaff}
                  className="mt-4 h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 bg-white text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 mx-auto cursor-pointer shadow-xs"
                >
                  <UserPlus size={14} />
                  <span>Assign Staff</span>
                </button>
              </div>
            ) : (
              /* 12. Assigned Staff List Cards */
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {assignedStaffList.map((stMember: any) => {
                  const sName = stMember.name || 'Staff operator';
                  const sEmail = stMember.email || '—';
                  return (
                    <article
                      key={stMember.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 bg-white"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {sName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 leading-snug">{sName}</p>
                        <p className="truncate text-xs text-slate-500 mt-0.5">{sEmail}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStaff(stMember)}
                        aria-label={`Remove ${sName}`}
                        className="h-9 w-9 shrink-0 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 13. Records Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="space-y-4">
            
            {/* Header / Dynamic Title */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {terminology.recordPlural}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {totalRecords} records under this {terminology.subgroupSingular.toLowerCase()}
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={`Search ${terminology.recordPlural.toLowerCase()}...`}
                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-205 text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                  <svg className="absolute left-3 top-3 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <select
                  value={recordFilterStatus}
                  onChange={(e) => setRecordFilterStatus(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-205 text-xs font-semibold text-slate-650 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="correction">Correction</option>
                </select>
              </div>
            </div>

            {/* Records Content */}
            {subgroupRecordsQuery.isLoading ? (
              <RecordListSkeleton />
            ) : subgroupRecordsQuery.isError ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-red-500 font-bold">Unable to load records.</p>
                <button
                  onClick={() => subgroupRecordsQuery.refetch()}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Retry
                </button>
              </div>
            ) : filteredRecords.length === 0 ? (
              debouncedSearch || recordFilterStatus ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-semibold text-slate-750">No {terminology.recordPlural.toLowerCase()} found for "{debouncedSearch || 'filter'}"</p>
                  <button
                    onClick={() => { setSearchText(''); setRecordFilterStatus(''); }}
                    className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-705"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center max-w-sm mx-auto">
                  <p className="text-sm font-semibold text-slate-750">No {terminology.recordPlural.toLowerCase()} found</p>
                  <p className="text-xs text-slate-500 mt-1">Add the first {terminology.recordSingular.toLowerCase()} under this {terminology.subgroupSingular.toLowerCase()}.</p>
                  {canCreateRecord && (
                    <button
                      onClick={handleOpenAddRecord}
                      className="mt-4 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors inline-flex items-center gap-1.5 shadow-xs shadow-blue-500/10 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add {terminology.recordSingular}</span>
                    </button>
                  )}
                </div>
              )
            ) : (
              <>
                {/* Mobile View */}
                <div className="mt-4 space-y-3 sm:hidden">
                  {filteredRecords.map((record: any) => (
                    <RecordCardMobile
                      key={record.id}
                      record={record}
                      onView={navigateToRecordDetail}
                      onUpdatePhoto={(rec) => {
                        setSelectedRecordForPhoto(rec);
                        setIsPhotoEditorOpen(true);
                      }}
                      templateFields={resolvedTemplate?.fields || []}
                    />
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block mt-4">
                  <RecordList 
                    recordsList={filteredRecords}
                    isOrganization={isOrganization}
                    isAdmin={isAdmin}
                    onView={navigateToRecordDetail}
                    onEdit={navigateToRecordEdit}
                    onDelete={handleDeleteRecord}
                    onSubmit={handleSubmitRecord}
                    onApprove={handleApproveRecord}
                    onReject={handleRejectRecord}
                    onCorrection={handleCorrectionRecord}
                    templateFields={resolvedTemplate?.fields || []}
                    onUpdatePhoto={(rec) => {
                      setSelectedRecordForPhoto(rec);
                      setIsPhotoEditorOpen(true);
                    }}
                  />
                </div>

                {/* Pagination Controls */}
                {totalRecords > pageSize && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                    <p className="text-xs text-slate-500 font-semibold">
                      Showing {start}–{end} of {totalRecords}
                    </p>
                    <div className="flex gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="h-9 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        disabled={!recordsData?.next}
                        onClick={() => setPage(p => p + 1)}
                        className="h-9 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </section>

      </div>

      {/* Assign Staff Dialog */}
      <AssignStaffDialog
        open={isAssignStaffOpen}
        assignment={selectedAssignment}
        mode="create"
        onOpenChange={(open) => {
          setIsAssignStaffOpen(open);
          if (!open) {
            setSelectedAssignment(null);
          }
        }}
      />

      {/* Add Record & Bulk Upload Modal */}
      <AddRecordModal
        open={isAddRecordOpen}
        onClose={() => setIsAddRecordOpen(false)}
        onOpenChange={setIsAddRecordOpen}
        onSuccess={async () => {
          setIsAddRecordOpen(false);
          await queryClient.invalidateQueries({ queryKey: ["subgroup-records", resolvedGroupId, subgroupId] });
          await queryClient.invalidateQueries({ queryKey: ["subgroup-detail", subgroupId] });
          await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }}
        preselectedGroupId={resolvedGroupId}
        preselectedSubgroupId={subgroupId}
        lockGroup
        lockSubgroup
        initialMode={modalRecordType}
      />

      {/* Capture Photo Modal */}
      {isPhotoEditorOpen && selectedRecordForPhoto && (
        <PhotoEditorModal
          isOpen={isPhotoEditorOpen}
          onClose={() => {
            setIsPhotoEditorOpen(false);
            setSelectedRecordForPhoto(null);
          }}
          record={selectedRecordForPhoto}
          isSchool={user?.organization_type?.toLowerCase() === 'institution'}
          onSuccess={async () => {
            await queryClient.invalidateQueries({ queryKey: ["subgroup-records", resolvedGroupId, subgroupId] });
          }}
        />
      )}
    </div>
  );
}
