import api from './api';

export async function getBranches() {
  const res = await api.get('/api/mobile/branches/');
  return res.data;
}

export async function createBranch(data: { name: string }) {
  const res = await api.post('/api/mobile/branches/', data);
  return res.data;
}

export async function updateBranch(id: string, data: { name: string }) {
  const res = await api.put(`/api/mobile/branches/${id}/`, data);
  return res.data;
}

export async function deleteBranch(id: string) {
  const res = await api.delete(`/api/mobile/branches/${id}/`);
  return res.data;
}
