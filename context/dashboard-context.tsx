'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { AuthService } from '@/services/auth-service';
import * as recordService from '@/services/record-service';
import api from '@/services/api';

export interface OrganizationStats {
  totalStudents: number;
  totalSchoolStaff: number;
  totalEmployees: number;
  pendingCards: number;
  approvedCards: number;
  rejectedCards: number;
  correctionRequired: number;
  totalApprovedRecords: number;
  recentlyUpdated: any[];
}

interface DashboardContextType {
  // Lists
  branchesList: any[];
  departmentsList: any[];
  classesList: any[];
  divisionsList: any[];
  staffList: any[];
  recordsList: any[];
  logsList: any[];
  allAssignmentsList: any[];

  // Dynamic Add Record fields
  dynamicFieldsList: any[];

  // Stats & States
  stats: OrganizationStats;
  orgName: string;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isSchool: boolean;
  requiredFields: any[];
  resolvedTemplate: {
    has_template: boolean;
    fields: any[];
    template_id: string | null;
    template_name: string | null;
  };

  // Nested View Selections
  activeClassId: string | null;
  setActiveClassId: (id: string | null) => void;
  activeDivisionId: string | null;
  setActiveDivisionId: (id: string | null) => void;
  activeBranchId: string | null;
  setActiveBranchId: (id: string | null) => void;
  activeDepartmentId: string | null;
  setActiveDepartmentId: (id: string | null) => void;

  // Search & Filter
  recordSearch: string;
  setRecordSearch: (s: string) => void;
  recordFilterStatus: string;
  setRecordFilterStatus: (s: string) => void;

  // Modals / Details triggers
  viewingRecord: any | null;
  setViewingRecord: (r: any | null) => void;
  isBulkUploadModalOpen: boolean;
  setIsBulkUploadModalOpen: (b: boolean) => void;
  isRecordModalOpen: boolean;
  setIsRecordModalOpen: (b: boolean) => void;
  editingRecord: any | null;
  isAddRecordModalOpen: boolean;
  setIsAddRecordModalOpen: (b: boolean) => void;

  // CRUD & Operations
  fetchDashboardData: () => Promise<void>;
  fetchActiveTemplate: () => Promise<void>;
  handleOpenCreateRecord: () => Promise<void>;
  handleOpenEditRecord: (record: any) => void;
  handleSaveRecord: (formValues: any, processedBlob: Blob | null) => Promise<void>;
  handleDeleteRecord: (id: string) => Promise<void>;
  handleSubmitRecord: (id: string) => Promise<void>;
  handleApproveRecord: (id: string, skipConfirm?: boolean) => Promise<void>;
  handleRejectRecord: (id: string, reason?: string) => Promise<void>;
  handleCorrectionRecord: (id: string, note?: string) => Promise<void>;
  
  // Staff CRUD
  isCreateStaffOpen: boolean;
  setIsCreateStaffOpen: (b: boolean) => void;
  isEditStaffOpen: boolean;
  setIsEditStaffOpen: (b: boolean) => void;
  isResetPasswordOpen: boolean;
  setIsResetPasswordOpen: (b: boolean) => void;
  isStaffDetailsOpen: boolean;
  setIsStaffDetailsOpen: (b: boolean) => void;
  editingStaff: any | null;
  setEditingStaff: (s: any | null) => void;
  viewingStaff: any | null;
  setViewingStaff: (s: any | null) => void;
  staffForReset: any | null;
  setStaffForReset: (s: any | null) => void;
  
  handleOpenCreate: () => void;
  handleOpenEdit: (staff: any) => Promise<void>;
  handleOpenView: (staff: any) => Promise<void>;
  handleCreateStaffSubmit: (payload: any) => Promise<void>;
  handleEditStaffSubmit: (id: string, payload: any) => Promise<void>;
  handleResetPasswordSubmit: (id: string, newPassword: string) => Promise<void>;
  handleToggleStaffStatus: (id: string, currentStatus: boolean, name: string) => Promise<void>;
  handleRemoveStaffAssignment: (assignmentId: string, label: string) => Promise<void>;

  // Staff Assignment Modals
  isAssignStaffModalOpen: boolean;
  setIsAssignStaffModalOpen: (b: boolean) => void;
  assignTargetType: 'class' | 'division' | 'branch' | 'department';
  setAssignTargetType: (t: 'class' | 'division' | 'branch' | 'department') => void;
  assignTargetId: string | null;
  setAssignTargetId: (id: string | null) => void;

  isAssignClassOpen: boolean;
  setIsAssignClassOpen: (b: boolean) => void;
  isAssignDivisionOpen: boolean;
  setIsAssignDivisionOpen: (b: boolean) => void;
  isAssignBranchOpen: boolean;
  setIsAssignBranchOpen: (b: boolean) => void;
  isAssignDepartmentOpen: boolean;
  setIsAssignDepartmentOpen: (b: boolean) => void;

  handleAssignClasses: (selectedClassIds: string[]) => Promise<void>;
  handleAssignDivisions: (selectedDivisionIds: string[]) => Promise<void>;
  handleAssignBranches: (selectedBranchIds: string[]) => Promise<void>;
  handleAssignDepartments: (selectedDeptIds: string[]) => Promise<void>;
  handleSaveStaffAssignments: (selectedStaffIds: string[]) => Promise<void>;

  // Structure Modal states
  isStructureModalOpen: boolean;
  setIsStructureModalOpen: (b: boolean) => void;
  structureType: 'class' | 'division' | 'branch' | 'department';
  setStructureType: (t: 'class' | 'division' | 'branch' | 'department') => void;
  editingStructureId: string | null;
  setEditingStructureId: (id: string | null) => void;
  structureName: string;
  setStructureName: (n: string) => void;
  structureParentId: string;
  setStructureParentId: (id: string) => void;

  handleOpenCreateStructure: (type: 'class' | 'division' | 'branch' | 'department') => void;
  handleOpenEditStructure: (type: 'class' | 'division' | 'branch' | 'department', item: any) => void;
  handleSaveStructure: (name: string, parentId?: string) => Promise<void>;
  handleDeleteStructure: (type: 'class' | 'division' | 'branch' | 'department', id: string) => Promise<void>;

  // Helpers
  getBranchName: (id: string | null) => string;
  getDeptName: (id: string | null) => string;
  getClassName: (id: string | null) => string;
  getDivName: (id: string | null) => string;
  getActiveFields: () => any[];
  getBreadcrumbs: (currentRoute: string) => any[];
  renderBlockade: (onBackAction?: () => void) => React.ReactNode;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [orgName, setOrgName] = useState('');
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeDivisionId, setActiveDivisionId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeDepartmentId, setActiveDepartmentId] = useState<string | null>(null);

  // Modals & triggers
  const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
  const [assignTargetType, setAssignTargetType] = useState<'class' | 'division' | 'branch' | 'department'>('class');
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [allAssignmentsList, setAllAssignmentsList] = useState<any[]>([]);

  // Staff CRUD state
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isStaffDetailsOpen, setIsStaffDetailsOpen] = useState(false);

  // Dynamic Add Record state
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [dynamicFieldsList, setDynamicFieldsList] = useState<any[]>([]);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [viewingStaff, setViewingStaff] = useState<any | null>(null);
  const [staffForReset, setStaffForReset] = useState<any | null>(null);

  // Staff Assign Modals state
  const [isAssignClassOpen, setIsAssignClassOpen] = useState(false);
  const [isAssignDivisionOpen, setIsAssignDivisionOpen] = useState(false);
  const [isAssignBranchOpen, setIsAssignBranchOpen] = useState(false);
  const [isAssignDepartmentOpen, setIsAssignDepartmentOpen] = useState(false);

  // Structure Modal state
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [structureType, setStructureType] = useState<'class' | 'division' | 'branch' | 'department'>('class');
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [structureName, setStructureName] = useState('');
  const [structureParentId, setStructureParentId] = useState('');

  // Record form state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [requiredFields, setRequiredFields] = useState<any[]>([]);
  const [resolvedTemplate, setResolvedTemplate] = useState<{
    has_template: boolean;
    fields: any[];
    template_id: string | null;
    template_name: string | null;
  }>({
    has_template: true,
    fields: [],
    template_id: null,
    template_name: null,
  });

  // Record details
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  // Lists
  const [stats, setStats] = useState<OrganizationStats>({
    totalStudents: 0, totalSchoolStaff: 0, totalEmployees: 0,
    pendingCards: 0, approvedCards: 0, rejectedCards: 0,
    correctionRequired: 0, totalApprovedRecords: 0, recentlyUpdated: []
  });
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [divisionsList, setDivisionsList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [recordsList, setRecordsList] = useState<any[]>([]);
  const [logsList, setLogsList] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & filter
  const [recordSearch, setRecordSearch] = useState('');
  const [recordFilterStatus, setRecordFilterStatus] = useState('');

  const isAdmin = user?.role === 'organization_admin';
  const isSchool = user?.organization_type?.toLowerCase() !== 'office';

  const getBranchName = (id: string | null) => id ? (branchesList.find(b => String(b.id) === String(id))?.name || '—') : '—';
  const getDeptName = (id: string | null) => id ? (departmentsList.find(d => String(d.id) === String(id))?.name || '—') : '—';
  const getClassName = (id: string | null) => id ? (classesList.find(c => String(c.id) === String(id))?.name || '—') : '—';
  const getDivName = (id: string | null) => id ? (divisionsList.find(d => String(d.id) === String(id))?.name || '—') : '—';

  const getActiveFields = () => (requiredFields || []).filter(f => f.enabled !== false);

  const getBreadcrumbs = (currentRoute: string) => {
    const crumbs = [{ label: 'Dashboard', tab: 'dashboard', action: () => {} }];

    if (isSchool) {
      if (currentRoute.includes('classes')) {
        crumbs.push({ label: 'Classes', tab: 'classes', action: () => { setActiveClassId(null); setActiveDivisionId(null); setViewingRecord(null); setIsBulkUploadModalOpen(false); } });
        if (activeClassId) {
          const cls = classesList.find(c => String(c.id) === String(activeClassId));
          crumbs.push({ label: cls ? cls.name : 'Class', tab: 'classes', action: () => { setActiveDivisionId(null); setViewingRecord(null); setIsBulkUploadModalOpen(false); } });
          
          if (activeDivisionId) {
            const div = divisionsList.find(d => String(d.id) === String(activeDivisionId));
            crumbs.push({ label: div ? div.name : 'Division', tab: 'classes', action: () => { setViewingRecord(null); setIsBulkUploadModalOpen(false); } });
          }
        }
      }
    } else {
      if (currentRoute.includes('branches')) {
        crumbs.push({ label: 'Branches', tab: 'branches', action: () => { setActiveBranchId(null); setActiveDepartmentId(null); setViewingRecord(null); setIsBulkUploadModalOpen(false); } });
        if (activeBranchId) {
          const br = branchesList.find(b => String(b.id) === String(activeBranchId));
          crumbs.push({ label: br ? br.name : 'Branch', tab: 'branches', action: () => { setActiveDepartmentId(null); setViewingRecord(null); setIsBulkUploadModalOpen(false); } });
          
          if (activeDepartmentId) {
            const dept = departmentsList.find(d => String(d.id) === String(activeDepartmentId));
            crumbs.push({ label: dept ? dept.name : 'Department', tab: 'branches', action: () => { setViewingRecord(null); setIsBulkUploadModalOpen(false); } });
          }
        }
      }
    }

    if (isBulkUploadModalOpen) {
      crumbs.push({ label: 'Bulk Upload', tab: '', action: () => {} });
    }

    return crumbs;
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const isSchoolUser = user?.organization_type?.toLowerCase() === 'school';

      const profile = isSchoolUser
        ? await AuthService.getSchoolProfile().catch(() => null)
        : await AuthService.getOfficeProfile().catch(() => null);

      if (profile) {
        setOrgName(profile.school_name || profile.office_name || '');
        setRequiredFields(profile?.required_fields || []);
      }

      const statsRes = await AuthService.getDashboard().catch(() => null);
      if (statsRes) {
        setStats({
          totalStudents: statsRes.total_students || 0,
          totalSchoolStaff: statsRes.total_school_staff || 0,
          totalEmployees: statsRes.total_employees || 0,
          pendingCards: statsRes.pending_cards || 0,
          approvedCards: statsRes.approved_cards || 0,
          rejectedCards: statsRes.rejected_cards || 0,
          correctionRequired: statsRes.correction_required || 0,
          totalApprovedRecords: statsRes.total_approved_records || 0,
          recentlyUpdated: statsRes.recently_updated || []
        });
      }

      const [classes, divisions, branches, departments, records] = await Promise.all([
        AuthService.getClasses().catch(() => []),
        AuthService.getDivisions().catch(() => []),
        AuthService.getBranches().catch(() => []),
        AuthService.getDepartments().catch(() => []),
        AuthService.getRecords().catch(() => [])
      ]);

      setClassesList(classes || []);
      setDivisionsList(divisions || []);
      setBranchesList(branches || []);
      setDepartmentsList(departments || []);
      setRecordsList(records || []);

      if (isAdmin) {
        const [staff, logs, assignments] = await Promise.all([
          AuthService.getStaffList().catch(() => []),
          AuthService.getApprovalLogs().catch(() => []),
          AuthService.getAllStaffAssignments().catch(() => [])
        ]);
        setStaffList(staff || []);
        setLogsList(logs || []);
        setAllAssignmentsList(assignments || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to sync with backend.');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user, fetchDashboardData]);

  const fetchActiveTemplate = useCallback(async () => {
    if (!user) return;
    const orgId = user?.organization_id;
    if (!orgId) return;

    try {
      const params: Record<string, string> = {};
      if (activeClassId) params.class_id = activeClassId;
      if (activeDivisionId) params.division_id = activeDivisionId;
      if (activeBranchId) params.branch_id = activeBranchId;
      if (activeDepartmentId) params.department_id = activeDepartmentId;

      const queryStr = new URLSearchParams(params).toString();
      const res = await api.get(`/api/studio/organizations/${orgId}/template-fields/?${queryStr}`);
      const data = res.data;
      
      setResolvedTemplate({
        has_template: data?.has_template ?? false,
        fields: data?.fields ?? [],
        template_id: data?.template_id ?? null,
        template_name: data?.template_name ?? null,
      });

      if (data?.fields) {
        setRequiredFields(data.fields);
      }
    } catch (err) {
      console.error('Error fetching active template:', err);
    }
  }, [user, activeClassId, activeDivisionId, activeBranchId, activeDepartmentId]);

  useEffect(() => {
    if (user) {
      fetchActiveTemplate();
    }
  }, [user, activeClassId, activeDivisionId, activeBranchId, activeDepartmentId, fetchActiveTemplate]);

  const renderBlockade = (onBackAction?: () => void) => (
    <div className="bg-white border border-red-100 rounded-3xl p-8 max-w-2xl mx-auto my-12 text-center shadow-lg space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Sora' }}>No Template Assigned</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          This organization, class, division, branch, or department does not have an assigned template. Please assign a template from CardFlow Studio.
        </p>
      </div>
      {onBackAction && (
        <button
          onClick={onBackAction}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
        >
          ← Go Back
        </button>
      )}
    </div>
  );

  // Staff handlers
  const handleOpenCreate = () => {
    setIsCreateStaffOpen(true);
  };

  const handleOpenEdit = async (staff: any) => {
    setEditingStaff(staff);
    setIsEditStaffOpen(true);
  };

  const handleOpenView = async (staff: any) => {
    setLoading(true);
    try {
      const assignments = await AuthService.getStaffAssignments(staff.id);
      setViewingStaff({ ...staff, assignments: assignments || [] });
      setIsStaffDetailsOpen(true);
    } catch {
      setViewingStaff(staff);
      setIsStaffDetailsOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaffSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await AuthService.createStaff(payload);
      await fetchDashboardData();
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleEditStaffSubmit = async (id: string, payload: any) => {
    setLoading(true);
    try {
      await AuthService.updateStaff(id, payload);
      await fetchDashboardData();
      if (viewingStaff && String(viewingStaff.id) === String(id)) {
        const assignments = await AuthService.getStaffAssignments(id).catch(() => []);
        setViewingStaff({ ...viewingStaff, ...payload, assignments });
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (id: string, newPassword: string) => {
    setLoading(true);
    try {
      await AuthService.resetStaffPassword(id, {
        password: newPassword,
        new_password: newPassword,
        temporary_password: newPassword
      });
      alert('Password reset successfully.');
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStaffStatus = async (id: string, currentStatus: boolean, name: string) => {
    const actionText = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${actionText} staff member "${name}"?`)) return;
    setLoading(true);
    try {
      const targetActive = !currentStatus;
      await AuthService.updateStaff(id, {
        is_active: targetActive,
        status: targetActive ? 'active' : 'inactive'
      });
      await fetchDashboardData();
      if (viewingStaff && String(viewingStaff.id) === String(id)) {
        const assignments = await AuthService.getStaffAssignments(id).catch(() => []);
        setViewingStaff((prev: any) => prev ? { ...prev, is_active: targetActive, status: targetActive ? 'active' : 'inactive', assignments } : null);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || `Failed to ${actionText} staff member.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaffAssignment = async (assignmentId: string, label: string) => {
    setLoading(true);
    try {
      await AuthService.deleteStaffAssignment(assignmentId);
      await fetchDashboardData();
      if (viewingStaff) {
        const updated = (viewingStaff.assignments || []).filter((a: any) => String(a.id) !== String(assignmentId));
        setViewingStaff({ ...viewingStaff, assignments: updated });
      }
    } catch {
      alert(`Failed to remove access to "${label}".`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClasses = async (selectedClassIds: string[]) => {
    if (!viewingStaff) return;
    setLoading(true);
    try {
      const staffId = viewingStaff.id;
      const currentRes = await AuthService.getStaffAssignments(staffId);
      const currentAssignments = currentRes || [];
      const classAssignments = currentAssignments.filter((a: any) => a.assignment_level === 'class');

      const toDelete = classAssignments.filter((a: any) => {
        const classId = String(a.school_class?.id || a.school_class);
        return !selectedClassIds.includes(classId);
      });

      const currentClassIds = classAssignments.map((a: any) => String(a.school_class?.id || a.school_class));
      const toCreate = selectedClassIds.filter(id => !currentClassIds.includes(String(id)));

      for (const a of toDelete) {
        await AuthService.deleteStaffAssignment(a.id);
      }
      for (const id of toCreate) {
        await AuthService.createStaffAssignment({
          staff: staffId,
          school_class: id,
          assignment_level: 'class',
          inherit_children: true
        });
      }

      const freshAssignments = await AuthService.getStaffAssignments(staffId);
      setViewingStaff({ ...viewingStaff, assignments: freshAssignments });
      setIsAssignClassOpen(false);
      await fetchDashboardData();
    } catch (err: any) {
      alert('Failed to update class assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDivisions = async (selectedDivisionIds: string[]) => {
    if (!viewingStaff) return;
    setLoading(true);
    try {
      const staffId = viewingStaff.id;
      const currentAssignments = await AuthService.getStaffAssignments(staffId);
      const divisionAssignments = (currentAssignments || []).filter((a: any) => a.assignment_level === 'division');

      const toDelete = divisionAssignments.filter((a: any) => {
        const divId = String(a.division?.id || a.division);
        return !selectedDivisionIds.includes(divId);
      });

      const currentDivIds = divisionAssignments.map((a: any) => String(a.division?.id || a.division));
      const toCreate = selectedDivisionIds.filter(id => !currentDivIds.includes(String(id)));

      for (const a of toDelete) {
        await AuthService.deleteStaffAssignment(a.id);
      }
      for (const id of toCreate) {
        const divObj = divisionsList.find(d => String(d.id) === String(id));
        const classId = divObj?.school_class || divObj?.classId || divObj?.class_id;
        await AuthService.createStaffAssignment({
          staff: staffId,
          division: id,
          school_class: classId ? String(classId) : undefined,
          assignment_level: 'division',
          inherit_children: true
        });
      }

      const freshAssignments = await AuthService.getStaffAssignments(staffId);
      setViewingStaff({ ...viewingStaff, assignments: freshAssignments });
      setIsAssignDivisionOpen(false);
      await fetchDashboardData();
    } catch {
      alert('Failed to update division assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBranches = async (selectedBranchIds: string[]) => {
    if (!viewingStaff) return;
    setLoading(true);
    try {
      const staffId = viewingStaff.id;
      const currentAssignments = await AuthService.getStaffAssignments(staffId);
      const branchAssignments = (currentAssignments || []).filter((a: any) => a.assignment_level === 'branch');

      const toDelete = branchAssignments.filter((a: any) => {
        const branchId = String(a.branch?.id || a.branch);
        return !selectedBranchIds.includes(branchId);
      });

      const currentBranchIds = branchAssignments.map((a: any) => String(a.branch?.id || a.branch));
      const toCreate = selectedBranchIds.filter(id => !currentBranchIds.includes(String(id)));

      for (const a of toDelete) {
        await AuthService.deleteStaffAssignment(a.id);
      }
      for (const id of toCreate) {
        await AuthService.createStaffAssignment({
          staff: staffId,
          branch: id,
          assignment_level: 'branch',
          inherit_children: true
        });
      }

      const freshAssignments = await AuthService.getStaffAssignments(staffId);
      setViewingStaff({ ...viewingStaff, assignments: freshAssignments });
      setIsAssignBranchOpen(false);
      await fetchDashboardData();
    } catch {
      alert('Failed to update branch assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDepartments = async (selectedDeptIds: string[]) => {
    if (!viewingStaff) return;
    setLoading(true);
    try {
      const staffId = viewingStaff.id;
      const currentAssignments = await AuthService.getStaffAssignments(staffId);
      const deptAssignments = (currentAssignments || []).filter((a: any) => a.assignment_level === 'department');

      const toDelete = deptAssignments.filter((a: any) => {
        const deptId = String(a.department?.id || a.department);
        return !selectedDeptIds.includes(deptId);
      });

      const currentDeptIds = deptAssignments.map((a: any) => String(a.department?.id || a.department));
      const toCreate = selectedDeptIds.filter(id => !currentDeptIds.includes(String(id)));

      for (const a of toDelete) {
        await AuthService.deleteStaffAssignment(a.id);
      }
      for (const id of toCreate) {
        const deptObj = departmentsList.find(d => String(d.id) === String(id));
        const branchId = deptObj?.branch || deptObj?.branchId || deptObj?.branch_id;
        await AuthService.createStaffAssignment({
          staff: staffId,
          department: id,
          branch: branchId ? String(branchId) : undefined,
          assignment_level: 'department',
          inherit_children: true
        });
      }

      const freshAssignments = await AuthService.getStaffAssignments(staffId);
      setViewingStaff({ ...viewingStaff, assignments: freshAssignments });
      setIsAssignDepartmentOpen(false);
      await fetchDashboardData();
    } catch {
      alert('Failed to update department assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStaffAssignments = async (selectedStaffIds: string[]) => {
    if (!assignTargetId) return;
    setLoading(true);
    try {
      const currentTargetAssignments = allAssignmentsList.filter((a: any) => {
        if (assignTargetType === 'class') return a.assignment_level === 'class' && String(a.school_class || a.class_id) === String(assignTargetId);
        if (assignTargetType === 'division') return a.assignment_level === 'division' && String(a.division || a.division_id) === String(assignTargetId);
        if (assignTargetType === 'branch') return a.assignment_level === 'branch' && String(a.branch || a.branch_id) === String(assignTargetId);
        if (assignTargetType === 'department') return a.assignment_level === 'department' && String(a.department || a.department_id) === String(assignTargetId);
        return false;
      });

      const currentStaffIds = currentTargetAssignments.map((a: any) => String(a.staff || a.staff_id));
      const toDelete = currentTargetAssignments.filter((a: any) => !selectedStaffIds.includes(String(a.staff || a.staff_id)));
      const toCreate = selectedStaffIds.filter(id => !currentStaffIds.includes(String(id)));

      for (const a of toDelete) {
        await AuthService.deleteStaffAssignment(a.id);
      }
      for (const staffId of toCreate) {
        const payload: any = {
          staff: staffId,
          assignment_level: assignTargetType,
          inherit_children: true
        };
        if (assignTargetType === 'class') {
          payload.school_class = assignTargetId;
        } else if (assignTargetType === 'division') {
          payload.division = assignTargetId;
          const divObj = divisionsList.find(d => String(d.id) === String(assignTargetId));
          const classId = divObj?.school_class || divObj?.classId || divObj?.class_id;
          if (classId) payload.school_class = classId;
        } else if (assignTargetType === 'branch') {
          payload.branch = assignTargetId;
        } else if (assignTargetType === 'department') {
          payload.department = assignTargetId;
          const deptObj = departmentsList.find(d => String(d.id) === String(assignTargetId));
          const branchId = deptObj?.branch || deptObj?.branchId || deptObj?.branch_id;
          if (branchId) payload.branch = branchId;
        }
        await AuthService.createStaffAssignment(payload);
      }

      setIsAssignStaffModalOpen(false);
      await fetchDashboardData();
    } catch (err: any) {
      alert('Failed to update staff assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateStructure = (type: 'class' | 'division' | 'branch' | 'department') => {
    setStructureType(type);
    setEditingStructureId(null);
    setStructureName('');
    setStructureParentId(
      type === 'division' ? String(classesList[0]?.id || '') :
        type === 'department' ? String(branchesList[0]?.id || '') : ''
    );
    setIsStructureModalOpen(true);
  };

  const handleOpenEditStructure = (type: 'class' | 'division' | 'branch' | 'department', item: any) => {
    setStructureType(type);
    setEditingStructureId(item.id);
    setStructureName(item.name);
    setStructureParentId(
      type === 'division' ? String(item.school_class || item.classId || item.class_id || '') :
        type === 'department' ? String(item.branch || item.branchId || item.branch_id || '') : ''
    );
    setIsStructureModalOpen(true);
  };

  const handleSaveStructure = async (name: string, parentId?: string) => {
    setLoading(true);
    try {
      if (structureType === 'class') {
        editingStructureId
          ? await AuthService.updateClass(editingStructureId, { name, organization: user?.organization_id })
          : await AuthService.createClass({ name, organization: user?.organization_id });
      } else if (structureType === 'division') {
        if (!parentId) { alert('Parent Class is required.'); setLoading(false); return; }
        editingStructureId
          ? await AuthService.updateDivision(editingStructureId, { name, school_class: parentId })
          : await AuthService.createDivision({ name, school_class: parentId });
      } else if (structureType === 'branch') {
        editingStructureId
          ? await AuthService.updateBranch(editingStructureId, { name, organization: user?.organization_id })
          : await AuthService.createBranch({ name, organization: user?.organization_id });
      } else if (structureType === 'department') {
        if (!parentId) { alert('Parent Branch is required.'); setLoading(false); return; }
        editingStructureId
          ? await AuthService.updateDepartment(editingStructureId, { name, branch: parentId })
          : await AuthService.createDepartment({ name, branch: parentId });
      }
      setIsStructureModalOpen(false);
      await fetchDashboardData();
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStructure = async (type: 'class' | 'division' | 'branch' | 'department', id: string) => {
    if (!confirm(`Delete this ${type}?`)) return;
    setLoading(true);
    try {
      if (type === 'class') await AuthService.deleteClass(id);
      else if (type === 'division') await AuthService.deleteDivision(id);
      else if (type === 'branch') await AuthService.deleteBranch(id);
      else if (type === 'department') await AuthService.deleteDepartment(id);
      await fetchDashboardData();
    } catch {
      alert(`Failed to delete ${type}.`);
    } finally {
      setLoading(false);
    }
  };

  const loadDynamicFields = async () => {
    try {
      const fields = await recordService.getFields();
      setDynamicFieldsList(fields || []);
    } catch (err) {
      console.error('Failed to load fields config:', err);
    }
  };

  const handleOpenCreateRecord = async () => {
    if (activeDivisionId || activeDepartmentId) {
      await loadDynamicFields();
      setIsAddRecordModalOpen(true);
    } else {
      setEditingRecord(null);
      setIsRecordModalOpen(true);
    }
  };

  const handleOpenEditRecord = (record: any) => {
    setEditingRecord(record);
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = async (formValues: any, processedBlob: Blob | null) => {
    setLoading(true);
    setError(null);
    try {
      const isSchoolUser = user?.organization_type?.toLowerCase() === 'school';
      const payload: any = {
        record_type: isSchoolUser ? 'student' : 'employee',
        status: 'active',
        organization: user?.organization_id,
        ...formValues
      };
      
      const photoKeys = ['photo', 'profile_photo', 'photoUrl', 'photo_url', 'image', 'imageSrc', 'imageUrl'];
      photoKeys.forEach(k => {
        delete payload[k];
      });

      if (isSchoolUser) {
        payload.full_name = formValues.student_name || formValues.full_name || '';
        payload.student_name = payload.full_name;
      } else {
        payload.full_name = formValues.employee_name || formValues.full_name || '';
        payload.employee_name = payload.full_name;
      }

      let recordId = '';
      if (editingRecord) {
        recordId = editingRecord.id;
        await AuthService.updateRecord(recordId, payload);
      } else {
        const res = await AuthService.createRecord(payload);
        recordId = res.id;
      }

      if (processedBlob) {
        const formData = new FormData();
        formData.append('record_type', isSchoolUser ? 'student' : 'employee');
        formData.append('record_id', recordId);
        formData.append('photo', processedBlob, 'processed_profile_photo.jpg');
        await AuthService.uploadPhoto(formData);
      }

      setIsRecordModalOpen(false);
      await fetchDashboardData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    setLoading(true);
    try {
      await AuthService.deleteRecord(id);
      await fetchDashboardData();
    } catch { alert('Failed to delete record.'); }
    finally { setLoading(false); }
  };

  const handleSubmitRecord = async (id: string) => {
    const rec = recordsList.find(r => String(r.id) === String(id));
    const cardId = rec?.card_id;
    setLoading(true);
    try {
      await AuthService.submitRecord(id, cardId);
      await fetchDashboardData();
    } catch { alert('Failed to submit record.'); }
    finally { setLoading(false); }
  };

  const handleApproveRecord = async (id: string, skipConfirm = false) => {
    if (!skipConfirm && !confirm('Approve this record?')) return;
    const rec = recordsList.find(r => String(r.id) === String(id));
    const cardId = rec?.card_id;
    setLoading(true);
    try {
      await AuthService.approveRecord(id, {}, cardId);
      await fetchDashboardData();
    } catch { alert('Failed to approve record.'); }
    finally { setLoading(false); }
  };

  const handleRejectRecord = async (id: string, reasonFromDetails?: string) => {
    let reason = reasonFromDetails;
    if (reason === undefined) {
      const promptVal = prompt('Enter rejection reason:');
      if (promptVal === null) return;
      reason = promptVal;
    }
    const rec = recordsList.find(r => String(r.id) === String(id));
    const cardId = rec?.card_id;
    setLoading(true);
    try {
      await AuthService.rejectRecord(id, { comment: reason, rejection_reason: reason }, cardId);
      await fetchDashboardData();
    } catch { alert('Failed to reject record.'); }
    finally { setLoading(false); }
  };

  const handleCorrectionRecord = async (id: string, noteFromDetails?: string) => {
    let note = noteFromDetails;
    if (note === undefined) {
      const promptVal = prompt('Enter correction instructions:');
      if (promptVal === null) return;
      note = promptVal;
    }
    const rec = recordsList.find(r => String(r.id) === String(id));
    const cardId = rec?.card_id;
    setLoading(true);
    try {
      await AuthService.correctionRecord(id, { comment: note, correction_note: note }, cardId);
      await fetchDashboardData();
    } catch { alert('Failed to request correction.'); }
    finally { setLoading(false); }
  };

  return (
    <DashboardContext.Provider value={{
      branchesList,
      departmentsList,
      classesList,
      divisionsList,
      staffList,
      recordsList,
      logsList,
      allAssignmentsList,
      dynamicFieldsList,
      stats,
      orgName,
      loading,
      error,
      isAdmin,
      isSchool,
      requiredFields,
      resolvedTemplate,
      activeClassId,
      setActiveClassId,
      activeDivisionId,
      setActiveDivisionId,
      activeBranchId,
      setActiveBranchId,
      activeDepartmentId,
      setActiveDepartmentId,
      recordSearch,
      setRecordSearch,
      recordFilterStatus,
      setRecordFilterStatus,
      viewingRecord,
      setViewingRecord,
      isBulkUploadModalOpen,
      setIsBulkUploadModalOpen,
      isRecordModalOpen,
      setIsRecordModalOpen,
      editingRecord,
      isAddRecordModalOpen,
      setIsAddRecordModalOpen,
      fetchDashboardData,
      fetchActiveTemplate,
      handleOpenCreateRecord,
      handleOpenEditRecord,
      handleSaveRecord,
      handleDeleteRecord,
      handleSubmitRecord,
      handleApproveRecord,
      handleRejectRecord,
      handleCorrectionRecord,
      isCreateStaffOpen,
      setIsCreateStaffOpen,
      isEditStaffOpen,
      setIsEditStaffOpen,
      isResetPasswordOpen,
      setIsResetPasswordOpen,
      isStaffDetailsOpen,
      setIsStaffDetailsOpen,
      editingStaff,
      setEditingStaff,
      viewingStaff,
      setViewingStaff,
      staffForReset,
      setStaffForReset,
      handleOpenCreate,
      handleOpenEdit,
      handleOpenView,
      handleCreateStaffSubmit,
      handleEditStaffSubmit,
      handleResetPasswordSubmit,
      handleToggleStaffStatus,
      handleRemoveStaffAssignment,
      isAssignStaffModalOpen,
      setIsAssignStaffModalOpen,
      assignTargetType,
      setAssignTargetType,
      assignTargetId,
      setAssignTargetId,
      isAssignClassOpen,
      setIsAssignClassOpen,
      isAssignDivisionOpen,
      setIsAssignDivisionOpen,
      isAssignBranchOpen,
      setIsAssignBranchOpen,
      isAssignDepartmentOpen,
      setIsAssignDepartmentOpen,
      handleAssignClasses,
      handleAssignDivisions,
      handleAssignBranches,
      handleAssignDepartments,
      handleSaveStaffAssignments,
      isStructureModalOpen,
      setIsStructureModalOpen,
      structureType,
      setStructureType,
      editingStructureId,
      setEditingStructureId,
      structureName,
      setStructureName,
      structureParentId,
      setStructureParentId,
      handleOpenCreateStructure,
      handleOpenEditStructure,
      handleSaveStructure,
      handleDeleteStructure,
      getBranchName,
      getDeptName,
      getClassName,
      getDivName,
      getActiveFields,
      getBreadcrumbs,
      renderBlockade
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
