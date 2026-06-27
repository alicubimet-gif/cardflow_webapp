'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNavbar } from '@/components/layout/MobileNavbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { RecordDetailsPage } from '@/components/records/RecordDetailsPage';
import { DashboardProvider, useDashboard } from '@/context/dashboard-context';
import * as recordService from '@/services/record-service';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, logout } = useAuth();
  const pathname = usePathname();
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
    viewingRecord,
    setViewingRecord,
    handleOpenEditRecord,
    handleApproveRecord,
    handleRejectRecord,
    handleCorrectionRecord,
    handleSubmitRecord,
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
    setIsBulkUploadModalOpen
  } = useDashboard();
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      <div className="flex min-h-dvh flex-col items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mb-3" />
        <p className="text-sm font-semibold text-[#64748B]">Verifying session…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-white text-[#0B0F19] flex flex-col lg:flex-row" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* DESKTOP SIDEBAR */}
      <Sidebar
        user={user}
        currentTab={pathname.replace(/^\//, '') || 'dashboard'}
        setCurrentTab={() => {}} 
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

      {/* TOP NAVIGATION BAR */}
      <MobileNavbar
        user={user}
        currentTab={pathname.replace(/^\//, '') || 'dashboard'} 
        setCurrentTab={() => {}}
        isSchool={isSchool}
        isAdmin={isAdmin}
        logout={logout}
      />

      {/* MOBILE BOTTOM NAVIGATION */}
      {isMobile && (
        <MobileBottomNav
          currentTab={pathname.replace(/^\//, '') || 'dashboard'}
          setCurrentTab={() => {}}
          isSchool={isSchool}
          isAdmin={isAdmin}
        />
      )}

      {/* MAIN CONTENT */}
      <main className={`flex-1 overflow-y-auto lg:pl-64 ${isMobile ? 'pt-[56px] pb-[56px]' : 'pt-[64px] pb-8'}`}>
        <div className="px-4 pt-5 pb-6 lg:px-8 lg:py-8 space-y-5 w-full max-w-full">
          
          <PageHeader
            loading={loading}
            error={error}
            onRefresh={fetchDashboardData}
          />

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50/70 p-2.5 px-4 rounded-xl border border-slate-100/50 select-none animate-in fade-in duration-200">
            {getBreadcrumbs(pathname).map((crumb: any, idx: number, arr: any[]) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-350 mx-0.5">&gt;</span>}
                <button
                  type="button"
                  onClick={crumb.action}
                  disabled={idx === arr.length - 1}
                  className={`transition-colors focus:outline-hidden ${
                    idx === arr.length - 1 
                      ? 'text-slate-800 font-bold' 
                      : 'hover:text-blue-600 cursor-pointer text-slate-400'
                  }`}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>

          {!resolvedTemplate.has_template && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top duration-300">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold text-sm">No Template Assigned</h3>
                <p className="text-xs text-red-600 mt-1">
                  This organization or selection does not have an assigned template. Please configure and assign a template from CardFlow Studio to enable member enrollment and card operations.
                </p>
              </div>
            </div>
          )}

          {children}
        </div>
      </main>
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
