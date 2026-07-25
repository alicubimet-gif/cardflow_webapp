'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDashboard } from '@/context/dashboard-context';
import { RecordForm } from '@/components/records/RecordForm';
import { Loader2 } from 'lucide-react';
import * as recordService from '@/services/record-service';

export default function EditClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = searchParams.get('groupId');
  const subgroupId = searchParams.get('subgroupId');
  const recordId = searchParams.get('recordId');
  
  const { 
    recordsList, 
    setRecordsList,
    isOrganization,
    groupsList,
    subgroupsList,
    resolvedTemplate,
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

  if (!groupId || !subgroupId || !recordId) {
    return <div className="p-6 text-sm text-slate-600">Invalid route parameters.</div>;
  }

  if (!record) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-white text-slate-500">
        <Loader2 size={24} className="animate-spin text-blue-600 mb-4" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading record details...</p>
      </div>
    );
  }

  const handleSave = async (updatedData: any) => {
    const data = await recordService.updateRecord(record.id, updatedData);
    setRecordsList((prev: any[]) => prev.map((r: any) => String(r.id) === String(record.id) ? data : r));
    router.push(`/groups/record?groupId=${encodeURIComponent(groupId)}&subgroupId=${encodeURIComponent(subgroupId)}&recordId=${encodeURIComponent(record.id)}`);
  };

  return (
    <div className="space-y-5">
      <RecordForm
        isOpen={true}
        onClose={() => router.push(`/groups/record?groupId=${encodeURIComponent(groupId)}&subgroupId=${encodeURIComponent(subgroupId)}&recordId=${encodeURIComponent(record.id)}`)}
        onSubmit={handleSave}
        editingRecord={record}
        requiredFields={resolvedTemplate?.fields || []}
        isOrganization={isOrganization}
        groupsList={groupsList}
        subgroupsList={subgroupsList}
      />
    </div>
  );
}
