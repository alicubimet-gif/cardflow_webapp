import { createCrudApi } from './crud';
import { API_ENDPOINTS } from './endpoints';

export const subgroupApi = createCrudApi(API_ENDPOINTS.SUBGROUPS.LIST);
export const subGroupApi = subgroupApi;

export async function getSubgroups(params?: any) {
  return subgroupApi.list(params);
}

export async function getSubgroup(id: string | number) {
  return subgroupApi.detail(id);
}

export async function createSubgroup(data: any) {
  return subgroupApi.create(data);
}

export async function updateSubgroup(id: string | number, data: any) {
  return subgroupApi.update(id, data);
}

export async function patchSubgroup(id: string | number, data: any) {
  return subgroupApi.patch(id, data);
}

export async function deleteSubgroup(id: string | number) {
  return subgroupApi.delete(id);
}
