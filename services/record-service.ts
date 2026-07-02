import api from './api';

export async function getRecords() {
  const res = await api.get('/api/mobile/records/');
  return res.data;
}

export async function getRecord(id: string) {
  const res = await api.get(`/api/mobile/records/${id}/`);
  return res.data;
}

export async function createRecord(data: any) {
  const res = await api.post('/api/mobile/records/', data);
  return res.data;
}

export async function createRecordWithPhoto(formData: FormData) {
  const res = await api.post('/api/mobile/records/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}

export async function getFields() {
  const res = await api.get('/api/mobile/fields/');
  return res.data;
}

export async function updateRecord(id: string, data: any) {
  const res = await api.patch(`/api/mobile/records/${id}/`, data);
  return res.data;
}

export async function patchRecord(id: string, data: any) {
  const res = await api.patch(`/api/mobile/records/${id}/`, data);
  return res.data;
}

export async function deleteRecord(id: string) {
  const res = await api.delete(`/api/mobile/records/${id}/`);
  return res.data;
}

export async function submitRecord(id: string) {
  const res = await api.post(`/api/webapp/records/${id}/submit/`, {});
  return res.data;
}

export async function approveRecord(id: string, data: any = {}) {
  const res = await api.post(`/api/webapp/records/${id}/approve/`, data);
  return res.data;
}

export async function rejectRecord(id: string, data: any = {}) {
  const res = await api.post(`/api/webapp/records/${id}/reject/`, data);
  return res.data;
}

export async function correctionRecord(id: string, data: any = {}) {
  const res = await api.post(`/api/webapp/records/${id}/correction/`, data);
  return res.data;
}

export async function uploadPhoto(formData: FormData) {
  const res = await api.post('/api/mobile/photos/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export function resolvePhotoUrl(src: string): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://cubixmet.pythonanywhere.com').replace(/\/$/, '');
  const mediaUrl = (process.env.NEXT_PUBLIC_MEDIA_URL || 'https://cubixmet.pythonanywhere.com/media/').replace(/\/$/, '');
  
  if (src.startsWith('/media/') || src.startsWith('media/')) {
    const clean = src.replace(/^\/?media\//, '');
    return `${mediaUrl}/${clean}`;
  }
  
  if (src.startsWith('/')) {
    return `${backendUrl}${src}`;
  }
  
  return `${mediaUrl}/${src}`;
}

export async function downloadPDF(id: string) {
  const res = await api.post(`/api/cards/${id}/download-pdf/`, {});
  return res.data;
}

export async function downloadPNG(id: string) {
  const res = await api.post(`/api/cards/${id}/download-png/`, {});
  return res.data;
}


