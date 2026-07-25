import React from 'react';
import { OrganizationType } from './organization.types';
import { WebAppUser } from './user.types';
import { RecordItem, DynamicField } from './record.types';

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
  groupsCount?: number;
  subgroupsCount?: number;
  staffCount?: number;
  group?: number;
  subGroup?: number;
  totalRecords?: number;
  totalStaff?: number;
  pendingReview?: number;
  approved?: number;
  approvers?: number;
}

export interface DashboardContextType {
  // Lists
  branchesList: any[];
  departmentsList: any[];
  classesList: any[];
  divisionsList: any[];
  staffList: any[];
  recordsList: RecordItem[];
  setRecordsList: React.Dispatch<React.SetStateAction<RecordItem[]>>;
  logsList: any[];
  allAssignmentsList: any[];

  // Dynamic Add Record fields
  dynamicFieldsList: DynamicField[];

  // Stats & States
  stats: OrganizationStats;
  orgName: string;
  orgEmail: string;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isSchool: boolean;
  isOrganization: boolean;
  organizationType: OrganizationType;
  requiredFields: DynamicField[];
  resolvedTemplate: {
    has_template: boolean;
    fields: DynamicField[];
    template_id: string | null;
    template_name: string | null;
  };

  // Selections
  activeClassId: string | null;
  setActiveClassId: (id: string | null) => void;
  activeDivisionId: string | null;
  setActiveDivisionId: (id: string | null) => void;
  activeBranchId: string | null;
  setActiveBranchId: (id: string | null) => void;
  activeDepartmentId: string | null;
  setActiveDepartmentId: (id: string | null) => void;

  // Generic Aliases & Selections
  groupsList: any[];
  subgroupsList: any[];
  userList: any[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  activeSubgroupId: string | null;
  setActiveSubgroupId: (id: string | null) => void;

  // Search & Filter
  recordSearch: string;
  setRecordSearch: (s: string) => void;
  recordFilterStatus: string;
  setRecordFilterStatus: (s: string) => void;

  // Modals / Details triggers
  viewingRecord: RecordItem | null;
  setViewingRecord: (r: RecordItem | null) => void;
  isBulkUploadModalOpen: boolean;
  setIsBulkUploadModalOpen: (b: boolean) => void;
  isRecordModalOpen: boolean;
  setIsRecordModalOpen: (b: boolean) => void;
  editingRecord: RecordItem | null;
  isConfirmEditRecordModalOpen: boolean;
  setIsConfirmEditRecordModalOpen: (b: boolean) => void;
  pendingEditRecord: RecordItem | null;
  setPendingEditRecord: (r: RecordItem | null) => void;
  _executeOpenEditRecord: (record: RecordItem) => void;
  isAddRecordModalOpen: boolean;
  setIsAddRecordModalOpen: (b: boolean) => void;

  // CRUD & Operations
  fetchDashboardData: () => Promise<void>;
  fetchActiveTemplate: () => Promise<void>;
  handleOpenCreateRecord: () => Promise<void>;
  handleOpenEditRecord: (record: RecordItem) => void;
  handleSaveRecord: (formValues: any, processedBlob: Blob | null) => Promise<void>;
  handleDeleteRecord: (id: string) => Promise<void>;
  handleSubmitRecord: (id: string) => Promise<void>;
  handleApproveRecord: (id: string, skipConfirm?: boolean) => Promise<void>;
  handleRejectRecord: (id: string, reason?: string) => Promise<void>;
  handleCorrectionRecord: (id: string, note?: string) => Promise<void>;

  // Staff CRUD Specifics
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
  handleDeleteStaff: (id: string) => Promise<void>;
  handleResetPasswordSubmit: (id: string, newPassword: string) => Promise<void>;
  handleToggleStaffStatus: (id: string, currentStatus: boolean, name: string) => Promise<void>;
  handleRemoveStaffAssignment: (assignmentId: string, label: string) => Promise<void>;

  // Staff Assignment Specific Modals
  isAssignStaffModalOpen: boolean;
  setIsAssignStaffModalOpen: (b: boolean) => void;
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

  // Generic User Management
  viewingUser: any | null;
  setViewingUser: (u: any | null) => void;
  isAssignGroupOpen: boolean;
  setIsAssignGroupOpen: (b: boolean) => void;
  isAssignSubgroupOpen: boolean;
  setIsAssignSubgroupOpen: (b: boolean) => void;
  handleRemoveUserAssignment: (assignmentId: string, label: string) => Promise<void>;
  handleDeleteUser: (id: string) => Promise<void>;
  getGroupName: (id: string | null) => string;
  getSubgroupName: (id: string | null) => string;

  isCreateUserOpen: boolean;
  setIsCreateUserOpen: (b: boolean) => void;
  isEditUserOpen: boolean;
  setIsEditUserOpen: (b: boolean) => void;
  editingUser: any | null;
  setEditingUser: (u: any | null) => void;
  userForReset: any | null;
  setUserForReset: (u: any | null) => void;

  handleCreateUserSubmit: (payload: any) => Promise<void>;
  handleEditUserSubmit: (id: string, payload: any) => Promise<void>;
  handleResendUserInvite: (id: string) => Promise<void>;
  handleToggleUserStatus: (id: string, currentStatus: boolean, name: string) => Promise<void>;

  // Assignments & Modals
  isAssignUserModalOpen: boolean;
  setIsAssignUserModalOpen: (b: boolean) => void;
  assignTargetType: any;
  setAssignTargetType: (t: any) => void;
  assignTargetId: string | null;
  setAssignTargetId: (id: string | null) => void;
  handleSaveUserAssignments: (selectedUserIds: string[]) => Promise<void>;

  // Structure Modal states
  isStructureModalOpen: boolean;
  setIsStructureModalOpen: (b: boolean) => void;
  structureType: any;
  setStructureType: (t: any) => void;
  editingStructureId: string | null;
  setEditingStructureId: (id: string | null) => void;
  structureName: string;
  setStructureName: (n: string) => void;
  structureParentId: string;
  setStructureParentId: (id: string) => void;

  handleOpenCreateStructure: (type: any) => void;
  handleOpenEditStructure: (type: any, item: any) => void;
  handleSaveStructure: (name: string, parentId?: string) => Promise<void>;
  handleDeleteStructure: (type: any, id: string) => Promise<void>;

  // Helpers & Blockade
  getBranchName: (id: string | null) => string;
  getDeptName: (id: string | null) => string;
  getClassName: (id: string | null) => string;
  getDivName: (id: string | null) => string;
  getActiveFields: () => DynamicField[];
  getBreadcrumbs: (currentRoute: string) => any[];
  renderBlockade: (onBackAction?: () => void) => React.ReactNode;

  isSubscriberModalOpen: boolean;
  setIsSubscriberModalOpen: (b: boolean) => void;
  subscriberInfo: any | null;
  setSubscriberInfo: (info: any | null) => void;
}
