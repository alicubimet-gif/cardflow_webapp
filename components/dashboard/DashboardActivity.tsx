import React from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { FileText } from 'lucide-react';

interface DashboardActivityProps {
  logs: any[];
}

export function DashboardActivity({ logs }: DashboardActivityProps) {
  const recentLogs = (logs || []).slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest">
          Recent Approval Activity
        </h3>
        <span className="text-[10px] font-bold text-slate-400">Showing latest 5</span>
      </div>

      {recentLogs.length > 0 ? (
        <div className="overflow-x-auto border border-slate-150 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                <th className="py-3 px-4">Record Name</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Done By</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {recentLogs.map((log) => {
                const date = log.created_at ? new Date(log.created_at).toLocaleDateString() : '—';
                const actionColor = 
                  log.action?.toLowerCase() === 'approved' ? 'text-emerald-600' :
                  log.action?.toLowerCase() === 'rejected' ? 'text-rose-600' : 'text-blue-600';
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.record_name || 'Roster Record'}</td>
                    <td className={`py-3 px-4 font-extrabold uppercase text-[10px] ${actionColor}`}>
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-bold">{log.done_by_name || log.done_by_email}</td>
                    <td className="py-3 px-4 text-slate-500 font-medium">{date}</td>
                    <td className="py-3 px-4 text-slate-500 font-medium italic max-w-xs truncate" title={log.comment || '—'}>
                      {log.comment || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState 
          title="No activity recorded" 
          description="Verification audits and status actions will be logged here."
          icon={FileText}
        />
      )}
    </div>
  );
}
export type DashboardActivityType = typeof DashboardActivity;
