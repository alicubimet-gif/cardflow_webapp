import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createCrudApi } from '@/api/crud';

export const crudKeys = {
  all: (queryKey: string) => [queryKey] as const,
  lists: (queryKey: string) => [...crudKeys.all(queryKey), "list"] as const,
  list: (queryKey: string, filters: any) =>
    [...crudKeys.lists(queryKey), filters] as const,
  details: (queryKey: string) => [...crudKeys.all(queryKey), "detail"] as const,
  detail: (queryKey: string, id: string | number) =>
    [...crudKeys.details(queryKey), id] as const,
};

export function useCrudList<T = any>(queryKey: string, endpoint: string, filters: any = {}, options: any = {}) {
  const api = createCrudApi<T>(endpoint);
  return useQuery<any>({
    queryKey: crudKeys.list(queryKey, filters),
    queryFn: () => api.list(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options
  });
}

export function useCrudDetail<T = any>(queryKey: string, endpoint: string, id: string | number) {
  const api = createCrudApi<T>(endpoint);
  return useQuery({
    queryKey: crudKeys.detail(queryKey, id),
    queryFn: () => api.detail(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateMutation<T = any>(queryKey: string, endpoint: string) {
  const api = createCrudApi<T>(endpoint);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: crudKeys.lists(queryKey),
      });
    },
  });
}

export function useUpdateMutation<T = any>(queryKey: string, endpoint: string) {
  const api = createCrudApi<T>(endpoint);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: any }) =>
      api.update(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: crudKeys.lists(queryKey),
      });
      queryClient.invalidateQueries({
        queryKey: crudKeys.detail(queryKey, variables.id),
      });
    },
  });
}

export function usePatchMutation<T = any>(queryKey: string, endpoint: string) {
  const api = createCrudApi<T>(endpoint);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: any }) =>
      api.patch(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: crudKeys.lists(queryKey),
      });
      queryClient.invalidateQueries({
        queryKey: crudKeys.detail(queryKey, variables.id),
      });
    },
  });
}

export function useDeleteMutation<T = any>(queryKey: string, endpoint: string) {
  const api = createCrudApi<T>(endpoint);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => api.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: crudKeys.lists(queryKey),
      });
    },
  });
}
