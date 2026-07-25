'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import AnimatedCounter from '@/components/AnimatedCounter';
import { useApp } from '@/context/AppContext';
import { getCenters, getVolunteers, getVisits } from '@/lib/db';
import { Center, Volunteer, Visit } from '@/types';
import { 
  Trophy, Users, Calendar, CheckCircle2, XCircle, Phone, ArrowLeft,
  ChevronRight, CalendarDays, ClipboardList, MapPin, Sparkles, UserCheck, ShieldAlert, Building, Star
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Leaderboard() {
  const { lang, t } = useApp();
  
  const [centers, setCenters] = useState<Center[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected sub-views state
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  const isRtl = lang === 'ar';

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [c, v, vt] = await Promise.all([
          getCenters(),
          getVolunteers(),
          getVisits()
        ]);
        
        // Sort centers by score descending
        const sortedCenters = [...c].sort((a, b) => (b.score || 0) - (a.score || 0));
        setCenters(sortedCenters);
        setVolunteers(v);
        setVisits(vt);
      } catch (err) {
        console.error('Failed to load leaderboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getRankMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  // Center Details derived data
  const centerVolunteers = selectedCenter 
    ? volunteers.filter(v => v.center_id === selectedCenter.id)
    : [];
  
  const centerVisits = selectedCenter
    ? visits.filter(v => v.volunteer?.center_id === selectedCenter.id)
    : [];

  const centerVolunteersData = centerVolunteers.map(vol => {
    const volVisits = visits.filter(vt => vt.volunteer_id === vol.id);
    const installed = volVisits.reduce((sum, vt) => sum + (vt.boards_installed || 0), 0);
    return {
      name: vol.name,
      installed
    };
  }).sort((a, b) => b.installed - a.installed).slice(0, 5);

  // Volunteer Details derived data
  const volunteerVisits = selectedVolunteer
    ? visits.filter(v => v.volunteer_id === selectedVolunteer.id)
        .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())
    : [];

  // Calculate maximum score to render relative progress bars
  const maxScore = centers.length > 0 ? Math.max(...centers.map(c => c.score || 1)) : 100;

  return (
    <DashboardLayout allowedRoles={['Administrator', 'Volunteer']}>
      
      {/* 1. MAIN LEADERBOARD VIEW */}
      {!selectedCenter && !selectedVolunteer && (
        <div className="space-y-6">
          <div className="text-start space-y-1">
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Trophy className="h-5.5 w-5.5 text-[#FBAE42]" />
              {t('leaderboardTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('leaderboardSubtitle')}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-44 bg-slate-100 dark:bg-slate-850 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-start">
              {centers.map((c, index) => {
                const medal = getRankMedal(index);
                const isPodium = index < 3;
                const scorePercentage = Math.round(((c.score || 0) / maxScore) * 100);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCenter(c)}
                    className="glass-card p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[220px] hover:scale-[1.01] hover:border-[#FBAE42]/40 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden group"
                  >
                    {/* Medal rank absolute badge */}
                    <div className={`absolute ${isRtl ? 'left-6' : 'right-6'} top-5 text-2xl font-black`}>
                      {medal}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                          {isRtl ? `المركز #${index + 1}` : `Rank #${index + 1}`}
                        </span>
                        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5 mt-1">
                          {c.name}
                          {index === 0 && <Sparkles className="h-4 w-4 text-[#FBAE42] animate-bounce" />}
                        </h3>
                      </div>

                      {/* Big score with AnimatedCounter */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold">{t('score')}</span>
                        <div className="text-2xl font-black text-[#014976] dark:text-[#FBAE42] font-mono">
                          <AnimatedCounter value={c.score || 0} />
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar (Notion/Linear style relative ranking metric) */}
                    <div className="space-y-1.5 mt-3">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                        <span>نسبة الإنجاز النسبية</span>
                        <span>{scorePercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
                        <div 
                          className="bg-gradient-to-r from-[#014976] to-[#FBAE42] h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${scorePercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 text-[10px] font-bold text-slate-500">
                      <div className="text-center bg-slate-50 dark:bg-slate-900/35 p-1.5 rounded-xl">
                        <span className="block text-slate-400">{t('volunteerCount')}</span>
                        <span className="text-xs text-slate-800 dark:text-slate-200">{c.volunteer_count || 0}</span>
                      </div>
                      <div className="text-center bg-slate-50 dark:bg-slate-900/35 p-1.5 rounded-xl">
                        <span className="block text-slate-400">{t('visits')}</span>
                        <span className="text-xs text-slate-800 dark:text-slate-200">{c.visits_count || 0}</span>
                      </div>
                      <div className="text-center bg-slate-50 dark:bg-slate-900/35 p-1.5 rounded-xl">
                        <span className="block text-slate-400">{t('boardsInstalled')}</span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-450">{c.boards_installed_count || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. CENTER DETAILS VIEW */}
      {selectedCenter && !selectedVolunteer && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedCenter(null)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('back')}</span>
          </button>

          <div className="text-start space-y-1">
            <h2 className="text-xl font-black text-[#014976] dark:text-white flex items-center gap-2">
              <Building className="h-5.5 w-5.5 text-[#FBAE42]" />
              {selectedCenter.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'إحصائيات تفصيلية ومستويات أداء متطوعي المركز' : 'Performance details and volunteer stats for this center'}
            </p>
          </div>

          {/* Stats count cards */}
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title={t('score')}
              value={selectedCenter.score || 0}
              icon={Trophy}
              color="accent"
              subtext="نقاط الجودة المجمعة"
            />
            <StatCard
              title={t('volunteers')}
              value={centerVolunteers.length}
              icon={Users}
              color="primary"
              subtext="متطوعون نشطون"
            />
            <StatCard
              title={t('visits')}
              value={selectedCenter.visits_count || 0}
              icon={Calendar}
              color="success"
              subtext="إجمالي نزولات ميدانية"
            />
            <StatCard
              title={t('boardsInstalled')}
              value={selectedCenter.boards_installed_count || 0}
              icon={CheckCircle2}
              color="info"
              subtext="لوحة مثبتة فعلياً"
            />
            <StatCard
              title={t('acceptedRestaurants')}
              value={selectedCenter.accepted_count || 0}
              icon={UserCheck}
              color="success"
              subtext={`مرفوض: ${selectedCenter.rejected_count || 0}`}
            />
          </section>

          {/* Center Chart */}
          {centerVolunteersData.length > 0 && (
            <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 space-y-4 text-start">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                أكثر متطوعي المركز تثبيتاً للوحات
              </h4>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={centerVolunteersData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="installed" fill="#014976" radius={[4, 4, 0, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Volunteer List */}
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-black text-slate-855 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-3 text-start">
              قائمة متطوعي المركز ({centerVolunteers.length})
            </h3>
            
            {centerVolunteers.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 font-medium">{t('noData')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {centerVolunteers.map(vol => (
                  <div
                    key={vol.id}
                    onClick={() => setSelectedVolunteer(vol)}
                    className="p-4 bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-xl hover:border-[#FBAE42]/40 transition-all cursor-pointer text-start flex justify-between items-center group"
                  >
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-slate-800 dark:text-white group-hover:text-[#014976] dark:group-hover:text-[#FBAE42] transition-colors">
                        {vol.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span dir="ltr">{vol.phone}</span>
                      </p>
                      
                      {/* Stats grid */}
                      <div className="flex gap-3 text-[9px] font-bold text-slate-500">
                        <span>النزولات: {vol.visits_count || 0}</span>
                        <span className="text-emerald-600 dark:text-emerald-450 font-black">المثبتة: {vol.boards_installed || 0}</span>
                        <span className="text-[#014976] dark:text-[#FBAE42]">مقبول: {vol.accepted_count || 0}</span>
                      </div>
                    </div>
                    
                    <ChevronRight className={`h-4.5 w-4.5 text-slate-400 group-hover:text-[#014976] dark:group-hover:text-[#FBAE42] transition-transform ${isRtl ? 'rotate-180' : ''}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. VOLUNTEER PROFILE VIEW */}
      {selectedVolunteer && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedVolunteer(null)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>
              {selectedCenter 
                ? `${t('back')} (تفاصيل ${selectedCenter.name})`
                : t('back')}
            </span>
          </button>

          {/* Profile overview card */}
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-start">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#014976]/10 border border-[#014976]/20 flex items-center justify-center text-[#014976] dark:text-[#FBAE42] font-black text-2xl shadow-sm">
                {selectedVolunteer.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-800 dark:text-white">{selectedVolunteer.name}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span dir="ltr">{selectedVolunteer.phone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" />
                    <span>{selectedVolunteer.center?.name || 'بدون مركز'}</span>
                  </span>
                </div>
              </div>
            </div>
            
            {/* Volunteer specific parameters */}
            <div className="text-[10px] text-slate-400 font-bold border-r-2 border-slate-200 dark:border-slate-850 pr-4">
              <p>رقم الحساب: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{selectedVolunteer.id.substring(0, 8)}</code></p>
              <p>تاريخ الانضمام: {new Date(selectedVolunteer.created_at || '').toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>
            </div>
          </div>

          {/* Stats counters */}
          <section className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-start">
            <StatCard
              title={t('visits')}
              value={selectedVolunteer.visits_count || 0}
              icon={CalendarDays}
              color="primary"
            />
            <StatCard
              title={t('boardsReceived')}
              value={selectedVolunteer.boards_received || 0}
              icon={ClipboardList}
              color="info"
            />
            <StatCard
              title={t('boardsInstalled')}
              value={selectedVolunteer.boards_installed || 0}
              icon={CheckCircle2}
              color="success"
            />
            <StatCard
              title={t('boardsReturned')}
              value={selectedVolunteer.boards_returned || 0}
              icon={XCircle}
              color="danger"
            />
            <StatCard
              title={t('acceptedRestaurants')}
              value={selectedVolunteer.accepted_count || 0}
              icon={UserCheck}
              color="accent"
            />
            <StatCard
              title={t('rejectedRestaurants')}
              value={selectedVolunteer.rejected_count || 0}
              icon={ShieldAlert}
              color="danger"
            />
          </section>

          {/* Visits History Timeline */}
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-black text-slate-850 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-3 text-start">
              {t('visitHistory')}
            </h3>
            
            {volunteerVisits.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 font-medium">{t('noData')}</p>
            ) : (
              <div className="space-y-4">
                {volunteerVisits.map(v => (
                  <div key={v.id} className="p-4 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800/80 rounded-xl text-start space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#014976] dark:text-[#FBAE42]">
                        {new Date(v.visit_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{v.visit_time}</span>
                    </div>
                    {v.notes && <p className="text-xs text-slate-655 dark:text-slate-300">{v.notes}</p>}
                    
                    <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                      <span className="text-emerald-600 dark:text-emerald-450">✓ لوحات مثبتة: {v.boards_installed}</span>
                      <span className="text-red-500"> مرتجع: {v.boards_returned}</span>
                      <span className="text-slate-500"> مستلم: {v.boards_received}</span>
                    </div>

                    {/* Dynamic Restaurant breakdowns on card */}
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {v.accepted_restaurants?.map((ar, i) => (
                        <span key={i} className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                          {ar.name} ({t(ar.category)})
                        </span>
                      ))}
                      {v.rejected_restaurants?.map((rr, i) => (
                        <span key={i} className="text-[9px] bg-red-50 text-red-650 dark:bg-red-955/20 dark:text-red-400 px-2.5 py-0.5 rounded-full font-bold">
                          {rr.name} (معتذر: {rr.reason})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
