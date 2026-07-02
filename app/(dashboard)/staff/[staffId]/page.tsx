'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDashboard } from '@/context/dashboard-context';
import { StaffDetails } from '@/components/staff/StaffDetails';
import { Loader2 } from 'lucide-react';
import { AuthService } from '@/services/auth-service';

// Assign Modals for Staff Single View
import { AssignClassModal } from '@/components/staff/AssignClassModal';
import { AssignDivisionModal } from '@/components/staff/AssignDivisionModal';
import { AssignBranchModal } from '@/components/staff/AssignBranchModal';
import { AssignDepartmentModal } from '@/components/staff/AssignDepartmentModal';

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.staffId as string;
  
  const {
    staffList,
    classesList,
    divisionsList,
    branchesList,
    departmentsList,
    isSchool,
    isAdmin,
    setViewingStaff,
    
    // Assignment state
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
    handleRemoveStaffAssignment,
    handleOpenEdit,
    handleDeleteStaff,
    
    getClassName,
    getDivName,
    getBranchName,
    getDeptName,
    fetchDashboardData
  } = useDashboard();

  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffId) return;
    const fetchStaffDetails = async () => {
      setLoading(true);
      try {
        const found = staffList.find((s: any) => String(s.id) === String(staffId));
        if (found) {
          const assignments = await AuthService.getStaffAssignments(staffId);
          const fullStaff = { ...found, assignments: assignments || [] };
          setStaff(fullStaff);
          setViewingStaff(fullStaff);
        } else {
          // Fetch from list if not loaded yet
          const freshList = await AuthService.getStaffList().catch(() => []);
          const freshFound = freshList.find((s: any) => String(s.id) === String(staffId));
          if (freshFound) {
            const assignments = await AuthService.getStaffAssignments(staffId);
            const fullStaff = { ...freshFound, assignments: assignments || [] };
            setStaff(fullStaff);
            setViewingStaff(fullStaff);
          }
        }
      } catch (err) {
        console.error('Failed to load staff details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaffDetails();
  }, [staffId, staffList, setViewingStaff]);

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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-white text-slate-500">
        <Loader2 size={24} className="animate-spin text-blue-600 mb-4" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading staff details...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-white text-slate-500 p-6">
        <p className="text-sm font-bold text-slate-800">Staff member not found.</p>
        <button onClick={() => router.push('/staff')} className="mt-4 text-xs font-bold text-blue-600 hover:underline">
          Return to staff list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StaffDetails
        isOpen={true}
        onClose={() => router.push('/staff')}
        staff={staff}
        isSchool={isSchool}
        classesList={classesList}
        divisionsList={divisionsList}
        branchesList={branchesList}
        departmentsList={departmentsList}
        onOpenAssignClass={() => setIsAssignClassOpen(true)}
        onOpenAssignDivision={() => setIsAssignDivisionOpen(true)}
        onOpenAssignBranch={() => setIsAssignBranchOpen(true)}
        onOpenAssignDepartment={() => setIsAssignDepartmentOpen(true)}
        onEdit={async (staffItem) => {
          await handleOpenEdit(staffItem);
        }}
        onDelete={async (id) => {
          await handleDeleteStaff(id);
          router.push('/staff');
        }}
        onRemoveAssignment={async (id, name) => {
          await handleRemoveStaffAssignment(id, name);
          const assignments = await AuthService.getStaffAssignments(staffId).catch(() => []);
          setStaff((prev: any) => prev ? { ...prev, assignments } : null);
        }}
        getClassName={getClassName}
        getDivName={getDivName}
        getBranchName={getBranchName}
        getDeptName={getDeptName}
      />

      {/* Assignment Modals */}
      {isAssignClassOpen && (
        <AssignClassModal
          isOpen={isAssignClassOpen}
          onClose={() => setIsAssignClassOpen(false)}
          classesList={classesList}
          currentAssignments={staff.assignments || []}
          onAssign={async (selected) => {
            await handleAssignClasses(selected);
            const fresh = await AuthService.getStaffAssignments(staffId).catch(() => []);
            setStaff((prev: any) => prev ? { ...prev, assignments: fresh } : null);
          }}
        />
      )}

      {isAssignDivisionOpen && (
        <AssignDivisionModal
          isOpen={isAssignDivisionOpen}
          onClose={() => setIsAssignDivisionOpen(false)}
          divisionsList={divisionsList}
          currentAssignments={staff.assignments || []}
          getClassName={getClassName}
          onAssign={async (selected) => {
            await handleAssignDivisions(selected);
            const fresh = await AuthService.getStaffAssignments(staffId).catch(() => []);
            setStaff((prev: any) => prev ? { ...prev, assignments: fresh } : null);
          }}
        />
      )}

      {isAssignBranchOpen && (
        <AssignBranchModal
          isOpen={isAssignBranchOpen}
          onClose={() => setIsAssignBranchOpen(false)}
          branchesList={branchesList}
          currentAssignments={staff.assignments || []}
          onAssign={async (selected) => {
            await handleAssignBranches(selected);
            const fresh = await AuthService.getStaffAssignments(staffId).catch(() => []);
            setStaff((prev: any) => prev ? { ...prev, assignments: fresh } : null);
          }}
        />
      )}

      {isAssignDepartmentOpen && (
        <AssignDepartmentModal
          isOpen={isAssignDepartmentOpen}
          onClose={() => setIsAssignDepartmentOpen(false)}
          departmentsList={departmentsList}
          currentAssignments={staff.assignments || []}
          getBranchName={getBranchName}
          onAssign={async (selected) => {
            await handleAssignDepartments(selected);
            const fresh = await AuthService.getStaffAssignments(staffId).catch(() => []);
            setStaff((prev: any) => prev ? { ...prev, assignments: fresh } : null);
          }}
        />
      )}
    </div>
  );
}
