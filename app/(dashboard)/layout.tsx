'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, ChevronRight, ArrowLeft, Menu, X } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { DashboardProvider, useDashboard } from '@/context/dashboard-context';
import { ConfirmEditApprovedRecordModal } from '@/components/common/ConfirmEditApprovedRecordModal';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const pathname = usePathname() || "";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Redirect /records to /dashboard
  useEffect(() => {
    if (pathname === '/records') {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  const {
    orgName,
    orgEmail,
    isSchool,
    isAdmin,
    loading,
    error,
    fetchDashboardData,
    getBreadcrumbs,
    resolvedTemplate,
    setViewingRecord,
    setActiveClassId,
    setActiveDivisionId,
    setActiveBranchId,
    setActiveDepartmentId,
    setViewingStaff,
    setEditingStaff,
    setStaffForReset,
    setIsCreateStaffOpen,
    setIsEditStaffOpen,
    setIsResetPasswordOpen,
    setIsStaffDetailsOpen,
    setIsAssignStaffModalOpen,
    setIsRecordModalOpen,
    setIsAddRecordModalOpen,
    setIsBulkUploadModalOpen,
    isConfirmEditRecordModalOpen,
    setIsConfirmEditRecordModalOpen,
    pendingEditRecord,
    _executeOpenEditRecord
  } = useDashboard();

  // Close mobile sidebar on pathname change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Route-based state resets
  useEffect(() => {
    if (pathname.startsWith('/records')) {
      setViewingStaff(null);
      setEditingStaff(null);
      setStaffForReset(null);
      setIsCreateStaffOpen(false);
      setIsEditStaffOpen(false);
      setIsResetPasswordOpen(false);
      setIsStaffDetailsOpen(false);
      setIsAssignStaffModalOpen(false);
    } else if (pathname.startsWith('/staff')) {
      setViewingRecord(null);
      setIsRecordModalOpen(false);
      setIsAddRecordModalOpen(false);
      setIsBulkUploadModalOpen(false);
      setActiveClassId(null);
      setActiveDivisionId(null);
      setActiveBranchId(null);
      setActiveDepartmentId(null);
    } else {
      setViewingRecord(null);
      setViewingStaff(null);
      setEditingStaff(null);
      setStaffForReset(null);
      setIsCreateStaffOpen(false);
      setIsEditStaffOpen(false);
      setIsResetPasswordOpen(false);
      setIsStaffDetailsOpen(false);
      setIsAssignStaffModalOpen(false);
      setActiveClassId(null);
      setActiveDivisionId(null);
      setActiveBranchId(null);
      setActiveDepartmentId(null);
    }
  }, [pathname, setActiveClassId, setActiveDivisionId, setActiveBranchId, setActiveDepartmentId, setViewingRecord, setViewingStaff, setEditingStaff, setStaffForReset, setIsCreateStaffOpen, setIsEditStaffOpen, setIsResetPasswordOpen, setIsStaffDetailsOpen, setIsAssignStaffModalOpen, setIsRecordModalOpen, setIsAddRecordModalOpen, setIsBulkUploadModalOpen]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mb-3" />
        <p className="text-sm font-semibold text-[#64748B]">Verifying session…</p>
      </div>
    );
  }

  if (!user) return null;

  const isRecordsRoute = pathname === '/records' || pathname.startsWith('/records/');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* DESKTOP FIXED SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col h-screen">
        <Sidebar
          user={user}
          currentTab={pathname.replace(/^\//, '') || 'dashboard'}
          setCurrentTab={() => { }}
          logout={logout}
          orgName={orgName}
          orgEmail={orgEmail}
          isSchool={isSchool}
          isAdmin={isAdmin}
          setActiveClassId={setActiveClassId}
          setActiveDivisionId={setActiveDivisionId}
          setActiveBranchId={setActiveBranchId}
          setActiveDepartmentId={setActiveDepartmentId}
        />
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex w-72 max-w-xs flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="absolute right-2 top-3.5 z-10">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar
              user={user}
              currentTab={pathname.replace(/^\//, '') || 'dashboard'}
              setCurrentTab={() => { }}
              logout={logout}
              orgName={orgName}
              orgEmail={orgEmail}
              isSchool={isSchool}
              isAdmin={isAdmin}
              setActiveClassId={setActiveClassId}
              setActiveDivisionId={setActiveDivisionId}
              setActiveBranchId={setActiveBranchId}
              setActiveDepartmentId={setActiveDepartmentId}
            />
          </div>
        </div>
      )}

      {/* MOBILE TOP HEADER (< lg) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden shrink-0">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold text-slate-900 absolute left-1/2 -translate-x-1/2" style={{ fontFamily: 'Sora, sans-serif' }}>
          CardFlow
        </span>
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-xs font-bold select-none">
          {user.name?.slice(0, 2)?.toUpperCase()}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className={`min-h-screen lg:pl-64 flex flex-col ${!isRecordsRoute ? 'pb-14 lg:pb-0' : ''}`}>
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6 flex-1 flex flex-col space-y-4">

          <PageHeader
            loading={loading}
            error={error}
            onRefresh={fetchDashboardData}
          />

          {/* Breadcrumbs */}
          {(() => {
            const segments = pathname.split('/').filter(Boolean);
            const isSubgroupDetailRoute = segments.length === 3 && segments[0] === 'groups' && segments[1] !== 'photo' && segments[1] !== 'edit';
            const isGroupDetailRoute = segments.length === 2 && segments[0] === 'groups' && segments[1] !== 'photo' && segments[1] !== 'edit';

            return (
              <div className="w-full min-w-0 overflow-hidden">
                {/* Mobile Breadcrumb */}
                <div className="w-full min-w-0 overflow-hidden sm:hidden mb-1">
                  {isSubgroupDetailRoute ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/groups/details?groupId=${encodeURIComponent(segments[1])}`)}
                      className="inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer min-h-8 rounded-md px-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Back to {isSchool ? 'Class' : 'Branch'}</span>
                    </button>
                  ) : isGroupDetailRoute ? (
                    <button
                      type="button"
                      onClick={() => router.push('/groups')}
                      className="inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer min-h-8 rounded-md px-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Back to {isSchool ? 'Classes' : 'Branches'}</span>
                    </button>
                  ) : (
                    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium select-none min-w-0 overflow-hidden">
                      {getBreadcrumbs(pathname).map((crumb: any, idx: number, arr: any[]) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                          <span className={`truncate ${idx === arr.length - 1 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                            {crumb.label}
                          </span>
                        </React.Fragment>
                      ))}
                    </nav>
                  )}
                </div>

                {/* Desktop Breadcrumb */}
                <nav aria-label="Breadcrumb" className="mb-1 hidden sm:flex items-center gap-2 text-xs font-medium select-none animate-in fade-in duration-200">
                  {getBreadcrumbs(pathname).map((crumb: any, idx: number, arr: any[]) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                      <button
                        type="button"
                        onClick={() => {
                          if (crumb.action) {
                            crumb.action();
                          }
                          if (crumb.tab === 'dashboard') {
                            router.push('/dashboard');
                          } else if (crumb.tab === 'groups') {
                            router.push('/groups');
                          } else if (crumb.tab === 'classes') {
                            router.push('/dashboard');
                          } else if (crumb.tab === 'branches') {
                            router.push('/dashboard');
                          }
                        }}
                        disabled={idx === arr.length - 1}
                        className={`transition-colors focus:outline-none ${idx === arr.length - 1
                          ? 'text-slate-900 font-semibold'
                          : 'hover:text-slate-700 cursor-pointer text-slate-500'
                          }`}
                      >
                        {crumb.label}
                      </button>
                    </React.Fragment>
                  ))}
                </nav>
              </div>
            );
          })()}


          {/* Children contents */}
          <div className="flex-1 flex flex-col min-w-0">
            {children}
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION - only show on non-records routes below lg */}
      {!isRecordsRoute && (
        <div className="lg:hidden">
          <MobileBottomNav
            currentTab={(typeof window !== 'undefined' && window.location.search.includes('from=dashboard')) ? 'dashboard' : (pathname.replace(/^\//, '') || 'dashboard')}
            setCurrentTab={() => { }}
            isSchool={isSchool}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {isConfirmEditRecordModalOpen && (
        <ConfirmEditApprovedRecordModal
          isOpen={isConfirmEditRecordModalOpen}
          onClose={() => setIsConfirmEditRecordModalOpen(false)}
          onConfirm={async () => {
            if (pendingEditRecord) {
              const { revertRecordApproval } = await import('@/services/record-service');
              await revertRecordApproval(pendingEditRecord.id);
              setIsConfirmEditRecordModalOpen(false);
              _executeOpenEditRecord({ ...pendingEditRecord, approval_status: 'draft' });
            }
          }}
        />
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
