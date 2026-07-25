import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchStaffApi } from '@/api/branchStaff.api';
import { CreateBranchStaffPayload, UpdateBranchStaffPayload } from '@/types/branchStaff.types';

export const branchStaffKeys = {
  all: ['branch-staff'] as const,
  lists: () => [...branchStaffKeys.all, 'list'] as const,
  listWithFilters: (filters: any) => [...branchStaffKeys.lists(), filters] as const,
  details: () => [...branchStaffKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...branchStaffKeys.details(), id] as const,
};

export function useBranchStaffList(filters: any = {}) {
  return useQuery({
    queryKey: branchStaffKeys.listWithFilters(filters),
    queryFn: () => branchStaffApi.list(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useBranchStaffDetail(id: string | number) {
  return useQuery({
    queryKey: branchStaffKeys.detail(id),
    queryFn: () => branchStaffApi.detail(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateBranchStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBranchStaffPayload) => branchStaffApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: branchStaffKeys.lists(),
      });
    },
  });
}

export function useUpdateBranchStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateBranchStaffPayload }) =>
      branchStaffApi.update(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: branchStaffKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: branchStaffKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteBranchStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => branchStaffApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: branchStaffKeys.lists(),
      });
    },
  });
}
