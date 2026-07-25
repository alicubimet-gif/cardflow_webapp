import { apiClient } from './client';

export function createCrudApi<T = any>(endpoint: string) {
  const cleanEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;

  return {
    list: (params?: any) =>
      apiClient.get(cleanEndpoint, { params }).then((res) => res.data),

    detail: (id: string | number) =>
      apiClient.get(`${cleanEndpoint}${id}/`).then((res) => res.data),

    create: (payload: any) =>
      apiClient.post(cleanEndpoint, payload).then((res) => res.data),

    update: (id: string | number, payload: any) =>
      apiClient.put(`${cleanEndpoint}${id}/`, payload).then((res) => res.data),

    patch: (id: string | number, payload: any) =>
      apiClient.patch(`${cleanEndpoint}${id}/`, payload).then((res) => res.data),

    delete: (id: string | number) =>
      apiClient.delete(`${cleanEndpoint}${id}/`).then((res) => res.data),
  };
}
