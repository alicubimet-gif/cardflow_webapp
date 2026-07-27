import axios from 'axios';

// Direct Django backend base URL
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    // Block mutative requests when offline
    if (
      typeof window !== 'undefined' &&
      !navigator.onLine &&
      config.method &&
      config.method.toUpperCase() !== 'GET'
    ) {
      const offlineError = new Error('Internet connection required');
      (offlineError as any).response = {
        status: 503,
        data: {
          success: false,
          message: 'Internet connection required',
          detail: 'Internet connection required',
        },
      };
      throw offlineError;
    }

    // Attach Authorization header if access token exists
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('webapp_access_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Ensure URL leading slash format
    if (config.url && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
      if (!config.url.startsWith('/')) {
        config.url = '/' + config.url;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (typeof window !== 'undefined' && body && typeof body === 'object') {
      const access = body.access || body.data?.access;
      const refresh = body.refresh || body.data?.refresh;
      if (access) {
        localStorage.setItem('webapp_access_token', access);
      }
      if (refresh) {
        localStorage.setItem('webapp_refresh_token', refresh);
      }
    }

    if (
      body &&
      typeof body === 'object' &&
      body.success === true &&
      'data' in body
    ) {
      response.data = body.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('webapp_refresh_token');
        const isAuthEndpoint = originalRequest.url?.includes('auth/login') || originalRequest.url?.includes('auth/refresh');

        if (refreshToken && !isAuthEndpoint) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return apiClient(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
              refresh: refreshToken,
            });
            const newAccess = res.data?.access || res.data?.data?.access;
            if (newAccess) {
              localStorage.setItem('webapp_access_token', newAccess);
              if (res.data?.refresh) {
                localStorage.setItem('webapp_refresh_token', res.data.refresh);
              }
              apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
              processQueue(null, newAccess);
              originalRequest.headers.Authorization = `Bearer ${newAccess}`;
              return apiClient(originalRequest);
            }
          } catch (refreshErr) {
            processQueue(refreshErr, null);
            localStorage.removeItem('webapp_access_token');
            localStorage.removeItem('webapp_refresh_token');
          } finally {
            isRefreshing = false;
          }
        }
      }
    }

    if (!error.response) {
      const isTimeout =
        error.code === 'ECONNABORTED' ||
        error.message?.toLowerCase().includes('timeout');
      const msg = isTimeout
        ? 'Request timed out. Please try again.'
        : 'Unable to connect to the server.';
      error.response = {
        status: 503,
        data: {
          success: false,
          message: msg,
          detail: msg,
        },
      };
    } else if (error.response.status >= 500) {
      error.response.data = {
        success: false,
        message: 'Something went wrong. Please try again.',
        detail: 'Something went wrong. Please try again.',
      };
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    return (
      data?.detail ||
      data?.message ||
      'Something went wrong. Please try again.'
    );
  }
  return 'Something went wrong. Please try again.';
}
