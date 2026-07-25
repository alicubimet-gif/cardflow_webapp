import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export async function getOrganizationProfile() {
  const res = await apiClient.get(API_ENDPOINTS.ORGANIZATION.PROFILE);
  return res.data;
}

export async function updateOrganizationProfile(data: any) {
  const res = await apiClient.put(API_ENDPOINTS.ORGANIZATION.PROFILE, data);
  return res.data;
}

export async function getTemplateFields(orgId: string | number, params: { class_id?: string; division_id?: string; branch_id?: string; department_id?: string }) {
  const cleanParams: any = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== 'undefined' && v !== 'null' && v !== '') {
      cleanParams[k] = v;
    }
  });
  const query = new URLSearchParams(cleanParams).toString();
  const res = await apiClient.get(`${API_ENDPOINTS.ORGANIZATION.TEMPLATE_FIELDS(orgId)}?${query}`);
  return res.data;
}

export async function downloadExcelTemplate(params: any) {
  const cleanParams: any = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== 'undefined' && v !== 'null' && v !== '') {
      cleanParams[k] = v;
    }
  });
  const query = new URLSearchParams(cleanParams).toString();
  const res = await apiClient.get(`${API_ENDPOINTS.ORGANIZATION.BULK_UPLOAD_EXCEL}?${query}`, {
    responseType: 'blob'
  });
  return res.data;
}
