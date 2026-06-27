import React from 'react';
import { Users, Plus } from 'lucide-react';
import { DivisionCard } from '../division/DivisionCard';

interface ClassDetailsProps {
  classId: string;
  className: string;
  divisionsList: any[];
  allAssignmentsList: any[];
  staffList: any[];
  recordsList: any[];
  onBack: () => void;
  onAssignClassStaff: (classId: string) => void;
  onAddDivision: (classId: string) => void;
  onOpenDivision: (divId: string) => void;
  onAssignDivisionStaff: (divId: string) => void;
  onEditDivision: (item: any) => void;
  onDeleteDivision: (id: string) => void;
}

export function ClassDetails({
  classId,
  className,
  divisionsList,
  allAssignmentsList,
  staffList,
  recordsList,
  onBack,
  onAssignClassStaff,
  onAddDivision,
  onOpenDivision,
  onAssignDivisionStaff,
  onEditDivision,
  onDeleteDivision
}: ClassDetailsProps) {
  
  // Filter class assignments & staff
  const classAssignments = allAssignmentsList.filter(
    a => a.assignment_level === 'class' && String(a.school_class || a.class_id) === String(classId)
  );
  const classStaff = staffList.filter(st => 
    classAssignments.some(a => String(a.staff || a.staff_id) === String(st.id))
  );

  // Filter divisions in this class
  const filteredDivs = divisionsList.filter(
    d => String(d.school_class || d.classId || d.class_id) === String(classId)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1"
        >
          ← Back to Classes
        </button>
      </div>

      <div className="bg-white border border-[#DFE4EA] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div>
          <h2 className="text-lg font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>
            Class: {className}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">Manage divisions and staff assigned directly to this class.</p>
        </div>
        <button
          onClick={() => onAssignClassStaff(classId)}
          className="flex items-center justify-center gap-1.5 px-4 h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Users size={14} />
          Assign Class Staff
        </button>
      </div>

      {/* Class Staff list */}
      <div className="bg-white border border-[#DFE4EA] rounded-2xl p-5 space-y-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Class Staff</h3>
        {classStaff.length === 0 ? (
          <p className="text-xs text-[#64748B] italic">No staff members assigned to this class level.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classStaff.map(st => (
              <span key={st.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-[#DFE4EA] text-[#0B0F19] text-xs font-semibold rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {st.name || st.full_name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Divisions list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>Divisions</h3>
          <button
            onClick={() => onAddDivision(classId)}
            className="flex items-center gap-1 px-3 h-8 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus size={12} />
            Add Division
          </button>
        </div>

        {filteredDivs.length === 0 ? (
          <div className="bg-white border border-[#DFE4EA] rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <p className="text-[#64748B] text-sm font-medium">No divisions created inside this class yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDivs.map(d => {
              const divAssignments = allAssignmentsList.filter(
                a => a.assignment_level === 'division' && String(a.division || a.division_id) === String(d.id)
              );
              const divRecords = recordsList.filter(
                r => String(r.division_id || r.divId || r.division) === String(d.id)
              );
              return (
                <DivisionCard
                  key={d.id}
                  division={d}
                  assignmentsCount={divAssignments.length}
                  recordsCount={divRecords.length}
                  onOpen={onOpenDivision}
                  onAssignStaff={onAssignDivisionStaff}
                  onEdit={onEditDivision}
                  onDelete={onDeleteDivision}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
