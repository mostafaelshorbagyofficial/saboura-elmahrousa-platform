'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

export default function DashboardRedirect() {
  const { user, profile, loading } = useAuth();
  const { t } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile) {
        if (profile.role === 'Administrator') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/volunteer');
        }
      }
    }
  }, [user, profile, loading, router]);

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
