import React from 'react';
import { FileText } from 'lucide-react';
import { ApprovalCard } from './ApprovalCard';

interface ApprovalListProps {
  logsList: any[];
  isLoading: boolean;
}

export function ApprovalList({ logsList, isLoading }: ApprovalListProps) {
  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
    </div>
  );
  
  if (logsList.length === 0) return (
    <div className="bg-white border border-[#DFE4EA] rounded-2xl p-10 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <FileText className="mx-auto mb-3 text-[#64748B]" size={32} />
      <p className="text-[#64748B] text-sm font-medium">No approval activity yet</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {logsList.map((log, i) => (
        <ApprovalCard key={log.id || i} log={log} />
      ))}
    </div>
  );
}
