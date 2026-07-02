import React from 'react';
import { Users, Upload, Plus } from 'lucide-react';
import { RecordList } from '../records/RecordList';

interface DepartmentDetailsProps {
  branchId: string;
  branchName: string;
  departmentId: string;
  departmentName: string;
  isAdmin: boolean;
  isSchool: boolean;
  staffList: any[];
  allAssignmentsList: any[];
  recordsList: any[];
  recordSearch: string;
  setRecordSearch: (val: string) => void;
  recordFilterStatus: string;
  setRecordFilterStatus: (val: string) => void;
  onBack?: () => void;
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
  templateFields?: any[];
  onUpdatePhoto?: (record: any) => void;
}

export function DepartmentDetails({
  branchId,
  branchName,
  departmentId,
  departmentName,
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
  templateFields = [],
  onUpdatePhoto
}: DepartmentDetailsProps) {

  // Filter staff assignments & staff
  const deptAssignments = allAssignmentsList.filter(
    a => a.assignment_level === 'department' && String(a.department || a.department_id) === String(departmentId)
  );
  const deptStaff = staffList.filter(st => 
    deptAssignments.some(a => String(a.staff || a.staff_id) === String(st.id))
  );

  // Filter records belonging to this department
  const filteredRecords = recordsList.filter(rec => {
    const belongs = String(rec.dept_id || rec.deptId || rec.department) === String(departmentId);
    const name = (rec.name || rec.full_name || rec.employee_name || '').toLowerCase();
    const matchSearch = !recordSearch || name.includes(recordSearch.toLowerCase());
    const matchStatus = !recordFilterStatus || (rec.approval_status || 'draft') === recordFilterStatus;
    return belongs && matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1"
          >
            {isAdmin ? `← Back to Branch ${branchName}` : '← Back to Dashboard'}
          </button>
        </div>
      )}

      <div className="bg-white border border-[#DFE4EA] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div>
          <h2 className="text-lg font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>
            Department: {departmentName}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">Parent Branch: {branchName}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => onAssignStaff(departmentId)}
              className="flex items-center justify-center gap-1 px-4 h-10 border border-[#DFE4EA] hover:border-[#2563EB] hover:text-[#2563EB] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Users size={14} />
              Assign Staff
            </button>
          )}
          <button
            onClick={onBulkUpload}
            className="flex items-center justify-center gap-1.5 px-4 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Upload size={14} />
            Bulk Upload
          </button>
          <button
            onClick={onAddRecord}
            className="flex items-center justify-center gap-1.5 px-4 h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Add Record
          </button>
        </div>
      </div>

      {/* Department Staff list */}
      {isAdmin && (
        <div className="bg-white border border-[#DFE4EA] rounded-2xl p-5 space-y-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Department Staff</h3>
          {deptStaff.length === 0 ? (
            <p className="text-xs text-[#64748B] italic">No staff members assigned directly to this department.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {deptStaff.map(st => (
                <span key={st.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-[#DFE4EA] text-[#0B0F19] text-xs font-semibold rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {st.name || st.full_name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Department Records list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B0F19]" style={{ fontFamily: 'Sora' }}>
            Department Employee Records
          </h3>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search employee by name…"
            value={recordSearch}
            onChange={e => setRecordSearch(e.target.value)}
            className="flex-1 h-10 px-4 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={recordFilterStatus}
            onChange={e => setRecordFilterStatus(e.target.value)}
            className="h-10 px-3 border border-[#D1D5DB] rounded-xl bg-white text-sm text-[#64748B] focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="correction_required">Correction Required</option>
          </select>
        </div>

        <RecordList
          recordsList={filteredRecords}
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
