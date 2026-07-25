export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/mobile/auth/login/',
    ME: '/api/mobile/auth/me/',
    COMPLETE_PASSWORD_SETUP: '/api/webapp/auth/complete-password-setup/',
    SETUP_PASSWORD: '/api/webapp/auth/setup-password/',
    LOGOUT: '/api/mobile/auth/logout/',
    CHANGE_PASSWORD: '/api/mobile/auth/change-password/',
    FORGOT_PASSWORD: '/api/webapp/auth/forgot-password/',
    RESET_PASSWORD: '/api/webapp/auth/reset-password/',
  },
  DASHBOARD: '/api/mobile/dashboard/',
  RECORDS: {
    LIST: '/api/mobile/records/',
    DETAIL: (id: string | number) => `/api/mobile/records/${id}/`,
    UPDATE: (id: string | number) => `/api/mobile/records/${id}/`,
    UPDATE_PHOTO: (id: string | number) => `/api/mobile/records/${id}/update_photo/`,
    BULK_UPLOAD: '/api/mobile/records/bulk-upload/',
    SUBMIT: (id: string | number) => `/api/webapp/records/${id}/submit/`,
    APPROVE: (id: string | number) => `/api/webapp/records/${id}/approve/`,
    REJECT: (id: string | number) => `/api/webapp/records/${id}/reject/`,
    REVERT_APPROVAL: (id: string | number) => `/api/webapp/records/${id}/revert-approval/`,
    CORRECTION: (id: string | number) => `/api/webapp/records/${id}/correction/`,
  },
  PHOTOS: {
    UPLOAD: '/api/mobile/photos/upload/',
  },
  FILES: {
    UPLOAD: '/api/organizations/records/upload-file/',
  },
  STAFF: {
    LIST: '/api/mobile/staff/',
    DETAIL: (id: string | number) => `/api/mobile/staff/${id}/`,
    RESET_PASSWORD: (id: string | number) => `/api/mobile/staff/${id}/reset-password/`,
  },
  STAFF_ASSIGNMENTS: {
    LIST: '/api/mobile/staff-assignments/',
    CREATE: '/api/mobile/staff-assignments/',
    DETAIL: (id: string | number) => `/api/mobile/staff-assignments/${id}/`,
    DELETE: (id: string | number) => `/api/mobile/staff-assignments/${id}/`,
  },
  BRANCH_STAFF: {
    LIST: '/api/mobile/branch-staff/',
    DETAIL: (id: string | number) => `/api/mobile/branch-staff/${id}/`,
  },
  GROUPS: {
    LIST: '/api/mobile/groups/',
    DETAIL: (id: string | number) => `/api/mobile/groups/${id}/`,
  },
  SUBGROUPS: {
    LIST: '/api/mobile/subgroups/',
    DETAIL: (id: string | number) => `/api/mobile/subgroups/${id}/`,
  },
  APPROVAL_LOGS: {
    LIST: '/api/mobile/approval-logs/',
    EXPORT: '/api/mobile/approval-logs/export/',
  },
  ORGANIZATION: {
    PROFILE: '/api/mobile/organization/profile/',
    TEMPLATE_FIELDS: (orgId: string | number) => `/api/studio/organizations/${orgId}/template-fields/`,
    BULK_UPLOAD_EXCEL: '/api/studio/bulk-upload/excel-template/',
  },
  FIELDS: {
    LIST: '/api/mobile/fields/',
  },
  CARDS: {
    LIST: '/api/cards/',
    SUBMIT: (id: string | number) => `/api/cards/${id}/submit/`,
    APPROVE: (id: string | number) => `/api/cards/${id}/approve/`,
    REJECT: (id: string | number) => `/api/cards/${id}/reject/`,
    CORRECTION: (id: string | number) => `/api/cards/${id}/correction/`,
  },
  CLASSES: {
    LIST: '/api/mobile/classes/',
    DETAIL: (id: string | number) => `/api/mobile/classes/${id}/`,
  },
  DIVISIONS: {
    LIST: '/api/mobile/divisions/',
    DETAIL: (id: string | number) => `/api/mobile/divisions/${id}/`,
  },
  BRANCHES: {
    LIST: '/api/mobile/branches/',
    DETAIL: (id: string | number) => `/api/mobile/branches/${id}/`,
  },
  DEPARTMENTS: {
    LIST: '/api/mobile/departments/',
    DETAIL: (id: string | number) => `/api/mobile/departments/${id}/`,
  },
  RESEND_INVITE: (id: string | number) => `/api/mobile/staff/${id}/resend-invite/`,
} as const;
