import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { CreateBranchStaffPayload, UpdateBranchStaffPayload } from '@/types/branchStaff.types';

export async function getBranchStaffList(params?: any) {
  const res = await apiClient.get(API_ENDPOINTS.BRANCH_STAFF.LIST, { params });
  return res.data;
}

export async function getBranchStaffDetail(id: string | number) {
  const res = await apiClient.get(API_ENDPOINTS.BRANCH_STAFF.DETAIL(id));
  return res.data;
}

export async function createBranchStaff(payload: CreateBranchStaffPayload) {
  const res = await apiClient.post(API_ENDPOINTS.BRANCH_STAFF.LIST, payload);
  return res.data;
}

export async function updateBranchStaff(id: string | number, payload: UpdateBranchStaffPayload) {
  const res = await apiClient.put(API_ENDPOINTS.BRANCH_STAFF.DETAIL(id), payload);
  return res.data;
}

export async function patchBranchStaff(id: string | number, payload: Partial<UpdateBranchStaffPayload>) {
  const res = await apiClient.patch(API_ENDPOINTS.BRANCH_STAFF.DETAIL(id), payload);
  return res.data;
}

export async function deleteBranchStaff(id: string | number) {
  const res = await apiClient.delete(API_ENDPOINTS.BRANCH_STAFF.DETAIL(id));
  return res.data;
}

export const branchStaffApi = {
  list: getBranchStaffList,
  detail: getBranchStaffDetail,
  create: createBranchStaff,
  update: updateBranchStaff,
  patch: patchBranchStaff,
  delete: deleteBranchStaff,
};
