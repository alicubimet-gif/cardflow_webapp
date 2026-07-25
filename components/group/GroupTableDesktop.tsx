'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Edit2, Users, Trash2 } from 'lucide-react';

interface GroupTableDesktopProps {
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

export function GroupTableDesktop({
  groupsList,
  terminology,
  router,
  onEdit,
  onDelete,
  onAssignStaff,
}: GroupTableDesktopProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className="mt-4 hidden overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm sm:block"
      ref={menuRef}
    >
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-[50%]" />
          <col className="w-[35%]" />
          <col className="w-[15%]" />
        </colgroup>
        <thead className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 rounded-tl-2xl">{terminology.groupSingular} Name</th>
            <th className="px-4 py-3 text-center">{terminology.subgroupPlural}</th>
            <th className="px-4 py-3 text-right rounded-tr-2xl">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {groupsList.map((group) => (
            <tr key={group.id} className="hover:bg-slate-50/40">
              <td className="px-4 py-4 text-sm align-middle">
                <span
                  onClick={() => router.push(`/groups/details?groupId=${encodeURIComponent(group.id)}`)}
                  className="break-words font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  {group.name}
                </span>
              </td>
              <td className="px-4 py-4 text-sm align-middle text-center font-semibold text-slate-800">
                {group.sub_group_count ?? group.subgroup_count ?? 0}
              </td>
              <td className="px-4 py-4 text-sm align-middle text-right relative overflow-visible">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === group.id ? null : group.id);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Dropdown Menu actions overlay */}
                {activeMenuId === group.id && (
                  <div className="absolute right-4 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-100 text-left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(group);
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignStaff(group);
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users size={12} /> Assign Staff
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(group);
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
