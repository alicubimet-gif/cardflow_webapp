'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/context/dashboard-context';
import { Briefcase } from 'lucide-react';

// Subcomponents
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { DivisionDetails } from '@/components/division/DivisionDetails';
import { DepartmentDetails } from '@/components/department/DepartmentDetails';

// Modals & overlays
import { AddRecordModal } from '@/components/records/AddRecordModal';
import { BulkUploadModal } from '@/components/records/BulkUploadModal';
import { RecordForm } from '@/components/records/RecordForm';

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

  const getClassName = (id: string | null) => id ? (classesList.find(c => String(c.id) === String(id))?.name || '—') : '—';
  const getDivName = (id: string | null) => id ? (divisionsList.find(d => String(d.id) === String(id))?.name || '—') : '—';
  const getBranchName = (id: string | null) => id ? (branchesList.find(b => String(b.id) === String(id))?.name || '—') : '—';
  const getDeptName = (id: string | null) => id ? (departmentsList.find(d => String(d.id) === String(id))?.name || '—') : '—';

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
        // Staff Operator Dashboard & Hierarchical Views
        isSchool ? (
          // 1. School Staff operator hierarchy
          !activeClassId ? (
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
          ) : !activeDivisionId ? (
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
          ) : !resolvedTemplate.has_template ? (
            renderBlockade(() => setActiveDivisionId(null))
          ) : (
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
              onOpenViewRecord={(record) => router.push(`/records/${record.id}`)}
              onOpenEditRecord={handleOpenEditRecord}
              onDeleteRecord={handleDeleteRecord}
              onSubmitRecord={handleSubmitRecord}
              onApproveRecord={handleApproveRecord}
              onRejectRecord={handleRejectRecord}
              onCorrectionRecord={handleCorrectionRecord}
              onViewStaff={(st) => router.push(`/staff/${st.id}`)}
              templateFields={resolvedTemplate.fields}
            />
          )
        ) : (
          // 2. Corporate Staff operator hierarchy
          !activeBranchId ? (
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
          ) : !activeDepartmentId ? (
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
          ) : !resolvedTemplate.has_template ? (
            renderBlockade(() => setActiveDepartmentId(null))
          ) : (
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
              onOpenViewRecord={(record) => router.push(`/records/${record.id}`)}
              onOpenEditRecord={handleOpenEditRecord}
              onDeleteRecord={handleDeleteRecord}
              onSubmitRecord={handleSubmitRecord}
              onApproveRecord={handleApproveRecord}
              onRejectRecord={handleRejectRecord}
              onCorrectionRecord={handleCorrectionRecord}
              templateFields={resolvedTemplate.fields}
            />
          )
        )
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
    </div>
  );
}
