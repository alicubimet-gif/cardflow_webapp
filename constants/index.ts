import { ORGANIZATION_TYPES } from '@/config/organization.config';

export { ORGANIZATION_TYPES };

export const USER_ROLES = {
  ORGANIZATION_ADMIN: 'organization_admin',
  ORGANIZATION_STAFF: 'organization_staff',
} as const;

export const RECORD_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CORRECTION_REQUIRED: 'correction_required',
  DRAFT: 'draft',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  GROUPS: '/groups',
  RECORDS: '/records',
  USERS: '/users',
  SETTINGS: '/settings',
  APPROVAL_LOGS: '/approval-logs',
  APPROVALS: '/approvals',
  SETUP_PASSWORD: '/setup-password',
} as const;
