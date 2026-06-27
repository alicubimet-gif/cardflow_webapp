import api from './api';

export async function getStaffList() {
  const res = await api.get('/api/mobile/staff/');
  return res.data;
}

export async function createStaff(data: any) {
  const res = await api.post('/api/mobile/staff/', data);
  return res.data;
}

export async function updateStaff(id: string, data: any) {
  const res = await api.put(`/api/mobile/staff/${id}/`, data);
  return res.data;
}

export async function deleteStaff(id: string) {
  const res = await api.delete(`/api/mobile/staff/${id}/`);
  return res.data;
}

export async function resetStaffPassword(id: string, payload: { password?: string; new_password?: string; temporary_password?: string }) {
  const res = await api.post(`/api/mobile/staff/${id}/reset-password/`, payload);
  return res.data;
}

export async function getStaffAssignments(staffId: string) {
  const res = await api.get(`/api/mobile/staff-assignments/?staff=${staffId}`);
  return res.data;
}

export async function createStaffAssignment(data: { staff: string; division?: string; school_class?: string; branch?: string; department?: string; assignment_level: string; inherit_children?: boolean }) {
  const res = await api.post('/api/mobile/staff-assignments/', data);
  return res.data;
}

export async function deleteStaffAssignment(id: string) {
  const res = await api.delete(`/api/mobile/staff-assignments/${id}/`);
  return res.data;
}
