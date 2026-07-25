import React from 'react';
import { Plus } from 'lucide-react';
import { RecordList } from '../records/RecordList';
import { EmptyState } from './EmptyState';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';

interface RecordListProps {
  recordsList: any[];
  isOrganization: boolean;
  isAdmin: boolean;
  onAddRecord: () => void;
  onBulkUpload: () => void;
  onOpenViewRecord: (record: any) => void;
  onOpenEditRecord: (record: any) => void;
  onDeleteRecord: (id: string) => void;
  onSubmitRecord: (id: string) => void;
  onApproveRecord: (id: string) => void;
  onRejectRecord: (id: string) => void;
  onCorrectionRecord: (id: string) => void;
  templateFields?: any[];
  onUpdatePhoto?: (rec: any) => void;
}

export function SubgroupRecordList({
  recordsList,
  isOrganization,
  isAdmin,
  onAddRecord,
  onBulkUpload,
  onOpenViewRecord,
  onOpenEditRecord,
  onDeleteRecord,
  onSubmitRecord,
  onApproveRecord,
  onRejectRecord,
  onCorrectionRecord,
  templateFields = [],
  onUpdatePhoto
}: RecordListProps) {
  const { user } = useAuth();
  const { recordLabel } = useOrgLabels(user?.organization_type);
    
  if (recordsList.length === 0) {
    return (
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 
            className="text-base font-semibold text-slate-800" 
            style={{ fontFamily: 'Sora' }}
          >
            {recordLabel}s ({recordsList.length})
          </h3>
        </div>
        <EmptyState
          isOrganization={isOrganization}
          onAddRecord={onAddRecord}
          onBulkUpload={onBulkUpload}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Records Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 
          className="text-base font-semibold text-slate-800" 
          style={{ fontFamily: 'Sora' }}
        >
          {recordLabel}s ({recordsList.length})
        </h3>
        
        {/* Action Button: + Add Record */}
        <button
          onClick={onAddRecord}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
        >
          <Plus size={14} />
          <span>Add {recordLabel}</span>
        </button>
      </div>

      {/* Record cards grid / table list */}
      <div className="w-full overflow-hidden">
        <RecordList
          recordsList={recordsList}
          isOrganization={isOrganization}
          onView={onOpenViewRecord}
          onEdit={onOpenEditRecord}
          onDelete={onDeleteRecord}
          onSubmit={onSubmitRecord}
          isAdmin={isAdmin}
          onApprove={onApproveRecord}
          onReject={onRejectRecord}
          onCorrection={onCorrectionRecord}
          templateFields={templateFields}
          onUpdatePhoto={onUpdatePhoto}
        />
      </div>
    </div>
  );
}
