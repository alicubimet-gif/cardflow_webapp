import { useState, useCallback, useEffect } from 'react';
import * as groupService from '@/services/group-service';
import { logApiError } from '@/services/api';

export function useGroups() {
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await groupService.getGroups();
      setGroupsList(data || []);
      return data || [];
    } catch (err: any) {
      logApiError('[useGroups] fetchGroups:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to fetch groups.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchGroups();
    };
    window.addEventListener('groups-updated', handleUpdate);
    return () => window.removeEventListener('groups-updated', handleUpdate);
  }, [fetchGroups]);

  const createGroup = async (data: { name: string; organization?: string }) => {
    setLoading(true);
    try {
      const res = await groupService.createGroup(data);
      await fetchGroups();
      window.dispatchEvent(new Event('groups-updated'));
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create group.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateGroup = async (id: string, data: { name: string; organization?: string }) => {
    setLoading(true);
    try {
      const res = await groupService.updateGroup(id, data);
      await fetchGroups();
      window.dispatchEvent(new Event('groups-updated'));
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update group.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (id: string) => {
    setLoading(true);
    try {
      const res = await groupService.deleteGroup(id);
      await fetchGroups();
      window.dispatchEvent(new Event('groups-updated'));
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete group.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    groupsList,
    loading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
export type UseGroupsReturn = ReturnType<typeof useGroups>;
