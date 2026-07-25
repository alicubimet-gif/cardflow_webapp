'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { AuthApi, RecordApi, GroupApi, SubgroupApi, ClassesApi, UserApi, OrganizationApi, DashboardApi, ApprovalLogsApi } from '@/api';
import * as recordService from '@/services/record-service';
import AuthService from '@/services/auth-service';
import api, { logApiError } from '@/services/api';
import { X, Phone, Copy, Check, Info } from 'lucide-react';
import { useDialog } from '@/hooks/useDialog';
import { useToast } from '@/hooks/useToast';
import { DashboardContextType, OrganizationStats } from '@/types';
import { normalizeOrganizationType, ORGANIZATION_TYPES, ORGANIZATION_CONFIG } from '@/config/organization.config';

export type { OrganizationStats, DashboardContextType };

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const dialog = useDialog();
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();

  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeDivisionId, setActiveDivisionId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeDepartmentId, setActiveDepartmentId] = useState<string | null>(null);

  const [isSubscriberModalOpen, setIsSubscriberModalOpen] = useState(false);
  const [subscriberInfo, setSubscriberInfo] = useState<any | null>(null);

  // Modals & triggers
  const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
  const [assignTargetType, setAssignTargetType] = useState<any>('class');
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
  const [structureType, setStructureType] = useState<any>('class');
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [structureName, setStructureName] = useState('');
  const [structureParentId, setStructureParentId] = useState('');

  // Record form state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isConfirmEditRecordModalOpen, setIsConfirmEditRecordModalOpen] = useState(false);
  const [pendingEditRecord, setPendingEditRecord] = useState<any>(null);
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
  const organizationType = normalizeOrganizationType(user?.organization_type);
  const isSchool = organizationType === ORGANIZATION_TYPES.INSTITUTION;

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

    const configKey = normalizeOrganizationType(user?.organization_type);
    const config = ORGANIZATION_CONFIG[configKey];
    const groupLabelPlural = config?.groupLabelPlural || 'Groups';
    const groupsList = isSchool ? classesList : branchesList;
    const subgroupsList = isSchool ? divisionsList : departmentsList;

    if (currentRoute.includes('groups')) {
      crumbs.push({ label: groupLabelPlural, tab: 'groups', action: () => { router.push('/groups'); } });
      const parts = currentRoute.split('/');
      const groupsIdx = parts.indexOf('groups');
      if (groupsIdx !== -1 && parts[groupsIdx + 1]) {
        const groupIdStr = parts[groupsIdx + 1];
        const foundGroup = groupsList.find(g => String(g.id) === String(groupIdStr));
        crumbs.push({
          label: foundGroup ? foundGroup.name : 'Detail',
          tab: 'groups-detail',
          action: () => { router.push(`/groups/details?groupId=${encodeURIComponent(groupIdStr)}`); }
        });
        
        if (parts[groupsIdx + 2] && parts[groupsIdx + 2] !== 'photo' && parts[groupsIdx + 2] !== 'edit') {
          const subgroupIdStr = parts[groupsIdx + 2];
          const foundSubgroup = subgroupsList.find(s => String(s.id) === String(subgroupIdStr));
          crumbs.push({
            label: foundSubgroup ? foundSubgroup.name : 'Subgroup Detail',
            tab: 'subgroups-detail',
            action: () => {}
          });
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
      // ── ONLY 1 API REQUEST FROM BROWSER: GET /server/mobile/dashboard ──────
      const res = await DashboardApi.getDashboard().catch(() => null);
      if (res) {
        const statsObj = res.statistics || res;
        const recs = res.recentRecords || res.records || res.recent_updates || [];
        const logs = res.approvalActivity || res.approval_activity || [];

        const gVal = statsObj.group ?? statsObj.groups ?? statsObj.classes ?? statsObj.branches ?? 0;
        const subVal = statsObj.subGroup ?? statsObj.subGroups ?? statsObj.divisions ?? statsObj.departments ?? 0;
        const recsVal = statsObj.totalRecords ?? statsObj.records ?? statsObj.total_records ?? 0;
        const staffVal = statsObj.totalStaff ?? statsObj.staffCount ?? statsObj.total_school_staff ?? 0;
        const pendVal = statsObj.pendingReview ?? statsObj.pendingCards ?? statsObj.pending_cards ?? 0;
        const appVal = statsObj.approved ?? statsObj.approvedCards ?? statsObj.approved_cards ?? 0;
        const apprVal = statsObj.approvers ?? staffVal;

        setStats({
          group: gVal,
          subGroup: subVal,
          groupsCount: gVal,
          subgroupsCount: subVal,
          totalRecords: recsVal,
          totalStaff: staffVal,
          pendingReview: pendVal,
          approved: appVal,
          approvers: apprVal,
          totalStudents: recsVal,
          totalSchoolStaff: staffVal,
          totalEmployees: recsVal,
          pendingCards: pendVal,
          approvedCards: appVal,
          rejectedCards: statsObj.rejectedCards ?? statsObj.rejected_cards ?? 0,
          correctionRequired: statsObj.correctionRequired ?? statsObj.correction_required ?? 0,
          totalApprovedRecords: appVal,
          recentlyUpdated: recs,
          staffCount: staffVal,
        });

        if (Array.isArray(recs) && recs.length > 0) setRecordsList(recs);
        if (Array.isArray(logs) && logs.length > 0) setLogsList(logs);

        // Fetch structures in background to populate list data
        const ensureArray = (r: any) => (Array.isArray(r) ? r : r?.results || r?.data || []);
        Promise.all([
          ClassesApi.getClasses().catch(() => []),
          ClassesApi.getDivisions().catch(() => []),
          ClassesApi.getBranches().catch(() => []),
          ClassesApi.getDepartments().catch(() => []),
          AuthService.getStaffList().catch(() => []),
          RecordApi.getRecords().catch(() => [])
        ]).then(([classes, divisions, branches, departments, staff, records]) => {
          const clsArr = ensureArray(classes);
          const divArr = ensureArray(divisions);
          const brArr = ensureArray(branches);
          const depArr = ensureArray(departments);
          const stArr = ensureArray(staff);
          const recArr = ensureArray(records);

          setClassesList(clsArr);
          setDivisionsList(divArr);
          setBranchesList(brArr);
          setDepartmentsList(depArr);
          setStaffList(stArr);
          if (recArr.length > 0) setRecordsList(recArr);

          const isSchoolUser = user?.organization_type?.toLowerCase() === 'school';
          const realG = isSchoolUser ? clsArr.length : brArr.length;
          const realSub = isSchoolUser ? divArr.length : depArr.length;
          const realStaff = stArr.length;
          const realRecs = recArr.length;

          setStats((prevStats: any) => ({
            ...prevStats,
            group: prevStats.group || realG,
            subGroup: prevStats.subGroup || realSub,
            groupsCount: prevStats.groupsCount || realG,
            subgroupsCount: prevStats.subgroupsCount || realSub,
            totalStaff: prevStats.totalStaff || realStaff,
            staffCount: prevStats.staffCount || realStaff,
            totalRecords: prevStats.totalRecords || realRecs,
            totalStudents: prevStats.totalStudents || realRecs,
            totalEmployees: prevStats.totalEmployees || realRecs,
          }));
        });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to sync dashboard stats.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Page-Level API Rule: Do not automatically fetch dashboard stats when visiting /groups routes or /dashboard
    if (user && !pathname.startsWith('/groups') && pathname !== '/dashboard') {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData, pathname]);

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
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        logApiError('Error fetching active template:', err);
      }
    }
  }, [user, activeClassId, activeDivisionId, activeBranchId, activeDepartmentId]);

  useEffect(() => {
    if (user && !pathname.startsWith('/groups') && pathname !== '/dashboard') {
      fetchActiveTemplate();
    }
  }, [user, activeClassId, activeDivisionId, activeBranchId, activeDepartmentId, fetchActiveTemplate, pathname]);

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
      toast('Staff Created Successfully', 'success');
    } catch (err: any) {
      dialog.alert({ title: 'Save Failed', message: err?.response?.data?.message || 'Failed to update staff.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const confirmed = await dialog.confirm({
      title: 'Delete Staff',
      message: 'Are you sure you want to delete this staff member?\n\nThis action cannot be undone.',
      variant: 'danger'
    });
    if (!confirmed) return;
    
    setLoading(true);
    try {
      await AuthService.deleteStaff(id);
      await fetchDashboardData();
      toast('Staff deleted successfully.', 'success');
    } catch (err: any) {
      dialog.alert({ 
        title: 'Delete Failed', 
        message: err?.response?.data?.message || 'Unable to delete staff. This staff member is assigned to active records. Please remove assignments first.', 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStaffSubmit = async (id: string, payload: any) => {
    setLoading(true);
    try {
      await AuthService.updateStaff(id, payload);
      await fetchDashboardData();
      toast('Staff Updated Successfully', 'success');
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
      toast('Password reset successfully.', 'success');
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStaffStatus = async (id: string, currentStatus: boolean, name: string) => {
    const actionText = currentStatus ? 'deactivate' : 'activate';
    const confirmed = await dialog.confirm({
      title: 'Confirm Status Change',
      message: `Are you sure you want to ${actionText} staff member "${name}"?`,
      variant: 'warning'
    });
    if (!confirmed) return;
    setLoading(true);
    try {
      const targetActive = !currentStatus;
      await AuthService.updateStaff(id, {
        is_active: targetActive,
        status: targetActive ? 'active' : 'inactive'
      });
      await fetchDashboardData();
      toast(`Staff ${actionText}d successfully.`, 'success');
      if (viewingStaff && String(viewingStaff.id) === String(id)) {
        const assignments = await AuthService.getStaffAssignments(id).catch(() => []);
        setViewingStaff((prev: any) => prev ? { ...prev, is_active: targetActive, status: targetActive ? 'active' : 'inactive', assignments } : null);
      }
    } catch (err: any) {
      dialog.alert({ title: 'Update Failed', message: err?.response?.data?.message || `Failed to ${actionText} staff member.`, variant: 'error' });
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
    } catch (err: any) {
      dialog.alert({ title: 'Remove Failed', message: `Failed to remove access to "${label}".`, variant: 'error' });
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
      dialog.alert({ title: 'Assignment Failed', message: 'Failed to update class assignments.', variant: 'error' });
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
    } catch (err) {
      dialog.alert({ title: 'Assignment Failed', message: 'Failed to update division assignments.', variant: 'error' });
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
    } catch (err) {
      dialog.alert({ title: 'Assignment Failed', message: 'Failed to update branch assignments.', variant: 'error' });
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
    } catch (err) {
      dialog.alert({ title: 'Assignment Failed', message: 'Failed to update department assignments.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStaffAssignments = async (selectedStaffIds: string[]) => {
    if (!assignTargetId) return;
    setLoading(true);
    try {
      const currentTargetAssignments = allAssignmentsList.filter((a: any) => {
        if (['class', 'group', 'branch'].includes(assignTargetType as string)) {
          return ['class', 'group', 'branch'].includes(a.assignment_level) && String(a.group || a.school_class || a.class_id || a.branch || a.branch_id) === String(assignTargetId);
        }
        if (['division', 'subgroup', 'department'].includes(assignTargetType as string)) {
          return ['division', 'subgroup', 'department'].includes(a.assignment_level) && String(a.subgroup || a.division || a.division_id || a.department || a.department_id) === String(assignTargetId);
        }
        return false;
      });

      const currentStaffIds = currentTargetAssignments.map((a: any) => String(a.staff || a.staff_id || a.user || a.user_id));
      const toDelete = currentTargetAssignments.filter((a: any) => !selectedStaffIds.includes(String(a.staff || a.staff_id || a.user || a.user_id)));
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
        if (['class', 'group', 'branch'].includes(assignTargetType as string)) {
          payload.group = assignTargetId;
          payload.school_class = assignTargetId;
          payload.branch = assignTargetId;
        } else if (['division', 'subgroup', 'department'].includes(assignTargetType as string)) {
          payload.subgroup = assignTargetId;
          payload.division = assignTargetId;
          payload.department = assignTargetId;

          const subgroupsListVal = isSchool ? divisionsList : departmentsList;
          const subObj = subgroupsListVal.find((s: any) => String(s.id) === String(assignTargetId)) ||
                         divisionsList.find((d: any) => String(d.id) === String(assignTargetId)) ||
                         departmentsList.find((d: any) => String(d.id) === String(assignTargetId));
          const parentId = subObj?.group || subObj?.groupId || subObj?.group_id || subObj?.school_class || subObj?.classId || subObj?.class_id || subObj?.branch || subObj?.branchId || subObj?.branch_id;
          if (parentId) {
            payload.group = parentId;
            payload.school_class = parentId;
            payload.branch = parentId;
          }
        }
        await AuthService.createStaffAssignment(payload);
      }

      setIsAssignStaffModalOpen(false);
      await fetchDashboardData();
    } catch (err: any) {
      dialog.alert({ title: 'Assignment Failed', message: 'Failed to update staff assignments.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateStructure = (type: any) => {
    setStructureType(type);
    setEditingStructureId(null);
    setStructureName('');
    setStructureParentId(
      type === 'division' ? String(classesList[0]?.id || '') :
        type === 'department' ? String(branchesList[0]?.id || '') : ''
    );
    setIsStructureModalOpen(true);
  };

  const handleOpenEditStructure = (type: any, item: any) => {
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
      if (structureType === 'group') {
        if (editingStructureId) {
          await GroupApi.updateGroup(editingStructureId, { name });
        } else {
          await GroupApi.createGroup({ name });
        }
      } else if (structureType === 'class') {
        if (editingStructureId) {
          await ClassesApi.updateClass(editingStructureId, { name, organization: user?.organization_id });
        } else {
          await ClassesApi.createClass({ name, organization: user?.organization_id });
        }
      } else if (structureType === 'division' || structureType === 'subgroup') {
        if (!parentId) { dialog.alert({ title: 'Missing Information', message: 'Parent Class is required.', variant: 'warning' }); setLoading(false); return; }
        if (editingStructureId) {
          await ClassesApi.updateDivision(editingStructureId, { name, school_class: parentId });
        } else {
          await ClassesApi.createDivision({ name, school_class: parentId });
        }
      } else if (structureType === 'branch') {
        if (editingStructureId) {
          await ClassesApi.updateBranch(editingStructureId, { name, organization: user?.organization_id });
        } else {
          await ClassesApi.createBranch({ name, organization: user?.organization_id });
        }
      } else if (structureType === 'department') {
        if (!parentId) { dialog.alert({ title: 'Missing Information', message: 'Parent Branch is required.', variant: 'warning' }); setLoading(false); return; }
        if (editingStructureId) {
          await ClassesApi.updateDepartment(editingStructureId, { name, branch: parentId });
        } else {
          await ClassesApi.createDepartment({ name, branch: parentId });
        }
      }
      setIsStructureModalOpen(false);
      if (pathname !== '/groups') {
        await fetchDashboardData();
      }
    } catch (err) {
      dialog.alert({ title: 'Save Failed', message: 'Failed to save. Please try again.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStructure = async (type: any, id: string) => {
    const confirmed = await dialog.confirm({ title: `Delete ${type}?`, message: `Are you sure you want to delete this ${type}?`, variant: 'danger' });
    if (!confirmed) return;
    setLoading(true);
    try {
      if (type === 'group') {
        await GroupApi.deleteGroup(id);
      } else if (type === 'class') await ClassesApi.deleteClass(id);
      else if (type === 'division') await ClassesApi.deleteDivision(id);
      else if (type === 'branch') await ClassesApi.deleteBranch(id);
      else if (type === 'department') await ClassesApi.deleteDepartment(id);
      
      if (pathname !== '/groups') {
        await fetchDashboardData();
      }
    } catch (err) {
      dialog.alert({ title: 'Delete Failed', message: `Failed to delete ${type}.`, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadDynamicFields = async () => {
    try {
      const fields = await recordService.getFields();
      setDynamicFieldsList(fields || []);
    } catch (err) {
      logApiError('Failed to load fields config:', err);
    }
  };

  const handleWorkflowError = (err: any, fallbackMsg: string) => {
    if (err?.response?.data?.code === 'SUBSCRIBER_ACTION_REQUIRED') {
      setSubscriberInfo(err.response.data.subscriber);
      setIsSubscriberModalOpen(true);
    } else {
      const responseData = err?.response?.data;
      let errMsg = fallbackMsg;
      if (responseData) {
        if (responseData.errors && typeof responseData.errors === 'object') {
          for (const key in responseData.errors) {
            const val = responseData.errors[key];
            if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
              errMsg = val[0];
              break;
            }
          }
        } else if (responseData.message && responseData.message !== 'Please correct the highlighted fields.') {
          errMsg = responseData.message;
        } else if (responseData.detail) {
          errMsg = responseData.detail;
        }
      } else {
        errMsg = err?.message || fallbackMsg;
      }
      dialog.alert({ title: 'Error', message: errMsg, variant: 'error' });
    }
    throw err;
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

  const _executeOpenEditRecord = (record: any) => {
    setEditingRecord(record);
    setIsRecordModalOpen(true);
  };

  const handleOpenEditRecord = (record: any) => {
    if (record?.approval_status?.toLowerCase() === 'approved') {
      setPendingEditRecord(record);
      setIsConfirmEditRecordModalOpen(true);
    } else {
      _executeOpenEditRecord(record);
    }
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

      const nameVal = formValues.student_name !== undefined ? formValues.student_name : (formValues.employee_name !== undefined ? formValues.employee_name : (formValues.full_name !== undefined ? formValues.full_name : (formValues.name !== undefined ? formValues.name : '')));
      payload.full_name = nameVal;
      payload.name = nameVal;

      const phoneVal = formValues.mobile_number !== undefined ? formValues.mobile_number : (formValues.phone !== undefined ? formValues.phone : (formValues.mobile !== undefined ? formValues.mobile : ''));
      payload.phone = phoneVal;
      payload.mobile_number = phoneVal;

      const emailVal = formValues.email_address !== undefined ? formValues.email_address : (formValues.email !== undefined ? formValues.email : '');
      payload.email = emailVal;
      payload.email_address = emailVal;

      if (isSchoolUser) {
        payload.student_name = nameVal;
        payload.student_id = formValues.student_id !== undefined ? formValues.student_id : (formValues.admission_number !== undefined ? formValues.admission_number : '');
        payload.admission_number = payload.student_id;
        payload.class_name = formValues.class_name || formValues.school_class_name || '';
        payload.school_class = formValues.school_class || formValues.class || '';
        payload.division = formValues.division || '';
      } else {
        payload.employee_name = nameVal;
        payload.employee_id = formValues.employee_id !== undefined ? formValues.employee_id : '';
        payload.department = formValues.department || '';
        payload.branch = formValues.branch || '';
      }

      let recordId = '';
      let updatedRecord: any = null;
      if (editingRecord) {
        recordId = editingRecord.id;
        updatedRecord = await RecordApi.updateRecord(recordId, payload);
        toast('Record updated successfully.', 'success');
      } else {
        const res = await RecordApi.createRecord(payload);
        recordId = res.id;
        updatedRecord = res;
        toast('Record created successfully.', 'success');
      }

      if (processedBlob) {
        const formData = new FormData();
        formData.append('record_type', isSchoolUser ? 'student' : 'employee');
        formData.append('record_id', recordId);
        formData.append('photo', processedBlob, 'processed_profile_photo.jpg');
        const uploadRes = await RecordApi.uploadPhoto(formData);
        if (uploadRes && uploadRes.photo_url) {
          updatedRecord.photo = uploadRes.photo_url;
          updatedRecord.profile_photo = uploadRes.photo_url;
          updatedRecord.photoUrl = uploadRes.photo_url;
        }
      }

      if (editingRecord) {
        setRecordsList(prev => prev.map(r => String(r.id) === String(recordId) ? { ...r, ...updatedRecord } : r));
      } else {
        setRecordsList(prev => [...prev, updatedRecord]);
      }

      setIsRecordModalOpen(false);
      await fetchDashboardData();
    } catch (err: any) {
      handleWorkflowError(err, 'Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const confirmed = await dialog.confirm({ title: 'Delete Record', message: 'Are you sure you want to delete this record?', variant: 'danger' });
    if (!confirmed) return;
    setLoading(true);
    try {
      await RecordApi.deleteRecord(id);
      await fetchDashboardData();
    } catch (err) {
      dialog.alert({ title: 'Delete Failed', message: 'Failed to delete record.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRecord = async (id: string) => {
    const rec = recordsList.find(r => String(r.id) === String(id));
    const cardId = rec?.card_id;
    setLoading(true);
    try {
      await RecordApi.submitRecord(id, cardId);
      await fetchDashboardData();
    } catch (err: any) {
      handleWorkflowError(err, 'Failed to submit record.');
    }
    finally { setLoading(false); }
  };

  const handleApproveRecord = async (id: string, skipConfirm = false) => {
    if (!skipConfirm) {
      const confirmed = await dialog.confirm({ title: 'Approve Record', message: 'Are you sure you want to approve this record?' });
      if (!confirmed) return;
    }
    const rec = recordsList.find(r => String(r.id) === String(id));
    const cardId = rec?.card_id;
    setLoading(true);
    try {
      await RecordApi.approveRecord(id, {}, cardId);
      await fetchDashboardData();
      toast('Record approved successfully.', 'success');
    } catch (err: any) {
      handleWorkflowError(err, 'Failed to approve record.');
    }
    finally { setLoading(false); }
  };

  const handleRejectRecord = async (id: string, reasonFromDetails?: string) => {
    let reason = reasonFromDetails;
    if (reason === undefined) {
      const promptVal = await dialog.prompt({ title: 'Reject Record', label: 'Reason for rejection', placeholder: 'Enter rejection reason' });
      if (!promptVal) return;
      reason = promptVal;
    }
    const rec = recordsList.find(r => String(r.id) === String(id));
    const cardId = rec?.card_id;
    setLoading(true);
    try {
      await RecordApi.rejectRecord(id, { comment: reason, rejection_reason: reason }, cardId);
      await fetchDashboardData();
      toast('Record rejected successfully.', 'success');
    } catch (err: any) {
      handleWorkflowError(err, 'Failed to reject record.');
    }
    finally { setLoading(false); }
  };

  const handleCorrectionRecord = async (id: string, noteFromDetails?: string) => {
    let note = noteFromDetails;
    if (note === undefined) {
      const promptVal = await dialog.prompt({ title: 'Request Correction', label: 'Correction instructions', placeholder: 'Enter correction instructions' });
      if (!promptVal) return;
      note = promptVal;
    }
    const rec = recordsList.find(r => String(r.id) === String(id));
    const cardId = rec?.card_id;
    setLoading(true);
    try {
      await RecordApi.correctionRecord(id, { comment: note, correction_note: note }, cardId);
      await fetchDashboardData();
      toast('Correction requested successfully.', 'success');
    } catch (err: any) {
      handleWorkflowError(err, 'Failed to request correction.');
    }
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
      setRecordsList,
      logsList,
      allAssignmentsList,
      dynamicFieldsList,
      stats,
      orgName,
      orgEmail,
      loading,
      error,
      isSubscriberModalOpen,
      setIsSubscriberModalOpen,
      subscriberInfo,
      setSubscriberInfo,
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
      isConfirmEditRecordModalOpen,
      setIsConfirmEditRecordModalOpen,
      pendingEditRecord,
      setPendingEditRecord,
      _executeOpenEditRecord,
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
      handleDeleteStaff,
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
      renderBlockade,
      isOrganization: !isSchool,
      organizationType,
      groupsList: isSchool ? classesList : branchesList,
      subgroupsList: isSchool ? divisionsList : departmentsList,
      userList: staffList,
      activeGroupId: isSchool ? activeClassId : activeBranchId,
      setActiveGroupId: (id: string | null) => { if (isSchool) setActiveClassId(id); else setActiveBranchId(id); },
      activeSubgroupId: isSchool ? activeDivisionId : activeDepartmentId,
      setActiveSubgroupId: (id: string | null) => { if (isSchool) setActiveDivisionId(id); else setActiveDepartmentId(id); },
      isAssignUserModalOpen: isAssignStaffModalOpen,
      setIsAssignUserModalOpen: setIsAssignStaffModalOpen,
      handleSaveUserAssignments: handleSaveStaffAssignments,
      viewingUser: viewingStaff,
      setViewingUser: setViewingStaff,
      isAssignGroupOpen: isSchool ? isAssignClassOpen : isAssignBranchOpen,
      setIsAssignGroupOpen: (b: boolean) => { if (isSchool) setIsAssignClassOpen(b); else setIsAssignBranchOpen(b); },
      isAssignSubgroupOpen: isSchool ? isAssignDivisionOpen : isAssignDepartmentOpen,
      setIsAssignSubgroupOpen: (b: boolean) => { if (isSchool) setIsAssignDivisionOpen(b); else setIsAssignDepartmentOpen(b); },
      handleRemoveUserAssignment: handleRemoveStaffAssignment,
      handleDeleteUser: handleDeleteStaff,
      getGroupName: (id: string | null) => (isSchool ? getClassName(id) : getBranchName(id)),
      getSubgroupName: (id: string | null) => (isSchool ? getDivName(id) : getDeptName(id)),
      isCreateUserOpen: isCreateStaffOpen,
      setIsCreateUserOpen: setIsCreateStaffOpen,
      isEditUserOpen: isEditStaffOpen,
      setIsEditUserOpen: setIsEditStaffOpen,
      editingUser: editingStaff,
      setEditingUser: setEditingStaff,
      userForReset: staffForReset,
      setUserForReset: setStaffForReset,
      handleCreateUserSubmit: handleCreateStaffSubmit,
      handleEditUserSubmit: handleEditStaffSubmit,
      handleResendUserInvite: async () => {},
      handleToggleUserStatus: handleToggleStaffStatus
    }}>
      {children}
      <SubscriberContactModal />
    </DashboardContext.Provider>
  );
}

function SubscriberContactModal() {
  const { isSubscriberModalOpen, setIsSubscriberModalOpen, subscriberInfo } = useDashboard();
  const [copied, setCopied] = useState(false);

  if (!isSubscriberModalOpen || !subscriberInfo) return null;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(subscriberInfo.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const hasPhone = !!subscriberInfo.phone;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <button
          onClick={() => setIsSubscriberModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Info className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Unable to complete this request.</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
              Please contact your CardFlow service provider (Subscriber) to continue using this service.
            </p>
            <p className="text-[11px] text-slate-400 font-medium max-w-xs mx-auto">
              If you need assistance, you can contact them using the details below.
            </p>
          </div>
        </div>

        <div className="bg-slate-50/70 border border-slate-100/85 rounded-2xl p-5 space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Subscriber</span>
            <h3 className="text-sm font-extrabold text-slate-800">
              {subscriberInfo.company || subscriberInfo.name}
            </h3>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-150/60">
            <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
              <span>📧</span>
              <span>{subscriberInfo.email}</span>
            </div>
            {hasPhone && (
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                <span>📞</span>
                <span>{subscriberInfo.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={() => setIsSubscriberModalOpen(false)}
            className="flex-1 order-last sm:order-first px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
          >
            Close
          </button>
          
          <button
            onClick={handleCopyEmail}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied Email
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Email
              </>
            )}
          </button>

          {hasPhone && (
            <a
              href={`tel:${subscriberInfo.phone}`}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 text-center"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Subscriber
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
