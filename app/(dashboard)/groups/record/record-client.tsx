'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserRound,
  Eye,
  Loader2,
  X,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/useToast';
import { normalizeOrganizationType, ORGANIZATION_CONFIG } from '@/config/organization.config';
import { apiClient, getApiErrorMessage } from '@/api/client';
import { RecordForm } from '@/components/records/RecordForm';
import { IdCardPreview } from '@/components/records/IdCardPreview';
import { PhotoEditorModal } from '@/components/records/PhotoEditorModal';

// Reusable custom Button matching styling specs
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger';
}

function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  let baseClass = "h-10 px-4 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 ";
  if (variant === 'primary') {
    baseClass += "bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/10";
  } else if (variant === 'outline') {
    baseClass += "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs";
  } else if (variant === 'danger') {
    baseClass += "border border-red-200 bg-white hover:bg-red-50 text-red-655 shadow-xs";
  }
  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Compact Status Badge
function RecordStatusBadge({ status }: { status?: string }) {
  const cleanStatus = String(status || 'draft').toLowerCase().replace(/\s+/g, '_');
  let statusClass = 'bg-slate-100 text-slate-600';
  let label = status || 'Draft';

  if (cleanStatus === 'pending_review' || cleanStatus === 'pending') {
    statusClass = 'bg-amber-100 text-amber-700';
    label = 'Pending';
  } else if (cleanStatus === 'approved') {
    statusClass = 'bg-emerald-100 text-emerald-700';
    label = 'Approved';
  } else if (cleanStatus === 'rejected') {
    statusClass = 'bg-red-100 text-red-700';
    label = 'Rejected';
  } else if (cleanStatus === 'draft') {
    statusClass = 'bg-slate-100 text-slate-600';
    label = 'Draft';
  }

  return (
    <span className={`inline-flex h-6 items-center rounded-md px-2 text-[10px] font-semibold uppercase tracking-wide ${statusClass}`}>
      {label}
    </span>
  );
}

// Normalize the Record Response Once
function normalizeRecordDetailResponse(response: any) {
  const payload = (response && typeof response === 'object' && 'config' in response && 'data' in response)
    ? response.data
    : response;

  const fieldValues =
    payload?.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
      ? payload.data
      : {};

  return {
    id: payload?.id ?? null,
    createdAt: payload?.created_at ?? null,
    approvedAt: payload?.approved_at ?? null,
    status:
      payload?.approval_status ??
      payload?.status ??
      "pending_review",
    photoUrl: payload?.photo ?? null,
    fieldValues,
    templateId: payload?.template ?? null,
    organizationId: payload?.organization ?? null,
    groupId: payload?.group ?? null,
    subgroupId:
      payload?.sub_group ??
      payload?.subgroup ??
      null,
    createdBy: payload?.created_by ?? null,
    approvedBy: payload?.approved_by ?? null,
    displayName:
      fieldValues.full_name ??
      fieldValues.name ??
      "Unnamed Record",
  };
}

// Normalize Template Fields Response Once
function normalizeTemplateFieldsResponse(response: any) {
  const payload = (response && typeof response === 'object' && 'config' in response && 'data' in response)
    ? response.data
    : response;

  return {
    templateId:
      payload?.template_id ??
      payload?.template ??
      null,
    hasTemplate:
      payload?.has_template === true ||
      Boolean(payload?.template_id),
    fields: Array.isArray(payload?.fields)
      ? payload.fields
      : [],
    schema: payload?.schema ?? {},
    uiSchema: payload?.uiSchema ?? {},
  };
}

function hasValue(value: unknown) {
  return !(
    value === null ||
    value === undefined ||
    value === ""
  );
}

function formatFieldLabel(fieldId: string) {
  return fieldId
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

// Format Date Helper
function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function RecordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdParam = searchParams.get('groupId');
  const subgroupIdParam = searchParams.get('subgroupId');
  const recordIdParam = searchParams.get('recordId');

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const groupId = String(groupIdParam ?? "");
  const subgroupId = String(subgroupIdParam ?? "");
  const recordId = String(recordIdParam ?? "");

  const orgType = normalizeOrganizationType(user?.organization_type);
  const orgLabels = ORGANIZATION_CONFIG[orgType];

  const terminology = {
    recordSingular: orgLabels.recordLabel,
    recordPlural: orgLabels.recordLabelPlural,
    groupSingular: orgLabels.groupLabel,
    groupPlural: orgLabels.groupLabelPlural,
    subgroupSingular: orgLabels.subgroupLabel,
    subgroupPlural: orgLabels.subgroupLabelPlural,
  };

  // Main Record Detail Query
  const recordQuery = useQuery({
    queryKey: ["record-detail", recordId],
    queryFn: async () => {
      const res = await apiClient.get(`/mobile/records/${recordId}/`);
      return normalizeRecordDetailResponse(res);
    },
    enabled: Boolean(groupIdParam && subgroupIdParam && recordIdParam),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const record = recordQuery.data;

  const normalizedRole = user?.role === 'organization_staff' ? 'staff' : (user?.role === 'organization_admin' ? 'admin' : user?.role);
  const canApprove =
    normalizedRole === "staff" &&
    record !== undefined &&
    record !== null &&
    [
      "pending",
      "pending_review",
      "awaiting_approval",
    ].includes(record.status);

  // Template Fields Query
  const templateFieldsQuery = useQuery({
    queryKey: [
      "template-fields",
      record?.organizationId,
      record?.groupId,
      record?.subgroupId,
    ],
    queryFn: async () => {
      const res = await apiClient.get(`/studio/organizations/${record?.organizationId}/template-fields/`, {
        params: { group: record?.groupId, subgroup: record?.subgroupId }
      });
      return normalizeTemplateFieldsResponse(res);
    },
    enabled: Boolean(
      record?.organizationId &&
      record?.groupId &&
      record?.subgroupId
    ),
    staleTime: 5 * 60 * 1000,
  });

  // Action states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);

  // Template Detail / Preview Query
  const templateQuery = useQuery({
    queryKey: [
      "record-template",
      record?.templateId,
    ],
    queryFn: async () => {
      const res = await apiClient.get(`/mobile/cards/preview/record/${recordId}/`);
      const payload = res.data ?? res;
      return payload.template_version ?? payload;
    },
    enabled: Boolean(record?.templateId && recordId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Other loading states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Mapped list of fields
  const displayFields = useMemo(() => {
    if (!record) return [];
    
    const tFields = templateFieldsQuery.data?.fields ?? [];
    const fieldValues = record.fieldValues;

    return tFields.map((field: any) => {
      const fieldId = field.field_id || field.key || field.id;
      const label = field.label || field.name || formatFieldLabel(fieldId);
      const value = fieldValues[fieldId];

      return {
        id: fieldId,
        label,
        value,
      };
    });
  }, [record, templateFieldsQuery.data]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      return apiClient.patch(`/mobile/records/${recordId}/`, {
        group: record!.groupId,
        sub_group: record!.subgroupId,
        template: record!.templateId,
        data: values,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["record-detail", recordId] });
      queryClient.invalidateQueries({ queryKey: ["subgroup-records", groupId, subgroupId] });
      queryClient.invalidateQueries({ queryKey: ["subgroup-detail", subgroupId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast('Record updated successfully', 'success');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast(getApiErrorMessage(err), 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/mobile/records/${recordId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subgroup-records", groupId, subgroupId] });
      queryClient.invalidateQueries({ queryKey: ["subgroup-detail", subgroupId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast('Record deleted successfully', 'success');
      setIsDeleteOpen(false);
      router.push(`/groups/subgroup?groupId=${encodeURIComponent(groupId)}&subgroupId=${encodeURIComponent(subgroupId)}`);
    },
    onError: (err: any) => {
      toast(getApiErrorMessage(err), 'error');
    }
  });

  if (!groupIdParam || !subgroupIdParam || !recordIdParam) {
    return <div className="p-6 text-sm text-slate-600">Invalid route parameters.</div>;
  }

  const isFromDashboard = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'dashboard';

  const fetchNextPendingAndRedirect = async () => {
    try {
      const res = await apiClient.get('/api/mobile/records/', {
        params: { approval_status: 'pending_review', page_size: 1 }
      });
      const results = res.data?.results || res.data?.records || res.data || [];
      const nextRec = results[0];
      if (nextRec) {
        router.replace(`/groups/record?groupId=${encodeURIComponent(nextRec.group)}&subgroupId=${encodeURIComponent(nextRec.sub_group)}&recordId=${encodeURIComponent(nextRec.id)}&from=dashboard`);
      } else {
        router.replace('/dashboard');
      }
    } catch (err) {
      router.replace('/dashboard');
    }
  };

  const handleNextRecord = async () => {
    try {
      const res = await apiClient.get('/api/mobile/records/', {
        params: { approval_status: 'pending_review', page_size: 5 }
      });
      const results = res.data?.results || res.data?.records || res.data || [];
      const nextRec = results.find((r: any) => String(r.id) !== String(recordId));
      if (nextRec) {
        router.replace(`/groups/record?groupId=${encodeURIComponent(nextRec.group)}&subgroupId=${encodeURIComponent(nextRec.sub_group)}&recordId=${encodeURIComponent(nextRec.id)}&from=dashboard`);
      } else {
        router.replace('/dashboard');
      }
    } catch (err) {
      router.replace('/dashboard');
    }
  };

  const approveMutation = useMutation({
    mutationFn: async (comment?: string) => {
      return apiClient.post(`/mobile/records/${recordId}/approve/`, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["record-detail", recordId] });
      queryClient.invalidateQueries({ queryKey: ["subgroup-records", groupId, subgroupId] });
      queryClient.invalidateQueries({ queryKey: ["approval-logs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast('Record approved successfully', 'success');
      setApproveOpen(false);
      if (isFromDashboard) {
        fetchNextPendingAndRedirect();
      }
    },
    onError: (err: any) => {
      toast(getApiErrorMessage(err), 'error');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      return apiClient.post(`/mobile/records/${recordId}/reject/`, { reason, rejection_reason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["record-detail", recordId] });
      queryClient.invalidateQueries({ queryKey: ["subgroup-records", groupId, subgroupId] });
      queryClient.invalidateQueries({ queryKey: ["approval-logs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast('Record rejected successfully', 'success');
      setRejectOpen(false);
      if (isFromDashboard) {
        fetchNextPendingAndRedirect();
      }
    },
    onError: (err: any) => {
      toast(getApiErrorMessage(err), 'error');
    }
  });

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('record_type', orgType === 'institution' ? 'student' : 'employee');
      formData.append('record_id', recordId);
      formData.append('photo', file);

      await apiClient.post('/mobile/photos/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      queryClient.invalidateQueries({ queryKey: ["record-detail", recordId] });
      queryClient.invalidateQueries({ queryKey: ["subgroup-records", groupId, subgroupId] });
      toast('Photo updated successfully', 'success');
    } catch (err: any) {
      toast(getApiErrorMessage(err), 'error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleEditSubmit = async (payload: any, processedBlob: Blob | null) => {
    if (processedBlob) {
      try {
        const formData = new FormData();
        formData.append('record_type', orgType === 'institution' ? 'student' : 'employee');
        formData.append('record_id', recordId);
        formData.append('photo', processedBlob, 'processed_profile_photo.jpg');
        await apiClient.post('/mobile/photos/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err: any) {
        toast('Photo upload failed, but saving record...', 'warning');
      }
    }
    updateMutation.mutate(payload);
  };

  function handleViewCard() {
    document
      .getElementById("card-preview")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  const isTemplateLoading = Boolean(
    record?.organizationId &&
    record?.groupId &&
    record?.subgroupId &&
    templateFieldsQuery.isLoading
  );

  // Loading Skeletons
  if (recordQuery.isLoading || isTemplateLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 animate-pulse">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 space-y-4">
          <div className="h-4 bg-slate-200 rounded-md w-1/3" />
          <div className="h-32 bg-white rounded-2xl border border-slate-200" />
          <div className="h-64 bg-white rounded-2xl border border-slate-200" />
        </div>
      </div>
    );
  }

  // Error State
  if (recordQuery.isError || !record) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-md shadow-sm">
          <p className="text-sm font-semibold text-red-700">Unable to load record details.</p>
          <Button type="button" variant="outline" onClick={() => recordQuery.refetch()} className="mt-4 mx-auto">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const recordName = record.displayName;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-24 sm:px-6 sm:pt-6">
        
        {/* Hidden File Input for Camera/File upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          capture="user"
          className="hidden"
        />

        {/* Main Record Header Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            
            {/* Photo / Avatar */}
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
              {record.photoUrl ? (
                <img
                  src={record.photoUrl}
                  alt={`${recordName} profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-10 w-10 text-slate-500" />
              )}
              {photoUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Record Info & Actions */}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {terminology.recordSingular}
              </p>

              <h1 className="mt-1 break-words text-xl font-bold text-slate-900 sm:text-2xl">
                {recordName}
              </h1>

              {record.groupId && (
                <p className="mt-1.5 text-sm text-slate-500 font-medium">
                  {terminology.groupSingular} – {terminology.subgroupSingular}
                </p>
              )}

              <div className="mt-3">
                <RecordStatusBadge status={record.status} />
              </div>

              {/* Action Buttons */}
              <div className="mt-4">
                {/* Mobile action grid */}
                <div className="grid grid-cols-2 gap-2 sm:hidden">
                  <Button type="button" variant="outline" onClick={handleViewCard}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Card
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsPhotoEditorOpen(true)}>
                    Capture Photo
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push(`/groups/record/edit?groupId=${encodeURIComponent(groupId)}&subgroupId=${encodeURIComponent(subgroupId)}&recordId=${encodeURIComponent(recordId)}`)}>
                    Edit
                  </Button>
                  <Button type="button" variant="danger" onClick={() => setIsDeleteOpen(true)}>
                    Delete
                  </Button>
                </div>

                {/* Desktop action row */}
                <div className="hidden sm:flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handleViewCard}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Card
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsPhotoEditorOpen(true)}>
                    Capture Photo
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push(`/groups/record/edit?groupId=${encodeURIComponent(groupId)}&subgroupId=${encodeURIComponent(subgroupId)}&recordId=${encodeURIComponent(recordId)}`)}>
                    Edit Record
                  </Button>
                  <Button type="button" variant="danger" onClick={() => setIsDeleteOpen(true)}>
                    Delete
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Dynamic Fields Section */}
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-slate-900">
            {terminology.recordSingular} Details
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {displayFields.map((field: any) => (
              <div
                key={field.id}
                className="rounded-xl bg-slate-50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {field.label}
                </p>

                <p className="mt-1 break-words text-sm font-medium text-slate-900">
                  {hasValue(field.value)
                    ? String(field.value)
                    : "Not provided"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Inline Card Preview Section */}
        <section
          id="card-preview"
          className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Card Preview
            </h2>
            {record.templateId && templateQuery.data && (
              !(
                String((templateQuery.data.canvas_json?.sides || templateQuery.data.sides || '2')) === '1' ||
                String((templateQuery.data.canvas_json?.sides || templateQuery.data.sides || '')).toLowerCase() === 'single'
              )
            ) && (
              <p className="mt-1 text-xs text-slate-500">
                Front and back preview
              </p>
            )}
          </div>

          <div className="mt-4">
            {!record.templateId ? (
              <div className="flex min-h-32 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-500 italic">No template is assigned to this record.</p>
              </div>
            ) : templateQuery.isLoading ? (
              <div className="flex min-h-64 items-center justify-center rounded-xl bg-slate-50">
                <p className="text-sm text-slate-500 animate-pulse">Loading card preview...</p>
              </div>
            ) : templateQuery.isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">Unable to load the assigned template.</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => templateQuery.refetch()}
                  className="mt-3"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <InlineRecordCardPreview
                template={templateQuery.data}
                fieldValues={record.fieldValues}
                photoUrl={record.photoUrl}
                isSchool={orgType === 'institution'}
              />
            )}
          </div>

          {/* Action buttons inside Card Preview Section */}
          {canApprove ? (
            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 animate-in fade-in duration-200">
              {isFromDashboard && (
                <button
                  type="button"
                  onClick={handleNextRecord}
                  className="h-10 w-full sm:w-auto px-4 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center sm:mr-auto"
                >
                  Next Record
                </button>
              )}
              <div className="flex gap-4 sm:justify-end">
                <button
                  type="button"
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  onClick={() => setRejectOpen(true)}
                  className="h-10 flex-1 sm:flex-initial sm:min-w-[120px] text-xs font-bold border border-red-300 text-red-650 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  onClick={() => setApproveOpen(true)}
                  className="h-10 flex-1 sm:flex-initial sm:min-w-[120px] text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          ) : (
            normalizedRole === "staff" && (
              <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                {record.status === "approved" && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approved</span>
                  </span>
                )}
                {record.status === "rejected" && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-750 shadow-2xs">
                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                    <span>Rejected</span>
                  </span>
                )}
              </div>
            )
          )}
        </section>

        {/* Metadata Section */}
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Metadata Trail
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Administrative tracking information
            </p>
          </div>
          
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-3.5 py-3 border border-slate-100">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 block">Created</span>
              <span className="mt-1 text-xs font-semibold text-slate-955 block">{formatDate(record.createdAt) || '—'}</span>
            </div>
            <div className="rounded-xl bg-slate-50 px-3.5 py-3 border border-slate-100">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 block">Updated</span>
              <span className="mt-1 text-xs font-semibold text-slate-955 block">{formatDate(record.approvedAt) || '—'}</span>
            </div>
            <div className="rounded-xl bg-slate-50 px-3.5 py-3 border border-slate-100">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 block">Record Serial ID</span>
              <span className="mt-1 text-xs font-semibold text-slate-955 block truncate">{record.id || '—'}</span>
            </div>
          </div>
        </section>

      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-[calc(100vw-24px)] max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900">
              Delete &ldquo;{recordName}&rdquo;?
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                className="h-10 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="h-10 text-xs bg-red-600 hover:bg-red-750 text-white shadow-xs shadow-red-500/10"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-[calc(100vw-24px)] max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900">
              Approve this {terminology.recordSingular.toLowerCase()} record?
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              This will mark the record as approved.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApproveOpen(false)}
                className="h-10 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={approveMutation.isPending || rejectMutation.isPending}
                onClick={() => approveMutation.mutate("Approved")}
                className="h-10 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve Record'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectOpen && (
        <RejectModal
          isOpen={rejectOpen}
          onClose={() => setRejectOpen(false)}
          onConfirm={(reason) => rejectMutation.mutate(reason)}
          isPending={rejectMutation.isPending || approveMutation.isPending}
          terminology={terminology}
        />
      )}

      {/* Dynamic Edit Record Form Modal */}
      {isEditOpen && (
        <RecordForm
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleEditSubmit}
          editingRecord={record}
          requiredFields={
            (templateFieldsQuery.data?.fields ?? []).map((d: any) => ({
              ...d,
              key: d.field_id || d.key || d.id
            }))
          }
          prefilledValues={record.fieldValues}
          isSchool={orgType === 'institution'}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Capture Photo editor modal */}
      {isPhotoEditorOpen && (
        <PhotoEditorModal
          isOpen={isPhotoEditorOpen}
          onClose={() => setIsPhotoEditorOpen(false)}
          record={record}
          isSchool={orgType === 'institution'}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["record-detail", recordId] });
            queryClient.invalidateQueries({ queryKey: ["subgroup-records", groupId, subgroupId] });
          }}
          templateVersion={templateQuery.data}
        />
      )}
    </div>
  );
}

// Reusable Reject Modal Component with Reason Validation
function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  terminology
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
  terminology: any;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-[calc(100vw-24px)] max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-base font-bold text-slate-900">
          Reject this {terminology.recordSingular.toLowerCase()} record?
        </h3>
        
        <div className="mt-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter rejection reason"
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 text-xs font-semibold text-slate-900 bg-white"
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending || !reason.trim()}
            onClick={() => onConfirm(reason)}
            className="h-10 text-xs bg-red-600 hover:bg-red-755 text-white shadow-xs disabled:opacity-50"
          >
            {isPending ? 'Rejecting...' : 'Reject Record'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Inline Record Card Preview Component
function InlineRecordCardPreview({
  template,
  fieldValues,
  photoUrl,
  isSchool
}: {
  template: any;
  fieldValues: any;
  photoUrl: string | null;
  isSchool: boolean;
}) {
  const [side, setSide] = useState<'FRONT' | 'BACK'>('FRONT');

  if (!template) return null;

  const templateVersion = template.active_version || template.approved_version || template.current_version || template;

  const isSingleSided = templateVersion
    ? String(templateVersion.canvas_json?.sides || templateVersion.sides || '2') === '1' ||
      String(templateVersion.canvas_json?.sides || templateVersion.sides || '').toLowerCase() === 'single'
    : true;

  const isDoubleSided = !isSingleSided;

  const recordMock = {
    record_type: isSchool ? 'student' : 'employee',
    photoUrl,
    photo_url: photoUrl,
    ...fieldValues
  };

  if (!isDoubleSided) {
    return (
      <div className="flex justify-center w-full animate-in fade-in duration-200">
        <div className="origin-top scale-[0.72] sm:scale-90 lg:scale-100">
          <IdCardPreview
            record={recordMock}
            templateVersion={templateVersion}
            side="FRONT"
            displayWidth={280}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      
      {/* Side Selector Tabs on Mobile/Tablet */}
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setSide('FRONT')}
          className={`h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            side === 'FRONT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setSide('BACK')}
          className={`h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            side === 'BACK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Back
        </button>
      </div>

      {/* Grid container: double-sided shows grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        
        {/* Front Side Block */}
        <div className={`min-w-0 ${side !== 'FRONT' ? 'hidden lg:block' : 'block'}`}>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500 text-center lg:text-left">
            Front Side
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mx-auto flex w-full justify-center">
              <div className="origin-top scale-[0.72] sm:scale-90 lg:scale-100">
                <IdCardPreview
                  record={recordMock}
                  templateVersion={templateVersion}
                  side="FRONT"
                  displayWidth={280}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Back Side Block */}
        <div className={`min-w-0 ${side !== 'BACK' ? 'hidden lg:block' : 'block'}`}>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500 text-center lg:text-left">
            Back Side
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mx-auto flex w-full justify-center">
              <div className="origin-top scale-[0.72] sm:scale-90 lg:scale-100">
                <IdCardPreview
                  record={recordMock}
                  templateVersion={templateVersion}
                  side="BACK"
                  displayWidth={280}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
