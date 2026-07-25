export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  AUTH: {
    LOGIN: '/auth/login',
    SETUP_PASSWORD: '/auth/setup-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    INVITE: (token: string) => `/auth/invite/${token}`,
  },
  RECORDS: {
    LIST: '/dashboard', // often dashboard lists records
    DETAIL: (id: string | number) => `/dashboard/records/${id}`,
  },
  STAFF: {
    LIST: '/dashboard/staff',
    DETAIL: (id: string | number) => `/staff/details?staffId=${encodeURIComponent(id)}`,
  },
  USERS: {
    DETAIL: (id: string | number) => `/users/details?userId=${encodeURIComponent(id)}`,
  },
  ORGANIZATION: {
    PROFILE: '/dashboard/organization',
  }
} as const;
