'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/dashboard-context';

// User Components
import { UserList } from '@/components/users/UserList';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import { EditUserModal } from '@/components/users/EditUserModal';
import { ResetPasswordModal } from '@/components/users/ResetPasswordModal';

export default function UserPage() {
  const router = useRouter();
  const {
    userList,
    allAssignmentsList,
    isAdmin,
    
    // CRUD modals state
    isCreateUserOpen,
    setIsCreateUserOpen,
    isEditUserOpen,
    setIsEditUserOpen,
    isResetPasswordOpen,
    setIsResetPasswordOpen,
    editingUser,
    userForReset,
    setUserForReset,

    handleOpenCreate,
    handleOpenEdit,
    handleCreateUserSubmit,
    handleEditUserSubmit,
    handleResetPasswordSubmit,
    handleResendUserInvite,
    handleToggleUserStatus
  } = useDashboard();

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
        <h3 className="font-bold text-sm">Access Denied</h3>
        <p className="text-xs text-red-600 mt-1">
          Only Organization Admins are permitted to access User Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>User Management</h2>
      
      <UserList
        userList={userList}
        allAssignmentsList={allAssignmentsList}
        onView={(st: any) => router.push(`/users/details?userId=${encodeURIComponent(st.id)}`)}
        onEdit={handleOpenEdit}
        onResetPassword={(st: any) => { setUserForReset(st); setIsResetPasswordOpen(true); }}
        onResendInvite={(st: any) => handleResendUserInvite(st.id)}
        onToggleStatus={handleToggleUserStatus}
        onAddUser={handleOpenCreate}
      />

      {/* User CRUD Modals */}
      {isCreateUserOpen && (
        <CreateUserModal
          isOpen={isCreateUserOpen}
          onClose={() => setIsCreateUserOpen(false)}
          onSubmit={handleCreateUserSubmit}
        />
      )}

      {isEditUserOpen && editingUser && (
        <EditUserModal
          isOpen={isEditUserOpen}
          onClose={() => setIsEditUserOpen(false)}
          onSubmit={async (payload: any) => {
            await handleEditUserSubmit(editingUser.id, payload);
            setIsEditUserOpen(false);
          }}
          user={editingUser}
        />
      )}

      {isResetPasswordOpen && userForReset && (
        <ResetPasswordModal
          isOpen={isResetPasswordOpen}
          onClose={() => {
            setIsResetPasswordOpen(false);
            setUserForReset(null);
          }}
          onSubmit={async (newPwd: any) => {
            await handleResetPasswordSubmit(userForReset.id, newPwd);
            setIsResetPasswordOpen(false);
            setUserForReset(null);
          }}
          user={userForReset}
        />
      )}
    </div>
  );
}
