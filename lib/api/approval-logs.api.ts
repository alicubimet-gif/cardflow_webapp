import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export async function getApprovalLogs(params?: any) {
  const res = await apiClient.get(API_ENDPOINTS.APPROVAL_LOGS.LIST, { params });
  const d = res.data;
  return Array.isArray(d) ? d : (d?.results ?? []);
}

export async function exportApprovalLogs(params?: any) {
  const res = await apiClient.get(API_ENDPOINTS.APPROVAL_LOGS.EXPORT, { 
    params,
    responseType: 'blob'
  });
  return res.data;
}
