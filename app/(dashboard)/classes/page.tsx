'use client';

import React from 'react';
import { useDashboard } from '@/context/dashboard-context';

// Structure Components
import { ClassList } from '@/components/class/ClassList';
import { ClassDetails } from '@/components/class/ClassDetails';
import { DivisionDetails } from '@/components/division/DivisionDetails';

// Modals
import { RecordForm } from '@/components/records/RecordForm';
import { AddRecordModal } from '@/components/records/AddRecordModal';
import { BulkUploadModal } from '@/components/records/BulkUploadModal';
import { AssignStaffModal } from '@/components/staff/AssignStaffModal';
import { CreateClassModal } from '@/components/class/CreateClassModal';
import { CreateDivisionModal } from '@/components/division/CreateDivisionModal';

export default function ClassesPage() {
  const {
    classesList,
    divisionsList,
    branchesList,
    departmentsList,
    staffList,
    recordsList,
    allAssignmentsList,
    isAdmin,
    isSchool,
    resolvedTemplate,
    activeClassId,
    setActiveClassId,
    activeDivisionId,
    setActiveDivisionId,
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

  const getClassName = (id: string | null) => id ? (classesList.find(c => String(c.id) === String(id))?.name || '—') : '—';
  const getDivName = (id: string | null) => id ? (divisionsList.find(d => String(d.id) === String(id))?.name || '—') : '—';

  return (
    <div className="space-y-5">
      {!activeClassId ? (
        <ClassList
          classesList={classesList}
          allAssignmentsList={allAssignmentsList}
          onAddClass={() => handleOpenCreateStructure('class')}
          onOpenClass={setActiveClassId}
          onAssignStaff={(id) => {
            setAssignTargetType('class');
            setAssignTargetId(id);
            setIsAssignStaffModalOpen(true);
          }}
          onEditClass={(item) => handleOpenEditStructure('class', item)}
          onDeleteClass={(id) => handleDeleteStructure('class', id)}
        />
      ) : !activeDivisionId ? (
        <ClassDetails
          classId={activeClassId}
          className={getClassName(activeClassId)}
          divisionsList={divisionsList}
          allAssignmentsList={allAssignmentsList}
          staffList={staffList}
          recordsList={recordsList}
          onBack={() => setActiveClassId(null)}
          onAssignClassStaff={(id) => {
            setAssignTargetType('class');
            setAssignTargetId(id);
            setIsAssignStaffModalOpen(true);
          }}
          onAddDivision={(cid) => {
            setStructureType('division');
            setEditingStructureId(null);
            setStructureName('');
            setStructureParentId(cid);
            setIsStructureModalOpen(true);
          }}
          onOpenDivision={setActiveDivisionId}
          onAssignDivisionStaff={(id) => {
            setAssignTargetType('division');
            setAssignTargetId(id);
            setIsAssignStaffModalOpen(true);
          }}
          onEditDivision={(item) => handleOpenEditStructure('division', item)}
          onDeleteDivision={(id) => handleDeleteStructure('division', id)}
        />
      ) : !resolvedTemplate.has_template ? (
        renderBlockade(() => setActiveDivisionId(null))
      ) : (
        <DivisionDetails
          classId={activeClassId}
          className={getClassName(activeClassId)}
          divisionId={activeDivisionId}
          divisionName={getDivName(activeDivisionId)}
          isAdmin={isAdmin}
          isSchool={isSchool}
          staffList={staffList}
          allAssignmentsList={allAssignmentsList}
          recordsList={recordsList}
          recordSearch={recordSearch}
          setRecordSearch={setRecordSearch}
          recordFilterStatus={recordFilterStatus}
          setRecordFilterStatus={setRecordFilterStatus}
          onBack={() => setActiveDivisionId(null)}
          onAssignStaff={(id) => {
            setAssignTargetType('division');
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
          areaType="division"
          classId={activeClassId}
          divisionId={activeDivisionId}
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
          prefilledSubId={activeDivisionId || undefined}
          prefilledClassName={activeClassId ? getClassName(activeClassId) : undefined}
          prefilledSubName={activeDivisionId ? getDivName(activeDivisionId) : undefined}
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
        structureType === 'class' ? (
          <CreateClassModal
            isOpen={isStructureModalOpen}
            onClose={() => setIsStructureModalOpen(false)}
            onSave={(name) => handleSaveStructure(name)}
            editingId={editingStructureId}
            initialName={structureName}
            isLoading={loading}
          />
        ) : (
          <CreateDivisionModal
            isOpen={isStructureModalOpen}
            onClose={() => setIsStructureModalOpen(false)}
            onSave={(name, parentId) => handleSaveStructure(name, parentId)}
            editingId={editingStructureId}
            initialName={structureName}
            initialParentId={structureParentId}
            parentList={classesList}
            isLoading={loading}
          />
        )
      )}
    </div>
  );
}
