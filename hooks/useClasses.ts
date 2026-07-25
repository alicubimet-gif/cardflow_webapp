import { useState, useCallback } from 'react';
import * as classService from '@/services/class-service';
import { logApiError } from '@/services/api';

export function useClasses() {
  const [classesList, setClassesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classService.getClasses();
      setClassesList(data || []);
      return data;
    } catch (err: any) {
      logApiError('[useClasses] fetchClasses:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch classes.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createClass = async (data: { name: string; branch?: string }) => {
    setLoading(true);
    try {
      const res = await classService.createClass(data);
      await fetchClasses();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create class.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateClass = async (id: string, data: { name: string; branch?: string }) => {
    setLoading(true);
    try {
      const res = await classService.updateClass(id, data);
      await fetchClasses();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update class.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteClass = async (id: string) => {
    setLoading(true);
    try {
      const res = await classService.deleteClass(id);
      await fetchClasses();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete class.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    classesList,
    loading,
    error,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass
  };
}
export type UseClassesReturn = ReturnType<typeof useClasses>;
