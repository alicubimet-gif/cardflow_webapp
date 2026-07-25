'use client';
import React from 'react';
import { RecordCard } from './RecordCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useDashboard } from '@/context/dashboard-context';

interface RecordListProps {
  recordsList: any[];
  isSchool?: boolean;
  isOrganization?: boolean;
  onView: (rec: any) => void;
  onEdit: (rec: any) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  isAdmin: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCorrection: (id: string) => void;
  templateFields?: any[];
  onUpdatePhoto?: (rec: any) => void;
}

export function RecordList({
  recordsList,
  isSchool,
  onView,
  onEdit,
  onDelete,
  onSubmit,
  isAdmin,
  onApprove,
  onReject,
  onCorrection,
  templateFields = [],
  onUpdatePhoto
}: RecordListProps) {
  const { loading } = useDashboard();

  // ── Loading Skeleton ──
  if (loading && recordsList.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-[20px] p-5 animate-pulse" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #F1F5F9' }}>
            <div className="flex items-start gap-4">
              <div className="w-[72px] h-[88px] rounded-2xl bg-slate-100 shrink-0" />
              <div className="flex-1 pt-1 space-y-3">
                <div className="h-4 w-40 bg-slate-200 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-slate-100 rounded-md" />
                  <div className="h-3 w-32 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="h-7 w-24 bg-slate-100 rounded-xl shrink-0" />
            </div>
            <div className="h-px bg-slate-100 my-4" />
            <div className="flex gap-2">
              <div className="flex-1 h-11 bg-slate-100 rounded-2xl" />
              <div className="flex-1 h-11 bg-slate-100 rounded-2xl" />
              <div className="flex-1 h-11 bg-slate-100 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recordsList.length === 0) {
    return (
      <EmptyState
        title="No records found"
        description="Roster database is empty or no records match your filter criteria."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {recordsList.map((rec) => (
        <RecordCard
          key={rec.id}
          record={rec}
          isSchool={Boolean(isSchool)}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onSubmit={onSubmit}
          isAdmin={isAdmin}
          onApprove={onApprove}
          onReject={onReject}
          onCorrection={onCorrection}
          onUpdatePhoto={onUpdatePhoto}
          templateFields={templateFields}
        />
      ))}
    </div>
  );
}
export type RecordListType = typeof RecordList;
