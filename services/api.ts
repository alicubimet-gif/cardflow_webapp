import axios from 'axios';

const isClient = typeof window !== 'undefined';
const API_URL = isClient
  ? '/server'
  : (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://cardflow-webapp.vercel.app') + '/server';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
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

api.interceptors.response.use(
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

    const isAuth401 = error?.response?.status === 401;
    const errorCode = error?.response?.data?.code;
    const isSilencedError = errorCode && ['SUBSCRIBER_ACTION_REQUIRED', 'INVALID_OR_EXPIRED_TOKEN', 'TOKEN_EXPIRED'].includes(errorCode);
    // 400 responses with field-level `errors` are handled inline by forms — no need to log
    const isFieldValidationError =
      error?.response?.status === 400 &&
      error?.response?.data?.errors &&
      typeof error?.response?.data?.errors === 'object';
    // 404 responses are expected "not found" states (e.g. no template assigned yet) handled by callers
    const isNotFoundError = error?.response?.status === 404;
    if (!isAuth401 && !isSilencedError && !isFieldValidationError && !isNotFoundError) {
      console.error(
        '[API WebApp] Error ←',
        error?.config?.method?.toUpperCase(),
        error?.config?.url,
        '| Status:', error?.response?.status,
        '| Data:', typeof error?.response?.data === 'object' ? JSON.stringify(error?.response?.data) : error?.response?.data
      );
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Use this in local catch blocks instead of `console.error(err)`.
 * It applies the same silencing rules as the global Axios interceptor so
 * 401 auth errors, 400 field-validation errors, and 404 not-found states
 * never pollute the console.
 */
export function logApiError(label: string, err: any): void {
  const status = err?.response?.status;
  const errorCode = err?.response?.data?.code;

  if (status === 401) return;
  if (status === 404) return;
  if (errorCode && ['SUBSCRIBER_ACTION_REQUIRED', 'INVALID_OR_EXPIRED_TOKEN', 'TOKEN_EXPIRED'].includes(errorCode)) return;
  if (status === 400 && err?.response?.data?.errors && typeof err?.response?.data?.errors === 'object') return;

  console.error(label, err);
}
