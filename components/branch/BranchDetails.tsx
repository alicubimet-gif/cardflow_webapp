import React from 'react';
import { Users, Plus } from 'lucide-react';
import { DepartmentCard } from '../department/DepartmentCard';

interface BranchDetailsProps {
  branchId: string;
  branchName: string;
  departmentsList: any[];
  allAssignmentsList: any[];
  staffList: any[];
  recordsList: any[];
  onBack: () => void;
  onAssignBranchStaff: (branchId: string) => void;
  onAddDepartment: (branchId: string) => void;
  onOpenDepartment: (deptId: string) => void;
  onAssignDepartmentStaff: (deptId: string) => void;
  onEditDepartment: (item: any) => void;
  onDeleteDepartment: (id: string) => void;
}

export function BranchDetails({
  branchId,
  branchName,
  departmentsList,
  allAssignmentsList,
  staffList,
  recordsList,
  onBack,
  onAssignBranchStaff,
  onAddDepartment,
  onOpenDepartment,
  onAssignDepartmentStaff,
  onEditDepartment,
  onDeleteDepartment
}: BranchDetailsProps) {

  // Filter branch assignments & staff
  const branchAssignments = allAssignmentsList.filter(
    a => a.assignment_level === 'branch' && String(a.branch || a.branch_id) === String(branchId)
  );
  const branchStaff = staffList.filter(st => 
    branchAssignments.some(a => String(a.staff || a.staff_id) === String(st.id))
  );

  // Filter departments in this branch
  const filteredDepts = departmentsList.filter(
    d => String(d.branch || d.branchId || d.branch_id) === String(branchId)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1"
        >
          ← Back to Branches
        </button>
      </div>

      <div className="bg-white border border-[#DFE4EA] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div>
          <h2 className="text-lg font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>
            Branch: {branchName}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">Manage departments and staff assigned directly to this branch.</p>
        </div>
        <button
          onClick={() => onAssignBranchStaff(branchId)}
          className="flex items-center justify-center gap-1.5 px-4 h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Users size={14} />
          Assign Branch Staff
        </button>
      </div>

      {/* Branch Staff list */}
      <div className="bg-white border border-[#DFE4EA] rounded-2xl p-5 space-y-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Branch Staff</h3>
        {branchStaff.length === 0 ? (
          <p className="text-xs text-[#64748B] italic">No staff members assigned to this branch level.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {branchStaff.map(st => (
              <span key={st.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-[#DFE4EA] text-[#0B0F19] text-xs font-semibold rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {st.name || st.full_name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Departments list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>Departments</h3>
          <button
            onClick={() => onAddDepartment(branchId)}
            className="flex items-center gap-1 px-3 h-8 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus size={12} />
            Add Department
          </button>
        </div>

        {filteredDepts.length === 0 ? (
          <div className="bg-white border border-[#DFE4EA] rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <p className="text-[#64748B] text-sm font-medium">No departments created inside this branch yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepts.map(d => {
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
        )}
      </div>
    </div>
  );
}
