import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

// --- Classes CRUD ---
export async function getClasses() {
  const res = await apiClient.get(API_ENDPOINTS.GROUPS.LIST);
  const d = res.data;
  return Array.isArray(d) ? d : (d?.results ?? []);
}

export async function createClass(data: { name: string; group?: string; school_class?: string; organization?: string; [key: string]: any }) {
  const res = await apiClient.post(API_ENDPOINTS.CLASSES.LIST, data);
  return res.data;
}

export async function updateClass(id: string | number, data: { name: string; group?: string; school_class?: string; organization?: string; [key: string]: any }) {
  const res = await apiClient.put(API_ENDPOINTS.CLASSES.DETAIL(id), data);
  return res.data;
}

export async function deleteClass(id: string | number) {
  const res = await apiClient.delete(API_ENDPOINTS.CLASSES.DETAIL(id));
  return res.data;
}

// --- Divisions CRUD ---
export async function getDivisions(classId?: string | number) {
  const url = classId ? `${API_ENDPOINTS.SUBGROUPS.LIST}?group=${classId}` : API_ENDPOINTS.SUBGROUPS.LIST;
  const res = await apiClient.get(url);
  const d = res.data;
  return Array.isArray(d) ? d : (d?.results ?? []);
}

export async function createDivision(data: { name: string; group?: string; school_class?: string; [key: string]: any }) {
  const res = await apiClient.post(API_ENDPOINTS.DIVISIONS.LIST, data);
  return res.data;
}

export async function updateDivision(id: string | number, data: { name: string; group?: string; school_class?: string; [key: string]: any }) {
  const res = await apiClient.put(API_ENDPOINTS.DIVISIONS.DETAIL(id), data);
  return res.data;
}

export async function deleteDivision(id: string | number) {
  const res = await apiClient.delete(API_ENDPOINTS.DIVISIONS.DETAIL(id));
  return res.data;
}

// --- Branches CRUD ---
export async function getBranches() {
  const res = await apiClient.get(API_ENDPOINTS.GROUPS.LIST);
  const d = res.data;
  return Array.isArray(d) ? d : (d?.results ?? []);
}

export async function createBranch(data: { name: string; organization?: string; [key: string]: any }) {
  const res = await apiClient.post(API_ENDPOINTS.BRANCHES.LIST, data);
  return res.data;
}

export async function updateBranch(id: string | number, data: { name: string; organization?: string; [key: string]: any }) {
  const res = await apiClient.put(API_ENDPOINTS.BRANCHES.DETAIL(id), data);
  return res.data;
}

export async function deleteBranch(id: string | number) {
  const res = await apiClient.delete(API_ENDPOINTS.BRANCHES.DETAIL(id));
  return res.data;
}

// --- Departments CRUD ---
export async function getDepartments(branchId?: string | number) {
  const url = branchId ? `${API_ENDPOINTS.SUBGROUPS.LIST}?group=${branchId}` : API_ENDPOINTS.SUBGROUPS.LIST;
  const res = await apiClient.get(url);
  const d = res.data;
  return Array.isArray(d) ? d : (d?.results ?? []);
}

export async function createDepartment(data: { name: string; group?: string; branch?: string; [key: string]: any }) {
  const res = await apiClient.post(API_ENDPOINTS.DEPARTMENTS.LIST, data);
  return res.data;
}

export async function updateDepartment(id: string | number, data: { name: string; group?: string; branch?: string; [key: string]: any }) {
  const res = await apiClient.put(API_ENDPOINTS.DEPARTMENTS.DETAIL(id), data);
  return res.data;
}

export async function deleteDepartment(id: string | number) {
  const res = await apiClient.delete(API_ENDPOINTS.DEPARTMENTS.DETAIL(id));
  return res.data;
}
