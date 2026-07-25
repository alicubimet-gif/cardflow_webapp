import React from 'react';
import { SubgroupCard } from './SubgroupCard';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';

interface SubgroupListProps {
  subgroupsList: any[];
  allAssignmentsList: any[];
  recordsList: any[];
  activeGroupId: string | null;
  onOpenSubgroup: (id: string) => void;
  onAssignSubgroupUsers: (id: string) => void;
  onEditSubgroup: (item: any) => void;
  onDeleteSubgroup: (id: string) => void;
}

export const SubgroupList = React.memo(function SubgroupList({
  subgroupsList,
  allAssignmentsList,
  recordsList,
  activeGroupId,
  onOpenSubgroup,
  onAssignSubgroupUsers,
  onEditSubgroup,
  onDeleteSubgroup
}: SubgroupListProps) {
  const { user } = useAuth();
  const { groupLabel, subgroupLabel, subgroupLabelPlural } = useOrgLabels(user?.organization_type);
  
  const filtered = subgroupsList.filter(
    (d: any) => !activeGroupId || String(d.group || d.groupId || d.group_id) === String(activeGroupId)
  );

  if (filtered.length === 0) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-2xl p-8 text-center shadow-xs">
        <p className="text-slate-500 text-sm font-medium">No {subgroupLabelPlural.toLowerCase()} created inside this {groupLabel.toLowerCase()} yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((d: any) => {
        const divAssignments = allAssignmentsList.filter(
          a => ['subgroup', 'division', 'department'].includes(a.assignment_level) &&
            String(a.subgroup?.id || a.subgroup || a.subgroup_id || a.division?.id || a.division || a.division_id || a.department?.id || a.department || a.department_id) === String(d.id)
        );
        const divRecords = recordsList.filter(
          (r: any) => String(r.subgroup?.id || r.subgroup_id || r.subgroup || r.division?.id || r.divId || r.division_id || r.division || r.department?.id || r.department_id || r.department) === String(d.id)
        );
        const assignmentsCountVal = d.staff_assigned_count !== undefined ? d.staff_assigned_count : (d.staff_count !== undefined ? d.staff_count : (d.staffCount !== undefined ? d.staffCount : divAssignments.length));
        return (
          <SubgroupCard
            key={d.id}
            subgroup={d}
            assignmentsCount={assignmentsCountVal}
            recordsCount={divRecords.length}
            onOpen={onOpenSubgroup}
            onAssignUser={onAssignSubgroupUsers}
            onEdit={onEditSubgroup}
            onDelete={onDeleteSubgroup}
          />
        );
      })}
    </div>
  );
});
