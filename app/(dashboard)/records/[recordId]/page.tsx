'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDashboard } from '@/context/dashboard-context';
import { RecordDetailsPage } from '@/components/records/RecordDetailsPage';
import { Loader2 } from 'lucide-react';
import * as recordService from '@/services/record-service';

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params?.recordId as string;
  const { 
    recordsList, 
    isAdmin, 
    isSchool, 
    handleOpenEditRecord,
    handleApproveRecord,
    handleRejectRecord,
    handleCorrectionRecord,
    handleSubmitRecord,
    resolvedTemplate,
    fetchDashboardData
  } = useDashboard();
  
  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    if (recordsList.length > 0 && recordId) {
      const found = recordsList.find((r: any) => String(r.id) === String(recordId));
      if (found) {
        setRecord(found);
      }
    }
  }, [recordsList, recordId]);

  if (!record) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-white text-slate-500">
        <Loader2 size={24} className="animate-spin text-blue-600 mb-4" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading record details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <RecordDetailsPage
        record={record}
        onBack={() => router.push('/records')}
        isAdmin={isAdmin}
        isSchool={isSchool}
        onEdit={(rec) => {
          handleOpenEditRecord(rec);
        }}
        onApprove={(id) => handleApproveRecord(id, true)}
        onReject={handleRejectRecord}
        onCorrection={handleCorrectionRecord}
        onSubmit={handleSubmitRecord}
        onRefreshRecord={async (id) => {
          const responseData = await recordService.getRecords();
          const refreshedList = Array.isArray(responseData) ? responseData : (responseData?.results ?? []);
          const updated = refreshedList.find((r: any) => String(r.id) === String(id));
          if (updated) setRecord(updated);
          return updated;
        }}
        hasTemplate={resolvedTemplate.has_template}
        templateFields={resolvedTemplate.fields}
      />
    </div>
  );
}
