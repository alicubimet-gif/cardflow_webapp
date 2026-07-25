'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { ApprovalsManager } from '@/components/records/ApprovalsManager';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const allowedRoles = ['ORGANIZATION_ADMIN', 'organization_admin', 'ORGANIZATION_STAFF', 'organization_staff', 'SUPER_ADMIN', 'SUBSCRIBER_ADMIN'];
  const hasAccess = allowedRoles.includes(user?.role || '');

  if (!hasAccess) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
        <h3 className="font-bold text-sm">Access Denied</h3>
        <p className="text-xs text-red-600 mt-1">
          Only Organization Admins and Staff are permitted to access Approvals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex-shrink-0">
        <h2 className="text-base font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>Approvals Management</h2>
        <p className="text-xs text-slate-500 mt-1">Manage pending, approved, and rejected cards.</p>
      </div>
      <div className="flex-grow min-h-0 overflow-y-auto">
        <ApprovalsManager />
      </div>
    </div>
  );
}
