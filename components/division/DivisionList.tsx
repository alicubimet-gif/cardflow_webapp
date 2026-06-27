import React from 'react';
import { DivisionCard } from './DivisionCard';

interface DivisionListProps {
  divisionsList: any[];
  allAssignmentsList: any[];
  recordsList: any[];
  activeClassId: string | null;
  onOpenDivision: (id: string) => void;
  onAssignDivisionStaff: (id: string) => void;
  onEditDivision: (item: any) => void;
  onDeleteDivision: (id: string) => void;
}

export function DivisionList({
  divisionsList,
  allAssignmentsList,
  recordsList,
  activeClassId,
  onOpenDivision,
  onAssignDivisionStaff,
  onEditDivision,
  onDeleteDivision
}: DivisionListProps) {
  
  const filtered = divisionsList.filter(
    d => !activeClassId || String(d.school_class || d.classId || d.class_id) === String(activeClassId)
  );

  if (filtered.length === 0) {
    return (
      <div className="bg-white border border-[#DFE4EA] rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <p className="text-[#64748B] text-sm font-medium">No divisions created inside this class yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map(d => {
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
  );
}
