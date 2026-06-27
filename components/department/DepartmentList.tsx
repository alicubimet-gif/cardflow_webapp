import React from 'react';
import { DepartmentCard } from './DepartmentCard';

interface DepartmentListProps {
  departmentsList: any[];
  allAssignmentsList: any[];
  recordsList: any[];
  activeBranchId: string | null;
  onOpenDepartment: (id: string) => void;
  onAssignDepartmentStaff: (id: string) => void;
  onEditDepartment: (item: any) => void;
  onDeleteDepartment: (id: string) => void;
}

export function DepartmentList({
  departmentsList,
  allAssignmentsList,
  recordsList,
  activeBranchId,
  onOpenDepartment,
  onAssignDepartmentStaff,
  onEditDepartment,
  onDeleteDepartment
}: DepartmentListProps) {

  const filtered = departmentsList.filter(
    d => !activeBranchId || String(d.branch || d.branchId || d.branch_id) === String(activeBranchId)
  );

  if (filtered.length === 0) {
    return (
      <div className="bg-white border border-[#DFE4EA] rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <p className="text-[#64748B] text-sm font-medium">No departments created inside this branch yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map(d => {
        const deptAssignments = allAssignmentsList.filter(
          a => a.assignment_level === 'department' && String(a.department || a.department_id) === String(d.id)
        );
        const deptRecords = recordsList.filter(
          r => String(r.dept_id || r.deptId || r.department) === String(d.id)
        );
        return (
          <DepartmentCard
            key={d.id}
            department={d}
            assignmentsCount={deptAssignments.length}
            recordsCount={deptRecords.length}
            onOpen={onOpenDepartment}
            onAssignStaff={onAssignDepartmentStaff}
            onEdit={onEditDepartment}
            onDelete={onDeleteDepartment}
          />
        );
      })}
    </div>
  );
}
