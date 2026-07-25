'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDashboard } from '@/context/dashboard-context';
import { UserDetails } from '@/components/users/UserDetails';
import { Loader2 } from 'lucide-react';
import { UserApi } from '@/api';

import { AssignGroupModal } from '@/components/users/AssignGroupModal';
import { AssignSubgroupModal } from '@/components/users/AssignSubgroupModal';

export default function UserDetailsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');
  
  const {
    userList,
    groupsList, subgroupsList,
    isOrganization,
    isAdmin,
    setViewingUser,
    
    // Assignment state
    isAssignGroupOpen,
    setIsAssignGroupOpen,
    isAssignSubgroupOpen,
    setIsAssignSubgroupOpen,
    
    handleAssignClasses,
    handleAssignDivisions,
    handleAssignBranches,
    handleAssignDepartments,
    handleRemoveUserAssignment,
    handleOpenEdit,
    handleDeleteUser,
    
    getGroupName, getSubgroupName
  } = useDashboard();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const found = userList.find((s: any) => String(s.id) === String(userId));
        if (found) {
          const assignments = await UserApi.getUserAssignments(userId);
          const fullUser = { ...found, assignments: assignments || [] };
          setUser(fullUser);
          setViewingUser(fullUser);
        } else {
          // Fetch from list if not loaded yet
          const freshList = await UserApi.getUserList().catch(() => []);
          const freshFound = freshList.find((s: any) => String(s.id) === String(userId));
          if (freshFound) {
            const assignments = await UserApi.getUserAssignments(userId);
            const fullUser = { ...freshFound, assignments: assignments || [] };
            setUser(fullUser);
            setViewingUser(fullUser);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [userId, userList, setViewingUser]);

  if (!userId) {
    return <div className="p-6 text-sm text-slate-600">Invalid user ID.</div>;
  }

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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-white text-slate-500">
        <Loader2 size={24} className="animate-spin text-blue-600 mb-4" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-white text-slate-500 p-6">
        <p className="text-sm font-bold text-slate-800">User member not found.</p>
        <button onClick={() => router.push('/users')} className="mt-4 text-xs font-bold text-blue-600 hover:underline">
          Return to user list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <UserDetails
        isOpen={true}
        onClose={() => router.push('/users')}
        user={user}
        isOrganization={isOrganization}
        groupsList={groupsList}
        subgroupsList={subgroupsList}
        onOpenAssignClass={() => setIsAssignGroupOpen(true)}
        onOpenAssignDivision={() => setIsAssignSubgroupOpen(true)}
        onOpenAssignBranch={() => setIsAssignGroupOpen(true)}
        onOpenAssignDepartment={() => setIsAssignSubgroupOpen(true)}
        onEdit={async (userItem: any) => {
          await handleOpenEdit(userItem);
        }}
        onDelete={async (id: string) => {
          await handleDeleteUser(id);
          router.push('/users');
        }}
        onRemoveAssignment={async (id: any, name: any) => {
          await handleRemoveUserAssignment(id, name);
          const assignments = await UserApi.getUserAssignments(userId).catch(() => []);
          setUser((prev: any) => prev ? { ...prev, assignments } : null);
        }}
        getGroupName={getGroupName}
        getSubgroupName={getSubgroupName}
      />

      {/* Assignment Modals */}
      {isAssignGroupOpen && (
        <AssignGroupModal
          isOpen={isAssignGroupOpen}
          onClose={() => setIsAssignGroupOpen(false)}
          groupsList={groupsList}
          currentAssignments={user.assignments || []}
          onAssign={async (selected: any) => {
            await handleAssignClasses(selected);
            const fresh = await UserApi.getUserAssignments(userId).catch(() => []);
            setUser((prev: any) => prev ? { ...prev, assignments: fresh } : null);
          }}
        />
      )}

      {isAssignSubgroupOpen && (
        <AssignSubgroupModal
          isOpen={isAssignSubgroupOpen}
          onClose={() => setIsAssignSubgroupOpen(false)}
          subgroupsList={subgroupsList}
          currentAssignments={user.assignments || []}
          getGroupName={getGroupName}
          onAssign={async (selected: any) => {
            await handleAssignDivisions(selected);
            const fresh = await UserApi.getUserAssignments(userId).catch(() => []);
            setUser((prev: any) => prev ? { ...prev, assignments: fresh } : null);
          }}
        />
      )}

      {isAssignGroupOpen && (
        <AssignGroupModal
          isOpen={isAssignGroupOpen}
          onClose={() => setIsAssignGroupOpen(false)}
          groupsList={groupsList}
          currentAssignments={user.assignments || []}
          onAssign={async (selected: any) => {
            await handleAssignBranches(selected);
            const fresh = await UserApi.getUserAssignments(userId).catch(() => []);
            setUser((prev: any) => prev ? { ...prev, assignments: fresh } : null);
          }}
        />
      )}

      {isAssignSubgroupOpen && (
        <AssignSubgroupModal
          isOpen={isAssignSubgroupOpen}
          onClose={() => setIsAssignSubgroupOpen(false)}
          subgroupsList={subgroupsList}
          currentAssignments={user.assignments || []}
          getGroupName={getGroupName}
          onAssign={async (selected: any) => {
            await handleAssignDepartments(selected);
            const fresh = await UserApi.getUserAssignments(userId).catch(() => []);
            setUser((prev: any) => prev ? { ...prev, assignments: fresh } : null);
          }}
        />
      )}
    </div>
  );
}
