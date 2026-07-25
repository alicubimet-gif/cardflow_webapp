'use client';

import React, { useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, Calendar, User, Shield, Info, Loader2, XCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';
import { useGroups } from '@/hooks/queries/useGroups';
import { useAllSubgroups } from '@/hooks/queries/useSubgroups';
import {
  useBranchStaffList,
  useDeleteBranchStaff,
} from '@/hooks/queries/useBranchStaff';
import { useQuery } from '@tanstack/react-query';
import { getStaffList } from '@/api/user.api';
import { BranchStaffFormDialog } from '@/components/branch-staff/BranchStaffFormDialog';
import { useDialog } from '@/hooks/useDialog';
import { useToast } from '@/hooks/useToast';
import { TableSkeleton } from '@/components/ui/Skeletons';

export default function BranchStaffPage() {
  const { user } = useAuth();
  const { groupLabel, groupLabelPlural, subgroupLabel, subgroupLabelPlural } = useOrgLabels(user?.organization_type);
  const dialog = useDialog();
  const { toast } = useToast();

  // Filter and search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [subgroupFilter, setSubgroupFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [viewAssignment, setViewAssignment] = useState<any | null>(null);

  // Queries
  const { data: assignments = [], isLoading, error } = useBranchStaffList({
    search: search.trim() || undefined,
    status: statusFilter || undefined,
    group: groupFilter || undefined,
    sub_group: subgroupFilter || undefined,
    ordering,
  });

  const { data: groupsData } = useGroups();
  const { data: subgroupsData } = useAllSubgroups();
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff-list'],
    queryFn: getStaffList,
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useDeleteBranchStaff();

  const groups = Array.isArray(groupsData)
    ? groupsData
    : (groupsData?.results && Array.isArray(groupsData.results))
      ? groupsData.results
      : [];

  const subgroups = Array.isArray(subgroupsData)
    ? subgroupsData
    : (subgroupsData?.results && Array.isArray(subgroupsData.results))
      ? subgroupsData.results
      : [];

  // Filter subgroup options based on selected branch filter
  const filteredSubgroups = subgroups.filter(
    (sg: any) => !groupFilter || String(sg.group || sg.groupId || sg.group_id) === String(groupFilter)
  );

  const handleDelete = async (item: any) => {
    const confirmed = await dialog.confirm({
      title: 'Remove Assignment?',
      message: `Are you sure you want to remove the assignment for ${item.staff_name}?`,
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(item.id, {
        onSuccess: () => {
          toast('Assignment removed successfully', 'success');
        },
        onError: (err: any) => {
          const data = err?.response?.data;
          toast(data?.detail || data?.message || 'Failed to remove assignment.', 'error');
        },
      });
    }
  };

  const handleEdit = (item: any) => {
    setSelectedAssignment(item);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedAssignment(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Sora' }}>
            Assign {groupLabel} Staff
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage staff assignments to branches and departments.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
        >
          <Plus size={14} />
          Assign Staff
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search staff assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Branch Filter */}
          <div className="relative">
            <select
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setSubgroupFilter('');
              }}
              className="w-full px-3 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="">All {groupLabelPlural}</option>
              {groups.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={subgroupFilter}
              onChange={(e) => setSubgroupFilter(e.target.value)}
              className="w-full px-3 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="">All {subgroupLabelPlural}</option>
              {filteredSubgroups.map((sg: any) => (
                <option key={sg.id} value={sg.id}>
                  {sg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
          <TableSkeleton rows={5} columns={6} />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-200">
          <p className="font-semibold text-sm">Failed to load branch staff assignments. Please try again.</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-xs">
          <p className="text-slate-500 text-sm font-medium">No branch staff assignments found.</p>
          <button
            onClick={handleAdd}
            className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            Assign your first staff member
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{groupLabel}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{subgroupLabel}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-sm">{item.staff_name}</div>
                      <div className="text-xs text-slate-400">{item.staff_email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm font-medium">{item.employee_id}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{item.group_name}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{item.sub_group_name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                        {item.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {item.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{formatDateTime(item.created_at)}</td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => setViewAssignment(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all cursor-pointer inline-flex items-center"
                        title="View Assignment"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all cursor-pointer inline-flex items-center"
                        title="Edit Assignment"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer inline-flex items-center"
                        title="Delete Assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <BranchStaffFormDialog
        open={isFormOpen}
        mode={formMode}
        assignment={selectedAssignment}
        onOpenChange={setIsFormOpen}
      />

      {/* View Detail Modal */}
      {viewAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-[#DFE4EA] flex items-center justify-between">
              <h3 className="font-semibold text-base text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>
                Assignment Details
              </h3>
              <button
                type="button"
                onClick={() => setViewAssignment(null)}
                className="p-2 rounded-xl text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <User className="text-slate-400 mt-0.5" size={16} />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff Information</div>
                  <div className="font-bold text-slate-800 mt-0.5">{viewAssignment.staff_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{viewAssignment.staff_email}</div>
                  <div className="text-xs text-slate-500 mt-0.5">ID: {viewAssignment.employee_id}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-slate-100 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{groupLabel}</div>
                  <div className="font-semibold text-slate-700 mt-1">{viewAssignment.group_name}</div>
                </div>
                <div className="p-3 border border-slate-100 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{subgroupLabel}</div>
                  <div className="font-semibold text-slate-700 mt-1">{viewAssignment.sub_group_name}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-slate-100 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Role</div>
                  <div className="font-semibold text-slate-700 mt-1 capitalize">{viewAssignment.role}</div>
                </div>
                <div className="p-3 border border-slate-100 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                        viewAssignment.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {viewAssignment.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {viewAssignment.remarks && (
                <div className="p-3 border border-slate-100 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remarks</div>
                  <div className="text-slate-600 mt-1">{viewAssignment.remarks}</div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Created By:</span>
                  <span className="text-slate-600 font-semibold">{viewAssignment.assigned_by_email}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Assigned Date:</span>
                  <span className="text-slate-600 font-semibold">{formatDateTime(viewAssignment.created_at)}</span>
                </div>
                {viewAssignment.updated_at && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Last Updated:</span>
                    <span className="text-slate-600 font-semibold">{formatDateTime(viewAssignment.updated_at)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setViewAssignment(null)}
                  className="w-full h-10 border border-[#DFE4EA] hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
