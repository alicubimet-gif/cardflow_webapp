import api from './api';

export const AuthService = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post('/api/mobile/auth/login/', credentials);
    return res.data;
  },

  verifyMagicToken: async (token: string) => {
    const res = await api.post('/api/auth/verify-magic-token/', { token });
    return res.data;
  },

  completePasswordSetup: async (payload: { token: string; password: string; confirm_password: string }) => {
    const res = await api.post('/api/webapp/auth/complete-password-setup/', payload);
    return res.data;
  },

  setupPassword: async (payload: { new_password: string; confirm_password: string }) => {
    const res = await api.post('/api/webapp/auth/setup-password/', payload);
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/api/mobile/auth/logout/', {});
    } catch (e) {
      // Ignore network errors on logout
    }
  },

  getProfile: async () => {
    const res = await api.get('/api/mobile/auth/me/');
    return res.data;
  },

  changePassword: async (payload: any) => {
    const res = await api.post('/api/mobile/auth/change-password/', payload);
    return res.data;
  },

  forgotPassword: async (payload: any) => {
    const res = await api.post('/api/webapp/auth/forgot-password/', payload);
    return res.data;
  },

  resetPassword: async (payload: any) => {
    const res = await api.post('/api/webapp/auth/reset-password/', payload);
    return res.data;
  },

  getDashboard: async () => {
    const res = await api.get('/api/mobile/dashboard/');
    return res.data;
  },

  getRecords: async () => {
    const res = await api.get('/api/mobile/records/');
    const d = res.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  },

  getApprovalLogs: async () => {
    const res = await api.get('/api/mobile/approval-logs/');
    const d = res.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  },

  getClasses: async () => {
    const res = await api.get('/api/mobile/classes/');
    const d = res.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  },

  getDivisions: async (classId?: string) => {
    const url = classId ? `/api/mobile/divisions/?school_class=${classId}` : '/api/mobile/divisions/';
    const res = await api.get(url);
    const d = res.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  },

  getBranches: async () => {
    const res = await api.get('/api/mobile/branches/');
    const d = res.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  },

  getDepartments: async (branchId?: string) => {
    const url = branchId ? `/api/mobile/departments/?branch=${branchId}` : '/api/mobile/departments/';
    const res = await api.get(url);
    const d = res.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  },

  getTemplateFields: async (orgId: string, params: { class_id?: string; division_id?: string; branch_id?: string; department_id?: string }) => {
    const cleanParams: any = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== 'undefined' && v !== 'null' && v !== '') {
        cleanParams[k] = v;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    const res = await api.get(`/api/studio/organizations/${orgId}/template-fields/?${query}`);
    return res.data;
  },

  getStaffList: async () => {
    const res = await api.get('/api/mobile/staff/');
    const d = res.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  },

  // --- Classes CRUD ---
  createClass: async (data: { name: string; branch?: string; organization?: string }) => {
    const res = await api.post('/api/mobile/classes/', data);
    return res.data;
  },
  updateClass: async (id: string, data: { name: string; branch?: string; organization?: string }) => {
    const res = await api.put(`/api/mobile/classes/${id}/`, data);
    return res.data;
  },
  deleteClass: async (id: string) => {
    const res = await api.delete(`/api/mobile/classes/${id}/`);
    return res.data;
  },

  // --- Divisions CRUD ---
  createDivision: async (data: { name: string; school_class: string }) => {
    const res = await api.post('/api/mobile/divisions/', data);
    return res.data;
  },
  updateDivision: async (id: string, data: { name: string; school_class: string }) => {
    const res = await api.put(`/api/mobile/divisions/${id}/`, data);
    return res.data;
  },
  deleteDivision: async (id: string) => {
    const res = await api.delete(`/api/mobile/divisions/${id}/`);
    return res.data;
  },

  // --- Branches CRUD ---
  createBranch: async (data: { name: string; organization?: string }) => {
    const res = await api.post('/api/mobile/branches/', data);
    return res.data;
  },
  updateBranch: async (id: string, data: { name: string; organization?: string }) => {
    const res = await api.put(`/api/mobile/branches/${id}/`, data);
    return res.data;
  },
  deleteBranch: async (id: string) => {
    const res = await api.delete(`/api/mobile/branches/${id}/`);
    return res.data;
  },

  // --- Departments CRUD ---
  createDepartment: async (data: { name: string; branch: string }) => {
    const res = await api.post('/api/mobile/departments/', data);
    return res.data;
  },
  updateDepartment: async (id: string, data: { name: string; branch: string }) => {
    const res = await api.put(`/api/mobile/departments/${id}/`, data);
    return res.data;
  },
  deleteDepartment: async (id: string) => {
    const res = await api.delete(`/api/mobile/departments/${id}/`);
    return res.data;
  },

  // --- Staff CRUD & Management ---
  createStaff: async (data: any) => {
    const res = await api.post('/api/mobile/staff/', data);
    return res.data;
  },
  updateStaff: async (id: string, data: any) => {
    const res = await api.put(`/api/mobile/staff/${id}/`, data);
    return res.data;
  },
  deleteStaff: async (id: string) => {
    const res = await api.delete(`/api/mobile/staff/${id}/`);
    return res.data;
  },
  resetStaffPassword: async (id: string, payload: { password?: string; new_password?: string; temporary_password?: string }) => {
    const res = await api.post(`/api/mobile/staff/${id}/reset-password/`, payload);
    return res.data;
  },

  // --- Staff Assignments ---
  getStaffAssignments: async (staffId: string) => {
    const res = await api.get(`/api/mobile/staff-assignments/?staff=${staffId}`);
    const d = res.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  },
  getAllStaffAssignments: async () => {
    const res = await api.get('/api/mobile/staff-assignments/');
    const d = res.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  },
  createStaffAssignment: async (data: { staff: string; division?: string; school_class?: string; branch?: string; department?: string; assignment_level: string; inherit_children?: boolean }) => {
    const res = await api.post('/api/mobile/staff-assignments/', data);
    return res.data;
  },
  deleteStaffAssignment: async (id: string) => {
    const res = await api.delete(`/api/mobile/staff-assignments/${id}/`);
    return res.data;
  },

  // --- Records CRUD ---
  createRecord: async (data: any) => {
    const res = await api.post('/api/mobile/records/', data);
    return res.data;
  },
  updateRecord: async (id: string, data: any) => {
    const res = await api.put(`/api/mobile/records/${id}/`, data);
    return res.data;
  },
  deleteRecord: async (id: string) => {
    const res = await api.delete(`/api/mobile/records/${id}/`);
    return res.data;
  },

  // --- Record Workflow Actions ---
  submitRecord: async (id: string, cardId?: string) => {
    const path = cardId ? `/api/webapp/cards/${cardId}/submit/` : `/api/webapp/records/${id}/submit/`;
    const res = await api.post(path, {});
    return res.data;
  },
  approveRecord: async (id: string, data: any, cardId?: string) => {
    const path = cardId ? `/api/webapp/cards/${cardId}/approve/` : `/api/webapp/records/${id}/approve/`;
    const res = await api.post(path, data);
    return res.data;
  },
  rejectRecord: async (id: string, data: any, cardId?: string) => {
    const path = cardId ? `/api/webapp/cards/${cardId}/reject/` : `/api/webapp/records/${id}/reject/`;
    const res = await api.post(path, data);
    return res.data;
  },
  correctionRecord: async (id: string, data: any, cardId?: string) => {
    const path = cardId ? `/api/webapp/cards/${cardId}/correction/` : `/api/webapp/records/${id}/correction/`;
    const res = await api.post(path, data);
    return res.data;
  },

  // --- Profiles / Configurations ---
  getSchoolProfile: async () => {
    const res = await api.get('/api/mobile/school/profile/');
    return res.data;
  },
  getOfficeProfile: async () => {
    const res = await api.get('/api/mobile/office/profile/');
    return res.data;
  },

  // --- Photo Upload ---
  uploadPhoto: async (formData: FormData) => {
    const res = await api.post('/api/mobile/photos/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // --- Card Preview ---
  getCardPreview: async (type: 'student' | 'school-staff' | 'employee', id: string) => {
    const res = await api.get(`/api/mobile/cards/preview/${type}/${id}/`);
    return res.data;
  },

  // --- Bulk Uploads ---
  bulkUploadStudents: async (formData: FormData) => {
    const res = await api.post('/api/mobile/students/bulk-upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  bulkUploadSchoolStaff: async (formData: FormData) => {
    const res = await api.post('/api/mobile/school-staff/bulk-upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  bulkUploadEmployees: async (formData: FormData) => {
    const res = await api.post('/api/mobile/employees/bulk-upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  downloadExcelTemplate: async (params: {
    organization_id: string;
    class_id?: string;
    division_id?: string;
    branch_id?: string;
    department_id?: string;
    template_id?: string;
  }) => {
    const cleanParams: any = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== 'undefined' && v !== 'null' && v !== '') {
        cleanParams[k] = v;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    const res = await api.get(`/api/studio/bulk-upload/excel-template/?${query}`, {
      responseType: 'blob'
    });
    return res.data;
  }
};

