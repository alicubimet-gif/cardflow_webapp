import React from 'react';
import { SubgroupHeader } from './SubgroupHeader';
import { SubgroupActions } from './SubgroupActions';
import { SubgroupUsers } from './SubgroupUsers';
import { RecordSearch } from './RecordSearch';
import { SubgroupRecordList } from './RecordList';
import { exportRecordsToExcel } from '@/utils/excelExport';
import { useToast } from '@/hooks/useToast';

import { useOrgLabels } from '@/hooks/useOrgLabels';
import { useAuth } from '@/context/auth-context';

interface SubgroupDetailsProps {
  groupId: string;
  groupName: string;
  subgroupId: string;
  subgroupName: string;
  isAdmin: boolean;
  isOrganization: boolean;
  userList: any[];
  allAssignmentsList: any[];
  recordsList: any[];
  recordSearch: string;
  setRecordSearch: (val: string) => void;
  recordFilterStatus: string;
  setRecordFilterStatus: (val: string) => void;
  onBack?: () => void;
  onAssignUser: (id: string) => void;
  onBulkUpload: () => void;
  onAddRecord: () => void;
  onOpenViewRecord: (record: any) => void;
  onOpenEditRecord: (record: any) => void;
  onDeleteRecord: (id: string) => void;
  onSubmitRecord: (id: string) => void;
  onApproveRecord: (id: string) => void;
  onRejectRecord: (id: string) => void;
  onCorrectionRecord: (id: string) => void;
  onViewUser?: (user: any) => void;
  templateFields?: any[];
  onUpdatePhoto?: (record: any) => void;
}

export function SubgroupDetails({
  groupName,
  subgroupId,
  subgroupName,
  isAdmin,
  isOrganization,
  userList,
  allAssignmentsList,
  recordsList,
  recordSearch,
  setRecordSearch,
  recordFilterStatus,
  setRecordFilterStatus,
  onBack,
  onAssignUser,
  onBulkUpload,
  onAddRecord,
  onOpenViewRecord,
  onOpenEditRecord,
  onDeleteRecord,
  onSubmitRecord,
  onApproveRecord,
  onRejectRecord,
  onCorrectionRecord,
  onViewUser = () => {},
  templateFields = [],
  onUpdatePhoto
}: SubgroupDetailsProps) {
  
  const { user } = useAuth();
  const { groupLabel, subgroupLabel } = useOrgLabels(user?.organization_type);
  const { toast } = useToast();

  // Filter user assignments & user
  const divAssignments = allAssignmentsList.filter(
    a => ['subgroup', 'division', 'department'].includes(a.assignment_level) &&
      String(a.subgroup?.id || a.subgroup || a.subgroup_id || a.division?.id || a.division || a.division_id || a.department?.id || a.department || a.department_id) === String(subgroupId)
  );
  const divUser = userList.filter(st => 
    divAssignments.some(a => String(a.user || a.user_id) === String(st.id))
  );

  // Filter records belonging to this subgroup
  const filteredRecords = recordsList.filter(rec => {
    const belongs = String(rec.sub_group || rec.subgroup?.id || rec.subgroup_id || rec.subgroup || rec.divId || rec.division?.id || rec.division_id || rec.division || rec.department?.id || rec.department_id || rec.department) === String(subgroupId);
    const name = (rec.name || rec.full_name || rec.record_name || rec.data?.name || rec.data?.full_name || '').toLowerCase();
    const matchSearch = !recordSearch || name.includes(recordSearch.toLowerCase());
    const matchStatus = !recordFilterStatus || (rec.approval_status || 'draft') === recordFilterStatus;
    return belongs && matchSearch && matchStatus;
  });

  const handleExport = () => {
    try {
      exportRecordsToExcel(filteredRecords, templateFields);
      toast("Exported to Excel successfully.", "success");
    } catch (err) {
      console.error("Excel export error:", err);
      toast(err instanceof Error ? err.message : "Failed to export to Excel.", "error");
    }
  };

  return (
    <div className="space-y-[20px] p-[16px] md:p-0 w-full max-w-full overflow-x-hidden">

      {/* Subgroup Header Card wrapping the layout details and Actions */}
      <SubgroupHeader
        subgroupName={subgroupName}
        groupName={groupName}
        userCount={divUser.length}
        recordsCount={filteredRecords.length}
      >
        <SubgroupActions
          isAdmin={isAdmin}
          onAssignUser={() => onAssignUser(subgroupId)}
          onBulkUpload={onBulkUpload}
          onAddRecord={onAddRecord}
          onExport={handleExport}
        />
      </SubgroupHeader>

      {/* Subgroup User Section */}
      {isAdmin && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs">
          <SubgroupUsers
            userList={userList}
            allAssignmentsList={allAssignmentsList}
            subgroupId={subgroupId}
            onViewUser={onViewUser}
          />
        </div>
      )}

      {/* Records Listing Section with Search & Filter */}
      <div className="space-y-[20px] w-full">
        <RecordSearch
          isOrganization={isOrganization}
          recordSearch={recordSearch}
          setRecordSearch={setRecordSearch}
          recordFilterStatus={recordFilterStatus}
          setRecordFilterStatus={setRecordFilterStatus}
        />

        <SubgroupRecordList
          recordsList={filteredRecords}
          isOrganization={isOrganization}
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
          onUpdatePhoto={onUpdatePhoto}
        />
      </div>
    </div>
  );
}
