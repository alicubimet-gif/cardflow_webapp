import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subgroupApi } from '@/api/subgroup.api';
import { groupKeys } from './useGroups';
import { CreateSubGroupPayload, UpdateSubGroupPayload } from '@/types/subGroup.types';

export const subGroupKeys = {
  all: ["sub-groups"] as const,
  lists: () => [...subGroupKeys.all, "list"] as const,
  listByGroup: (groupId: string, filters: any = {}) =>
    [
      ...subGroupKeys.lists(),
      { groupId, ...filters },
    ] as const,
  details: () => [...subGroupKeys.all, "detail"] as const,
  detail: (id: string | number) =>
    [...subGroupKeys.details(), id] as const,
};

export function useSubgroups(groupId: string, filters: any = {}, options: any = {}) {
  return useQuery<any>({
    queryKey: subGroupKeys.listByGroup(groupId, filters),
    queryFn: () => subgroupApi.list({ group: groupId, ...filters }),
    enabled: Boolean(groupId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options
  });
}

export function useAllSubgroups(filters: any = {}) {
  return useQuery({
    queryKey: [...subGroupKeys.lists(), filters],
    queryFn: () => subgroupApi.list(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSubgroupDetail(id: string | number) {
  return useQuery({
    queryKey: subGroupKeys.detail(id),
    queryFn: () => subgroupApi.detail(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateSubgroup(groupId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubGroupPayload) => subgroupApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: subGroupKeys.lists(),
      });
      if (groupId) {
        queryClient.invalidateQueries({
          queryKey: groupKeys.detail(groupId),
        });
      }
    },
  });
}

export function useUpdateSubgroup(groupId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateSubGroupPayload }) =>
      subgroupApi.update(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: subGroupKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: subGroupKeys.detail(variables.id),
      });
      if (groupId) {
        queryClient.invalidateQueries({
          queryKey: groupKeys.detail(groupId),
        });
      }
    },
  });
}

export function useDeleteSubgroup(groupId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => subgroupApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: subGroupKeys.lists(),
      });
      if (groupId) {
        queryClient.invalidateQueries({
          queryKey: groupKeys.detail(groupId),
        });
      }
    },
  });
}
