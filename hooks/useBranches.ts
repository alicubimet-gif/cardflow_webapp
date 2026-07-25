import { useState, useCallback } from 'react';
import * as branchService from '@/services/branch-service';
import { logApiError } from '@/services/api';

export function useBranches() {
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await branchService.getBranches();
      setBranchesList(data || []);
      return data;
    } catch (err: any) {
      logApiError('[useBranches] fetchBranches:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch branches.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBranch = async (data: { name: string }) => {
    setLoading(true);
    try {
      const res = await branchService.createBranch(data);
      await fetchBranches();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create branch.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateBranch = async (id: string, data: { name: string }) => {
    setLoading(true);
    try {
      const res = await branchService.updateBranch(id, data);
      await fetchBranches();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update branch.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteBranch = async (id: string) => {
    setLoading(true);
    try {
      const res = await branchService.deleteBranch(id);
      await fetchBranches();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete branch.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    branchesList,
    loading,
    error,
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch
  };
}
export type UseBranchesReturn = ReturnType<typeof useBranches>;
