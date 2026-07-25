'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { getPendingUsers } from '@/lib/db';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Users,
  Trophy,
  Settings,
  User,
  LogOut,
  X,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  isCollapsed, 
  onToggleCollapse 
}) => {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const { lang, t } = useApp();
  const [pendingCount, setPendingCount] = useState(0);

  const isRtl = lang === 'ar';

  useEffect(() => {
    if (profile?.role === 'Administrator') {
      getPendingUsers()
        .then(data => setPendingCount(data.length))
        .catch(() => {});
    }
  }, [profile, pathname]); // Refresh badge on navigation changes

  const menuItems = [
    // Admin Dashboard
    {
      title: t('adminDashboard'),
      href: '/dashboard/admin',
      icon: LayoutDashboard,
      roles: ['Administrator'],
    },
    // Volunteer Dashboard
    {
      title: t('volunteerDashboard'),
      href: '/dashboard/volunteer',
      icon: LayoutDashboard,
      roles: ['Volunteer'],
    },
    // Leaderboard (Shared)
    {
      title: t('leaderboardTitle'),
      href: '/dashboard/leaderboard',
      icon: Trophy,
      roles: ['Administrator', 'Volunteer'],
    },
    // Centers (Admin only)
    {
      title: t('centers'),
      href: '/dashboard/centers',
      icon: Building2,
      roles: ['Administrator'],
    },
    // Volunteers (Admin only)
    {
      title: t('volunteers'),
      href: '/dashboard/volunteers',
      icon: Users,
      roles: ['Administrator'],
    },
    // Registration Requests (Admin only)
    {
      title: isRtl ? 'طلبات التسجيل' : 'Registration Requests',
      href: '/dashboard/requests',
      icon: ShieldAlert,
      roles: ['Administrator'],
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    // Visits history (Shared)
    {
      title: t('visitHistory'),
      href: '/dashboard/visits',
      icon: CalendarDays,
      roles: ['Administrator', 'Volunteer'],
    },
    // Settings (Admin only)
    {
      title: t('settings'),
      href: '/dashboard/settings',
      icon: Settings,
      roles: ['Administrator'],
    },
    // Profile (Shared)
    {
      title: t('profile'),
      href: '/profile',
      icon: User,
      roles: ['Administrator', 'Volunteer'],
    },
  ];

  const allowedMenuItems = menuItems.filter(
    (item) => !profile || item.roles.includes(profile.role)
  );

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-all duration-300"
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside
        className={`fixed inset-y-0 z-50 flex flex-col bg-[#111827] border-slate-800 text-white transition-all duration-300 lg:static lg:translate-x-0 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          isRtl
            ? `right-0 border-l border-slate-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
            : `left-0 border-r border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
        } w-64`}
      >
        {/* Logo and App Identity Header */}
        <div className="flex h-20 items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img 
              src="/logo.png" 
              alt="Life Makers Logo" 
              className="h-10 w-10 object-contain rounded-xl bg-slate-800/20 p-1 shrink-0 border border-slate-700/30" 
            />
            {!isCollapsed && (
              <div className="text-start animate-in fade-in duration-200">
                <div className="text-sm font-black tracking-wide text-white font-sans">{t('appName')}</div>
                <div className="text-[9px] text-[#FBAE42] font-black uppercase tracking-wider">
                  {lang === 'ar' ? 'صناع الحياة - القليوبية' : 'Life Makers Qalyubia'}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white lg:hidden transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Menu Links */}
        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto scrollbar-none">
          {allowedMenuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/profile' && pathname.startsWith(item.href + '/'));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center rounded-xl text-xs font-bold transition-all duration-200 relative group ${
                  isCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'
                } ${
                  isActive
                    ? 'bg-[#FBAE42] text-[#014976] shadow-md shadow-[#FBAE42]/10'
                    : 'text-slate-300 hover:text-[#FBAE42] hover:bg-slate-800/40'
                }`}
                title={isCollapsed ? item.title : undefined}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-[#014976]' : 'text-slate-450 group-hover:text-[#FBAE42]'}`} />
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </div>

                {/* Badge count / highlight */}
                {!isCollapsed && item.badge !== undefined && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 border border-slate-900">
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge !== undefined && (
                  <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[7px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-[#111827]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer controls & Collapse toggle button */}
        <div className="border-t border-slate-800/80 p-3.5 space-y-2">
          
          {/* Collapse sidebar action toggle (Desktop only) */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center p-2.5 rounded-xl border border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-[#FBAE42] transition-all cursor-pointer focus:outline-none"
            title={isCollapsed ? (isRtl ? 'توسيع القائمة' : 'Expand Sidebar') : (isRtl ? 'طي القائمة' : 'Collapse Sidebar')}
          >
            {isCollapsed ? (
              isRtl ? <ChevronLeft className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold">
                {isRtl ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
                <span>{isRtl ? 'طي القائمة' : 'Collapse Menu'}</span>
              </div>
            )}
          </button>

          {/* Logout action */}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3.5 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/10 transition-all text-start cursor-pointer focus:outline-none ${
              isCollapsed ? 'justify-center p-3' : 'px-4 py-3'
            }`}
            title={t('logout')}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
