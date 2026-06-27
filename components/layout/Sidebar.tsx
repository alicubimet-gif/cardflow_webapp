import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, GraduationCap, Building2, Users, User, LogOut, Shield, ClipboardList } from 'lucide-react';
import { WebAppUser } from '@/context/auth-context';

interface SidebarProps {
  user: WebAppUser;
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  logout: () => void;
  orgName: string;
  isSchool: boolean;
  isAdmin: boolean;
  setActiveClassId: (id: string | null) => void;
  setActiveDivisionId: (id: string | null) => void;
  setActiveBranchId: (id: string | null) => void;
  setActiveDepartmentId: (id: string | null) => void;
}

const tabToRoute: Record<string, string> = {
  dashboard: '/dashboard',
  classes: '/classes',
  branches: '/branches',
  staff: '/staff',
  logs: '/approval-logs',
  profile: '/profile'
};

export function Sidebar({
  user,
  currentTab,
  logout,
  orgName,
  isSchool,
  isAdmin,
  setActiveClassId,
  setActiveDivisionId,
  setActiveBranchId,
  setActiveDepartmentId
}: SidebarProps) {

  const resetAllSubViews = () => {
    setActiveClassId(null);
    setActiveDivisionId(null);
    setActiveBranchId(null);
    setActiveDepartmentId(null);
  };

  return (
    <aside className="desktop-sidebar hidden lg:flex flex-col w-64 bg-white border-r border-[#DFE4EA] shrink-0 fixed top-0 bottom-0 left-0 h-screen z-[1010]">
      <div className="p-5 border-b border-[#DFE4EA] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shrink-0">
          <Shield size={15} />
        </div>
        <div>
          <span className="font-bold text-[#0B0F19] text-lg block leading-tight" style={{ fontFamily: 'Sora' }}>CardFlow</span>
          <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-widest">Organization Portal</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {isAdmin ? (
          <>
            <SidebarBtn icon={LayoutDashboard} label="Dashboard" tab="dashboard" current={currentTab} onClick={resetAllSubViews} />
            {isSchool ? (
              <SidebarBtn icon={GraduationCap} label="Classes" tab="classes" current={currentTab} onClick={resetAllSubViews} />
            ) : (
              <SidebarBtn icon={Building2} label="Branches" tab="branches" current={currentTab} onClick={resetAllSubViews} />
            )}
            <SidebarBtn icon={Users} label="Staff" tab="staff" current={currentTab} onClick={resetAllSubViews} />
            <SidebarBtn icon={ClipboardList} label="Approval Logs" tab="logs" current={currentTab} onClick={resetAllSubViews} />
            <SidebarBtn icon={User} label="Profile" tab="profile" current={currentTab} onClick={resetAllSubViews} />
          </>
        ) : (
          <>
            <SidebarBtn icon={LayoutDashboard} label="Dashboard" tab="dashboard" current={currentTab} onClick={resetAllSubViews} />
            <SidebarBtn icon={User} label="Profile" tab="profile" current={currentTab} onClick={resetAllSubViews} />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-[#DFE4EA]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-bold text-sm shrink-0">
            {user.name?.slice(0, 2)?.toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-bold text-[#0B0F19] truncate">{user.name}</div>
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider">{user.role?.replace('_', ' ')}</div>
          </div>
          <button onClick={logout} className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarBtn({ icon: Icon, label, tab, current, onClick }: {
  icon: any; label: string; tab: string; current: string; onClick: () => void;
}) {
  const active = current === tab || (tab === 'logs' && current === 'approval-logs');
  const route = tabToRoute[tab] || `/${tab}`;
  return (
    <Link
      href={route}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
        active 
          ? 'bg-[#2563EB] text-white' 
          : 'bg-white text-[#64748B] hover:bg-slate-50 hover:text-[#0B0F19]'
      }`}
    >
      <Icon size={17} className={active ? 'text-white' : 'text-[#64748B]'} />
      <span>{label}</span>
    </Link>
  );
}
