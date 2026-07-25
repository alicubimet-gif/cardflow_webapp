import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffAssignmentsApi } from '@/api/staffAssignments.api';

export const staffAssignmentKeys = {
  all: ['staff-assignments'] as const,
  lists: () => [...staffAssignmentKeys.all, 'list'] as const,
  listWithFilters: (filters: any) => [...staffAssignmentKeys.lists(), filters] as const,
  details: () => [...staffAssignmentKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...staffAssignmentKeys.details(), id] as const,
};

export function useStaffAssignmentsList(filters: any = {}) {
  return useQuery({
    queryKey: staffAssignmentKeys.listWithFilters(filters),
    queryFn: () => staffAssignmentsApi.list(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useStaffAssignmentDetail(id: string | number) {
  return useQuery({
    queryKey: staffAssignmentKeys.detail(id),
    queryFn: () => staffAssignmentsApi.detail(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateStaffAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => staffAssignmentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: staffAssignmentKeys.lists(),
      });
    },
  });
}

export function useUpdateStaffAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: any }) =>
      staffAssignmentsApi.update(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: staffAssignmentKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: staffAssignmentKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteStaffAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => staffAssignmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: staffAssignmentKeys.lists(),
      });
    },
  });
}
