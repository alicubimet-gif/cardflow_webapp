'use client';

import React from 'react';

interface SubgroupCardMobileProps {
  subgroupsList: any[];
  terminology: {
    groupSingular: string;
    groupPlural: string;
    subgroupSingular: string;
    subgroupPlural: string;
    recordSingular: string;
    recordPlural: string;
  };
  groupId: string;
  router: any;
  onEdit: (subgroup: any) => void;
  onDelete: (subgroup: any) => void;
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active';

  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-wide ${
        isActive
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-650'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export function SubgroupCardMobile({
  subgroupsList,
  terminology,
  groupId,
  router,
  onEdit,
  onDelete,
}: SubgroupCardMobileProps) {
  return (
    <div className="space-y-3">
      {subgroupsList.map((subgroup) => (
        <article
          key={subgroup.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm relative overflow-visible pointer-events-auto touch-manipulation"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/groups/subgroup?groupId=${encodeURIComponent(groupId)}&subgroupId=${encodeURIComponent(subgroup.id)}`);
                }}
                className="break-words text-base font-bold leading-5 text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {subgroup.name}
              </h2>
            </div>
            <StatusBadge status={subgroup.status} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase text-slate-400">
                {terminology.recordPlural}
              </p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {subgroup.record_count ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase text-slate-400">
                Staff Assigned
              </p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {subgroup.staff_count ?? 0}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/groups/subgroup?groupId=${encodeURIComponent(groupId)}&subgroupId=${encodeURIComponent(subgroup.id)}`);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors flex items-center justify-center cursor-pointer pointer-events-auto touch-manipulation"
            >
              View
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(subgroup);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors flex items-center justify-center cursor-pointer pointer-events-auto touch-manipulation"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(subgroup);
              }}
              className="col-span-2 h-11 rounded-xl border border-red-200 text-sm font-semibold text-red-650 hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer pointer-events-auto touch-manipulation"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
