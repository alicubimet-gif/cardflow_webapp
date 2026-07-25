'use client';

import React from 'react';
import { Eye, Pencil, Trash2, UserPlus } from 'lucide-react';

interface SubgroupTableDesktopProps {
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
  onAssignStaff: (subgroup: any) => void;
  isAdmin: boolean;
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

export function SubgroupTableDesktop({
  subgroupsList,
  terminology,
  groupId,
  router,
  onEdit,
  onDelete,
  onAssignStaff,
  isAdmin,
}: SubgroupTableDesktopProps) {
  return (
    <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-[28%]" />
          <col className="w-[16%]" />
          <col className="w-[18%]" />
          <col className="w-[16%]" />
          <col className="w-[22%]" />
        </colgroup>
        <thead className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 rounded-tl-2xl">{terminology.subgroupSingular} Name</th>
            <th className="px-5 py-3">{terminology.recordPlural}</th>
            <th className="px-5 py-3">Staff Assigned</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right rounded-tr-2xl">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subgroupsList.map((subgroup) => (
            <tr key={subgroup.id} className="hover:bg-slate-50/40">
              <td className="px-5 py-4 text-sm align-middle">
                <span
                  onClick={() => router.push(`/groups/subgroup?groupId=${encodeURIComponent(groupId)}&subgroupId=${encodeURIComponent(subgroup.id)}`)}
                  className="break-words font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  {subgroup.name}
                </span>
              </td>
              <td className="px-5 py-4 text-sm align-middle text-slate-800 font-medium">
                {subgroup.record_count ?? 0}
              </td>
              <td className="px-5 py-4 text-sm align-middle text-slate-800 font-medium">
                <div className="flex items-center gap-2">
                  <span>{subgroup.staff_count ?? 0}</span>
                  {isAdmin && (
                    <button
                      onClick={() => onAssignStaff(subgroup)}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-605 cursor-pointer"
                      title="Assign Staff"
                    >
                      <UserPlus size={14} />
                    </button>
                  )}
                </div>
              </td>
              <td className="px-5 py-4 text-sm align-middle">
                <StatusBadge status={subgroup.status} />
              </td>
              <td className="px-5 py-4 text-sm align-middle text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => router.push(`/groups/subgroup?groupId=${encodeURIComponent(groupId)}&subgroupId=${encodeURIComponent(subgroup.id)}`)}
                    aria-label={`View ${subgroup.name}`}
                    className="h-9 w-9 rounded-lg hover:bg-slate-150/40 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(subgroup)}
                        aria-label={`Edit ${subgroup.name}`}
                        className="h-9 w-9 rounded-lg hover:bg-slate-150/40 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(subgroup)}
                        aria-label={`Delete ${subgroup.name}`}
                        className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-650 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
