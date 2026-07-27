import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export async function getDashboard() {
  const res = await apiClient.get(API_ENDPOINTS.DASHBOARD);
  return res.data;
}
