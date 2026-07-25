'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Bell, Menu, User, LogOut, Search, Sun, Moon, Globe, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getNotifications, markNotificationAsRead } from '@/lib/db';
import { Notification } from '@/types';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface NavbarProps {
  toggleSidebar: () => void;
}

function SearchBarInput() {
  const { lang } = useApp();
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const isRtl = lang === 'ar';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${profile?.role === 'Administrator' ? 'dashboard/admin' : 'dashboard/volunteer'}?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/${profile?.role === 'Administrator' ? 'dashboard/admin' : 'dashboard/volunteer'}`);
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-60 lg:w-80">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={isRtl ? 'بحث عام (متطوع، مركز، مطعم...)' : 'Global search (volunteer, center, store...)'}
        className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#014976] dark:focus:ring-[#FBAE42] text-slate-800 dark:text-slate-200 transition-all font-semibold"
      />
      <button type="submit" className="absolute left-3 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer">
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}

export const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { profile, logout } = useAuth();
  const { lang, theme, setLang, setTheme, t } = useApp();
  const pathname = usePathname();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isRtl = lang === 'ar';

  // Fetch notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      if (!profile) return;
      try {
        const data = await getNotifications(profile.id);
        setNotifications(data);
      } catch (err) {
        console.warn('Failed to load notifications:', err);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [profile, pathname]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await markNotificationAsRead(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Breadcrumbs Generator
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    return paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      let label = path;
      
      if (path === 'dashboard') label = isRtl ? 'الرئيسية' : 'Home';
      else if (path === 'admin') label = isRtl ? 'المتابعة العامة' : 'Overview';
      else if (path === 'volunteer') label = isRtl ? 'أدائي الميداني' : 'My Performance';
      else if (path === 'centers') label = isRtl ? 'إدارة المراكز' : 'Centers';
      else if (path === 'volunteers') label = isRtl ? 'إدارة المتطوعين' : 'Volunteers';
      else if (path === 'requests') label = isRtl ? 'طلبات التسجيل المعلقة' : 'Registration Requests';
      else if (path === 'visits') label = isRtl ? 'سجل النزولات' : 'Visits History';
      else if (path === 'settings') label = isRtl ? 'إعدادات التكامل' : 'Integration Settings';
      else if (path === 'leaderboard') label = isRtl ? 'لوحة الصدارة' : 'Center rankings';
      else if (path === 'profile') label = isRtl ? 'الملف الشخصي' : 'Profile';
      else if (path === 'new-visit') label = isRtl ? 'نموذج النزولة' : 'Visit Form';

      return { label, href, isLast: index === paths.length - 1 };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/85 px-4 md:px-6 py-3.5 flex items-center justify-between transition-colors duration-300">
      
      {/* Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="text-slate-500 hover:text-[#014976] dark:hover:text-[#FBAE42] lg:hidden transition-colors focus:outline-none p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Breadcrumb Path Display */}
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <img 
            src="/logo.png" 
            alt="Life Makers Logo" 
            className="h-7 w-7 object-contain rounded lg:hidden mr-1" 
          />
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={bc.href}>
              {idx > 0 && <ChevronRight className={`h-3 w-3 text-slate-400 ${isRtl ? 'rotate-180' : ''}`} />}
              {bc.isLast ? (
                <span className="text-[#014976] dark:text-[#FBAE42] font-black truncate max-w-[140px] sm:max-w-none">
                  {bc.label}
                </span>
              ) : (
                <Link href={bc.href} className="hover:text-[#014976] dark:hover:text-white transition-colors truncate max-w-[80px] sm:max-w-none">
                  {bc.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Global Search Bar (Suspense wrapped for NextJS parameter bails) */}
      <Suspense fallback={<div className="h-8 w-60 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse hidden md:block" />}>
        <SearchBarInput />
      </Suspense>

      {/* Quick Action Menus */}
      <div className="flex items-center gap-2 relative">
        {/* Language Switch */}
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="p-2 text-slate-500 hover:text-[#014976] dark:text-slate-400 dark:hover:text-[#FBAE42] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold focus:outline-none cursor-pointer"
          title="Switch Language"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{lang === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 text-slate-500 hover:text-[#014976] dark:text-slate-400 dark:hover:text-[#FBAE42] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none cursor-pointer"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
        </button>

        {/* Notifications list trigger */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 text-slate-500 hover:text-[#014976] dark:text-slate-400 dark:hover:text-[#FBAE42] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative focus:outline-none cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full bg-red-500 text-[8px] font-black text-white flex items-center justify-center border border-white dark:border-[#0f172a] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Center Panel Dropdown */}
          {showNotifications && (
            <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-80 bg-white dark:bg-[#172033] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2.5 z-50 text-right overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
              <div className="px-4 py-2 border-b border-slate-150 dark:border-slate-850 font-bold text-xs text-slate-850 dark:text-slate-200 flex items-center justify-between">
                <span>{t('notifications')}</span>
                {unreadCount > 0 && (
                  <span className="text-[9px] bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} {isRtl ? 'جديد' : 'New'}
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8 font-semibold">{t('noData')}</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif.id)}
                      className={`px-4 py-2.5 border-b border-slate-100 dark:border-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer text-start ${
                        !notif.is_read ? 'bg-[#014976]/5 dark:bg-[#FBAE42]/5 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-[11px] font-black text-[#014976] dark:text-[#FBAE42]">{notif.title}</h4>
                        <span className="text-[8px] text-slate-400 font-mono">
                          {new Date(notif.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-550 dark:text-slate-350 leading-normal">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none cursor-pointer"
          >
            <div className="h-8 w-8 rounded-xl bg-[#014976]/10 border border-[#014976]/20 dark:border-slate-700 flex items-center justify-center text-[#014976] dark:text-[#FBAE42] font-black text-sm">
              {profile?.name ? profile.name.charAt(0) : 'م'}
            </div>
            <div className="hidden md:block text-start">
              <div className="text-xs font-black text-slate-750 dark:text-slate-200 leading-none mb-0.5">
                {profile?.name || 'مستشار'}
              </div>
              <div className="text-[9px] text-[#FBAE42] font-bold leading-none">
                {profile?.role === 'Administrator' ? t('adminDashboard') : t('volunteerDashboard')}
              </div>
            </div>
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-48 bg-white dark:bg-[#172033] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-850">
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{profile?.name}</p>
                <p className="text-[9px] text-slate-400 truncate font-mono">{profile?.email}</p>
              </div>
              
              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-655 dark:text-slate-300 hover:text-[#014976] dark:hover:text-[#FBAE42] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors font-bold"
              >
                <User className="h-4 w-4" />
                <span>{t('profile')}</span>
              </Link>
              
              <hr className="border-slate-100 dark:border-slate-850 my-1" />
              
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-start focus:outline-none cursor-pointer font-bold"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
    </header>
  );
};

export default Navbar;
