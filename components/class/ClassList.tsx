import React from 'react';
import { Plus } from 'lucide-react';
import { ClassCard } from './ClassCard';

interface ClassListProps {
  classesList: any[];
  allAssignmentsList: any[];
  onAddClass: () => void;
  onOpenClass: (id: string) => void;
  onAssignStaff: (id: string) => void;
  onEditClass: (item: any) => void;
  onDeleteClass: (id: string) => void;
}

export function ClassList({
  classesList,
  allAssignmentsList,
  onAddClass,
  onOpenClass,
  onAssignStaff,
  onEditClass,
  onDeleteClass
}: ClassListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>Classes</h2>
        <button
          onClick={onAddClass}
          className="flex items-center gap-1.5 px-3 h-9 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Add Class
        </button>
      </div>

      {classesList.length === 0 ? (
        <div className="bg-white border border-[#DFE4EA] rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p className="text-[#64748B] text-sm font-medium">No classes created yet</p>
          <button
            onClick={onAddClass}
            className="mt-2 text-xs font-semibold text-[#2563EB] hover:underline"
          >
            Create your first class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classesList.map(c => {
            const classAssignments = allAssignmentsList.filter(
              a => a.assignment_level === 'class' && String(a.school_class || a.class_id) === String(c.id)
            );
            return (
              <ClassCard
                key={c.id}
                c={c}
                classAssignmentsCount={classAssignments.length}
                onOpen={onOpenClass}
                onAssignStaff={onAssignStaff}
                onEdit={onEditClass}
                onDelete={onDeleteClass}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
