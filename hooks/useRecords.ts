import { useState, useCallback } from 'react';
import * as recordService from '@/services/record-service';
import { AuthService } from '@/services/auth-service';

export interface OrganizationStats {
  totalStudents: number;
  totalSchoolStaff: number;
  totalEmployees: number;
  pendingCards: number;
  approvedCards: number;
  rejectedCards: number;
  correctionRequired: number;
  totalApprovedRecords: number;
  recentlyUpdated: any[];
}

export function useRecords() {
  const [recordsList, setRecordsList] = useState<any[]>([]);
  const [requiredFields, setRequiredFields] = useState<any[]>([]);
  const [stats, setStats] = useState<OrganizationStats>({
    totalStudents: 0,
    totalSchoolStaff: 0,
    totalEmployees: 0,
    pendingCards: 0,
    approvedCards: 0,
    rejectedCards: 0,
    correctionRequired: 0,
    totalApprovedRecords: 0,
    recentlyUpdated: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecordsAndConfig = useCallback(async (isSchool: boolean) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch records
      const records = await recordService.getRecords().catch(() => []);
      setRecordsList(records || []);

      // 2. Fetch stats
      const statsRes = await AuthService.getDashboard().catch(() => null);
      if (statsRes) {
        setStats({
          totalStudents: statsRes.total_students || 0,
          totalSchoolStaff: statsRes.total_school_staff || 0,
          totalEmployees: statsRes.total_employees || 0,
          pendingCards: statsRes.pending_cards || 0,
          approvedCards: statsRes.approved_cards || 0,
          rejectedCards: statsRes.rejected_cards || 0,
          correctionRequired: statsRes.correction_required || 0,
          totalApprovedRecords: statsRes.total_approved_records || 0,
          recentlyUpdated: statsRes.recently_updated || []
        });
      }

      // 3. Fetch org profile for required fields configuration
      const profile = isSchool
        ? await AuthService.getSchoolProfile().catch(() => null)
        : await AuthService.getOfficeProfile().catch(() => null);
      
      if (profile?.required_fields) {
        setRequiredFields(profile.required_fields);
      } else {
        setRequiredFields([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load records database.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRecord = async (payload: any, processedBlob: Blob | null, isSchool: boolean) => {
    setLoading(true);
    try {
      const res = await recordService.createRecord(payload);
      const recordId = res.id;
      if (processedBlob) {
        const formData = new FormData();
        formData.append('record_type', isSchool ? 'student' : 'employee');
        formData.append('record_id', recordId);
        formData.append('photo', processedBlob, 'processed_profile_photo.jpg');
        await recordService.uploadPhoto(formData);
      }
      await fetchRecordsAndConfig(isSchool);
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to save record.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (id: string, payload: any, processedBlob: Blob | null, isSchool: boolean) => {
    setLoading(true);
    try {
      const res = await recordService.updateRecord(id, payload);
      if (processedBlob) {
        const formData = new FormData();
        formData.append('record_type', isSchool ? 'student' : 'employee');
        formData.append('record_id', id);
        formData.append('photo', processedBlob, 'processed_profile_photo.jpg');
        await recordService.uploadPhoto(formData);
      }
      await fetchRecordsAndConfig(isSchool);
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update record.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string, isSchool: boolean) => {
    setLoading(true);
    try {
      const res = await recordService.deleteRecord(id);
      await fetchRecordsAndConfig(isSchool);
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete record.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const submitRecord = async (id: string, isSchool: boolean) => {
    setLoading(true);
    try {
      const res = await recordService.submitRecord(id);
      await fetchRecordsAndConfig(isSchool);
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to submit record.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const approveRecord = async (id: string, comment: string, isSchool: boolean) => {
    setLoading(true);
    try {
      const res = await recordService.approveRecord(id, { comment });
      await fetchRecordsAndConfig(isSchool);
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to approve record.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const rejectRecord = async (id: string, comment: string, isSchool: boolean) => {
    setLoading(true);
    try {
      const res = await recordService.rejectRecord(id, { comment, rejection_reason: comment });
      await fetchRecordsAndConfig(isSchool);
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to reject record.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const correctionRecord = async (id: string, comment: string, isSchool: boolean) => {
    setLoading(true);
    try {
      const res = await recordService.correctionRecord(id, { comment, correction_note: comment });
      await fetchRecordsAndConfig(isSchool);
      return res;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to request corrections.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    recordsList,
    requiredFields,
    stats,
    loading,
    error,
    fetchRecordsAndConfig,
    createRecord,
    updateRecord,
    deleteRecord,
    submitRecord,
    approveRecord,
    rejectRecord,
    correctionRecord
  };
}
export type UseRecordsReturn = ReturnType<typeof useRecords>;
