'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Files, 
  Layers3, 
  Users, 
  ClipboardCheck, 
  Settings, 
  LogOut,
  GraduationCap,
  Building2
} from 'lucide-react';
import { WebAppUser } from '@/context/auth-context';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

interface SidebarProps {
  user: WebAppUser;
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  logout: () => void;
  orgName: string;
  orgEmail: string;
  isSchool: boolean;
  isAdmin: boolean;
  setActiveClassId: (id: string | null) => void;
  setActiveDivisionId: (id: string | null) => void;
  setActiveBranchId: (id: string | null) => void;
  setActiveDepartmentId: (id: string | null) => void;
}

function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  user,
  logout,
  orgName,
  orgEmail,
  isSchool,
  isAdmin,
  setActiveClassId,
  setActiveDivisionId,
  setActiveBranchId,
  setActiveDepartmentId
}: SidebarProps) {
  const pathname = usePathname() || "";

  const isStaff = user?.role === 'organization_staff';

  const groupsQuery = useQuery({
    queryKey: ["staff-assigned-groups-nav"],
    queryFn: async () => {
      const res = await apiClient.get('/api/mobile/groups/');
      return res.data?.results || res.data || [];
    },
    enabled: !!user && isStaff,
    staleTime: 5 * 60 * 1000,
  });

  const subgroupsQuery = useQuery({
    queryKey: ["staff-assigned-subgroups-nav"],
    queryFn: async () => {
      const res = await apiClient.get('/api/mobile/subgroups/');
      return res.data?.results || res.data || [];
    },
    enabled: !!user && isStaff,
    staleTime: 5 * 60 * 1000,
  });

  const assignedGroups = groupsQuery.data || [];
  const assignedSubgroups = subgroupsQuery.data || [];

  // Determine dynamic href for Records menu
  let recordsHref = "/records";
  if (isStaff && !groupsQuery.isLoading && !subgroupsQuery.isLoading) {
    if (assignedGroups.length > 1) {
      recordsHref = "/groups";
    } else if (assignedGroups.length === 1) {
      const group = assignedGroups[0];
      const groupSubgroups = assignedSubgroups.filter(
        (sg: any) => String(sg.group) === String(group.id) || String(sg.groupId) === String(group.id)
      );
      if (groupSubgroups.length > 1) {
        recordsHref = `/groups/details?groupId=${encodeURIComponent(group.id)}`;
      } else if (groupSubgroups.length === 1) {
        recordsHref = `/groups/subgroup?groupId=${encodeURIComponent(group.id)}&subgroupId=${encodeURIComponent(groupSubgroups[0].id)}`;
      } else {
        recordsHref = `/groups/details?groupId=${encodeURIComponent(group.id)}`;
      }
    } else {
      recordsHref = "/groups";
    }
  }

  const resetAllSubViews = () => {
    setActiveClassId(null);
    setActiveDivisionId(null);
    setActiveBranchId(null);
    setActiveDepartmentId(null);
  };

  const secondaryText = orgEmail || (user.organization_type 
    ? (user.organization_type.toLowerCase() === 'school' ? 'School' : 
       user.organization_type.toLowerCase() === 'office' ? 'Office' : 
       user.organization_type.toLowerCase() === 'college' ? 'College' : 
       user.organization_type.toLowerCase() === 'company' ? 'Company' : 
       user.organization_type)
    : 'Organization');

  const navigationItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ...(!isStaff ? [
      { label: isSchool ? "Classes" : "Branches", href: "/groups", icon: isSchool ? GraduationCap : Building2 }
    ] : []),
    ...(isAdmin ? [
      { label: "Staff", href: "/staff", icon: Users },
      { label: "Approval Logs", href: "/approval-logs", icon: ClipboardCheck },
    ] : []),
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Sidebar Header */}
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5 gap-3">
        <div className="h-7 w-auto flex items-center gap-2 select-none">
          <span className="font-extrabold text-base tracking-tight text-blue-600" style={{ fontFamily: 'Sora, sans-serif' }}>
            CardFlow
          </span>
        </div>
      </div>

      {/* Organization Information */}
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-extrabold text-xs text-slate-800 tracking-tight leading-snug truncate">
          {orgName || user.organization_name || 'CardFlow'}
        </h2>
        <p className="text-[10px] font-semibold text-slate-400 truncate leading-none mt-1">
          {secondaryText}
        </p>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigationItems.map((item) => {
          const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const isFromDashboard = searchParams?.get('from') === 'dashboard';
          const isActive = isFromDashboard
            ? item.href === '/dashboard'
            : isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={resetAllSubViews}
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition cursor-pointer ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-blue-700" : "text-slate-500"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 select-none">
              {user.name?.slice(0, 2)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate leading-tight">{user.name}</div>
              <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wider leading-none mt-0.5">{user.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0" 
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
