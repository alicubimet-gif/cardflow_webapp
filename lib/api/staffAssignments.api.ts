import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export async function getStaffAssignmentsList(params?: any) {
  const res = await apiClient.get(API_ENDPOINTS.STAFF_ASSIGNMENTS.LIST, { params });
  const d = res.data;
  return Array.isArray(d) ? d : (d?.results ?? []);
}

export async function getStaffAssignmentDetail(id: string | number) {
  const res = await apiClient.get(API_ENDPOINTS.STAFF_ASSIGNMENTS.DETAIL(id));
  return res.data;
}

export async function createStaffAssignment(payload: any) {
  const res = await apiClient.post(API_ENDPOINTS.STAFF_ASSIGNMENTS.CREATE, payload);
  return res.data;
}

export async function updateStaffAssignment(id: string | number, payload: any) {
  const res = await apiClient.put(API_ENDPOINTS.STAFF_ASSIGNMENTS.DETAIL(id), payload);
  return res.data;
}

export async function patchStaffAssignment(id: string | number, payload: any) {
  const res = await apiClient.patch(API_ENDPOINTS.STAFF_ASSIGNMENTS.DETAIL(id), payload);
  return res.data;
}

export async function deleteStaffAssignment(id: string | number) {
  const res = await apiClient.delete(API_ENDPOINTS.STAFF_ASSIGNMENTS.DELETE(id));
  return res.data;
}

export const staffAssignmentsApi = {
  list: getStaffAssignmentsList,
  detail: getStaffAssignmentDetail,
  create: createStaffAssignment,
  update: updateStaffAssignment,
  patch: patchStaffAssignment,
  delete: deleteStaffAssignment,
};
