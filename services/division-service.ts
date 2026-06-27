import api from './api';

export async function getDivisions() {
  const res = await api.get('/api/mobile/divisions/');
  return res.data;
}

export async function createDivision(data: { name: string; school_class: string }) {
  const res = await api.post('/api/mobile/divisions/', data);
  return res.data;
}

export async function updateDivision(id: string, data: { name: string; school_class: string }) {
  const res = await api.put(`/api/mobile/divisions/${id}/`, data);
  return res.data;
}

export async function deleteDivision(id: string) {
  const res = await api.delete(`/api/mobile/divisions/${id}/`);
  return res.data;
}
