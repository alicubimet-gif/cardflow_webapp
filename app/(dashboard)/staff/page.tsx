'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/dashboard-context';

// Staff Components
import { StaffList } from '@/components/staff/StaffList';
import { CreateStaffModal } from '@/components/staff/CreateStaffModal';
import { EditStaffModal } from '@/components/staff/EditStaffModal';
import { ResetPasswordModal } from '@/components/staff/ResetPasswordModal';

export default function StaffPage() {
  const router = useRouter();
  const {
    staffList,
    allAssignmentsList,
    isAdmin,
    
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
    handleCreateStaffSubmit,
    handleEditStaffSubmit,
    handleResetPasswordSubmit,
    handleToggleStaffStatus
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
        onView={(st) => router.push(`/staff/${st.id}`)}
        onEdit={handleOpenEdit}
        onResetPassword={(st) => { setStaffForReset(st); setIsResetPasswordOpen(true); }}
        onToggleStatus={handleToggleStaffStatus}
        onAddStaff={handleOpenCreate}
      />

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
    </div>
  );
}
