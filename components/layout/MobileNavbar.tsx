'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, SlidersHorizontal, LogOut } from 'lucide-react';
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
  isAdmin,
  logout
}: MobileNavbarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const getTabLabel = (tab: string) => {
    const clean = tab.split('?')[0].split('#')[0];
    switch (clean) {
      case 'dashboard': return isAdmin ? 'Admin Dashboard' : 'Staff Dashboard';
      case 'records': return 'Records';
      case 'classes': return 'Classes';
      case 'branches': return 'Branches';
      case 'staff': return 'Staff';
      case 'approval-logs': return 'Approvals';
      case 'profile': return 'Profile';
      default: return 'CardFlow';
    }
  };

  const userInitials = user.name?.slice(0, 2)?.toUpperCase() || 'US';

  return (
    <>
      {/* ── MOBILE HEADER (< md) ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white flex items-center justify-between px-4"
        style={{
          height: '56px',
          borderBottom: '1px solid #F1F5F9',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Left: Hamburger */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu size={22} strokeWidth={2} />
        </button>

        {/* Center: Title */}
        <span
          className="text-[15px] font-bold text-slate-900 tracking-tight absolute left-1/2 -translate-x-1/2"
          style={{ fontFamily: 'Sora, Plus Jakarta Sans, sans-serif' }}
        >
          {getTabLabel(currentTab)}
        </span>

        {/* Right: Filter icon */}
        <button className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
          <SlidersHorizontal size={20} strokeWidth={2} />
        </button>
      </header>

      {/* ── Slide-down menu overlay ── */}
      {showMenu && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="absolute top-[56px] left-0 right-0 bg-white border-b border-slate-100 shadow-xl p-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User info */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                {userInitials}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  {user.role?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            <button
              onClick={() => { router.push('/profile'); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              My Profile
            </button>
            <button
              onClick={() => { logout(); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── DESKTOP/TABLET HEADER (≥ md) ── */}
      <header className="hidden md:flex fixed top-0 right-0 z-40 lg:left-64 left-0 h-16 bg-white border-b border-[#DFE4EA] px-6 items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="h-7 w-28 relative shrink-0 lg:hidden">
            <img
              src="/branding/logo-light.png"
              alt="CardFlow"
              className="h-full w-auto object-contain select-none pointer-events-none"
              style={{ width: 'auto', height: '100%' }}
            />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">
              Organization Portal
            </span>
            <h1
              className="text-[18px] font-bold text-slate-900 leading-none"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              {getTabLabel(currentTab)}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4 border-l border-slate-100 pl-5">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-3 group text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-100 group-hover:bg-blue-100 transition-colors">
              {userInitials}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate">
                {user.role?.replace(/_/g, ' ')}
              </p>
            </div>
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
    </>
  );
}
