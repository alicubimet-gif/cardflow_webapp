'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';
import { useGroups, useDeleteGroup, useCreateGroup, useUpdateGroup } from '@/hooks/queries/useGroups';
import { AssignStaffDialog } from '@/components/staff/AssignStaffDialog';
import { useDialog } from '@/hooks/useDialog';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Users, 
  Loader2, 
  AlertCircle,
  FolderOpen,
  X
} from 'lucide-react';

import { GroupCardMobile } from '@/components/group/GroupCardMobile';
import { GroupTableDesktop } from '@/components/group/GroupTableDesktop';

// Skeletons
function GroupCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
        </div>
        <div className="h-9 w-9 bg-slate-200 rounded-lg shrink-0"></div>
      </div>
      <div className="h-10 bg-slate-100 rounded-xl"></div>
      <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
    </div>
  );
}

function GroupTableSkeleton() {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden animate-pulse bg-white">
      <div className="h-11 bg-slate-50 border-b border-slate-100 flex items-center px-4">
        <div className="h-4 bg-slate-200 rounded w-12"></div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex px-4 py-4 items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-[35%]"></div>
            <div className="h-4 bg-slate-200 rounded w-[20%]"></div>
            <div className="h-4 bg-slate-200 rounded w-[15%]"></div>
            <div className="h-4 bg-slate-200 rounded w-8"></div>
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

export default function GroupsPage() {
  const router = useRouter();
  const dialog = useDialog();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { groupLabel, groupLabelPlural, subgroupLabel, subgroupLabelPlural } = useOrgLabels(user?.organization_type);

  // Terminology Object
  const terminology = {
    groupSingular: groupLabel,
    groupPlural: groupLabelPlural,
    subgroupSingular: subgroupLabel,
    subgroupPlural: subgroupLabelPlural,
  };

  // Search debouncing states
  const [searchVal, setSearchVal] = useState('');
  const debouncedSearch = useDebouncedValue(searchVal.trim(), 300);

  // Fetch groups query
  const { data: fetchedGroups, isLoading, isFetching, error } = useGroups(
    { search: debouncedSearch },
    { placeholderData: (prev: any) => prev }
  );
  const normalizeGroupsResponse = (response: any) => {
    const payload =
      response?.data?.data ??
      response?.data ??
      response ??
      [];

    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.results)) {
        return payload.results;
      }
      if (Array.isArray(payload.groups)) {
        return payload.groups;
      }
    }

    return [];
  };

  const groupsList = normalizeGroupsResponse(fetchedGroups);

  // Mutations
  const deleteMutation = useDeleteGroup();
  const createMutation = useCreateGroup();
  const updateMutation = useUpdateGroup();

  // Dialog & drop menu states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

  // Staff Assignment Dialog states
  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);

  // Modal form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [formError, setFormError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Handle outside click to close dropdown menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedGroup(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormStatus('active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (group: any) => {
    setModalMode('edit');
    setSelectedGroup(group);
    setFormName(group.name || '');
    setFormCode(group.code || '');
    setFormDescription(group.description || '');
    setFormStatus(group.status || 'active');
    setFormError(null);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = async (group: any) => {
    setActiveMenuId(null);
    const confirmed = await dialog.confirm({
      title: `Delete "${group.name}" ${terminology.groupSingular.toLowerCase()}?`,
      message: `This action cannot be undone. All subgroups and records nested within this ${terminology.groupSingular.toLowerCase()} will be affected.`,
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(group.id, {
        onSuccess: async () => {
          toast(`${terminology.groupSingular} deleted successfully`, 'success');
          await queryClient.invalidateQueries({ queryKey: ["groups"] });
        },
        onError: (err: any) => {
          const data = err?.response?.data;
          toast(data?.detail || data?.message || `Failed to delete ${terminology.groupSingular.toLowerCase()}.`, 'error');
        },
      });
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError(`${terminology.groupSingular} Name is required.`);
      return;
    }

    const payload = {
      name: formName.trim(),
      code: formCode.trim(),
      description: formDescription.trim(),
      status: formStatus
    };

    const options = {
      onSuccess: async () => {
        toast(`${terminology.groupSingular} saved successfully`, 'success');
        await queryClient.invalidateQueries({ queryKey: ["groups"] });
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

    if (modalMode === 'edit' && selectedGroup?.id) {
      updateMutation.mutate({ id: selectedGroup.id, payload }, options);
    } else {
      createMutation.mutate(payload, options);
    }
  };

  const isLoadingData = isLoading || isFetching;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 space-y-4">

        {/* 4. Page Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl" style={{ fontFamily: 'Sora, sans-serif' }}>
                {terminology.groupPlural}
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Manage your organization’s {terminology.groupPlural.toLowerCase()}
              </p>
            </div>
            
            <button
              onClick={openCreateModal}
              className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 hidden sm:flex shadow-xs"
            >
              <Plus size={16} />
              <span>Add {terminology.groupSingular}</span>
            </button>
          </div>

          {/* 5. Search and Add Button Mobile Layout */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder={`Search ${terminology.groupPlural.toLowerCase()}`}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => setSearchVal('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={openCreateModal}
              className="h-11 w-full rounded-xl px-4 text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer sm:w-auto flex items-center justify-center gap-1.5 sm:hidden shadow-xs"
            >
              <Plus size={16} />
              <span>Add {terminology.groupSingular}</span>
            </button>
          </div>
        </div>

        {/* Loading State Skeleton Rendering */}
        {isLoadingData && groupsList.length === 0 ? (
          <>
            <div className="space-y-3 sm:hidden">
              {Array.from({ length: 3 }).map((_, index) => (
                <GroupCardSkeleton key={index} />
              ))}
            </div>
            <div className="hidden sm:block">
              <GroupTableSkeleton />
            </div>
          </>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-700 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Failed to load {terminology.groupPlural.toLowerCase()}.</p>
              <p className="mt-0.5 text-rose-600">Please verify connection or try again.</p>
            </div>
          </div>
        ) : groupsList.length === 0 ? (
          debouncedSearch ? (
            /* Search Empty State */
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center shadow-xs">
              <Search className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                No {terminology.groupPlural.toLowerCase()} found for "{debouncedSearch}"
              </h3>
              <button
                onClick={() => {
                  setSearchVal('');
                }}
                className="mt-4 mx-auto h-9 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Clear Search</span>
              </button>
            </div>
          ) : (
            /* 11. Global Empty State Card */
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center shadow-xs">
              <FolderOpen className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                No {terminology.groupPlural.toLowerCase()} found
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-xs mx-auto">
                Create your first {terminology.groupSingular.toLowerCase()} to organize {terminology.subgroupPlural.toLowerCase()}.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 mx-auto h-9 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add {terminology.groupSingular}</span>
              </button>
            </div>
          )
        ) : (
          <>
            <div className="sm:hidden">
              <GroupCardMobile
                groupsList={groupsList}
                terminology={terminology}
                router={router}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onAssignStaff={(group: any) => {
                  setSelectedAssignment(group);
                  setIsAssignStaffOpen(true);
                }}
              />
            </div>

            <div className="hidden sm:block">
              <GroupTableDesktop
                groupsList={groupsList}
                terminology={terminology}
                router={router}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onAssignStaff={(group: any) => {
                  setSelectedAssignment(group);
                  setIsAssignStaffOpen(true);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* 10. Add / Edit Group Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <form 
            onSubmit={handleSaveGroup}
            className="bg-white border border-slate-200 rounded-2xl shadow-xl w-[calc(100vw-24px)] max-w-[520px] max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#DFE4EA] flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="text-sm font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
                {modalMode === 'create' ? 'Add' : 'Edit'} {terminology.groupSingular}
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
                  {terminology.groupSingular} Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={`Enter ${terminology.groupSingular.toLowerCase()} name`}
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save {terminology.groupSingular}</span>
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
