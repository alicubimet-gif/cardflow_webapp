import { API_ENDPOINTS } from '@/api/endpoints';
import {
  useCrudList,
  useCrudDetail,
  useCreateMutation,
  useUpdateMutation,
  usePatchMutation,
  useDeleteMutation,
  crudKeys
} from './useCrud';

export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  list: (filters: any) =>
    [...groupKeys.lists(), filters] as const,
  details: () => [...groupKeys.all, "detail"] as const,
  detail: (id: string | number) =>
    [...groupKeys.details(), id] as const,
};

export function useGroups(filters: any = {}, options: any = {}) {
  return useCrudList("groups", API_ENDPOINTS.GROUPS.LIST, filters, options);
}

export function useGroupDetail(id: string | number) {
  return useCrudDetail("groups", API_ENDPOINTS.GROUPS.LIST, id);
}

export function useCreateGroup() {
  return useCreateMutation("groups", API_ENDPOINTS.GROUPS.LIST);
}

export function useUpdateGroup() {
  return useUpdateMutation("groups", API_ENDPOINTS.GROUPS.LIST);
}

export function usePatchGroup() {
  return usePatchMutation("groups", API_ENDPOINTS.GROUPS.LIST);
}

export function useDeleteGroup() {
  return useDeleteMutation("groups", API_ENDPOINTS.GROUPS.LIST);
}
