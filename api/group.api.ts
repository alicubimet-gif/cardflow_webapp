import { createCrudApi } from './crud';
import { API_ENDPOINTS } from './endpoints';

export const groupApi = createCrudApi(API_ENDPOINTS.GROUPS.LIST);

export async function getGroups(params?: any) {
  return groupApi.list(params);
}

export async function getGroup(id: string | number) {
  return groupApi.detail(id);
}

export async function createGroup(data: any) {
  return groupApi.create(data);
}

export async function updateGroup(id: string | number, data: any) {
  return groupApi.update(id, data);
}

export async function patchGroup(id: string | number, data: any) {
  return groupApi.patch(id, data);
}

export async function deleteGroup(id: string | number) {
  return groupApi.delete(id);
}
