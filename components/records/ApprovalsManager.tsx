'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/context/dashboard-context';
import { AuthApi, RecordApi, GroupApi, SubgroupApi, ClassesApi, UserApi, OrganizationApi, DashboardApi, ApprovalLogsApi } from '@/api';
import { RecordList } from './RecordList';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export function ApprovalsManager() {
  const { user } = useAuth();
  const { 
    isOrganization, isAdmin,
    handleOpenEditRecord, handleDeleteRecord, handleSubmitRecord,
    handleApproveRecord, handleRejectRecord, handleCorrectionRecord,
    requiredFields, fetchDashboardData
  } = useDashboard();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await RecordApi.getApprovals({
        approval_status: activeTab,
        search: search
      });
      setRecords(data);
    } catch (err) {
      console.error(err);
      toast('Failed to fetch approvals data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, toast]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const onApprove = async (id: string) => {
    await handleApproveRecord(id);
    fetchApprovals();
    fetchDashboardData();
  };

  const onReject = async (id: string) => {
    await handleRejectRecord(id);
    fetchApprovals();
    fetchDashboardData();
  };

  const tabs = [
    { id: 'pending', label: 'Pending Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-[24px] border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header & Tabs */}
      <div className="border-b border-slate-200/60 bg-slate-50/50 p-6 space-y-5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0B0F19] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search records or cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 min-h-0 p-6 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[20px] p-5 animate-pulse" style={{ border: '1px solid #F1F5F9' }}>
                <div className="flex items-start gap-4">
                  <div className="w-[72px] h-[88px] rounded-2xl bg-slate-100 shrink-0" />
                  <div className="flex-1 pt-1 space-y-3">
                    <div className="h-4 w-40 bg-slate-200 rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-slate-100 rounded-md" />
                      <div className="h-3 w-32 bg-slate-100 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <RecordList
            recordsList={records}
            isOrganization={isOrganization}
            onView={() => {}}
            onEdit={handleOpenEditRecord}
            onDelete={handleDeleteRecord}
            onSubmit={handleSubmitRecord}
            isAdmin={isAdmin}
            onApprove={onApprove}
            onReject={onReject}
            onCorrection={handleCorrectionRecord}
            templateFields={requiredFields}
          />
        )}
      </div>
    </div>
  );
}
