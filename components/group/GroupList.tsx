import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { GroupCard } from './GroupCard';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';

interface GroupListProps {
  groupsList: any[];
  subgroupsList: any[];
  recordsList: any[];
  allAssignmentsList: any[];
  onAddGroup: () => void;
  onOpenGroup: (id: string) => void;
  onAssignUser: (id: string) => void;
  onEditGroup: (item: any) => void;
  onDeleteGroup: (id: string) => void;
}

export const GroupList = React.memo(function GroupList({
  groupsList,
  subgroupsList,
  recordsList,
  allAssignmentsList,
  onAddGroup,
  onOpenGroup,
  onAssignUser,
  onEditGroup,
  onDeleteGroup
}: GroupListProps) {
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const { groupLabel, groupLabelPlural } = useOrgLabels(user?.organization_type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs">
        <h1 className="text-xl font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Sora' }}>{groupLabelPlural}</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={`Search ${groupLabelPlural.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button
            onClick={onAddGroup}
            className="flex items-center gap-2 px-4 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
          >
            <Plus size={14} />
            Add {groupLabel}
          </button>
        </div>
      </div>

      {groupsList.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-10 text-center shadow-xs">
          <p className="text-slate-500 text-sm font-medium">No {groupLabelPlural.toLowerCase()} created yet</p>
          <button
            onClick={onAddGroup}
            className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            Create your first {groupLabel.toLowerCase()}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupsList.map((c: any) => {
            const classAssignments = allAssignmentsList.filter(
              a => ['group', 'class', 'branch'].includes(a.assignment_level) &&
                String(a.group || a.group_id || a.school_class || a.school_class_id || a.branch || a.branch_id) === String(c.id)
            );
            const groupSubgroups = subgroupsList.filter(
              (d: any) => String(d.group || d.groupId || d.group_id) === String(c.id)
            );
            const groupRecords = recordsList.filter((r: any) => {
              const subId = r.sub_group || r.subgroup?.id || r.subgroup_id || r.subgroup || r.divId || r.division?.id || r.division_id || r.division || r.department?.id || r.department_id || r.department;
              return groupSubgroups.some((d: any) => String(d.id) === String(subId));
            });
            const classAssignmentsCount = c.staff_assigned_count !== undefined ? c.staff_assigned_count : (c.staff_count !== undefined ? c.staff_count : (c.staffCount !== undefined ? c.staffCount : classAssignments.length));
            const subgroupsCount = c.sub_group_count !== undefined ? c.sub_group_count : (c.subGroupCount !== undefined ? c.subGroupCount : groupSubgroups.length);
            const recordsCount = c.record_count !== undefined ? c.record_count : (c.recordCount !== undefined ? c.recordCount : groupRecords.length);
            return (
              <GroupCard
                key={c.id}
                c={c}
                classAssignmentsCount={classAssignmentsCount}
                subgroupsCount={subgroupsCount}
                recordsCount={recordsCount}
                onOpen={onOpenGroup}
                onAssignUser={onAssignUser}
                onEdit={onEditGroup}
                onDelete={onDeleteGroup}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
