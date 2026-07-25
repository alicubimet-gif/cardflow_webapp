import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { getPublicBackendUrl } from '@/lib/config';

export async function getRecords() {
  const res = await apiClient.get(API_ENDPOINTS.RECORDS.LIST);
  return res.data;
}

export async function getRecord(id: string | number) {
  const res = await apiClient.get(API_ENDPOINTS.RECORDS.DETAIL(id));
  return res.data;
}

export async function createRecord(data: any) {
  const res = await apiClient.post(API_ENDPOINTS.RECORDS.LIST, data);
  return res.data;
}

export async function createRecordWithPhoto(formData: FormData) {
  const res = await apiClient.post(API_ENDPOINTS.RECORDS.LIST, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}

export async function getFields() {
  const res = await apiClient.get(API_ENDPOINTS.FIELDS.LIST);
  return res.data;
}

export async function updateRecord(id: string | number, data: any) {
  const res = await apiClient.patch(API_ENDPOINTS.RECORDS.UPDATE(id), data);
  return res.data;
}

export async function patchRecord(id: string | number, data: any) {
  const res = await apiClient.patch(API_ENDPOINTS.RECORDS.UPDATE(id), data);
  return res.data;
}

export async function deleteRecord(id: string | number) {
  const res = await apiClient.delete(API_ENDPOINTS.RECORDS.DETAIL(id));
  return res.data;
}

export async function submitRecord(id: string | number, cardId?: string | number) {
  const endpoint = cardId ? API_ENDPOINTS.CARDS.SUBMIT(cardId) : API_ENDPOINTS.RECORDS.SUBMIT(id);
  const res = await apiClient.post(endpoint, {});
  return res.data;
}

export async function approveRecord(id: string | number, data: any = {}, cardId?: string | number) {
  const endpoint = cardId ? API_ENDPOINTS.CARDS.APPROVE(cardId) : API_ENDPOINTS.RECORDS.APPROVE(id);
  const res = await apiClient.post(endpoint, data);
  return res.data;
}

export async function rejectRecord(id: string | number, data: any = {}, cardId?: string | number) {
  const endpoint = cardId ? API_ENDPOINTS.CARDS.REJECT(cardId) : API_ENDPOINTS.RECORDS.REJECT(id);
  const res = await apiClient.post(endpoint, data);
  return res.data;
}

export async function revertRecordApproval(id: string | number) {
  const res = await apiClient.post(API_ENDPOINTS.RECORDS.REVERT_APPROVAL(id));
  return res.data;
}

export async function correctionRecord(id: string | number, data: any = {}, cardId?: string | number) {
  const endpoint = cardId ? API_ENDPOINTS.CARDS.CORRECTION(cardId) : API_ENDPOINTS.RECORDS.CORRECTION(id);
  const res = await apiClient.post(endpoint, data);
  return res.data;
}

export async function uploadPhoto(formData: FormData) {
  const res = await apiClient.post(API_ENDPOINTS.PHOTOS.UPLOAD, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function uploadGenericFile(formData: FormData) {
  const res = await apiClient.post(API_ENDPOINTS.FILES.UPLOAD, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export function resolvePhotoUrl(src: string): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  
  const backendUrl = getPublicBackendUrl();
  const mediaUrl = backendUrl ? `${backendUrl}/media` : '';
  
  if (src.startsWith('/media/') || src.startsWith('media/')) {
    const clean = src.replace(/^\/?media\//, '');
    return mediaUrl ? `${mediaUrl}/${clean}` : `/media/${clean}`;
  }
  
  if (src.startsWith('/')) {
    return backendUrl ? `${backendUrl}${src}` : src;
  }
  
  return mediaUrl ? `${mediaUrl}/${src}` : src;
}

export async function getCardPreview(type: 'student' | 'school-user' | 'employee', id?: string) {
  const url = id && id !== 'undefined' 
    ? `/api/mobile/cards/preview/record/${id}/` 
    : `/api/mobile/cards/preview/record/`;
  const res = await apiClient.get(url);
  return res.data;
}

export async function bulkUploadStudents(formData: FormData) {
  const res = await apiClient.post(API_ENDPOINTS.RECORDS.BULK_UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function bulkUploadSchoolUser(formData: FormData) {
  const res = await apiClient.post(API_ENDPOINTS.RECORDS.BULK_UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function bulkUploadEmployees(formData: FormData) {
  const res = await apiClient.post(API_ENDPOINTS.RECORDS.BULK_UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function getApprovals(params?: any) {
  const res = await apiClient.get(API_ENDPOINTS.RECORDS.LIST, { params });
  const d = res.data;
  return Array.isArray(d) ? d : (d?.results ?? []);
}

// These point to cards API instead of webapp records endpoints
export async function downloadPDF(id: string | number) {
  const res = await apiClient.post(`/api/cards/${id}/download-pdf/`, {});
  return res.data;
}

export async function downloadPNG(id: string | number) {
  const res = await apiClient.post(`/api/cards/${id}/download-png/`, {});
  return res.data;
}

export const recordApi = {
  list: getRecords,
  detail: getRecord,
  create: createRecord,
  update: updateRecord,
  patch: patchRecord,
  delete: deleteRecord,
};
