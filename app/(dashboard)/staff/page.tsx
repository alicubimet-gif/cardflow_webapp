'use client';

import React from 'react';
import { useDashboard } from '@/context/dashboard-context';

// Staff Components
import { StaffList } from '@/components/staff/StaffList';
import { StaffDetails } from '@/components/staff/StaffDetails';
import { CreateStaffModal } from '@/components/staff/CreateStaffModal';
import { EditStaffModal } from '@/components/staff/EditStaffModal';
import { ResetPasswordModal } from '@/components/staff/ResetPasswordModal';

// Shared Assignment Modals
import { AssignClassModal } from '@/components/staff/AssignClassModal';
import { AssignDivisionModal } from '@/components/staff/AssignDivisionModal';
import { AssignBranchModal } from '@/components/staff/AssignBranchModal';
import { AssignDepartmentModal } from '@/components/staff/AssignDepartmentModal';

export default function StaffPage() {
  const {
    staffList,
    allAssignmentsList,
    isAdmin,
    isSchool,
    classesList,
    divisionsList,
    branchesList,
    departmentsList,
    
    // Staff details state
    isStaffDetailsOpen,
    setIsStaffDetailsOpen,
    viewingStaff,
    setViewingStaff,

    // CRUD modals state
    isCreateStaffOpen,
    setIsCreateStaffOpen,
    isEditStaffOpen,
    setIsEditStaffOpen,
    isResetPasswordOpen,
    setIsResetPasswordOpen,
    editingStaff,
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

    // Assignment modals state
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

    // Naming helpers
    getClassName,
    getDivName,
    getBranchName,
    getDeptName
  } = useDashboard();

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
        <h3 className="font-bold text-sm">Access Denied</h3>
        <p className="text-xs text-red-600 mt-1">
          Only Organization Admins are permitted to access Staff Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>Staff Management</h2>
      
      <StaffList
        staffList={staffList}
        allAssignmentsList={allAssignmentsList}
        onView={handleOpenView}
        onEdit={handleOpenEdit}
        onResetPassword={(st) => { setStaffForReset(st); setIsResetPasswordOpen(true); }}
        onToggleStatus={handleToggleStaffStatus}
        onAddStaff={handleOpenCreate}
      />

      {/* Staff Details Overlay */}
      {isStaffDetailsOpen && viewingStaff && (
        <StaffDetails
          isOpen={isStaffDetailsOpen}
          onClose={() => {
            setIsStaffDetailsOpen(false);
            setViewingStaff(null);
          }}
          staff={viewingStaff}
          isSchool={isSchool}
          classesList={classesList}
          divisionsList={divisionsList}
          branchesList={branchesList}
          departmentsList={departmentsList}
          onOpenAssignClass={() => setIsAssignClassOpen(true)}
          onOpenAssignDivision={() => setIsAssignDivisionOpen(true)}
          onOpenAssignBranch={() => setIsAssignBranchOpen(true)}
          onOpenAssignDepartment={() => setIsAssignDepartmentOpen(true)}
          onRemoveAssignment={handleRemoveStaffAssignment}
          getClassName={getClassName}
          getDivName={getDivName}
          getBranchName={getBranchName}
          getDeptName={getDeptName}
        />
      )}

      {/* Staff CRUD Modals */}
      {isCreateStaffOpen && (
        <CreateStaffModal
          isOpen={isCreateStaffOpen}
          onClose={() => setIsCreateStaffOpen(false)}
          onSubmit={handleCreateStaffSubmit}
        />
      )}

      {isEditStaffOpen && editingStaff && (
        <EditStaffModal
          isOpen={isEditStaffOpen}
          onClose={() => setIsEditStaffOpen(false)}
          onSubmit={async (payload) => {
            await handleEditStaffSubmit(editingStaff.id, payload);
            setIsEditStaffOpen(false);
          }}
          staff={editingStaff}
        />
      )}

      {isResetPasswordOpen && staffForReset && (
        <ResetPasswordModal
          isOpen={isResetPasswordOpen}
          onClose={() => {
            setIsResetPasswordOpen(false);
            setStaffForReset(null);
          }}
          onSubmit={async (newPwd) => {
            await handleResetPasswordSubmit(staffForReset.id, newPwd);
            setIsResetPasswordOpen(false);
            setStaffForReset(null);
          }}
          staff={staffForReset}
        />
      )}

      {/* Access Assignment Modals */}
      {isAssignClassOpen && viewingStaff && (
        <AssignClassModal
          isOpen={isAssignClassOpen}
          onClose={() => setIsAssignClassOpen(false)}
          classesList={classesList}
          currentAssignments={viewingStaff.assignments || []}
          onAssign={handleAssignClasses}
        />
      )}

      {isAssignDivisionOpen && viewingStaff && (
        <AssignDivisionModal
          isOpen={isAssignDivisionOpen}
          onClose={() => setIsAssignDivisionOpen(false)}
          divisionsList={divisionsList}
          currentAssignments={viewingStaff.assignments || []}
          getClassName={getClassName}
          onAssign={handleAssignDivisions}
        />
      )}

      {isAssignBranchOpen && viewingStaff && (
        <AssignBranchModal
          isOpen={isAssignBranchOpen}
          onClose={() => setIsAssignBranchOpen(false)}
          branchesList={branchesList}
          currentAssignments={viewingStaff.assignments || []}
          onAssign={handleAssignBranches}
        />
      )}

      {isAssignDepartmentOpen && viewingStaff && (
        <AssignDepartmentModal
          isOpen={isAssignDepartmentOpen}
          onClose={() => setIsAssignDepartmentOpen(false)}
          departmentsList={departmentsList}
          currentAssignments={viewingStaff.assignments || []}
          getBranchName={getBranchName}
          onAssign={handleAssignDepartments}
        />
      )}
    </div>
  );
}
