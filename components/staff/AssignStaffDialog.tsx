import React, { useEffect, useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';
import { useQuery } from '@tanstack/react-query';
import { useGroups } from '@/hooks/queries/useGroups';
import { subgroupApi } from '@/api/subgroup.api';
import { getStaffList } from '@/api/user.api';
import { useCreateStaffAssignment, useUpdateStaffAssignment } from '@/hooks/queries/useStaffAssignments';
import { useToast } from '@/hooks/useToast';
import { cleanText } from '@/utils/validation';

export interface AssignStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: any | null;
  mode?: 'create' | 'edit';
}

export function AssignStaffDialog({
  open,
  onOpenChange,
  assignment,
  mode = 'create',
}: AssignStaffDialogProps) {
  const { user } = useAuth();
  const { groupLabel, subgroupLabel, subgroupLabelPlural } = useOrgLabels(user?.organization_type);
  const { toast } = useToast();

  // Form states
  const [staffId, setStaffId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [subGroupId, setSubGroupId] = useState('');
  const [role, setRole] = useState('staff');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [remarks, setRemarks] = useState('');

  // Error states
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dropdown Queries
  const { data: groupsData = [] } = useGroups({}, { enabled: open });
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff-list'],
    queryFn: getStaffList,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Dynamic Sub Groups Query
  const { data: dynamicSubgroupsRaw, isLoading: isSubgroupsLoading } = useQuery({
    queryKey: ['sub-groups', 'list-by-group', groupId],
    queryFn: () => subgroupApi.list({ group: groupId }),
    enabled: open && Boolean(groupId),
  });

  const dynamicSubgroups = Array.isArray(dynamicSubgroupsRaw)
    ? dynamicSubgroupsRaw
    : (dynamicSubgroupsRaw?.results && Array.isArray(dynamicSubgroupsRaw.results))
      ? dynamicSubgroupsRaw.results
      : [];

  const groups = Array.isArray(groupsData)
    ? groupsData
    : (groupsData?.results && Array.isArray(groupsData.results))
      ? groupsData.results
      : [];

  const createMutation = useCreateStaffAssignment();
  const updateMutation = useUpdateStaffAssignment();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Prefill form
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && assignment) {
        setStaffId(assignment.staff ?? '');
        setGroupId(assignment.group ?? '');
        setSubGroupId(assignment.subgroup || assignment.sub_group || '');
        setRole(assignment.role ?? 'staff');
        setStatus(assignment.status === 'inactive' ? 'inactive' : 'active');
        setRemarks(assignment.remarks ?? '');
      } else {
        setStaffId('');
        // If we passed an initial group/branch ID (e.g. from page context)
        if (assignment && typeof assignment === 'object' && assignment.group_id) {
          setGroupId(assignment.group_id);
        } else if (assignment && typeof assignment === 'object' && assignment.id) {
          setGroupId(assignment.id);
        } else {
          setGroupId('');
        }
        setSubGroupId('');
        setRole('staff');
        setStatus('active');
        setRemarks('');
      }
      setErrors({});
    }
  }, [open, mode, assignment]);

  const handleClose = () => onOpenChange(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!staffId) newErrors.staff = 'Staff member is required.';
    if (!groupId) newErrors.group = `${groupLabel} is required.`;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      staff: staffId,
      group: groupId,
      sub_group: subGroupId || null,
      role,
      status,
      remarks: cleanText(remarks),
    };

    const options = {
      onSuccess: () => {
        toast(`Staff assignment ${mode === 'edit' ? 'updated' : 'assigned'} successfully`, 'success');
        handleClose();
      },
      onError: (err: any) => {
        const data = err?.response?.data;
        if (data && typeof data === 'object') {
          const mappedErrors: Record<string, string> = {};
          if (data.staff) mappedErrors.staff = Array.isArray(data.staff) ? data.staff[0] : data.staff;
          if (data.group) mappedErrors.group = Array.isArray(data.group) ? data.group[0] : data.group;
          if (data.sub_group || data.subgroup) {
            const sgErr = data.sub_group || data.subgroup;
            mappedErrors.sub_group = Array.isArray(sgErr) ? sgErr[0] : sgErr;
          }
          if (data.role) mappedErrors.role = Array.isArray(data.role) ? data.role[0] : data.role;
          if (data.status) mappedErrors.status = Array.isArray(data.status) ? data.status[0] : data.status;
          
          if (Object.keys(mappedErrors).length > 0) {
            setErrors(mappedErrors);
          } else {
            toast(data.detail || data.message || 'An error occurred. Please try again.', 'error');
          }
        } else {
          toast('An error occurred. Please try again.', 'error');
        }
      },
    };

    if (mode === 'edit' && assignment) {
      updateMutation.mutate({ id: assignment.id, payload }, options);
    } else {
      createMutation.mutate(payload, options);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Assignment' : 'Assign Staff'}</DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <XCircle size={20} />
          </button>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Staff Member
            </label>
            <select
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                if (errors.staff) setErrors((prev) => ({ ...prev, staff: '' }));
              }}
              disabled={mode === 'edit'}
              className="w-full h-11 px-4 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] bg-white cursor-pointer transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Staff</option>
              {staffList.map((st: any) => (
                <option key={st.id} value={st.id}>
                  {st.first_name || st.last_name ? `${st.first_name} ${st.last_name} (${st.email})` : st.username || st.email}
                </option>
              ))}
            </select>
            {errors.staff && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.staff}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              {groupLabel}
            </label>
            <select
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                setSubGroupId('');
                if (errors.group) setErrors((prev) => ({ ...prev, group: '' }));
              }}
              className="w-full h-11 px-4 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] bg-white cursor-pointer transition-all"
            >
              <option value="">Select {groupLabel}</option>
              {groups.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {errors.group && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.group}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              {subgroupLabel} (Optional)
            </label>
            <select
              value={subGroupId}
              onChange={(e) => {
                setSubGroupId(e.target.value);
                if (errors.sub_group) setErrors((prev) => ({ ...prev, sub_group: '' }));
              }}
              disabled={!groupId || isSubgroupsLoading}
              className="w-full h-11 px-4 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] bg-white cursor-pointer transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              {isSubgroupsLoading ? (
                <option value="">Loading {subgroupLabelPlural}...</option>
              ) : (
                <>
                  <option value="">Select {subgroupLabel}</option>
                  {dynamicSubgroups.map((sg: any) => (
                    <option key={sg.id} value={sg.id}>
                      {sg.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.sub_group && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.sub_group}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 px-4 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] bg-white cursor-pointer transition-all"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="supervisor">Supervisor</option>
                <option value="clerk">Clerk</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full h-11 px-4 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] bg-white cursor-pointer transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter remarks..."
              rows={3}
              className="w-full p-4 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-11 border border-[#DFE4EA] rounded-xl text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {mode === 'edit' ? 'Update' : 'Assign'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
