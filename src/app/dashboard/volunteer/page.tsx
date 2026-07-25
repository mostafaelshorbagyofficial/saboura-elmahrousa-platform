'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/components/DashboardLayout';
import AnimatedCounter from '@/components/AnimatedCounter';
import { getVisits } from '@/lib/db';
import { Visit } from '@/types';
import { Plus, Calendar, FileText, Phone, Building, LayoutList, CheckCircle2, XCircle, Trophy, CalendarDays, Award, Star } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VolunteerDashboardContent() {
  const { volunteerDetails, profile, user } = useAuth();
  const { lang, t } = useApp();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('/avatar-placeholder.png');
  const [stats, setStats] = useState({
    visits: 0,
    received: 0,
    installed: 0,
    returned: 0,
    accepted: 0,
    rejected: 0,
  });

  const isRtl = lang === 'ar';

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`saboura_avatar_${user.id}`);
      if (saved) setAvatarUrl(saved);
    }
  }, [user]);

  useEffect(() => {
    async function loadData() {
      if (!volunteerDetails) return;
      try {
        setLoading(true);
        const allVisits = await getVisits();
        const myVisits = allVisits.filter(v => v.volunteer_id === volunteerDetails.id);
        setVisits(myVisits);

        const totals = myVisits.reduce((acc, v) => {
          acc.visits += 1;
          acc.received += v.boards_received || 0;
          acc.installed += v.boards_installed || 0;
          acc.returned += v.boards_returned || 0;
          acc.accepted += v.accepted_restaurants?.length || 0;
          acc.rejected += v.rejected_restaurants?.length || 0;
          return acc;
        }, { visits: 0, received: 0, installed: 0, returned: 0, accepted: 0, rejected: 0 });

        setStats(totals);
      } catch (err) {
        console.error('Failed to load volunteer data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [volunteerDetails]);

  // Filter visits
  const filteredVisits = visits.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchDate = v.visit_date.includes(q);
    const matchNotes = v.notes?.toLowerCase().includes(q) || false;
    const matchAccepted = v.accepted_restaurants?.some(r => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)) || false;
    const matchRejected = v.rejected_restaurants?.some(r => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q)) || false;
    return matchDate || matchNotes || matchAccepted || matchRejected;
  });

  const score = (stats.installed * 10) + (stats.accepted * 5) + (stats.visits * 2);

  return (
    <DashboardLayout allowedRoles={['Volunteer']}>
      
      {/* Volunteer Profile Banner */}
      <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        
        <div className="flex items-center gap-4 relative z-10 text-start">
          <img 
            src={avatarUrl} 
            alt="Volunteer Avatar" 
            className="h-16 w-16 rounded-2xl object-cover border-2 border-[#014976]/25 dark:border-slate-700 shadow-md bg-white shrink-0" 
          />
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-850 dark:text-white flex items-center gap-1.5">
              {profile?.name}
              <span className="text-[9px] bg-[#FBAE42]/10 text-[#014976] dark:text-[#FBAE42] border border-[#FBAE42]/20 px-2 py-0.5 rounded-full font-black">
                ★ {isRtl ? 'متطوع نشط' : 'Active Volunteer'}
              </span>
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-bold">
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-[#014976] dark:text-[#FBAE42]" />
                <span dir="ltr">{volunteerDetails?.phone || '010XXXXXXXX'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-[#014976] dark:text-[#FBAE42]" />
                <span>المركز: {volunteerDetails?.center?.name || t('noData')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Large Add Visit Action Button */}
        <div className="w-full md:w-auto relative z-10 flex items-center gap-3">
          <div className="bg-[#014976] text-white p-3.5 rounded-2xl text-center shadow border-b-2 border-slate-900/30 flex items-center gap-2">
            <Trophy className="h-4.5 w-4.5 text-[#FBAE42]" />
            <div className="text-start">
              <span className="text-[8px] text-slate-200 block uppercase font-bold">{isRtl ? 'مؤشر أدائي الميداني' : 'My Performance Score'}</span>
              <span className="text-sm font-black font-mono"><AnimatedCounter value={score} /></span>
            </div>
          </div>
          
          <Link
            href="/dashboard/volunteer/new-visit"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#FBAE42] hover:bg-[#eb9d30] text-[#014976] font-black text-xs px-5 py-4.5 rounded-2xl shadow-lg transition-all border-b-2 border-slate-900/20 active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" />
            <span>{t('addVisit')}</span>
          </Link>
        </div>

        {/* Visual decoration glows */}
        <div className="absolute -right-24 -bottom-24 w-48 h-48 bg-[#FBAE42]/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -top-24 w-48 h-48 bg-[#014976]/5 rounded-full filter blur-3xl pointer-events-none" />
      </div>

      {/* Statistics Grid with count ups */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-start">
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[120px] hover:scale-[1.01] transition-transform">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{t('visits')}</span>
          <CalendarDays className="h-5 w-5 text-[#014976] dark:text-[#FBAE42] mt-1" />
          <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono mt-2">
            <AnimatedCounter value={stats.visits} />
          </h3>
        </div>

        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[120px] hover:scale-[1.01] transition-transform">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{t('boardsReceived')}</span>
          <LayoutList className="h-5 w-5 text-slate-400 mt-1" />
          <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono mt-2">
            <AnimatedCounter value={stats.received} />
          </h3>
        </div>

        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[120px] hover:scale-[1.01] transition-transform">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{t('boardsInstalled')}</span>
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-1" />
          <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono mt-2">
            <AnimatedCounter value={stats.installed} />
          </h3>
        </div>

        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[120px] hover:scale-[1.01] transition-transform">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{t('boardsReturned')}</span>
          <XCircle className="h-5 w-5 text-red-500 mt-1" />
          <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono mt-2">
            <AnimatedCounter value={stats.returned} />
          </h3>
        </div>

        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[120px] hover:scale-[1.01] transition-transform">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{isRtl ? 'المطاعم المقبولة' : 'Accepted Stores'}</span>
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-1" />
          <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono mt-2">
            <AnimatedCounter value={stats.accepted} />
          </h3>
        </div>

        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[120px] hover:scale-[1.01] transition-transform">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{isRtl ? 'المطاعم المعتذرة' : 'Rejected Stores'}</span>
          <XCircle className="h-5 w-5 text-red-500 mt-1" />
          <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono mt-2">
            <AnimatedCounter value={stats.rejected} />
          </h3>
        </div>
      </section>

      {/* History visit list */}
      <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
          <div className="text-start">
            <h3 className="text-sm font-black text-slate-850 dark:text-slate-200">{t('visitHistory')}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">قائمة النزولات المسجلة تحت حسابك الشخصي</p>
          </div>
          {search && (
            <div className="text-[11px] bg-[#014976]/10 text-[#014976] dark:bg-[#FBAE42]/10 dark:text-[#FBAE42] px-3 py-1 rounded-full font-bold">
              {lang === 'ar' ? `نتائج البحث عن: "${search}"` : `Search results for: "${search}"`} ({filteredVisits.length})
            </div>
          )}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-16 bg-slate-100 dark:bg-slate-850 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-xs font-bold">{t('noData')}</p>
            </div>
          ) : (
            filteredVisits.map((v) => (
              <div
                key={v.id}
                className="p-4 bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-350 dark:hover:border-slate-700 transition-colors text-start animate-in fade-in duration-200"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-850 dark:text-slate-100 flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-[#014976] dark:text-[#FBAE42]" />
                      {new Date(v.visit_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-850 px-2 py-0.5 rounded font-mono">
                      {v.visit_time}
                    </span>
                  </div>

                  {v.notes && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1">
                      <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{v.notes}</span>
                    </p>
                  )}

                  {/* Stat badges line */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-bold">
                    <span className="text-emerald-600 dark:text-emerald-450">
                      ✓ {lang === 'ar' ? `لوحات مثبتة: ${v.boards_installed}` : `Installed: ${v.boards_installed}`}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {lang === 'ar' ? `مستلم: ${v.boards_received}` : `Received: ${v.boards_received}`}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-red-500 dark:text-red-400">
                      {lang === 'ar' ? `مرتجع: ${v.boards_returned}` : `Returned: ${v.boards_returned}`}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-[#014976] dark:text-[#FBAE42]">
                      {lang === 'ar' ? `المقبولة: ${v.accepted_restaurants?.length || 0}` : `Accepted: ${v.accepted_restaurants?.length || 0}`}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-orange-500 dark:text-orange-400">
                      {lang === 'ar' ? `المرفوضة: ${v.rejected_restaurants?.length || 0}` : `Rejected: ${v.rejected_restaurants?.length || 0}`}
                    </span>
                  </div>
                </div>

                {/* Restaurant labels list */}
                <div className="flex flex-wrap gap-1.5 justify-end w-full md:w-auto">
                  {v.accepted_restaurants?.map((ar, i) => (
                    <span key={i} className="text-[9px] font-black bg-[#014976]/5 text-[#014976] dark:bg-[#FBAE42]/10 dark:text-[#FBAE42] border border-[#014976]/10 dark:border-transparent px-2.5 py-1 rounded-full">
                      {ar.name} ({t(ar.category)})
                    </span>
                  ))}
                  {v.rejected_restaurants?.map((rr, i) => (
                    <span key={i} className="text-[9px] font-black bg-red-50 text-red-650 dark:bg-red-955/20 dark:text-red-450 border border-red-100 dark:border-transparent px-2.5 py-1 rounded-full">
                      {rr.name} ({t(rr.category)}) - {rr.reason}
                    </span>
                  ))}
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </DashboardLayout>
  );
}

export default function VolunteerDashboard() {
  return (
    <Suspense fallback={
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-[#014976] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VolunteerDashboardContent />
    </Suspense>
  );
}
