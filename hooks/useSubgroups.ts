import { useState, useCallback, useEffect } from 'react';
import * as subgroupService from '@/services/subgroup-service';
import { logApiError } from '@/services/api';

export function useSubgroups() {
  const [subgroupsList, setSubgroupsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubgroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await subgroupService.getSubgroups();
      setSubgroupsList(data || []);
      return data || [];
    } catch (err: any) {
      logApiError('[useSubgroups] fetchSubgroups:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to fetch subgroups.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubgroups();
  }, [fetchSubgroups]);

  const createSubgroup = async (data: { name: string; group: string }) => {
    setLoading(true);
    try {
      const res = await subgroupService.createSubgroup(data);
      await fetchSubgroups();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create subgroup.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateSubgroup = async (id: string, data: { name: string; group: string }) => {
    setLoading(true);
    try {
      const res = await subgroupService.updateSubgroup(id, data);
      await fetchSubgroups();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update subgroup.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubgroup = async (id: string) => {
    setLoading(true);
    try {
      const res = await subgroupService.deleteSubgroup(id);
      await fetchSubgroups();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete subgroup.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    subgroupsList,
    loading,
    error,
    fetchSubgroups,
    createSubgroup,
    updateSubgroup,
    deleteSubgroup,
  };
}
export type UseSubgroupsReturn = ReturnType<typeof useSubgroups>;
