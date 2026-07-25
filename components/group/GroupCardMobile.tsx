'use client';

import React from 'react';
import { Users, Edit2, Trash2 } from 'lucide-react';

interface GroupCardMobileProps {
  groupsList: any[];
  terminology: {
    groupSingular: string;
    groupPlural: string;
    subgroupSingular: string;
    subgroupPlural: string;
  };
  router: any;
  onEdit: (group: any) => void;
  onDelete: (group: any) => void;
  onAssignStaff: (group: any) => void;
}

export function GroupCardMobile({
  groupsList,
  terminology,
  router,
  onEdit,
  onDelete,
  onAssignStaff,
}: GroupCardMobileProps) {
  return (
    <div className="space-y-3">
      {groupsList.map((group) => (
        <article
          key={group.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm relative overflow-visible pointer-events-auto touch-manipulation"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/groups/details?groupId=${encodeURIComponent(group.id)}`);
                }}
                className="min-w-0 break-words text-sm font-bold leading-5 text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {group.name}
              </h2>
              {group.code && (
                <p className="mt-1 text-xs text-slate-500">
                  Code: {group.code}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-xs font-medium text-slate-500">
              {terminology.subgroupPlural}
            </span>
            <span className="text-sm font-bold text-slate-900">
              {group.sub_group_count ?? group.subgroup_count ?? 0}
            </span>
          </div>

          {/* stacked direct action buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAssignStaff(group);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5 touch-manipulation pointer-events-auto cursor-pointer"
            >
              <Users size={14} />
              <span>Assign Staff</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(group);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5 touch-manipulation pointer-events-auto cursor-pointer"
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(group);
              }}
              className="col-span-2 h-11 rounded-xl border border-rose-100 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-600 transition-colors flex items-center justify-center gap-1.5 touch-manipulation pointer-events-auto cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete {terminology.groupSingular}</span>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
