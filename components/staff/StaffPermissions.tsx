import React from 'react';
import { Plus, Trash2, Shield, Layers, Building2, Briefcase } from 'lucide-react';

interface StaffPermissionsProps {
  staff: any;
  isSchool: boolean;
  onRemoveAssignment: (id: string, name: string) => Promise<void>;
  onOpenAssignClass: () => void;
  onOpenAssignDivision: () => void;
  onOpenAssignBranch: () => void;
  onOpenAssignDepartment: () => void;
  getClassName: (id: string) => string;
  getDivName: (id: string) => string;
  getBranchName: (id: string) => string;
  getDeptName: (id: string) => string;
}

export function StaffPermissions({
  staff,
  isSchool,
  onRemoveAssignment,
  onOpenAssignClass,
  onOpenAssignDivision,
  onOpenAssignBranch,
  onOpenAssignDepartment,
  getClassName,
  getDivName,
  getBranchName,
  getDeptName
}: StaffPermissionsProps) {
  const assignments = staff?.assignments || [];

  const handleRemove = async (id: string, label: string) => {
    if (confirm(`Are you sure you want to remove access to "${label}"?`)) {
      await onRemoveAssignment(id, label);
    }
  };

  const renderSchoolAssignments = () => {
    const classAssignments = assignments.filter((a: any) => a.assignment_level === 'class');
    const divisionAssignments = assignments.filter((a: any) => a.assignment_level === 'division');

    return (
      <div className="space-y-6">
        {/* Class Level Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Layers size={13} className="text-blue-500" />
              Assigned Classes (Inherits Divisions)
            </h4>
            <button
              type="button"
              onClick={onOpenAssignClass}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={11} />
              <span>Assign Class</span>
            </button>
          </div>

          {classAssignments.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-150 rounded-xl bg-slate-50/30 text-center text-xs text-slate-400 font-medium italic">
              No classes assigned.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classAssignments.map((a: any) => {
                const cId = a.school_class?.id || a.school_class;
                const label = getClassName(cId);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl shadow-3xs hover:border-slate-300 transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{label}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Class Access</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(a.id, label)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Access"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Division Level Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Shield size={13} className="text-indigo-500" />
              Assigned Divisions
            </h4>
            <button
              type="button"
              onClick={onOpenAssignDivision}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={11} />
              <span>Assign Division</span>
            </button>
          </div>

          {divisionAssignments.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-150 rounded-xl bg-slate-50/30 text-center text-xs text-slate-400 font-medium italic">
              No divisions assigned.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {divisionAssignments.map((a: any) => {
                const divId = a.division?.id || a.division;
                const classId = a.division?.school_class || a.division?.school_class_id || a.school_class;
                const className = getClassName(classId);
                const label = `${className} - ${getDivName(divId)}`;
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl shadow-3xs hover:border-slate-300 transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{label}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Division Access</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(a.id, label)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Access"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOfficeAssignments = () => {
    const branchAssignments = assignments.filter((a: any) => a.assignment_level === 'branch');
    const departmentAssignments = assignments.filter((a: any) => a.assignment_level === 'department');

    return (
      <div className="space-y-6">
        {/* Branch Level Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Building2 size={13} className="text-emerald-600" />
              Assigned Branches (Inherits Departments)
            </h4>
            <button
              type="button"
              onClick={onOpenAssignBranch}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-650 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={11} />
              <span>Assign Branch</span>
            </button>
          </div>

          {branchAssignments.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-150 rounded-xl bg-slate-50/30 text-center text-xs text-slate-400 font-medium italic">
              No branches assigned.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {branchAssignments.map((a: any) => {
                const bId = a.branch?.id || a.branch;
                const label = getBranchName(bId);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl shadow-3xs hover:border-slate-300 transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{label}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Branch Access</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(a.id, label)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Access"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Department Level Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Briefcase size={13} className="text-teal-650" />
              Assigned Departments
            </h4>
            <button
              type="button"
              onClick={onOpenAssignDepartment}
              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={11} />
              <span>Assign Department</span>
            </button>
          </div>

          {departmentAssignments.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-150 rounded-xl bg-slate-50/30 text-center text-xs text-slate-400 font-medium italic">
              No departments assigned.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {departmentAssignments.map((a: any) => {
                const deptId = a.department?.id || a.department;
                const branchId = a.department?.branch || a.department?.branch_id || a.branch;
                const branchName = getBranchName(branchId);
                const label = `${branchName} - ${getDeptName(deptId)}`;
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl shadow-3xs hover:border-slate-300 transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{label}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Department Access</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(a.id, label)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Access"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
      <h3 className="text-xs font-extrabold text-[#0B0F19] uppercase tracking-wider">
        Assigned Areas Section
      </h3>
      {isSchool ? renderSchoolAssignments() : renderOfficeAssignments()}
    </div>
  );
}
