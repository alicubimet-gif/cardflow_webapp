import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export async function getUserList() {
  const res = await apiClient.get(API_ENDPOINTS.STAFF.LIST);
  const d = res.data;
  return Array.isArray(d) ? d : (d?.results ?? []);
}

export async function resendUserInvite(id: string | number) {
  const res = await apiClient.post(API_ENDPOINTS.RESEND_INVITE(id));
  return res.data;
}

export async function createUser(data: any) {
  const res = await apiClient.post(API_ENDPOINTS.STAFF.LIST, data);
  return res.data;
}

export async function updateUser(id: string | number, data: any) {
  const res = await apiClient.put(API_ENDPOINTS.STAFF.DETAIL(id), data);
  return res.data;
}

export async function deleteUser(id: string | number) {
  const res = await apiClient.delete(API_ENDPOINTS.STAFF.DETAIL(id));
  return res.data;
}

export async function resetUserPassword(id: string | number, payload: { password?: string; new_password?: string; temporary_password?: string }) {
  const res = await apiClient.post(API_ENDPOINTS.STAFF.RESET_PASSWORD(id), payload);
  return res.data;
}

export async function getUserAssignments(userId?: string | number) {
  const url = userId 
    ? `${API_ENDPOINTS.STAFF_ASSIGNMENTS.LIST}?staff=${userId}`
    : API_ENDPOINTS.STAFF_ASSIGNMENTS.LIST;
  const res = await apiClient.get(url);
  const d = res.data;
  return Array.isArray(d) ? d : (d?.results ?? []);
}

export async function createUserAssignment(data: { user?: string; staff?: string; subgroup?: string; group?: string; assignment_level?: string; inherit_children?: boolean; [key: string]: any }) {
  const payload = { ...data, staff: data.staff || data.user };
  const res = await apiClient.post(API_ENDPOINTS.STAFF_ASSIGNMENTS.CREATE, payload);
  return res.data;
}

export async function deleteUserAssignment(id: string | number) {
  const res = await apiClient.delete(API_ENDPOINTS.STAFF_ASSIGNMENTS.DELETE(id));
  return res.data;
}

// Staff aliases for backward compatibility
export const getStaffList = getUserList;
export const createStaff = createUser;
export const updateStaff = updateUser;
export const deleteStaff = deleteUser;
export const resetStaffPassword = resetUserPassword;
export const getStaffAssignments = getUserAssignments;
export const deleteStaffAssignment = deleteUserAssignment;
export const createStaffAssignment = createUserAssignment;
