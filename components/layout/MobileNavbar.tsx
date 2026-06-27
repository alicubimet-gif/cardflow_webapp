import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, LogOut, Shield } from 'lucide-react';
import { WebAppUser } from '@/context/auth-context';

interface MobileNavbarProps {
  user: WebAppUser;
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  isSchool: boolean;
  isAdmin: boolean;
  logout: () => void;
}

export function MobileNavbar({
  user,
  currentTab,
  logout
}: MobileNavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  // Tab label helper
  const getTabLabel = (tab: string) => {
    const cleanTab = tab.split('?')[0].split('#')[0];
    switch (cleanTab) {
      case 'dashboard': return 'Dashboard';
      case 'classes': return 'Classes';
      case 'branches': return 'Branches';
      case 'staff': return 'Staff';
      case 'approval-logs': return 'Approval Logs';
      case 'logs': return 'Approval Logs';
      case 'profile': return 'Profile';
      default: return 'CardFlow';
    }
  };

  const userInitials = user.name?.slice(0, 2)?.toUpperCase() || 'US';

  return (
    <>
      {/* ── MOBILE HEADER (< 768px) ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-[#DFE4EA] h-[56px] flex items-center justify-between z-50 px-4 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Left: Empty Spacer for centering */}
        <div className="w-8" />

        {/* Center: Title */}
        <span 
          className="text-[16px] font-medium leading-[1.2] text-[#0B0F19] select-none tracking-tight font-heading" 
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          {getTabLabel(currentTab)}
        </span>

        {/* Right: User Avatar */}
        <button 
          onClick={() => router.push('/profile')}
          className="w-8 h-8 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-bold text-xs border border-[#2563EB]/20 cursor-pointer"
        >
          {userInitials}
        </button>
      </header>

      {/* ── DESKTOP/TABLET HEADER (>= 768px) ── */}
      <header className="hidden md:flex fixed top-0 right-0 z-40 lg:left-64 left-0 h-16 bg-white border-b border-[#DFE4EA] px-6 items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-xs lg:hidden">
            <Shield size={15} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider leading-none mb-1">
              Organization Portal
            </span>
            <h1 className="text-[18px] font-semibold text-[#0B0F19] leading-none font-heading" style={{ fontFamily: 'Sora, sans-serif' }}>
              {getTabLabel(currentTab)}
            </h1>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          {/* Mock Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-2.5 text-[#64748B]" size={14} />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="w-56 h-9 pl-9 pr-4 border border-[#DFE4EA] rounded-xl text-xs font-medium text-[#0B0F19] focus:outline-none focus:border-[#2563EB] bg-slate-50 transition-colors"
            />
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-3 border-l border-[#DFE4EA] pl-6 relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-bold text-sm border border-[#2563EB]/25 group-hover:bg-[#2563EB]/20 transition-colors">
                {userInitials}
              </div>
              <div className="hidden sm:block overflow-hidden max-w-[120px]">
                <div className="text-xs font-bold text-[#0B0F19] truncate">{user.name}</div>
                <div className="text-[10px] text-[#64748B] uppercase tracking-wider truncate font-semibold">
                  {user.role?.replace('_', ' ')}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-11 w-44 bg-white border border-[#DFE4EA] rounded-xl shadow-lg py-1.5 z-55 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => { router.push('/profile'); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[#0B0F19] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  My Profile
                </button>
                <button
                  onClick={() => { logout(); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[#EF4444] hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-[#DFE4EA] mt-1 cursor-pointer"
                >
                  <LogOut size={12} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
