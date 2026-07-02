import React from 'react';
import { Plus } from 'lucide-react';
import { RecordList } from '../records/RecordList';
import { EmptyState } from './EmptyState';

interface StudentListProps {
  recordsList: any[];
  isSchool: boolean;
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

export function StudentList({
  recordsList,
  isSchool,
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
}: StudentListProps) {
  
  if (recordsList.length === 0) {
    return (
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 
            className="text-[16px] font-semibold text-[#0B0F19]" 
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            {isSchool ? 'Student Records' : 'Employee Records'} ({recordsList.length})
          </h3>
        </div>
        <EmptyState
          isSchool={isSchool}
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
          className="text-[16px] font-semibold text-[#0B0F19]" 
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          {isSchool ? 'Student Records' : 'Employee Records'} ({recordsList.length})
        </h3>
        
        {/* Action Button: + Add Record */}
        <button
          onClick={onAddRecord}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 h-[40px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Record</span>
        </button>
      </div>

      {/* Record cards grid / table list */}
      <div className="w-full overflow-hidden">
        <RecordList
          recordsList={recordsList}
          isSchool={isSchool}
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
