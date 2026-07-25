'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/components/DashboardLayout';
import AnimatedCounter from '@/components/AnimatedCounter';
import { getCenters, getVolunteers, getVisits, getActivityLogs, getPendingUsers } from '@/lib/db';
import { Center, Volunteer, Visit, ActivityLog } from '@/types';
import { 
  Users, Building, Calendar, Clipboard, CheckCircle2, XCircle, 
  TrendingUp, BarChart2, PieChart as PieIcon, ListTodo, Activity, Trophy,
  UserPlus, PlusCircle, ArrowUpRight, ArrowDownRight, Compass, Settings, ShieldAlert, Heart
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Recharts components loaded on client-side
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

function AdminDashboardContent() {
  const { profile } = useAuth();
  const { lang, t } = useApp();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const [centers, setCenters] = useState<Center[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const isRtl = lang === 'ar';
  const COLORS = ['#014976', '#FBAE42', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        setLoading(true);
        const [c, v, vt, l, p] = await Promise.all([
          getCenters(),
          getVolunteers(),
          getVisits(),
          getActivityLogs(),
          getPendingUsers()
        ]);
        setCenters(c);
        setVolunteers(v);
        setVisits(vt);
        setLogs(l);
        setPendingCount(p.length);
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !profile) {
    return (
      <DashboardLayout allowedRoles={['Administrator']}>
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-[#014976] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('loading')}</p>
        </div>
      </DashboardLayout>
    );
  }

  // --- STATS CALCULATIONS ---
  const totalVolunteers = volunteers.length;
  const totalCenters = centers.length;
  const totalVisits = visits.length;

  const totalBoardsReceived = visits.reduce((sum, v) => sum + (v.boards_received || 0), 0);
  const totalBoardsInstalled = visits.reduce((sum, v) => sum + (v.boards_installed || 0), 0);
  const totalBoardsReturned = visits.reduce((sum, v) => sum + (v.boards_returned || 0), 0);

  const allAccepted = visits.flatMap(v => v.accepted_restaurants || []);
  const allRejected = visits.flatMap(v => v.rejected_restaurants || []);

  const totalAcceptedCount = allAccepted.length;
  const totalRejectedCount = allRejected.length;
  const acceptanceRate = (totalAcceptedCount + totalRejectedCount) > 0
    ? Math.round((totalAcceptedCount / (totalAcceptedCount + totalRejectedCount)) * 100)
    : 0;

  // Filter visits for Today, Week, Month
  const today = new Date().toISOString().split('T')[0];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const todaysVisits = visits.filter(v => v.visit_date === today).length;
  const weeklyVisits = visits.filter(v => v.visit_date >= oneWeekAgo).length;
  const monthlyVisits = visits.filter(v => v.visit_date >= oneMonthAgo).length;

  // Calculate Best Center (Leaderboard champion)
  const centerScores = centers.map(c => {
    const centerVols = volunteers.filter(v => v.center_id === c.id);
    const volIds = centerVols.map(v => v.id);
    const centerVisits = visits.filter(v => volIds.includes(v.volunteer_id));
    const installed = centerVisits.reduce((sum, v) => sum + (v.boards_installed || 0), 0);
    const accepted = centerVisits.reduce((sum, v) => sum + (v.accepted_restaurants?.length || 0), 0);
    const score = (installed * 10) + (accepted * 5) + (centerVisits.length * 2);
    return { name: c.name, score };
  });
  const bestCenterName = centerScores.sort((a, b) => b.score - a.score)[0]?.name || (isRtl ? 'لا يوجد' : 'None');

  // Calculate Most Active Volunteer
  const volunteerScores = volunteers.map(v => {
    const volVisits = visits.filter(vt => vt.volunteer_id === v.id);
    const installed = volVisits.reduce((sum, vt) => sum + (vt.boards_installed || 0), 0);
    const accepted = volVisits.reduce((sum, vt) => sum + (vt.accepted_restaurants?.length || 0), 0);
    const score = (installed * 10) + (accepted * 5) + (volVisits.length * 2);
    return { name: v.name, score };
  });
  const bestVolunteerName = volunteerScores.sort((a, b) => b.score - a.score)[0]?.name || (isRtl ? 'لا يوجد' : 'None');

  // --- CHART 1: VISITS OVER TIME (DAY) ---
  const visitsByDateMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    visitsByDateMap[d] = 0;
  }
  visits.forEach(v => {
    if (visitsByDateMap[v.visit_date] !== undefined) {
      visitsByDateMap[v.visit_date]++;
    }
  });
  const chartVisitsPerDay = Object.entries(visitsByDateMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({
      name: new Date(date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' }),
      visits: count
    }));

  // --- CHART 2: BOARDS INSTALLED PER CENTER ---
  const chartBoardsPerCenter = centers.map(c => {
    const centerVols = volunteers.filter(v => v.center_id === c.id);
    const volIds = centerVols.map(v => v.id);
    const centerVisits = visits.filter(v => volIds.includes(v.volunteer_id));
    const installed = centerVisits.reduce((sum, v) => sum + (v.boards_installed || 0), 0);
    return {
      name: c.name.replace('مركز ', ''),
      installed
    };
  });

  // --- CHART 3: TOP VOLUNTEERS ---
  const chartTopVolunteers = [...volunteers]
    .map(v => {
      const volVisits = visits.filter(vt => vt.volunteer_id === v.id);
      const installed = volVisits.reduce((sum, vt) => sum + (vt.boards_installed || 0), 0);
      return {
        name: v.name,
        installed
      };
    })
    .sort((a, b) => b.installed - a.installed)
    .slice(0, 5);

  // --- CHART 4: REJECTED REASONS ---
  const rejectedReasonsMap: Record<string, number> = {};
  allRejected.forEach(r => {
    const reason = r.reason || 'غير محدد';
    rejectedReasonsMap[reason] = (rejectedReasonsMap[reason] || 0) + 1;
  });
  const chartRejectedReasons = Object.entries(rejectedReasonsMap).map(([reason, count]) => ({
    name: reason,
    value: count
  }));

  // --- CHART 5: RESTAURANT CATEGORIES ---
  const categoriesMap: Record<string, number> = {};
  allAccepted.forEach(a => {
    const cat = a.category || 'Other';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
  });
  const chartCategories = Object.entries(categoriesMap).map(([cat, count]) => ({
    name: t(cat),
    value: count
  }));

  // Filter volunteers for Search panel
  const isSearchActive = search.trim().length > 0;
  const filteredVolunteers = volunteers.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.phone.includes(q) || (v.center?.name || '').toLowerCase().includes(q);
  });

  return (
    <DashboardLayout allowedRoles={['Administrator']}>
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-start">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">{t('adminDashboard')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isRtl ? 'متابعة أرقام ونزولات مبادرة صبورة المحروسة بمحافظة القليوبية' : 'Manage Saboura El Mahrousa initiative across Qalyubia centers'}
          </p>
        </div>

        {/* Live Pending Registration requests Badge */}
        {pendingCount > 0 && (
          <Link
            href="/dashboard/requests"
            className="flex items-center gap-2 bg-[#FBAE42]/10 border border-[#FBAE42]/20 hover:bg-[#FBAE42]/20 px-4 py-2 rounded-xl text-xs font-black text-[#014976] dark:text-[#FBAE42] transition-colors"
          >
            <ShieldAlert className="h-4.5 w-4.5 text-[#014976] dark:text-[#FBAE42]" />
            <span>
              {isRtl ? `لديك ${pendingCount} طلبات تسجيل معلقة` : `You have ${pendingCount} pending registrations`}
            </span>
          </Link>
        )}
      </div>

      {/* Main KPI Counters Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-start">
        {/* Volunteers count */}
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[125px] hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('volunteers')}</span>
            <Users className="h-5 w-5 text-[#014976] dark:text-[#FBAE42]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-850 dark:text-white font-mono">
              <AnimatedCounter value={totalVolunteers} />
            </h3>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <span className="text-emerald-500 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> +15%</span>
              <span>مقارنة بالأسبوع الماضي</span>
            </p>
          </div>
        </div>

        {/* Sub-branches Count */}
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[125px] hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('centers')}</span>
            <Building className="h-5 w-5 text-[#014976] dark:text-[#FBAE42]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-850 dark:text-white font-mono">
              <AnimatedCounter value={totalCenters} />
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">المراكز المعتمدة بالقليوبية</p>
          </div>
        </div>

        {/* Total Visits Logged */}
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[125px] hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('visits')}</span>
            <Calendar className="h-5 w-5 text-[#014976] dark:text-[#FBAE42]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-850 dark:text-white font-mono">
              <AnimatedCounter value={totalVisits} />
            </h3>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
              <span className="bg-[#014976]/10 dark:bg-[#FBAE42]/10 text-[#014976] dark:text-[#FBAE42] px-1.5 py-0.5 rounded font-black">{todaysVisits} اليوم</span>
              <span>{weeklyVisits} هذا الأسبوع</span>
            </p>
          </div>
        </div>

        {/* Acceptance rate percentage */}
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[125px] hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('acceptanceRate')}</span>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-850 dark:text-white font-mono">
              <AnimatedCounter value={acceptanceRate} suffix="%" />
            </h3>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 text-slate-500">
              <span className="text-emerald-500 font-black">{totalAcceptedCount} مقبول</span>
              <span>/ {totalRejectedCount} مرفوض</span>
            </p>
          </div>
        </div>
      </section>

      {/* Special Highlights Section (Best Center & Active Volunteer) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-start">
        {/* Best Center Card */}
        <div className="bg-[#014976]/5 dark:bg-[#172033] border border-[#014976]/15 dark:border-slate-850 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="h-12 w-12 rounded-xl bg-[#FBAE42]/15 text-[#014976] dark:text-[#FBAE42] flex items-center justify-center shrink-0">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">{isRtl ? 'المركز الأفضل أداءً' : 'Best Performing Center'}</span>
            <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1">{bestCenterName}</h4>
          </div>
          <div className="absolute right-[-10px] top-[-10px] text-[#FBAE42]/5 text-6xl font-black select-none pointer-events-none">🥇</div>
        </div>

        {/* Most Active Volunteer */}
        <div className="bg-[#014976]/5 dark:bg-[#172033] border border-[#014976]/15 dark:border-slate-850 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-550 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">{isRtl ? 'المتطوع الأكثر نشاطاً' : 'Most Active Volunteer'}</span>
            <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1">{bestVolunteerName}</h4>
          </div>
          <div className="absolute right-[-10px] top-[-10px] text-emerald-500/5 text-6xl font-black select-none pointer-events-none">🎖️</div>
        </div>

        {/* Quick actions panel */}
        <div className="bg-[#014976]/5 dark:bg-[#172033] border border-[#014976]/15 dark:border-slate-850 p-4 rounded-2xl flex flex-col justify-center gap-2">
          <span className="text-[10px] text-slate-400 font-black block mb-0.5">{isRtl ? 'اختصارات الإجراءات السريعة' : 'Quick Dashboard Actions'}</span>
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold text-[#014976] dark:text-[#FBAE42]">
            <Link 
              href="/dashboard/volunteer/new-visit" 
              className="bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-850/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-center gap-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{isRtl ? 'إضافة نزولة' : 'New Visit'}</span>
            </Link>
            <Link 
              href="/dashboard/requests" 
              className="bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-850/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-center gap-1"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{isRtl ? 'طلبات التسجيل' : 'Requests'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Boards Statistics Sub-counter grid */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-start">
        {/* Installation efficiency */}
        <div className="col-span-2 lg:col-span-1 bg-[#014976] text-white p-5 rounded-2xl flex flex-col justify-between min-h-[125px] shadow-lg border-b-4 border-slate-900/30">
          <p className="text-[10px] font-bold text-slate-200">نسبة تثبيت البوردات</p>
          <h3 className="text-3xl font-black font-mono">
            <AnimatedCounter value={totalBoardsReceived > 0 ? (totalBoardsInstalled / totalBoardsReceived) * 100 : 0} suffix="%" />
          </h3>
          <span className="text-[9px] text-slate-300 font-bold">لوحات مثبتة من مستلمة</span>
        </div>

        {/* Boards Received */}
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[125px] hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">بوردات مستلمة</span>
            <Clipboard className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono">
              <AnimatedCounter value={totalBoardsReceived} />
            </h3>
            <p className="text-[9px] text-slate-400 font-bold">سلمت للمتطوعين للتثبيت</p>
          </div>
        </div>

        {/* Boards Installed */}
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[125px] hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">بوردات مثبتة</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono">
              <AnimatedCounter value={totalBoardsInstalled} />
            </h3>
            <p className="text-[9px] text-slate-400 font-bold">لوحات مثبتة بنجاح</p>
          </div>
        </div>

        {/* Boards Returned */}
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[125px] hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">بوردات مرتجعة</span>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono">
              <AnimatedCounter value={totalBoardsReturned} />
            </h3>
            <p className="text-[9px] text-slate-400 font-bold">مرتجعة للمخزن الرئيسي</p>
          </div>
        </div>

        {/* Monthly visits */}
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[125px] hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">نزولات الشهر</span>
            <Compass className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono">
              <AnimatedCounter value={monthlyVisits} />
            </h3>
            <p className="text-[9px] text-slate-400 font-bold">إجمالي آخر 30 يوماً</p>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      {mounted && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-start">
          
          {/* Chart 1: Visits per Day */}
          <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div>
              <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                <BarChart2 className="h-4.5 w-4.5 text-[#014976] dark:text-[#FBAE42]" />
                معدل النزولات (آخر 7 أيام)
              </h4>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartVisitsPerDay} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#014976" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#014976" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="visits" stroke="#014976" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Boards Installed Per Center */}
          <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div>
              <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                <Building className="h-4.5 w-4.5 text-[#014976] dark:text-[#FBAE42]" />
                اللوحات المثبتة حسب المراكز
              </h4>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartBoardsPerCenter} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                  <Bar dataKey="installed" fill="#FBAE42" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Top Volunteers */}
          <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div>
              <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                <Trophy className="h-4.5 w-4.5 text-[#014976] dark:text-[#FBAE42]" />
                أكثر المتطوعين تثبيتاً للألواح
              </h4>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartTopVolunteers} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} width={65} />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                  <Bar dataKey="installed" fill="#014976" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Categories breakdown */}
          <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div>
              <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                <PieIcon className="h-4.5 w-4.5 text-[#014976] dark:text-[#FBAE42]" />
                تصنيفات المحلات المقبولة
              </h4>
            </div>
            <div className="h-60 flex items-center justify-center">
              {chartCategories.length === 0 ? (
                <span className="text-xs text-slate-400 font-medium">{t('noData')}</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 5: Rejected Reasons */}
          <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div>
              <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                <XCircle className="h-4.5 w-4.5 text-red-500" />
                أسباب الرفض الأكثر شيوعاً
              </h4>
            </div>
            <div className="h-60 flex items-center justify-center">
              {chartRejectedReasons.length === 0 ? (
                <span className="text-xs text-slate-400 font-medium">{t('noData')}</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartRejectedReasons}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={70}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {chartRejectedReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Activity Log (Mini Audit Trail) */}
          <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-[#014976] dark:text-[#FBAE42]" />
              سجل أنشطة المبادرة الأخيرة
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {logs.slice(0, 6).map((log) => (
                <div key={log.id} className="text-xs border-r-2 border-[#014976]/35 dark:border-[#FBAE42]/40 pr-3.5 py-1 relative">
                  <span className="absolute right-[-4px] top-2.5 h-1.5 w-1.5 rounded-full bg-[#014976] dark:bg-[#FBAE42]" />
                  <p className="font-bold text-slate-750 dark:text-slate-250 leading-snug">{log.description}</p>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                    {new Date(log.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </section>
      )}

      {/* Global Search Results Panel */}
      {isSearchActive && (
        <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4 text-start">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/85 pb-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-white">
              نتائج البحث عن المتطوعين: "{search}"
            </h3>
            <span className="text-xs bg-[#014976]/10 text-[#014976] dark:bg-[#FBAE42]/10 dark:text-[#FBAE42] px-3 py-1 rounded-full font-bold">
              {filteredVolunteers.length} متطوع
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVolunteers.map(vol => (
              <div key={vol.id} className="p-4 bg-slate-55 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">{vol.name}</h4>
                <p className="text-[10px] text-slate-500">الهاتف: {vol.phone}</p>
                <p className="text-[10px] text-slate-500">المركز: {vol.center?.name || 'غير محدد'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-[#014976] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
