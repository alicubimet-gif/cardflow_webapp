import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, GraduationCap, Building2, FolderGit2, FileText, Users, ClipboardCheck, User } from 'lucide-react';
import { useOrgLabels } from '@/hooks/useOrgLabels';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab?: (tab: any) => void;
  isSchool?: boolean;
  isAdmin?: boolean;
}

export function MobileBottomNav({
  currentTab,
  isSchool = true,
  isAdmin = true
}: MobileBottomNavProps) {
  const labels = useOrgLabels(isSchool ? 'institution' : 'cooperative');

  const navItems = isAdmin
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
        { id: 'groups', label: labels.groupLabelPlural || (isSchool ? 'Classes' : 'Branches'), icon: isSchool ? GraduationCap : Building2, route: '/groups' },
        { id: 'logs', label: 'Approval Logs', icon: ClipboardCheck, route: '/approval-logs' },
        { id: 'staff', label: 'Staff', icon: Users, route: '/staff' },
        { id: 'profile', label: 'Profile', icon: User, route: '/profile' },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
        { id: 'groups', label: labels.groupLabelPlural || (isSchool ? 'Classes' : 'Branches'), icon: FolderGit2, route: '/groups' },
        { id: 'logs', label: 'Approval Logs', icon: ClipboardCheck, route: '/approval-logs' },
        { id: 'profile', label: 'Profile', icon: User, route: '/profile' },
      ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white flex items-center justify-around border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2"
      style={{
        height: '56px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          currentTab === item.id ||
          currentTab.startsWith(item.id + '/') ||
          (item.id === 'logs' && (currentTab === 'approval-logs' || currentTab.startsWith('approval-logs'))) ||
          (item.id === 'dashboard' && (currentTab === '' || currentTab === 'dashboard'));

        return (
          <Link
            key={item.id}
            href={item.route}
            title={item.label}
            aria-label={item.label}
            className={`flex items-center justify-center flex-1 h-full transition-all duration-200 cursor-pointer ${
              isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div
              className={`flex items-center justify-center w-11 h-9 rounded-2xl transition-all duration-200 ${
                isActive ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.9} />
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
