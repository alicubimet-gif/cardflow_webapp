import { useState, useCallback } from 'react';
import * as staffService from '@/services/staff-service';
import { logApiError } from '@/services/api';

export function useStaff() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await staffService.getStaffList();
      setStaffList(data || []);
      return data;
    } catch (err: any) {
      logApiError('[useStaff] fetchStaff:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch staff list.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createStaff = async (data: any) => {
    setLoading(true);
    try {
      const res = await staffService.createStaff(data);
      await fetchStaff();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to create staff member.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateStaff = async (id: string, data: any) => {
    setLoading(true);
    try {
      const res = await staffService.updateStaff(id, data);
      await fetchStaff();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to update staff member.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteStaff = async (id: string) => {
    setLoading(true);
    try {
      const res = await staffService.deleteStaff(id);
      await fetchStaff();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete staff member.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetStaffPassword = async (id: string, payload: { password?: string; new_password?: string; temporary_password?: string }) => {
    setLoading(true);
    try {
      const res = await staffService.resetStaffPassword(id, payload);
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to reset staff password.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateStaffAssignments = async (
    staffId: string,
    selectedIds: string[],
    level: 'division' | 'department',
    divisionsList: any[],
    departmentsList: any[]
  ) => {
    setLoading(true);
    try {
      // 1. Fetch current assignments
      const currentAssignments = await staffService.getStaffAssignments(staffId) || [];

      // 2. Identify assignments to delete
      const toDelete = currentAssignments.filter((a: any) => {
        const targetId = level === 'division' ? (a.division || a.division_id) : (a.department || a.department_id);
        return !selectedIds.includes(String(targetId));
      });

      // 3. Identify assignments to create
      const currentTargetIds = currentAssignments.map((a: any) =>
        String(level === 'division' ? (a.division || a.division_id) : (a.department || a.department_id))
      );
      const toCreate = selectedIds.filter(id => !currentTargetIds.includes(String(id)));

      // 4. Delete old assignments
      await Promise.all(toDelete.map((a: any) => staffService.deleteStaffAssignment(a.id)));

      // 5. Create new assignments
      await Promise.all(toCreate.map(id => {
        const payload: any = {
          staff: staffId,
          assignment_level: level,
          inherit_children: true
        };
        if (level === 'division') {
          payload.division = id;
          const divObj = divisionsList.find(d => String(d.id) === String(id));
          const classId = divObj?.school_class || divObj?.classId || divObj?.class_id;
          if (classId) payload.school_class = classId;
        } else {
          payload.department = id;
          const deptObj = departmentsList.find(d => String(d.id) === String(id));
          const branchId = deptObj?.branch || deptObj?.branchId || deptObj?.branch_id;
          if (branchId) payload.branch = branchId;
        }
        return staffService.createStaffAssignment(payload);
      }));
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update staff assignments.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    staffList,
    loading,
    error,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    resetStaffPassword,
    updateStaffAssignments
  };
}
export type UseStaffReturn = ReturnType<typeof useStaff>;
