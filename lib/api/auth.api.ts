import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { getOrganizationProfile } from './organization.api';
import * as UserApi from './user.api';

export const AuthService = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return res.data;
  },

  completePasswordSetup: async (payload: { uidb64?: string; token: string; password: string; confirm_password: string }) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.COMPLETE_PASSWORD_SETUP, payload);
    return res.data;
  },

  setupPassword: async (payload: { new_password: string; confirm_password: string }) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.SETUP_PASSWORD, payload);
    return res.data;
  },

  logout: async () => {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {});
    } catch (e) {
      // Ignore network errors on logout
    }
  },

  getProfile: async () => {
    const res = await apiClient.get(API_ENDPOINTS.AUTH.ME);
    return res.data;
  },

  getSchoolProfile: async () => {
    return getOrganizationProfile();
  },

  getOfficeProfile: async () => {
    return getOrganizationProfile();
  },

  changePassword: async (payload: any) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
    return res.data;
  },

  forgotPassword: async (payload: any) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
    return res.data;
  },

  resetPassword: async (payload: any) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
    return res.data;
  },

  getStaffList: UserApi.getStaffList,
  getAllStaffAssignments: UserApi.getUserAssignments,
  getStaffAssignments: UserApi.getStaffAssignments,
  getUserAssignments: UserApi.getUserAssignments,
  createStaff: UserApi.createStaff,
  updateStaff: UserApi.updateStaff,
  deleteStaff: UserApi.deleteStaff,
  resetStaffPassword: UserApi.resetStaffPassword,
  deleteStaffAssignment: UserApi.deleteStaffAssignment,
  deleteUserAssignment: UserApi.deleteUserAssignment,
  createStaffAssignment: UserApi.createStaffAssignment,
  createUserAssignment: UserApi.createUserAssignment,
};

export const login = AuthService.login;
export const completePasswordSetup = AuthService.completePasswordSetup;
export const setupPassword = AuthService.setupPassword;
export const logout = AuthService.logout;
export const getProfile = AuthService.getProfile;
export const getSchoolProfile = AuthService.getSchoolProfile;
export const getOfficeProfile = AuthService.getOfficeProfile;
export const changePassword = AuthService.changePassword;
export const forgotPassword = AuthService.forgotPassword;
export const resetPassword = AuthService.resetPassword;
export default AuthService;
