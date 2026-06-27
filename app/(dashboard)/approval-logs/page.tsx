'use client';

import React from 'react';
import { useDashboard } from '@/context/dashboard-context';
import { ApprovalLogsList } from '@/components/records/ApprovalLogsList';

export default function ApprovalLogsPage() {
  const { logsList, isAdmin } = useDashboard();

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
        <h3 className="font-bold text-sm">Access Denied</h3>
        <p className="text-xs text-red-600 mt-1">
          Only Organization Admins are permitted to access Approval Logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>Approval Logs</h2>
      <ApprovalLogsList logsList={logsList} />
    </div>
  );
}
