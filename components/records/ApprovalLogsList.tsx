'use client';

import React, { useState } from 'react';
import { Search, ClipboardList, Calendar, Clock, User, ShieldCheck } from 'lucide-react';

interface ApprovalLogsListProps {
  logsList: any[];
}

export function ApprovalLogsList({ logsList }: ApprovalLogsListProps) {
  const [search, setSearch] = useState('');

  // Filter logs based on search query
  const filteredLogs = logsList.filter(log => {
    const term = search.toLowerCase();
    const record = (log.record_name || '').toLowerCase();
    const org = (log.organization_name || '').toLowerCase();
    const actor = (log.user_full_name || '').toLowerCase();
    const desc = (log.description || '').toLowerCase();
    const act = (log.action_display || '').toLowerCase();
    
    return record.includes(term) || org.includes(term) || actor.includes(term) || desc.includes(term) || act.includes(term);
  });

  return (
    <div className="space-y-[20px] w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
            Approval Logs
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Audit logs of all card approvals, rejections, corrections, and submissions.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72 shrink-0">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-[40px] border border-[#DFE4EA] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white transition-all shadow-3xs"
          />
        </div>
      </div>

      {/* Main Logs Table */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-[#DFE4EA] rounded-2xl p-12 text-center shadow-sm">
          <ClipboardList className="mx-auto mb-3 text-slate-400" size={40} />
          <p className="text-[#0B0F19] font-bold mb-1">No Logs Found</p>
          <p className="text-xs text-slate-500">There are no approval history logs that match your criteria.</p>
        </div>
      ) : (
        <div>
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredLogs.map((log) => {
              const action = log.action_display || 'Action';
              let actionBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (action.includes('Approved')) {
                actionBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
              } else if (action.includes('Rejected')) {
                actionBadgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
              } else if (action.includes('Correction')) {
                actionBadgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
              } else if (action.includes('Submitted')) {
                actionBadgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
              }
              return (
                <div key={log.id} className="bg-white border border-[#DFE4EA] p-4 rounded-2xl space-y-2.5 shadow-3xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{log.record_name || 'Roster Record'}</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wide ${actionBadgeColor}`}>
                      {action}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>Scope / Area:</span>
                    <span className="font-semibold text-slate-700">{log.organization_name || '—'}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>Performed By:</span>
                    <span className="font-semibold text-slate-700">{log.user_full_name || log.username || 'System'}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{log.date || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{log.time || '—'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto border border-[#DFE4EA] rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DFE4EA] bg-[#F8FAFC] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Record</th>
                  <th className="py-4 px-6">Organization</th>
                  <th className="py-4 px-6">Performed By</th>
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE4EA] text-xs font-semibold text-slate-700">
                {filteredLogs.map((log) => {
                  const action = log.action_display || 'Action';
                  let actionBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  
                  if (action.includes('Approved')) {
                    actionBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  } else if (action.includes('Rejected')) {
                    actionBadgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
                  } else if (action.includes('Correction')) {
                    actionBadgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
                  } else if (action.includes('Submitted')) {
                    actionBadgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {log.record_name || 'Roster Record'}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-500">
                        {log.organization_name || '—'}
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-bold flex items-center gap-1.5 mt-0.5">
                        <User size={13} className="text-slate-400" />
                        <span>{log.user_full_name || log.username || 'System'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wide ${actionBadgeColor}`}>
                          {action}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{log.date || '—'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock size={13} className="text-slate-400" />
                          <span>{log.time || '—'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
