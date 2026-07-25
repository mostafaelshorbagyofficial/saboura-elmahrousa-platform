'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useApp } from '@/context/AppContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles?: ('Administrator' | 'Volunteer')[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  allowedRoles = ['Administrator', 'Volunteer'],
}) => {
  const { user, profile, loading } = useAuth();
  const { theme, lang, t } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saboura_sidebar_collapsed') === 'true';
      setSidebarCollapsed(saved);
    }
  }, []);

  const handleToggleCollapse = () => {
    const nextVal = !sidebarCollapsed;
    setSidebarCollapsed(nextVal);
    localStorage.setItem('saboura_sidebar_collapsed', String(nextVal));
  };

  useEffect(() => {
    if (user && profile && !allowedRoles.includes(profile.role)) {
      if (profile.role === 'Administrator') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/volunteer');
      }
    }
  }, [user, profile, allowedRoles, router]);

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center gap-4 transition-colors duration-300">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 border-4 border-[#014976]/20 dark:border-slate-800 rounded-full" />
          <div className="absolute h-16 w-16 border-4 border-t-[#FBAE42] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          <div className="absolute text-[#014976] dark:text-[#FBAE42] font-black text-sm">ص</div>
        </div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 animate-pulse">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
