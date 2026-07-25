'use client';

import React, { Suspense, lazy } from 'react';
import { useDashboard } from '@/context/dashboard-context';
import { useAuth } from '@/context/auth-context';
import { AuthApi, RecordApi, GroupApi, SubgroupApi, ClassesApi, UserApi, OrganizationApi, DashboardApi, ApprovalLogsApi } from '@/api';

// Lazy loaded Modals for performance
const RecordForm = lazy(() => import('@/components/records/RecordForm').then(module => ({ default: module.RecordForm })));
const BulkUploadWizard = lazy(() => import('@/components/records/BulkUploadWizard').then(module => ({ default: module.BulkUploadWizard })));
const AssignUserModal = lazy(() => import('@/components/users/AssignUserModal').then(module => ({ default: module.AssignUserModal })));
const CreateGroupModal = lazy(() => import('@/components/group/CreateGroupModal').then(module => ({ default: module.CreateGroupModal })));
const CreateSubgroupModal = lazy(() => import('@/components/subgroup/CreateSubgroupModal').then(module => ({ default: module.CreateSubgroupModal })));

export function DashboardModals() {
  const { user } = useAuth();
  
  const {
    groupsList, 
    subgroupsList,
    userList,
    allAssignmentsList,
    resolvedTemplate,
    
    activeGroupId,
    activeSubgroupId,

    setIsBulkUploadModalOpen,
    isBulkUploadModalOpen,
    fetchDashboardData,
    isOrganization,
    loading,

    // CRUD
    handleSaveStructure,
    setAssignTargetType,
    setAssignTargetId,
    setIsAssignUserModalOpen,

    // Modals
    isRecordModalOpen,
    setIsRecordModalOpen,
    editingRecord,
    handleSaveRecord,
    isAddRecordModalOpen,
    setIsAddRecordModalOpen,
    dynamicFieldsList,

    // Assign user modal
    isAssignUserModalOpen,
    assignTargetType,
    assignTargetId,
    handleSaveUserAssignments,

    // Structure modal state
    isStructureModalOpen,
    structureType,
    editingStructureId,
    structureName,
    structureParentId,
    setIsStructureModalOpen,
  } = useDashboard();

  if (!user) return null;

  return (
    <Suspense fallback={null}>
      {isRecordModalOpen && (
        <RecordForm
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onSubmit={handleSaveRecord}
          editingRecord={editingRecord}
          requiredFields={resolvedTemplate?.fields || []}
          isOrganization={isOrganization}
          groupsList={groupsList}
          subgroupsList={subgroupsList}
        />
      )}

      {isAddRecordModalOpen && (
        <RecordForm
          isOpen={isAddRecordModalOpen}
          onClose={() => setIsAddRecordModalOpen(false)}
          onSubmit={handleSaveRecord}
          editingRecord={null}
          requiredFields={dynamicFieldsList || []}
          isOrganization={isOrganization}
          groupsList={groupsList}
          subgroupsList={subgroupsList}
          prefilledValues={{
            group: activeGroupId,
            subgroup: activeSubgroupId
          }}
        />
      )}

      {isBulkUploadModalOpen && (
        <BulkUploadWizard
          isOpen={isBulkUploadModalOpen}
          onClose={() => setIsBulkUploadModalOpen(false)}
          onSuccess={async () => {
            await fetchDashboardData();
          }}
          title="Bulk Upload Wizard"
          templateId={resolvedTemplate?.template_id}
          templateName={resolvedTemplate?.template_name}
          templateFields={resolvedTemplate?.fields || []}
          uploadBulkRecords={isOrganization ? RecordApi.bulkUploadStudents : RecordApi.bulkUploadEmployees}
          additionalFormData={
            isOrganization
              ? Object.fromEntries(Object.entries({ class_id: activeGroupId, division_id: activeSubgroupId }).filter((entry): entry is [string, string] => Boolean(entry[1])))
              : Object.fromEntries(Object.entries({ branch_id: activeGroupId, department_id: activeSubgroupId }).filter((entry): entry is [string, string] => Boolean(entry[1])))
          }
        />
      )}

      {isAssignUserModalOpen && (
        <AssignUserModal
          isOpen={isAssignUserModalOpen}
          onClose={() => setIsAssignUserModalOpen(false)}
          targetType={assignTargetType as any}
          targetId={assignTargetId}
          userList={userList}
          currentAssignments={allAssignmentsList}
          isLoading={loading}
          onSave={handleSaveUserAssignments}
        />
      )}

      {isStructureModalOpen && (
        ['class', 'group', 'branch'].includes(structureType as string) ? (
          <CreateGroupModal
            isOpen={isStructureModalOpen}
            onClose={() => setIsStructureModalOpen(false)}
            onSave={(name: string) => handleSaveStructure(name)}
            editingId={editingStructureId}
            initialName={structureName}
            isLoading={loading}
          />
        ) : (
          <CreateSubgroupModal
            isOpen={isStructureModalOpen}
            onClose={() => setIsStructureModalOpen(false)}
            onSave={(name: string, parentId?: string) => handleSaveStructure(name, parentId)}
            editingId={editingStructureId}
            initialName={structureName}
            initialParentId={structureParentId}
            parentList={groupsList}
            isLoading={loading}
          />
        )
      )}
    </Suspense>
  );
}
