import React from 'react';
import { Plus } from 'lucide-react';
import { BranchCard } from './BranchCard';

interface BranchListProps {
  branchesList: any[];
  allAssignmentsList: any[];
  onAddBranch: () => void;
  onOpenBranch: (id: string) => void;
  onAssignStaff: (id: string) => void;
  onEditBranch: (item: any) => void;
  onDeleteBranch: (id: string) => void;
}

export function BranchList({
  branchesList,
  allAssignmentsList,
  onAddBranch,
  onOpenBranch,
  onAssignStaff,
  onEditBranch,
  onDeleteBranch
}: BranchListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>Branches</h2>
        <button
          onClick={onAddBranch}
          className="flex items-center gap-1.5 px-3 h-9 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Add Branch
        </button>
      </div>

      {branchesList.length === 0 ? (
        <div className="bg-white border border-[#DFE4EA] rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p className="text-[#64748B] text-sm font-medium">No branches created yet</p>
          <button
            onClick={onAddBranch}
            className="mt-2 text-xs font-semibold text-[#2563EB] hover:underline"
          >
            Create your first branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branchesList.map(b => {
            const branchAssignments = allAssignmentsList.filter(
              a => a.assignment_level === 'branch' && String(a.branch || a.branch_id) === String(b.id)
            );
            return (
              <BranchCard
                key={b.id}
                b={b}
                branchAssignmentsCount={branchAssignments.length}
                onOpen={onOpenBranch}
                onAssignStaff={onAssignStaff}
                onEdit={onEditBranch}
                onDelete={onDeleteBranch}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
