import { apiClient, getApiErrorMessage } from '@/api/client';

export const logApiError = (arg1: any, arg2?: any) => {
  const status = arg2?.response?.status || arg1?.response?.status;
  if (status === 401 || status === 403) return;
  console.error('[API Error]:', arg1, arg2);
};

export { apiClient, getApiErrorMessage };
export default apiClient;
