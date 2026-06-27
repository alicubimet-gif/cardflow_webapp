import React from 'react';
import { FolderOpen, Users, Edit, Trash2 } from 'lucide-react';

interface DivisionCardProps {
  division: any;
  assignmentsCount: number;
  recordsCount: number;
  onOpen: (id: string) => void;
  onAssignStaff: (id: string) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export function DivisionCard({
  division,
  assignmentsCount,
  recordsCount,
  onOpen,
  onAssignStaff,
  onEdit,
  onDelete
}: DivisionCardProps) {
  return (
    <div
      className="bg-white border border-[#DFE4EA] rounded-2xl p-5 flex flex-col justify-between space-y-4"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      <div>
        <h4 className="text-sm font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>
          Division {division.name}
        </h4>
        <p className="text-xs text-[#64748B] mt-1">
          {assignmentsCount} Staff assigned • {recordsCount} Records
        </p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onOpen(String(division.id))}
          className="flex-1 h-9 bg-[#2563EB]/10 hover:bg-[#2563EB]/15 text-[#2563EB] rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <FolderOpen size={13} />
          Open
        </button>
        <button
          onClick={() => onAssignStaff(String(division.id))}
          className="px-3 h-9 border border-[#DFE4EA] hover:border-[#2563EB] hover:text-[#2563EB] rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center"
          title="Assign Staff"
        >
          <Users size={14} />
        </button>
        <button
          onClick={() => onEdit(division)}
          className="p-2 text-[#64748B] hover:bg-slate-50 border border-transparent hover:border-[#DFE4EA] rounded-xl transition-colors cursor-pointer"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={() => onDelete(division.id)}
          className="p-2 text-[#EF4444] hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
