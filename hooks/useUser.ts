import { useState, useCallback } from 'react';
import * as userService from '@/services/user-service';
import { logApiError } from '@/services/api';

export function useUser() {
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUserList();
      setUserList(data || []);
      return data;
    } catch (err: any) {
      logApiError('[useUser] fetchUser:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch user list.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (data: any) => {
    setLoading(true);
    try {
      const res = await userService.createUser(data);
      await fetchUser();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to create user member.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, data: any) => {
    setLoading(true);
    try {
      const res = await userService.updateUser(id, data);
      await fetchUser();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to update user member.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    setLoading(true);
    try {
      const res = await userService.deleteUser(id);
      await fetchUser();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete user member.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async (id: string, payload: { password?: string; new_password?: string; temporary_password?: string }) => {
    setLoading(true);
    try {
      const res = await userService.resetUserPassword(id, payload);
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to reset user password.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateUserAssignments = async (
    userId: string,
    selectedIds: string[],
    level: 'subgroup' | 'subgroup',
    subgroupsList: any[],
  ) => {
    setLoading(true);
    try {
      // 1. Fetch current assignments
      const currentAssignments = await userService.getUserAssignments(userId) || [];

      // 2. Identify assignments to delete
      const toDelete = currentAssignments.filter((a: any) => {
        const targetId = level === 'subgroup' ? (a.subgroup || a.division_id) : (a.subgroup || a.department_id);
        return !selectedIds.includes(String(targetId));
      });

      // 3. Identify assignments to create
      const currentTargetIds = currentAssignments.map((a: any) =>
        String(level === 'subgroup' ? (a.subgroup || a.division_id) : (a.subgroup || a.department_id))
      );
      const toCreate = selectedIds.filter(id => !currentTargetIds.includes(String(id)));

      // 4. Delete old assignments
      await Promise.all(toDelete.map((a: any) => userService.deleteUserAssignment(a.id)));

      // 5. Create new assignments
      await Promise.all(toCreate.map(id => {
        const payload: any = {
          user: userId,
          assignment_level: level,
          inherit_children: true
        };
        if (level === 'subgroup') {
          payload.subgroup = id;
          const divObj = subgroupsList.find(d => String(d.id) === String(id));
          const classId = divObj?.group || divObj?.classId || divObj?.class_id;
          if (classId) payload.group = classId;
        } else {
          payload.subgroup = id;
          const deptObj = subgroupsList.find(d => String(d.id) === String(id));
          const branchId = deptObj?.group || deptObj?.branchId || deptObj?.branch_id;
          if (branchId) payload.group = branchId;
        }
        return userService.createUserAssignment(payload);
      }));
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update user assignments.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    userList,
    loading,
    error,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    updateUserAssignments
  };
}
export type UseUserReturn = ReturnType<typeof useUser>;
