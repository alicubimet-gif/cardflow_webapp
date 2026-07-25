import { useState, useCallback } from 'react';
import * as divisionService from '@/services/division-service';
import { logApiError } from '@/services/api';

export function useDivisions() {
  const [divisionsList, setDivisionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDivisions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await divisionService.getDivisions();
      setDivisionsList(data || []);
      return data;
    } catch (err: any) {
      logApiError('[useDivisions] fetchDivisions:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch divisions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDivision = async (data: { name: string; school_class: string }) => {
    setLoading(true);
    try {
      const res = await divisionService.createDivision(data);
      await fetchDivisions();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create division.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateDivision = async (id: string, data: { name: string; school_class: string }) => {
    setLoading(true);
    try {
      const res = await divisionService.updateDivision(id, data);
      await fetchDivisions();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update division.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteDivision = async (id: string) => {
    setLoading(true);
    try {
      const res = await divisionService.deleteDivision(id);
      await fetchDivisions();
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete division.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    divisionsList,
    loading,
    error,
    fetchDivisions,
    createDivision,
    updateDivision,
    deleteDivision
  };
}
export type UseDivisionsReturn = ReturnType<typeof useDivisions>;
