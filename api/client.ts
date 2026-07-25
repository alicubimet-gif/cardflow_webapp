import axios from 'axios';

// Always use relative WebApp server proxy (BFF) path
export const API_BASE_URL = '/server';

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
    if (typeof window !== 'undefined' && !navigator.onLine && config.method && config.method.toUpperCase() !== 'GET') {
      const offlineError = new Error('Internet connection required');
      (offlineError as any).response = {
        status: 503,
        data: {
          success: false,
          message: 'Internet connection required',
          detail: 'Internet connection required'
        }
      };
      throw offlineError;
    }

    // Standardize URL paths to not include '/api/' if already in baseURL
    if (config.url) {
      if (config.url.startsWith('/api/')) {
        config.url = config.url.slice(5);
      } else if (config.url.startsWith('api/')) {
        config.url = config.url.slice(4);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
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
  (error) => {
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout');
      const msg = isTimeout ? 'Request timed out. Please try again.' : 'Unable to connect to the server.';
      error.response = {
        status: 503,
        data: {
          success: false,
          message: msg,
          detail: msg
        }
      };
    } else if (error.response.status >= 500) {
      error.response.data = {
        success: false,
        message: 'Something went wrong. Please try again.',
        detail: 'Something went wrong. Please try again.'
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
