import api from './api';

export async function getClasses() {
  const res = await api.get('/api/mobile/classes/');
  return res.data;
}

export async function createClass(data: { name: string; branch?: string }) {
  const res = await api.post('/api/mobile/classes/', data);
  return res.data;
}

export async function updateClass(id: string, data: { name: string; branch?: string }) {
  const res = await api.put(`/api/mobile/classes/${id}/`, data);
  return res.data;
}

export async function deleteClass(id: string) {
  const res = await api.delete(`/api/mobile/classes/${id}/`);
  return res.data;
}
