'use client';

import React from 'react';
import { useDashboard } from '@/context/dashboard-context';

// Structure Components
import { BranchList } from '@/components/branch/BranchList';
import { BranchDetails } from '@/components/branch/BranchDetails';
import { DepartmentDetails } from '@/components/department/DepartmentDetails';

// Modals
import { RecordForm } from '@/components/records/RecordForm';
import { AddRecordModal } from '@/components/records/AddRecordModal';
import { BulkUploadModal } from '@/components/records/BulkUploadModal';
import { AssignStaffModal } from '@/components/staff/AssignStaffModal';
import { CreateBranchModal } from '@/components/branch/CreateBranchModal';
import { CreateDepartmentModal } from '@/components/department/CreateDepartmentModal';

export default function BranchesPage() {
  const {
    branchesList,
    departmentsList,
    divisionsList,
    classesList,
    staffList,
    recordsList,
    allAssignmentsList,
    isAdmin,
    isSchool,
    resolvedTemplate,
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
    setViewingRecord,
    handleDeleteRecord,
    handleSubmitRecord,
    handleApproveRecord,
    handleRejectRecord,
    handleCorrectionRecord,
    renderBlockade,
    loading,
    fetchDashboardData,

    // CRUD
    handleOpenCreateStructure,
    handleOpenEditStructure,
    handleDeleteStructure,
    setAssignTargetType,
    setAssignTargetId,
    setIsAssignStaffModalOpen,
    setStructureType,
    setEditingStructureId,
    setStructureName,
    setStructureParentId,
    setIsStructureModalOpen,

    // Modals
    isRecordModalOpen,
    setIsRecordModalOpen,
    editingRecord,
    handleSaveRecord,
    isAddRecordModalOpen,
    setIsAddRecordModalOpen,
    dynamicFieldsList,

    // Assign staff modal
    isAssignStaffModalOpen,
    assignTargetType,
    assignTargetId,
    handleSaveStaffAssignments,

    // Structure modal state
    isStructureModalOpen,
    structureType,
    editingStructureId,
    structureName,
    structureParentId,
    handleSaveStructure
  } = useDashboard();

  const getBranchName = (id: string | null) => id ? (branchesList.find(b => String(b.id) === String(id))?.name || '—') : '—';
  const getDeptName = (id: string | null) => id ? (departmentsList.find(d => String(d.id) === String(id))?.name || '—') : '—';

  return (
    <div className="space-y-5">
      {!activeBranchId ? (
        <BranchList
          branchesList={branchesList}
          allAssignmentsList={allAssignmentsList}
          onAddBranch={() => handleOpenCreateStructure('branch')}
          onOpenBranch={setActiveBranchId}
          onAssignStaff={(id) => {
            setAssignTargetType('branch');
            setAssignTargetId(id);
            setIsAssignStaffModalOpen(true);
          }}
          onEditBranch={(item) => handleOpenEditStructure('branch', item)}
          onDeleteBranch={(id) => handleDeleteStructure('branch', id)}
        />
      ) : !activeDepartmentId ? (
        <BranchDetails
          branchId={activeBranchId}
          branchName={getBranchName(activeBranchId)}
          departmentsList={departmentsList}
          allAssignmentsList={allAssignmentsList}
          staffList={staffList}
          recordsList={recordsList}
          onBack={() => setActiveBranchId(null)}
          onAssignBranchStaff={(id) => {
            setAssignTargetType('branch');
            setAssignTargetId(id);
            setIsAssignStaffModalOpen(true);
          }}
          onAddDepartment={(bid) => {
            setStructureType('department');
            setEditingStructureId(null);
            setStructureName('');
            setStructureParentId(bid);
            setIsStructureModalOpen(true);
          }}
          onOpenDepartment={setActiveDepartmentId}
          onAssignDepartmentStaff={(id) => {
            setAssignTargetType('department');
            setAssignTargetId(id);
            setIsAssignStaffModalOpen(true);
          }}
          onEditDepartment={(item) => handleOpenEditStructure('department', item)}
          onDeleteDepartment={(id) => handleDeleteStructure('department', id)}
        />
      ) : !resolvedTemplate.has_template ? (
        renderBlockade(() => setActiveDepartmentId(null))
      ) : (
        <DepartmentDetails
          branchId={activeBranchId}
          branchName={getBranchName(activeBranchId)}
          departmentId={activeDepartmentId}
          departmentName={getDeptName(activeDepartmentId)}
          isAdmin={isAdmin}
          isSchool={isSchool}
          staffList={staffList}
          allAssignmentsList={allAssignmentsList}
          recordsList={recordsList}
          recordSearch={recordSearch}
          setRecordSearch={setRecordSearch}
          recordFilterStatus={recordFilterStatus}
          setRecordFilterStatus={setRecordFilterStatus}
          onBack={() => setActiveDepartmentId(null)}
          onAssignStaff={(id) => {
            setAssignTargetType('department');
            setAssignTargetId(id);
            setIsAssignStaffModalOpen(true);
          }}
          onBulkUpload={() => setIsBulkUploadModalOpen(true)}
          onAddRecord={handleOpenCreateRecord}
          onOpenViewRecord={setViewingRecord}
          onOpenEditRecord={handleOpenEditRecord}
          onDeleteRecord={handleDeleteRecord}
          onSubmitRecord={handleSubmitRecord}
          onApproveRecord={handleApproveRecord}
          onRejectRecord={handleRejectRecord}
          onCorrectionRecord={handleCorrectionRecord}
          templateFields={resolvedTemplate.fields}
        />
      )}

      {/* Modals & Overlays */}
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
          areaType="department"
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
          prefilledClassId={undefined}
          prefilledSubId={activeDepartmentId || undefined}
          prefilledClassName={undefined}
          prefilledSubName={activeDepartmentId ? getDeptName(activeDepartmentId) : undefined}
          onSuccess={() => {
            setIsBulkUploadModalOpen(false);
            fetchDashboardData();
          }}
        />
      )}

      {isAssignStaffModalOpen && (
        <AssignStaffModal
          isOpen={isAssignStaffModalOpen}
          onClose={() => setIsAssignStaffModalOpen(false)}
          targetType={assignTargetType}
          targetId={assignTargetId}
          staffList={staffList}
          currentAssignments={allAssignmentsList}
          isLoading={loading}
          onSave={handleSaveStaffAssignments}
        />
      )}

      {isStructureModalOpen && (
        structureType === 'branch' ? (
          <CreateBranchModal
            isOpen={isStructureModalOpen}
            onClose={() => setIsStructureModalOpen(false)}
            onSave={(name) => handleSaveStructure(name)}
            editingId={editingStructureId}
            initialName={structureName}
            isLoading={loading}
          />
        ) : (
          <CreateDepartmentModal
            isOpen={isStructureModalOpen}
            onClose={() => setIsStructureModalOpen(false)}
            onSave={(name, parentId) => handleSaveStructure(name, parentId)}
            editingId={editingStructureId}
            initialName={structureName}
            initialParentId={structureParentId}
            parentList={branchesList}
            isLoading={loading}
          />
        )
      )}
    </div>
  );
}
