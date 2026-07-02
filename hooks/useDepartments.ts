import { useState, useCallback } from 'react';
import * as departmentService from '@/services/department-service';
import { logApiError } from '@/services/api';

export function useDepartments() {
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await departmentService.getDepartments();
      setDepartmentsList(data || []);
      return data;
    } catch (err: any) {
      logApiError('[useDepartments] fetchDepartments:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDepartment = async (data: { name: string; branch: string }) => {
    setLoading(true);
    try {
      const res = await departmentService.createDepartment(data);
      await fetchDepartments();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create department.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateDepartment = async (id: string, data: { name: string; branch: string }) => {
    setLoading(true);
    try {
      const res = await departmentService.updateDepartment(id, data);
      await fetchDepartments();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update department.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteDepartment = async (id: string) => {
    setLoading(true);
    try {
      const res = await departmentService.deleteDepartment(id);
      await fetchDepartments();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete department.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    departmentsList,
    loading,
    error,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
  };
}
export type UseDepartmentsReturn = ReturnType<typeof useDepartments>;
