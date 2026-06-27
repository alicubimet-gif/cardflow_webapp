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
    if (!isAuth401) {
      console.error(
        '[API WebApp] Error ←',
        error?.config?.method?.toUpperCase(),
        error?.config?.url,
        '| Status:', error?.response?.status,
        '| Data:', error?.response?.data
      );
    }
    return Promise.reject(error);
  }
);

export default api;
