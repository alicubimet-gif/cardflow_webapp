import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, GraduationCap, Building2, Users, ClipboardList, User } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  isSchool: boolean;
  isAdmin: boolean;
}

const tabToRoute: Record<string, string> = {
  dashboard: '/dashboard',
  records: '/records',
  staff: '/staff',
  logs: '/approval-logs',
  profile: '/profile'
};

export function MobileBottomNav({
  currentTab,
  isSchool,
  isAdmin,
}: MobileBottomNavProps) {
  
  const items = [];
  
  if (isAdmin) {
    items.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
    items.push({ id: 'records', label: 'Records', icon: isSchool ? GraduationCap : Building2 });
    items.push({ id: 'staff', label: 'Staff', icon: Users });
    items.push({ id: 'logs', label: 'Logs', icon: ClipboardList });
    items.push({ id: 'profile', label: 'Profile', icon: User });
  } else {
    items.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
    items.push({ id: 'profile', label: 'Profile', icon: User });
  }

  return (
    <>
      <style>{`
        .mobile-nav-text {
          font-size: 11px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        @media (max-width: 360px) {
          .mobile-nav-text {
            font-size: 10px;
          }
        }
      `}</style>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DFE4EA] h-[56px] flex items-center justify-around z-50 px-2 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab.startsWith(item.id) || (item.id === 'logs' && currentTab === 'approval-logs');
          const route = tabToRoute[item.id] || `/${item.id}`;
          
          return (
            <Link
              key={item.id}
              href={route}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 leading-[1.2] tracking-[0.2px] transition-all duration-200 cursor-pointer min-h-[44px] min-w-[44px] ${
                isActive 
                  ? 'font-semibold text-[#2563EB]' 
                  : 'font-medium text-[#64748B] hover:text-[#0B0F19]'
              }`}
            >
              <Icon size={21} className={isActive ? 'text-[#2563EB]' : 'text-[#64748B]'} />
              <span className="mobile-nav-text mt-[3px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
