import api from './api';

export async function getDepartments() {
  const res = await api.get('/api/mobile/departments/');
  return res.data;
}

export async function createDepartment(data: { name: string; branch: string }) {
  const res = await api.post('/api/mobile/departments/', data);
  return res.data;
}

export async function updateDepartment(id: string, data: { name: string; branch: string }) {
  const res = await api.put(`/api/mobile/departments/${id}/`, data);
  return res.data;
}

export async function deleteDepartment(id: string) {
  const res = await api.delete(`/api/mobile/departments/${id}/`);
  return res.data;
}
