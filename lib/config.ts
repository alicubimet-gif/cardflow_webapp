export const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || '';
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || '';

export function normalizeBackendUrl(value?: string | null): string {
  return String(value || '').trim().replace(/\/$/, '').replace(/\/api$/, '');
}

export function getBackendUrl(): string {
  return normalizeBackendUrl(
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ''
  );
}

export function getPublicBackendUrl(): string {
  return normalizeBackendUrl(process.env.NEXT_PUBLIC_BACKEND_URL || '');
}

export function getServerApiBase(): string {
  if (typeof window !== 'undefined') return API_BASE;
  return FRONTEND_URL ? `${FRONTEND_URL.replace(/\/$/, '')}${API_BASE}` : API_BASE;
}

export function getBackendApiUrl(path = ''): string {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error('BACKEND_URL or NEXT_PUBLIC_BACKEND_URL is required.');
  }
  const cleanPath = path.replace(/^\/+/, '');
  return `${backendUrl}/api/${cleanPath}`;
}
