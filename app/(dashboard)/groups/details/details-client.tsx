'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';
import { useGroupDetail } from '@/hooks/queries/useGroups';
import { useSubgroups, useDeleteSubgroup, useCreateSubgroup, useUpdateSubgroup } from '@/hooks/queries/useSubgroups';
import { AssignStaffDialog } from '@/components/staff/AssignStaffDialog';
import { useDialog } from '@/hooks/useDialog';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  Plus, 
  Loader2, 
  AlertCircle, 
  FolderOpen, 
  X 
} from 'lucide-react';
import { SubgroupCardMobile } from '@/components/group/SubgroupCardMobile';
import { SubgroupTableDesktop } from '@/components/group/SubgroupTableDesktop';
import { TableSkeleton } from '@/components/ui/Skeletons';

// Skeletons
function SubgroupCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        <div className="h-6 w-16 bg-slate-200 rounded-full shrink-0"></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-14 bg-slate-100 rounded-xl"></div>
        <div className="h-14 bg-slate-100 rounded-xl"></div>
      </div>
      <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
    </div>
  );
}

function SubgroupTableSkeleton() {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden animate-pulse bg-white">
      <div className="h-11 bg-slate-50 border-b border-slate-100 flex items-center px-4">
        <div className="h-4 bg-slate-200 rounded w-16"></div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex px-4 py-4 items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-[25%]"></div>
            <div className="h-4 bg-slate-200 rounded w-[15%]"></div>
            <div className="h-4 bg-slate-200 rounded w-[15%]"></div>
            <div className="h-4 bg-slate-200 rounded w-[15%]"></div>
            <div className="h-4 bg-slate-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function GroupDetailsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');

  const dialog = useDialog();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { groupLabel, groupLabelPlural, subgroupLabel, subgroupLabelPlural, recordLabel, recordLabelPlural } = useOrgLabels(user?.organization_type);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SUBSCRIBER_ADMIN' || user?.role === 'ORGANIZATION_ADMIN' || user?.role === 'organization_admin';

  // Terminology Object
  const terminology = {
    groupSingular: groupLabel,
    groupPlural: groupLabelPlural,
    subgroupSingular: subgroupLabel,
    subgroupPlural: subgroupLabelPlural,
    recordSingular: recordLabel,
    recordPlural: recordLabelPlural,
  };

  // Search input and debounce
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  // Queries
  const { data: groupDetail, isLoading: isDetailLoading } = useGroupDetail(groupId || '');
  const { data: fetchedSubgroups, isLoading: isSubgroupsLoading, isFetching: isSubgroupsFetching, error: subgroupsError } = useSubgroups(
    groupId || '',
    { search: debouncedSearch },
    { placeholderData: (prev: any) => prev, enabled: Boolean(groupId) }
  );

  // Mutations
  const deleteSubgroupMutation = useDeleteSubgroup(groupId || '');
  const createSubgroupMutation = useCreateSubgroup(groupId || '');
  const updateSubgroupMutation = useUpdateSubgroup(groupId || '');

  // Dialog & drop menu states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSubGroup, setSelectedSubGroup] = useState<any | null>(null);

  // Staff Assignment Dialog states
  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [formError, setFormError] = useState<string | null>(null);

  if (!groupId) {
    return <div className="p-6 text-sm text-slate-600">Invalid route parameters. missing groupId.</div>;
  }

  const groupName = groupDetail?.name || '—';
  
  const rawSubgroups = (fetchedSubgroups as any) || [];
  const groupSubgroups = Array.isArray(rawSubgroups)
    ? rawSubgroups
    : (rawSubgroups.results && Array.isArray(rawSubgroups.results))
      ? rawSubgroups.results
      : [];

  const handleAddSubgroup = () => {
    setModalMode('create');
    setSelectedSubGroup(null);
    setFormName('');
    setFormStatus('active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleEditSubgroup = (subgroup: any) => {
    setModalMode('edit');
    setSelectedSubGroup(subgroup);
    setFormName(subgroup.name || '');
    setFormStatus(subgroup.status || 'active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteSubgroup = async (sub: any) => {
    const confirmed = await dialog.confirm({
      title: `Delete "${sub.name}" ${terminology.subgroupSingular.toLowerCase()}?`,
      message: `This action cannot be undone. All records nested within this ${terminology.subgroupSingular.toLowerCase()} will be affected.`,
      variant: 'danger',
    });
    if (confirmed) {
      deleteSubgroupMutation.mutate(sub.id, {
        onSuccess: async () => {
          toast(`${terminology.subgroupSingular} deleted successfully`, 'success');
          await queryClient.invalidateQueries({ queryKey: ["subgroups", groupId] });
          await queryClient.invalidateQueries({ queryKey: ["group", groupId] });
        },
        onError: (err: any) => {
          const data = err?.response?.data;
          toast(data?.detail || data?.message || `Failed to delete ${terminology.subgroupSingular.toLowerCase()}.`, 'error');
        }
      });
    }
  };

  const handleSaveSubgroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError(`${terminology.subgroupSingular} Name is required.`);
      return;
    }

    const payload = {
      name: formName.trim(),
      status: formStatus as 'active' | 'inactive',
      group: groupId
    };

    const options = {
      onSuccess: async () => {
        toast(`${terminology.subgroupSingular} saved successfully`, 'success');
        await queryClient.invalidateQueries({ queryKey: ["subgroups", groupId] });
        await queryClient.invalidateQueries({ queryKey: ["group", groupId] });
        setIsModalOpen(false);
      },
      onError: (err: any) => {
        const responseData = err?.response?.data;
        if (responseData && typeof responseData === 'object') {
          const errSource = responseData.errors || responseData;
          const firstErr = Object.values(errSource)[0];
          setFormError(Array.isArray(firstErr) ? String(firstErr[0]) : String(firstErr));
        } else {
          setFormError('An error occurred. Please try again.');
        }
      }
    };

    if (modalMode === 'edit' && selectedSubGroup?.id) {
      updateSubgroupMutation.mutate({ id: selectedSubGroup.id, payload }, options);
    } else {
      createSubgroupMutation.mutate(payload, options);
    }
  };

  const isPageLoading = isDetailLoading || (isSubgroupsLoading && groupSubgroups.length === 0);
  const isLoadingData = isSubgroupsLoading || isSubgroupsFetching;

  if (isPageLoading) {
    return (
      <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
        <div className="w-1/3 h-10 bg-slate-200 rounded-md mb-6"></div>
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  // Summary counts
  const summary = {
    subgroupCount: groupSubgroups.filter((s: any) => s.status === 'active').length,
    recordCount: groupDetail?.record_count ?? 0,
    staffCount: groupDetail?.staff_count ?? 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 space-y-4">

        {/* 5. Header Card */}
        <section className="mt-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-450">
                {terminology.groupSingular}
              </p>
              <h1 className="mt-1 break-words text-xl font-bold leading-tight text-slate-900 sm:text-2xl" style={{ fontFamily: 'Sora, sans-serif' }}>
                {groupName}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Manage {terminology.subgroupPlural.toLowerCase()} for this {terminology.groupSingular.toLowerCase()}
              </p>
            </div>

            {/* 6. Search and Add Sub Group */}
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <div className="relative min-w-0 flex-1 lg:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${terminology.subgroupPlural.toLowerCase()}`}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {isAdmin && (
                <button
                  onClick={handleAddSubgroup}
                  className="h-11 w-full rounded-xl px-4 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer sm:w-auto flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus size={16} />
                  <span>Add {terminology.subgroupSingular}</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 7. Summary Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Active {terminology.subgroupPlural}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{summary.subgroupCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total {terminology.recordPlural}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{summary.recordCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Assigned Staff</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{summary.staffCount}</p>
          </div>
        </div>

        {/* Table/Card switching state */}
        {isLoadingData && groupSubgroups.length === 0 ? (
          <>
            <div className="space-y-3 sm:hidden">
              {Array.from({ length: 3 }).map((_, index) => (
                <SubgroupCardSkeleton key={index} />
              ))}
            </div>
            <div className="hidden sm:block">
              <SubgroupTableSkeleton />
            </div>
          </>
        ) : subgroupsError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-700 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Failed to load {terminology.subgroupPlural.toLowerCase()}.</p>
              <p className="mt-0.5 text-rose-600">Please verify connection or try again.</p>
            </div>
          </div>
        ) : groupSubgroups.length === 0 ? (
          /* 14. Empty State Card */
          debouncedSearch ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center shadow-xs">
              <Search className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                No {terminology.subgroupPlural.toLowerCase()} found for "{debouncedSearch}"
              </h3>
              <button
                onClick={() => setSearchText('')}
                className="mt-4 mx-auto h-9 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Clear Search</span>
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center shadow-xs">
              <FolderOpen className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                No {terminology.subgroupPlural.toLowerCase()} found
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-xs mx-auto">
                Create the first {terminology.subgroupSingular.toLowerCase()} under {groupName}.
              </p>
              {isAdmin && (
                <button
                  onClick={handleAddSubgroup}
                  className="mt-4 mx-auto h-9 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add {terminology.subgroupSingular}</span>
                </button>
              )}
            </div>
          )
        ) : (
          <>
            {/* 8. Mobile Sub Group Card list */}
            <div className="sm:hidden">
              <SubgroupCardMobile
                subgroupsList={groupSubgroups}
                terminology={terminology}
                groupId={groupId}
                router={router}
                onEdit={handleEditSubgroup}
                onDelete={handleDeleteSubgroup}
              />
            </div>

            {/* 10. Desktop Table list */}
            <div className="hidden sm:block">
              <SubgroupTableDesktop
                subgroupsList={groupSubgroups}
                terminology={terminology}
                groupId={groupId}
                router={router}
                onEdit={handleEditSubgroup}
                onDelete={handleDeleteSubgroup}
                onAssignStaff={(subgroup: any) => {
                  setSelectedAssignment({ group_id: groupId, subgroup: subgroup.id });
                  setIsAssignStaffOpen(true);
                }}
                isAdmin={isAdmin}
              />
            </div>
          </>
        )}
      </div>

      {/* 16. Add / Edit Sub Group Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <form 
            onSubmit={handleSaveSubgroup}
            className="bg-white border border-slate-200 rounded-2xl shadow-xl w-[calc(100vw-24px)] max-w-[520px] max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#DFE4EA] flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="text-sm font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
                {modalMode === 'create' ? 'Add' : 'Edit'} {terminology.subgroupSingular}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="font-semibold">{formError}</div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {terminology.subgroupSingular} Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={`Enter ${terminology.subgroupSingular.toLowerCase()} name`}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 px-3 border border-[#DFE4EA] rounded-xl text-xs font-semibold text-[#0B0F19] focus:outline-none focus:border-[#2563EB] bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full h-10 px-3 border border-[#DFE4EA] rounded-xl text-xs font-semibold text-[#0B0F19] focus:outline-none focus:border-[#2563EB] bg-white cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 border-t border-[#DFE4EA] bg-white px-6 py-4">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubgroupMutation.isPending || updateSubgroupMutation.isPending}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {(createSubgroupMutation.isPending || updateSubgroupMutation.isPending) ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save {terminology.subgroupSingular}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

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
    </div>
  );
}
