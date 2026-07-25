import React from 'react';
import { Users, Plus } from 'lucide-react';
import { SubgroupCard } from '../subgroup/SubgroupCard';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';

interface GroupDetailsProps {
  groupId: string;
  groupName: string;
  subgroupsList: any[];
  allAssignmentsList: any[];
  userList: any[];
  recordsList: any[];
  onBack: () => void;
  onAssignGroupUser: (groupId: string) => void;
  onAddSubgroup: (groupId: string) => void;
  onOpenSubgroup: (divId: string) => void;
  onAssignSubgroupUsers: (divId: string) => void;
  onEditSubgroup: (item: any) => void;
  onDeleteSubgroup: (id: string) => void;
}

export function GroupDetails({
  groupId,
  groupName,
  subgroupsList,
  allAssignmentsList,
  userList,
  recordsList,
  onBack,
  onAssignGroupUser,
  onAddSubgroup,
  onOpenSubgroup,
  onAssignSubgroupUsers,
  onEditSubgroup,
  onDeleteSubgroup
}: GroupDetailsProps) {
  const { user } = useAuth();
  const { groupLabel, groupLabelPlural, subgroupLabel, subgroupLabelPlural } = useOrgLabels(user?.organization_type);

  // Filter class assignments & user
  const classAssignments = allAssignmentsList.filter(
    a => ['group', 'class', 'branch'].includes(a.assignment_level) &&
      String(a.group?.id || a.group || a.group_id || a.school_class?.id || a.school_class || a.school_class_id || a.branch?.id || a.branch || a.branch_id) === String(groupId)
  );
  const classUser = userList.filter(st => 
    classAssignments.some(a => String(a.user || a.user_id) === String(st.id))
  );

  // Filter subgroups in this class
  const filteredDivs = subgroupsList.filter(
    (d: any) => String(d.group || d.groupId || d.group_id) === String(groupId)
  );

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Sora' }}>
            {groupLabel}: {groupName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage {subgroupLabelPlural.toLowerCase()} and staff assigned directly to this {groupLabel.toLowerCase()}.</p>
        </div>
        <button
          onClick={() => onAssignGroupUser(groupId)}
          className="flex items-center gap-1.5 px-4 h-9 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Users size={14} className="text-slate-400 group-hover:text-blue-500" />
          Assign {groupLabel} Staff
        </button>
      </div>



      {/* Subgroups list */}
      <div>
        <div className="flex items-center justify-between mb-4 mt-6">
          <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Sora' }}>{subgroupLabelPlural}</h3>
          <button
            onClick={() => onAddSubgroup(groupId)}
            className="flex items-center gap-1.5 px-3 h-9 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            Add {subgroupLabel}
          </button>
        </div>

        {filteredDivs.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-10 text-center shadow-xs">
            <p className="text-slate-500 text-sm font-medium">No {subgroupLabelPlural.toLowerCase()} created inside this {groupLabel.toLowerCase()} yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDivs.map((d: any) => {
              const divAssignments = allAssignmentsList.filter(
                a => ['subgroup', 'division', 'department'].includes(a.assignment_level) &&
                  String(a.subgroup?.id || a.subgroup || a.subgroup_id || a.division?.id || a.division || a.division_id || a.department?.id || a.department || a.department_id) === String(d.id)
              );
              const divRecords = recordsList.filter(
                (r: any) => String(r.sub_group || r.subgroup?.id || r.subgroup_id || r.subgroup || r.division?.id || r.divId || r.division_id || r.division || r.department?.id || r.department_id || r.department) === String(d.id)
              );
              const recordsCountVal = d.recordCount !== undefined ? d.recordCount : divRecords.length;
              const assignmentsCountVal = d.staff_assigned_count !== undefined ? d.staff_assigned_count : (d.staff_count !== undefined ? d.staff_count : (d.staffCount !== undefined ? d.staffCount : divAssignments.length));
              return (
                <SubgroupCard
                  key={d.id}
                  subgroup={d}
                  assignmentsCount={assignmentsCountVal}
                  recordsCount={recordsCountVal}
                  onOpen={onOpenSubgroup}
                  onAssignUser={onAssignSubgroupUsers}
                  onEdit={onEditSubgroup}
                  onDelete={onDeleteSubgroup}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
