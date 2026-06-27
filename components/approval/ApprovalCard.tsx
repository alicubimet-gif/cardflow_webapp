import React from 'react';

interface ApprovalCardProps {
  log: any;
}

export function ApprovalCard({ log }: ApprovalCardProps) {
  const date = log.created_at ? new Date(log.created_at).toLocaleDateString() : '—';
  const actionColor = log.action?.toLowerCase() === 'approved' ? 'text-[#22C55E]' :
    log.action?.toLowerCase() === 'rejected' ? 'text-[#EF4444]' : 'text-[#2563EB]';

  return (
    <div
      className="bg-white border border-[#DFE4EA] rounded-2xl px-4 py-3 space-y-1.5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#0B0F19]">{log.record_name || 'Roster Record'}</p>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${actionColor}`}>{log.action}</span>
      </div>
      <p className="text-xs text-[#64748B]">By {log.done_by_name || log.done_by_email || '—'} • {date}</p>
      {log.comment && (
        <p className="text-xs text-[#64748B] italic">"{log.comment}"</p>
      )}
    </div>
  );
}
