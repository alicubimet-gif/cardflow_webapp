import React from 'react';
import { DivisionHeader } from './DivisionHeader';
import { DivisionActions } from './DivisionActions';
import { DivisionStaff } from './DivisionStaff';
import { StudentSearch } from './StudentSearch';
import { StudentList } from './StudentList';

interface DivisionDetailsProps {
  classId: string;
  className: string;
  divisionId: string;
  divisionName: string;
  isAdmin: boolean;
  isSchool: boolean;
  staffList: any[];
  allAssignmentsList: any[];
  recordsList: any[];
  recordSearch: string;
  setRecordSearch: (val: string) => void;
  recordFilterStatus: string;
  setRecordFilterStatus: (val: string) => void;
  onBack: () => void;
  onAssignStaff: (id: string) => void;
  onBulkUpload: () => void;
  onAddRecord: () => void;
  onOpenViewRecord: (record: any) => void;
  onOpenEditRecord: (record: any) => void;
  onDeleteRecord: (id: string) => void;
  onSubmitRecord: (id: string) => void;
  onApproveRecord: (id: string) => void;
  onRejectRecord: (id: string) => void;
  onCorrectionRecord: (id: string) => void;
  onViewStaff?: (staff: any) => void;
  templateFields?: any[];
}

export function DivisionDetails({
  classId,
  className,
  divisionId,
  divisionName,
  isAdmin,
  isSchool,
  staffList,
  allAssignmentsList,
  recordsList,
  recordSearch,
  setRecordSearch,
  recordFilterStatus,
  setRecordFilterStatus,
  onBack,
  onAssignStaff,
  onBulkUpload,
  onAddRecord,
  onOpenViewRecord,
  onOpenEditRecord,
  onDeleteRecord,
  onSubmitRecord,
  onApproveRecord,
  onRejectRecord,
  onCorrectionRecord,
  onViewStaff = () => {},
  templateFields = []
}: DivisionDetailsProps) {

  // Filter staff assignments & staff
  const divAssignments = allAssignmentsList.filter(
    a => a.assignment_level === 'division' && String(a.division || a.division_id) === String(divisionId)
  );
  const divStaff = staffList.filter(st => 
    divAssignments.some(a => String(a.staff || a.staff_id) === String(st.id))
  );

  // Filter records belonging to this division
  const filteredRecords = recordsList.filter(rec => {
    const belongs = String(rec.division_id || rec.divId || rec.division) === String(divisionId);
    const name = (rec.name || rec.full_name || rec.student_name || '').toLowerCase();
    const matchSearch = !recordSearch || name.includes(recordSearch.toLowerCase());
    const matchStatus = !recordFilterStatus || (rec.approval_status || 'draft') === recordFilterStatus;
    return belongs && matchSearch && matchStatus;
  });

  return (
    <div className="space-y-[20px] p-[16px] md:p-0 w-full max-w-full overflow-x-hidden">
      {/* Back Navigation Link */}
      <div>
        <button
          onClick={onBack}
          className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer flex items-center gap-1"
        >
          {isAdmin ? `← Back to Class ${className}` : '← Back to Dashboard'}
        </button>
      </div>

      {/* Division Header Card wrapping the layout details and Actions */}
      <DivisionHeader
        divisionName={divisionName}
        className={className}
        staffCount={divStaff.length}
        recordsCount={filteredRecords.length}
      >
        <DivisionActions
          isAdmin={isAdmin}
          onAssignStaff={() => onAssignStaff(divisionId)}
          onBulkUpload={onBulkUpload}
          onAddRecord={onAddRecord}
        />
      </DivisionHeader>

      {/* Division Staff Section */}
      {isAdmin && (
        <div className="bg-white border border-[#DFE4EA] rounded-[16px] p-[20px] shadow-sm">
          <DivisionStaff
            staffList={staffList}
            allAssignmentsList={allAssignmentsList}
            divisionId={divisionId}
            onViewStaff={onViewStaff}
          />
        </div>
      )}

      {/* Records Listing Section with Search & Filter */}
      <div className="space-y-[20px] w-full">
        <StudentSearch
          isSchool={isSchool}
          recordSearch={recordSearch}
          setRecordSearch={setRecordSearch}
          recordFilterStatus={recordFilterStatus}
          setRecordFilterStatus={setRecordFilterStatus}
        />

        <StudentList
          recordsList={filteredRecords}
          isSchool={isSchool}
          isAdmin={isAdmin}
          onAddRecord={onAddRecord}
          onBulkUpload={onBulkUpload}
          onOpenViewRecord={onOpenViewRecord}
          onOpenEditRecord={onOpenEditRecord}
          onDeleteRecord={onDeleteRecord}
          onSubmitRecord={onSubmitRecord}
          onApproveRecord={onApproveRecord}
          onRejectRecord={onRejectRecord}
          onCorrectionRecord={onCorrectionRecord}
          templateFields={templateFields}
        />
      </div>
    </div>
  );
}
