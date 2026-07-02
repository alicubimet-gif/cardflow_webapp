'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/context/dashboard-context';
import { Briefcase, X, Loader2, AlertCircle } from 'lucide-react';
import { AuthService } from '@/services/auth-service';

// Subcomponents
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { DivisionDetails } from '@/components/division/DivisionDetails';
import { DepartmentDetails } from '@/components/department/DepartmentDetails';

// Modals & overlays
import { AddRecordModal } from '@/components/records/AddRecordModal';
import { BulkUploadModal } from '@/components/records/BulkUploadModal';
import { RecordForm } from '@/components/records/RecordForm';
import { PhotoEditorModal } from '@/components/records/PhotoEditorModal';
import { IdCardPreview } from '@/components/records/IdCardPreview';

export default function DashboardPage() {
  const user = useAuth().user;
  const router = useRouter();
  const {
    stats,
    classesList,
    branchesList,
    divisionsList,
    departmentsList,
    staffList,
    recordsList,
    logsList,
    allAssignmentsList,
    orgName,
    loading,
    isAdmin,
    isSchool,
    resolvedTemplate,
    activeClassId,
    setActiveClassId,
    activeDivisionId,
    setActiveDivisionId,
    activeBranchId,
    setActiveBranchId,
    activeDepartmentId,
    setActiveDepartmentId,
    recordSearch,
    setRecordSearch,
    recordFilterStatus,
    setRecordFilterStatus,
    setIsBulkUploadModalOpen,
    isBulkUploadModalOpen,
    handleOpenCreateRecord,
    handleOpenEditRecord,
    fetchDashboardData,
    handleDeleteRecord,
    handleSubmitRecord,
    handleApproveRecord,
    handleRejectRecord,
    handleCorrectionRecord,
    handleOpenView,
    renderBlockade,

    // Modals
    isAddRecordModalOpen,
    setIsAddRecordModalOpen,
    dynamicFieldsList,
    handleSaveRecord,
    isRecordModalOpen,
    setIsRecordModalOpen,
    editingRecord
  } = useDashboard();

  if (!user) return null;

  // Local states for custom teacher features
  const [editingPhotoRecord, setEditingPhotoRecord] = useState<any | null>(null);
  const [viewingPreviewRecord, setViewingPreviewRecord] = useState<any | null>(null);
  const [cardPreviewData, setCardPreviewData] = useState<any | null>(null);
  const [cardPreviewLoading, setCardPreviewLoading] = useState(false);
  const [cardPreviewError, setCardPreviewError] = useState<string | null>(null);

  // Auto-fit routing navigation depth on initialization for non-admins (Case 1, Case 2, Case 3)
  useEffect(() => {
    if (!isAdmin && isSchool && classesList.length > 0 && divisionsList.length > 0) {
      if (classesList.length === 1 && divisionsList.length === 1) {
        if (activeClassId !== String(classesList[0].id)) {
          setActiveClassId(String(classesList[0].id));
        }
        if (activeDivisionId !== String(divisionsList[0].id)) {
          setActiveDivisionId(String(divisionsList[0].id));
        }
      } else if (classesList.length === 1 && divisionsList.length > 1) {
        if (activeClassId !== String(classesList[0].id)) {
          setActiveClassId(String(classesList[0].id));
        }
      }
    }
  }, [isAdmin, isSchool, classesList, divisionsList, activeClassId, activeDivisionId, setActiveClassId, setActiveDivisionId]);

  useEffect(() => {
    if (!isAdmin && !isSchool && branchesList.length > 0 && departmentsList.length > 0) {
      if (branchesList.length === 1 && departmentsList.length === 1) {
        if (activeBranchId !== String(branchesList[0].id)) {
          setActiveBranchId(String(branchesList[0].id));
        }
        if (activeDepartmentId !== String(departmentsList[0].id)) {
          setActiveDepartmentId(String(departmentsList[0].id));
        }
      } else if (branchesList.length === 1 && departmentsList.length > 1) {
        if (activeBranchId !== String(branchesList[0].id)) {
          setActiveBranchId(String(branchesList[0].id));
        }
      }
    }
  }, [isAdmin, isSchool, branchesList, departmentsList, activeBranchId, activeDepartmentId, setActiveBranchId, setActiveDepartmentId]);

  // Load preview details for the preview record modal
  useEffect(() => {
    if (!viewingPreviewRecord) {
      setCardPreviewData(null);
      setCardPreviewError(null);
      return;
    }
    const loadPreview = async () => {
      setCardPreviewLoading(true);
      setCardPreviewError(null);
      try {
        const recordType = viewingPreviewRecord.record_type || (isSchool ? 'student' : 'employee');
        const mappedType = recordType === 'staff' ? 'school-staff' : recordType;
        const data = await AuthService.getCardPreview(mappedType as any, viewingPreviewRecord.id);
        setCardPreviewData(data);
        if (!data || !data.template_version) {
          setCardPreviewError('No template assigned.');
        }
      } catch (err: any) {
        console.error('[CardPreview] Failed to load card preview:', err);
        if (err?.response?.status === 404) {
          setCardPreviewError('Record not found.');
        } else {
          setCardPreviewError('No template assigned.');
        }
      } finally {
        setCardPreviewLoading(false);
      }
    };
    loadPreview();
  }, [viewingPreviewRecord, isSchool]);

  const getClassName = (id: string | null) => id ? (classesList.find(c => String(c.id) === String(id))?.name || '—') : '—';
  const getDivName = (id: string | null) => id ? (divisionsList.find(d => String(d.id) === String(id))?.name || '—') : '—';
  const getBranchName = (id: string | null) => id ? (branchesList.find(b => String(b.id) === String(id))?.name || '—') : '—';
  const getDeptName = (id: string | null) => id ? (departmentsList.find(d => String(d.id) === String(id))?.name || '—') : '—';

  const renderSchoolOperator = () => {
    if (classesList.length === 1 && divisionsList.length === 1) {
      // Case 1 – Single Division Assigned
      if (!resolvedTemplate.has_template) {
        return renderBlockade();
      }
      return (
        <DivisionDetails
          classId={activeClassId!}
          className={getClassName(activeClassId)}
          divisionId={activeDivisionId!}
          divisionName={getDivName(activeDivisionId)}
          isAdmin={false}
          isSchool={true}
          staffList={staffList}
          allAssignmentsList={allAssignmentsList}
          recordsList={recordsList}
          recordSearch={recordSearch}
          setRecordSearch={setRecordSearch}
          recordFilterStatus={recordFilterStatus}
          setRecordFilterStatus={setRecordFilterStatus}
          onBack={undefined}
          onAssignStaff={() => {}}
          onBulkUpload={() => setIsBulkUploadModalOpen(true)}
          onAddRecord={handleOpenCreateRecord}
          onOpenViewRecord={(record) => {
            setViewingPreviewRecord(record);
          }}
          onOpenEditRecord={handleOpenEditRecord}
          onDeleteRecord={handleDeleteRecord}
          onSubmitRecord={handleSubmitRecord}
          onApproveRecord={handleApproveRecord}
          onRejectRecord={handleRejectRecord}
          onCorrectionRecord={handleCorrectionRecord}
          onViewStaff={(st) => router.push(`/staff/${st.id}`)}
          templateFields={resolvedTemplate.fields}
          onUpdatePhoto={(rec) => setEditingPhotoRecord(rec)}
        />
      );
    }

    if (classesList.length === 1 && divisionsList.length > 1) {
      // Case 2 – Single Class Assigned (multiple divisions)
      if (!activeDivisionId) {
        return (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">
              Divisions in Class {getClassName(activeClassId)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {divisionsList
                .filter(d => String(d.school_class || d.classId || d.class_id) === String(activeClassId))
                .map(div => (
                  <div
                    key={div.id}
                    onClick={() => setActiveDivisionId(String(div.id))}
                    className="bg-white border border-[#DFE4EA] hover:border-[#2563EB] cursor-pointer rounded-2xl p-5 flex items-center justify-between transition-all shadow-sm"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Division Level
                      </span>
                      <h3 className="text-sm font-bold text-[#0B0F19] mt-2" style={{ fontFamily: 'Sora' }}>
                        Division {div.name}
                      </h3>
                    </div>
                    <Briefcase className="text-[#64748B] opacity-40" size={20} />
                  </div>
                ))}
            </div>
          </div>
        );
      }

      if (!resolvedTemplate.has_template) {
        return renderBlockade(() => setActiveDivisionId(null));
      }

      return (
        <DivisionDetails
          classId={activeClassId!}
          className={getClassName(activeClassId)}
          divisionId={activeDivisionId}
          divisionName={getDivName(activeDivisionId)}
          isAdmin={false}
          isSchool={true}
          staffList={staffList}
          allAssignmentsList={allAssignmentsList}
          recordsList={recordsList}
          recordSearch={recordSearch}
          setRecordSearch={setRecordSearch}
          recordFilterStatus={recordFilterStatus}
          setRecordFilterStatus={setRecordFilterStatus}
          onBack={() => setActiveDivisionId(null)}
          onAssignStaff={() => {}}
          onBulkUpload={() => setIsBulkUploadModalOpen(true)}
          onAddRecord={handleOpenCreateRecord}
          onOpenViewRecord={(record) => {
            setViewingPreviewRecord(record);
          }}
          onOpenEditRecord={handleOpenEditRecord}
          onDeleteRecord={handleDeleteRecord}
          onSubmitRecord={handleSubmitRecord}
          onApproveRecord={handleApproveRecord}
          onRejectRecord={handleRejectRecord}
          onCorrectionRecord={handleCorrectionRecord}
          onViewStaff={(st) => router.push(`/staff/${st.id}`)}
          templateFields={resolvedTemplate.fields}
          onUpdatePhoto={(rec) => setEditingPhotoRecord(rec)}
        />
      );
    }

    // Case 3 – Multiple Classes Assigned
    if (!activeClassId) {
      return (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">
            My Assigned Classes
          </h2>
          {classesList.length === 0 ? (
            <div className="bg-white border border-[#DFE4EA] rounded-2xl p-8 text-center shadow-sm">
              <Briefcase className="mx-auto mb-3 text-[#64748B]" size={36} />
              <p className="text-[#0B0F19] font-semibold mb-1">No Classes Assigned</p>
              <p className="text-sm text-[#64748B]">You are not currently assigned to any classes or divisions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classesList.map(c => (
                <div
                  key={c.id}
                  onClick={() => setActiveClassId(String(c.id))}
                  className="bg-white border border-[#DFE4EA] hover:border-[#2563EB] cursor-pointer rounded-2xl p-5 flex items-center justify-between transition-all shadow-sm"
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Class Level
                    </span>
                    <h3 className="text-sm font-bold text-[#0B0F19] mt-2" style={{ fontFamily: 'Sora' }}>
                      {c.name}
                    </h3>
                  </div>
                  <Briefcase className="text-[#64748B] opacity-40" size={20} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (!activeDivisionId) {
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveClassId(null)}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1"
            >
              ← Back to Classes
            </button>
          </div>

          <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">
            Divisions in Class {getClassName(activeClassId)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {divisionsList
              .filter(d => String(d.school_class || d.classId || d.class_id) === String(activeClassId))
              .map(div => (
                <div
                  key={div.id}
                  onClick={() => setActiveDivisionId(String(div.id))}
                  className="bg-white border border-[#DFE4EA] hover:border-[#2563EB] cursor-pointer rounded-2xl p-5 flex items-center justify-between transition-all shadow-sm"
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Division Level
                    </span>
                    <h3 className="text-sm font-bold text-[#0B0F19] mt-2" style={{ fontFamily: 'Sora' }}>
                      Division {div.name}
                    </h3>
                  </div>
                  <Briefcase className="text-[#64748B] opacity-40" size={20} />
                </div>
              ))}
          </div>
        </div>
      );
    }

    if (!resolvedTemplate.has_template) {
      return renderBlockade(() => setActiveDivisionId(null));
    }

    return (
      <DivisionDetails
        classId={activeClassId!}
        className={getClassName(activeClassId)}
        divisionId={activeDivisionId}
        divisionName={getDivName(activeDivisionId)}
        isAdmin={false}
        isSchool={true}
        staffList={staffList}
        allAssignmentsList={allAssignmentsList}
        recordsList={recordsList}
        recordSearch={recordSearch}
        setRecordSearch={setRecordSearch}
        recordFilterStatus={recordFilterStatus}
        setRecordFilterStatus={setRecordFilterStatus}
        onBack={() => setActiveDivisionId(null)}
        onAssignStaff={() => {}}
        onBulkUpload={() => setIsBulkUploadModalOpen(true)}
        onAddRecord={handleOpenCreateRecord}
        onOpenViewRecord={(record) => {
          setViewingPreviewRecord(record);
        }}
        onOpenEditRecord={handleOpenEditRecord}
        onDeleteRecord={handleDeleteRecord}
        onSubmitRecord={handleSubmitRecord}
        onApproveRecord={handleApproveRecord}
        onRejectRecord={handleRejectRecord}
        onCorrectionRecord={handleCorrectionRecord}
        onViewStaff={(st) => router.push(`/staff/${st.id}`)}
        templateFields={resolvedTemplate.fields}
        onUpdatePhoto={(rec) => setEditingPhotoRecord(rec)}
      />
    );
  };

  const renderCorporateOperator = () => {
    if (branchesList.length === 1 && departmentsList.length === 1) {
      // Case 1 - Single Department
      if (!resolvedTemplate.has_template) {
        return renderBlockade();
      }
      return (
        <DepartmentDetails
          branchId={activeBranchId!}
          branchName={getBranchName(activeBranchId)}
          departmentId={activeDepartmentId!}
          departmentName={getDeptName(activeDepartmentId)}
          isAdmin={false}
          isSchool={false}
          staffList={staffList}
          allAssignmentsList={allAssignmentsList}
          recordsList={recordsList}
          recordSearch={recordSearch}
          setRecordSearch={setRecordSearch}
          recordFilterStatus={recordFilterStatus}
          setRecordFilterStatus={setRecordFilterStatus}
          onBack={undefined}
          onAssignStaff={() => {}}
          onBulkUpload={() => setIsBulkUploadModalOpen(true)}
          onAddRecord={handleOpenCreateRecord}
          onOpenViewRecord={(record) => {
            setViewingPreviewRecord(record);
          }}
          onOpenEditRecord={handleOpenEditRecord}
          onDeleteRecord={handleDeleteRecord}
          onSubmitRecord={handleSubmitRecord}
          onApproveRecord={handleApproveRecord}
          onRejectRecord={handleRejectRecord}
          onCorrectionRecord={handleCorrectionRecord}
          templateFields={resolvedTemplate.fields}
          onUpdatePhoto={(rec) => setEditingPhotoRecord(rec)}
        />
      );
    }

    if (branchesList.length === 1 && departmentsList.length > 1) {
      // Case 2 - Single Branch (multiple departments)
      if (!activeDepartmentId) {
        return (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">
              Departments in Branch {getBranchName(activeBranchId)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departmentsList
                .filter(dept => String(dept.branch || dept.branchId || dept.branch_id) === String(activeBranchId))
                .map(dept => (
                  <div
                    key={dept.id}
                    onClick={() => setActiveDepartmentId(String(dept.id))}
                    className="bg-white border border-[#DFE4EA] hover:border-[#2563EB] cursor-pointer rounded-2xl p-5 flex items-center justify-between transition-all shadow-sm"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Department Section
                      </span>
                      <h3 className="text-sm font-bold text-[#0B0F19] mt-2" style={{ fontFamily: 'Sora' }}>
                        {dept.name}
                      </h3>
                    </div>
                    <Briefcase className="text-[#64748B] opacity-40" size={20} />
                  </div>
                ))}
            </div>
          </div>
        );
      }

      if (!resolvedTemplate.has_template) {
        return renderBlockade(() => setActiveDepartmentId(null));
      }

      return (
        <DepartmentDetails
          branchId={activeBranchId!}
          branchName={getBranchName(activeBranchId)}
          departmentId={activeDepartmentId}
          departmentName={getDeptName(activeDepartmentId)}
          isAdmin={false}
          isSchool={false}
          staffList={staffList}
          allAssignmentsList={allAssignmentsList}
          recordsList={recordsList}
          recordSearch={recordSearch}
          setRecordSearch={setRecordSearch}
          recordFilterStatus={recordFilterStatus}
          setRecordFilterStatus={setRecordFilterStatus}
          onBack={() => setActiveDepartmentId(null)}
          onAssignStaff={() => {}}
          onBulkUpload={() => setIsBulkUploadModalOpen(true)}
          onAddRecord={handleOpenCreateRecord}
          onOpenViewRecord={(record) => {
            setViewingPreviewRecord(record);
          }}
          onOpenEditRecord={handleOpenEditRecord}
          onDeleteRecord={handleDeleteRecord}
          onSubmitRecord={handleSubmitRecord}
          onApproveRecord={handleApproveRecord}
          onRejectRecord={handleRejectRecord}
          onCorrectionRecord={handleCorrectionRecord}
          templateFields={resolvedTemplate.fields}
          onUpdatePhoto={(rec) => setEditingPhotoRecord(rec)}
        />
      );
    }

    // Case 3 - Multiple Branches
    if (!activeBranchId) {
      return (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">
            My Assigned Branches
          </h2>
          {branchesList.length === 0 ? (
            <div className="bg-white border border-[#DFE4EA] rounded-2xl p-8 text-center shadow-sm">
              <Briefcase className="mx-auto mb-3 text-[#64748B]" size={36} />
              <p className="text-[#0B0F19] font-semibold mb-1">No Branches Assigned</p>
              <p className="text-sm text-[#64748B]">You are not currently assigned to any branches or departments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branchesList.map(b => (
                <div
                  key={b.id}
                  onClick={() => setActiveBranchId(String(b.id))}
                  className="bg-white border border-[#DFE4EA] hover:border-[#2563EB] cursor-pointer rounded-2xl p-5 flex items-center justify-between transition-all shadow-sm"
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Branch Location
                    </span>
                    <h3 className="text-sm font-bold text-[#0B0F19] mt-2" style={{ fontFamily: 'Sora' }}>
                      {b.name}
                    </h3>
                  </div>
                  <Briefcase className="text-[#64748B] opacity-40" size={20} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (!activeDepartmentId) {
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveBranchId(null)}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1"
            >
              ← Back to Branches
            </button>
          </div>

          <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">
            Departments in Branch {getBranchName(activeBranchId)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departmentsList
              .filter(dept => String(dept.branch || dept.branchId || dept.branch_id) === String(activeBranchId))
              .map(dept => (
                <div
                  key={dept.id}
                  onClick={() => setActiveDepartmentId(String(dept.id))}
                  className="bg-white border border-[#DFE4EA] hover:border-[#2563EB] cursor-pointer rounded-2xl p-5 flex items-center justify-between transition-all shadow-sm"
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Department Section
                    </span>
                    <h3 className="text-sm font-bold text-[#0B0F19] mt-2" style={{ fontFamily: 'Sora' }}>
                      {dept.name}
                    </h3>
                  </div>
                  <Briefcase className="text-[#64748B] opacity-40" size={20} />
                </div>
              ))}
          </div>
        </div>
      );
    }

    if (!resolvedTemplate.has_template) {
      return renderBlockade(() => setActiveDepartmentId(null));
    }

    return (
      <DepartmentDetails
        branchId={activeBranchId!}
        branchName={getBranchName(activeBranchId)}
        departmentId={activeDepartmentId}
        departmentName={getDeptName(activeDepartmentId)}
        isAdmin={false}
        isSchool={false}
        staffList={staffList}
        allAssignmentsList={allAssignmentsList}
        recordsList={recordsList}
        recordSearch={recordSearch}
        setRecordSearch={setRecordSearch}
        recordFilterStatus={recordFilterStatus}
        setRecordFilterStatus={setRecordFilterStatus}
        onBack={() => setActiveDepartmentId(null)}
        onAssignStaff={() => {}}
        onBulkUpload={() => setIsBulkUploadModalOpen(true)}
        onAddRecord={handleOpenCreateRecord}
        onOpenViewRecord={(record) => {
          setViewingPreviewRecord(record);
        }}
        onOpenEditRecord={handleOpenEditRecord}
        onDeleteRecord={handleDeleteRecord}
        onSubmitRecord={handleSubmitRecord}
        onApproveRecord={handleApproveRecord}
        onRejectRecord={handleRejectRecord}
        onCorrectionRecord={handleCorrectionRecord}
        templateFields={resolvedTemplate.fields}
        onUpdatePhoto={(rec) => setEditingPhotoRecord(rec)}
      />
    );
  };

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <div className="space-y-5">
          <DashboardStats
            isSchool={isSchool}
            classesCount={classesList.length}
            branchesCount={branchesList.length}
            divisionsCount={divisionsList.length}
            departmentsCount={departmentsList.length}
            staffCount={staffList.length}
            stats={stats}
          />
          <DashboardCards
            user={user}
            orgName={orgName}
            isSchool={isSchool}
            recordsList={recordsList}
            logsList={logsList}
            loading={loading}
            onNavigateToSetup={() => router.push('/records')}
            onOpenBulkUpload={() => setIsBulkUploadModalOpen(true)}
            onOpenViewRecord={(record) => router.push(`/records/${record.id}`)}
            hasTemplate={resolvedTemplate.has_template}
          />
        </div>
      ) : (
        isSchool ? renderSchoolOperator() : renderCorporateOperator()
      )}

      {/* ── SHARED RECORD FORM MODALS ────────────────────────────────────── */}
      {isRecordModalOpen && (
        <RecordForm
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onSubmit={handleSaveRecord}
          editingRecord={editingRecord}
          requiredFields={resolvedTemplate.fields}
          isSchool={isSchool}
          classesList={classesList}
          divisionsList={divisionsList}
          branchesList={branchesList}
          departmentsList={departmentsList}
          hidePhoto={!isAdmin}
        />
      )}

      {isAddRecordModalOpen && (
        <AddRecordModal
          open={isAddRecordModalOpen}
          onClose={() => setIsAddRecordModalOpen(false)}
          areaType={isSchool ? 'division' : 'department'}
          classId={activeClassId}
          divisionId={activeDivisionId}
          branchId={activeBranchId}
          departmentId={activeDepartmentId}
          fields={dynamicFieldsList}
          onSuccess={async () => {
            await fetchDashboardData();
            setIsAddRecordModalOpen(false);
          }}
        />
      )}

      {isBulkUploadModalOpen && (
        <BulkUploadModal
          isOpen={isBulkUploadModalOpen}
          onClose={() => setIsBulkUploadModalOpen(false)}
          isSchool={isSchool}
          prefilledClassId={activeClassId || undefined}
          prefilledSubId={(activeDivisionId || activeDepartmentId) || undefined}
          prefilledClassName={activeClassId ? getClassName(activeClassId) : undefined}
          prefilledSubName={activeDivisionId ? getDivName(activeDivisionId) : activeDepartmentId ? getDeptName(activeDepartmentId) : undefined}
          onSuccess={() => {
            setIsBulkUploadModalOpen(false);
            fetchDashboardData();
          }}
        />
      )}

      {/* ── PHOTO EDITOR MODAL ─────────────────────────────────────────── */}
      {editingPhotoRecord && (
        <PhotoEditorModal
          isOpen={!!editingPhotoRecord}
          onClose={() => setEditingPhotoRecord(null)}
          record={editingPhotoRecord}
          isSchool={isSchool}
          onSuccess={async () => {
            await fetchDashboardData();
          }}
        />
      )}

      {/* ── PROFESSIONAL CARD PREVIEW OVERLAY ──────────────────────────── */}
      {viewingPreviewRecord && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setViewingPreviewRecord(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Professional ID Card Preview</h3>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {viewingPreviewRecord.name || viewingPreviewRecord.full_name || viewingPreviewRecord.student_name || viewingPreviewRecord.employee_name} • ID: {viewingPreviewRecord.admission_number || viewingPreviewRecord.employee_id}
                </p>
              </div>
              <button
                onClick={() => setViewingPreviewRecord(null)}
                className="text-slate-400 hover:text-slate-655 p-1.5 hover:bg-slate-55 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas side by side */}
            {cardPreviewLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-550 min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider">Rendering ID Card Preview...</p>
              </div>
            ) : cardPreviewError ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center font-sans min-h-[300px]">
                <AlertCircle className="w-8 h-8 text-slate-350 mb-2" />
                <span className="text-xs font-bold">{cardPreviewError}</span>
              </div>
            ) : cardPreviewData?.template_version ? (() => {
              const templateVersion = cardPreviewData.template_version;
              const isSingleSided = String(templateVersion.canvas_json?.sides || templateVersion.sides || '2') === '1' ||
                String(templateVersion.canvas_json?.sides || templateVersion.sides || '').toLowerCase() === 'single' ||
                String(templateVersion.cardSides || templateVersion.cardSides || '').toLowerCase() === 'single';

              return (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-8 justify-center items-center py-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner min-h-[300px] overflow-auto">
                    {/* Front */}
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Front View</span>
                      <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-150 shrink-0">
                        <IdCardPreview
                          record={cardPreviewData?.record_data || viewingPreviewRecord}
                          templateVersion={templateVersion}
                          side="FRONT"
                          scale={0.45}
                        />
                      </div>
                    </div>

                    {/* Back */}
                    {!isSingleSided && (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Back View</span>
                        <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-150 shrink-0">
                          <IdCardPreview
                            record={cardPreviewData?.record_data || viewingPreviewRecord}
                            templateVersion={templateVersion}
                            side="BACK"
                            scale={0.45}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center text-[10px] text-slate-400 font-semibold leading-relaxed">
                    💡 This is a live preview using CardFlow Studio's vector rendering engine.
                  </div>
                </div>
              );
            })() : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center font-sans min-h-[300px]">
                <AlertCircle className="w-8 h-8 text-slate-350 mb-2" />
                <span className="text-xs font-bold">No template assigned.</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingPreviewRecord(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
