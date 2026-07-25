'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp, AppProvider } from '@/context/AppContext';
import { getCenters, getVolunteers, getVisits } from '@/lib/db';
import { Center, Visit } from '@/types';
import AnimatedCounter from '@/components/AnimatedCounter';
import { 
  Building2, CalendarDays, Users, Heart, Trophy, LogIn, Globe, 
  Moon, Sun, CheckCircle2, ShieldAlert, Sparkles, HelpCircle, 
  MapPin, Phone, Mail, ArrowUpRight, Check, Compass, Star, ChevronDown
} from 'lucide-react';

function LandingPageContent() {
  const { lang, theme, setLang, setTheme, t } = useApp();
  
  const [centers, setCenters] = useState<Center[]>([]);
  const [volunteersCount, setVolunteersCount] = useState(0);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const isRtl = lang === 'ar';

  useEffect(() => {
    async function fetchPublicData() {
      try {
        setLoading(true);
        const [c, v, vt] = await Promise.all([
          getCenters(),
          getVolunteers(),
          getVisits()
        ]);
        
        const sortedCenters = [...c].sort((a, b) => (b.score || 0) - (a.score || 0));
        setCenters(sortedCenters);
        setVolunteersCount(v.length);
        setVisits(vt);
      } catch (e) {
        console.warn('Failed to load public data:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchPublicData();
  }, []);

  const totalVisits = visits.length;
  const totalInstalled = visits.reduce((sum, v) => sum + (v.boards_installed || 0), 0);
  const totalAccepted = visits.flatMap(v => v.accepted_restaurants || []).length;
  const totalRejected = visits.flatMap(v => v.rejected_restaurants || []).length;

  const faqs = [
    {
      q: isRtl ? 'كيف ينضم المتطوعون الجدد للعمل الميداني؟' : 'How do new volunteers join?',
      a: isRtl 
        ? 'يمكن للمتطوع الجديد الضغط على "إنشاء حساب جديد" وتعبئة بيانات الاسم والهاتف واختيار المركز التابع له. يتم إرسال الطلب للمسؤولين للمراجعة وتفعيل الحساب قبل التمكن من الدخول.'
        : 'New volunteers can register by clicking "Create New Account", entering their name, phone, and center. The registration goes to pending approval, and the administrator will activate it.'
    },
    {
      q: isRtl ? 'كيف يتم احتساب النقاط وتصنيف المراكز؟' : 'How is center ranking score computed?',
      a: isRtl
        ? 'يتم احتساب النقاط تلقائياً بناءً على المعادلة: (لوحات مثبتة × 10) + (محلات مقبولة × 5) + (نزولات ميدانية × 2). تساهم كل نزولة موثقة في رفع تصنيف مركزك الفرعي بجدول الصدارة.'
        : 'Scores are computed using the formula: (boards installed × 10) + (accepted stores × 5) + (visits logged × 2). Every documented visit dynamically elevates your center\'s score.'
    },
    {
      q: isRtl ? 'هل يتم توثيق المحلات المعتذرة (المرفوضة)؟' : 'Are rejected shops recorded?',
      a: isRtl
        ? 'نعم، يوثق النظام المحلات المعتذرة مع تحديد أسباب الرفض (مثال: عدم ملاءمة المكان، أسباب دينية، إلخ) لضمان دقة التقارير الميدانية وتحديث قواعد البيانات الاستراتيجية.'
        : 'Yes, volunteers log rejected shops and select reasons (e.g., location spacing, shopkeeper decline) to ensure the integrity of the center statistics.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300">
      
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#0f172a]/75 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/85 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Life Makers Logo" 
            className="h-10 w-10 object-contain rounded-xl bg-slate-800/20 p-1 border border-slate-700/30" 
          />
          <div className="text-start">
            <h1 className="text-sm sm:text-base font-black text-[#014976] dark:text-white leading-tight">
              {t('appName')}
            </h1>
            <p className="text-[10px] text-[#FBAE42] font-black uppercase tracking-wide">
              {isRtl ? 'صناع الحياة - القليوبية' : 'Life Makers - Qalyubia'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="p-2 text-slate-500 hover:text-[#014976] dark:text-slate-400 dark:hover:text-[#FBAE42] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 text-xs font-bold focus:outline-none cursor-pointer"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 text-slate-500 hover:text-[#014976] dark:text-slate-400 dark:hover:text-[#FBAE42] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none cursor-pointer"
          >
            {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </button>

          <Link
            href="/login"
            className="flex items-center gap-2 bg-[#014976] hover:bg-[#013556] text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer border-b-2 border-slate-900/20 active:scale-[0.98]"
          >
            <LogIn className="h-4 w-4" />
            <span>{t('login')}</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 space-y-20">
        
        {/* 1. Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-6 text-start">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 bg-[#FBAE42]/10 text-[#014976] dark:text-[#FBAE42] font-black text-xs px-3.5 py-1.5 rounded-full border border-[#FBAE42]/20">
              <Sparkles className="h-4 w-4 text-[#FBAE42] animate-bounce" />
              {isRtl ? 'لوحة المتابعة الميدانية المركزية' : 'Central Field Operations Portal'}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#014976] dark:text-white leading-tight">
              {isRtl 
                ? 'وثّق نزولاتك، وانشر الخير بلوحات صبورة المحروسة'
                : 'Document Placements, Track Progress, Drive Charity Impact'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              {isRtl 
                ? 'تم تصميم منصة صبورة المحروسة لمتطوعي صناع الحياة بمحافظة القليوبية لتسجيل جولاتهم، توثيق تعليق اللوحات الخيرية وتصدير البيانات بطريقة سريعة وتكاملية.'
                : 'Saboura El Mahrousa portal enables Life Makers volunteers in Qalyubia to log merchant placements, record acceptances, and monitor dynamic leaderboard performance.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link 
                href="/login" 
                className="bg-[#FBAE42] hover:bg-[#eb9d30] text-[#014976] font-black text-xs px-6 py-3.5 rounded-xl shadow-lg border-b-2 border-slate-900/20 transition-all active:scale-[0.98]"
              >
                {isRtl ? 'تسجيل دخول المتطوعين' : 'Volunteer Login'}
              </Link>
              <Link 
                href="/register" 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-350 font-bold text-xs px-6 py-3.5 rounded-xl transition-all"
              >
                {isRtl ? 'إنشاء حساب متطوع جديد' : 'Register New Volunteer'}
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md bg-gradient-to-br from-[#014976] to-[#013556] rounded-3xl p-8 text-white space-y-6 shadow-2xl relative z-10 border border-slate-850">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" className="h-9 w-9 object-contain bg-white/10 p-1 rounded-lg" />
                  <span className="text-xs font-black">{isRtl ? 'جدول الصدارة الميداني' : 'Top Center Rankings'}</span>
                </div>
                <Trophy className="h-5 w-5 text-[#FBAE42]" />
              </div>

              {/* Mini visual ranking items */}
              <div className="space-y-4 text-xs font-bold">
                {centers.slice(0, 3).map((c, i) => (
                  <div key={c.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                      <span>{c.name}</span>
                    </div>
                    <span className="text-[#FBAE42] font-mono">{c.score} نقطة</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Absolute blur layout highlights */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FBAE42]/10 rounded-full filter blur-3xl pointer-events-none" />
          </div>
        </section>

        {/* 2. About Initiative Section */}
        <section className="bg-slate-50 dark:bg-slate-900/35 border border-slate-150 dark:border-slate-850 p-8 rounded-3xl text-start space-y-6">
          <div className="max-w-2xl space-y-2">
            <h3 className="text-xl font-black text-slate-850 dark:text-white flex items-center gap-2">
              <Compass className="h-5.5 w-5.5 text-[#014976] dark:text-[#FBAE42]" />
              {isRtl ? 'عن مبادرة صبورة المحروسة' : 'About Saboura El Mahrousa'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {isRtl 
                ? 'تهدف مبادرة صبورة المحروسة إلى نشر اللوحات التوعوية والخيرية في المنشآت الخدمية بمحافظة القليوبية، لتذكير الجمهور بعمل الخير وبث روح التضامن والتكامل الاجتماعي.'
                : 'A community engagement campaign logging social impact and placing local boards across key neighborhoods to spark civic unity.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#172033] p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
              <span className="text-2xl">🏬</span>
              <h4 className="text-xs font-black text-slate-800 dark:text-white">{isRtl ? 'الزيارات والنزولات الميدانية' : 'Field Engagements'}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">زيارة المطاعم، المقاهي، المحلات والماركت والتفاعل مع أصحابها لعرض فكرة اللوحات الخيرية وتوثيق استجابتهم.</p>
            </div>
            <div className="bg-white dark:bg-[#172033] p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
              <span className="text-2xl">📌</span>
              <h4 className="text-xs font-black text-slate-800 dark:text-white">{isRtl ? 'تثبيت اللوحات التوعوية' : 'Charity Placements'}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">تركيب الألواح وتثبيتها بشكل آمن وجميل في الأماكن البارزة والمطاعم المشاركة لتصل لأكبر عدد من المستفيدين.</p>
            </div>
            <div className="bg-white dark:bg-[#172033] p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
              <span className="text-2xl">📊</span>
              <h4 className="text-xs font-black text-slate-800 dark:text-white">{isRtl ? 'التقارير الميدانية والأثر' : 'Dynamic Analytics'}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">رصد فوري لعدد البوردات النشطة بالشارع، المرتجعة للفرع، وإصدار ملفات المتابعة والتقارير الإحصائية دورياً.</p>
            </div>
          </div>
        </section>

        {/* 3. Statistics Section (with count ups) */}
        <section className="space-y-6 text-start">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-850 dark:text-white">{isRtl ? 'المؤشرات الرقمية العامة' : 'Central Performance Metrics'}</h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-405 font-bold">تحديث فوري مباشر لإحصائيات العمل الميداني على مستوى المحافظة</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Centers Count */}
            <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[110px]">
              <span className="text-[9px] font-black text-slate-450 uppercase">{t('centers')}</span>
              <Building2 className="h-5 w-5 text-[#014976] dark:text-[#FBAE42]" />
              <h3 className="text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">
                {loading ? '0' : <AnimatedCounter value={centers.length} />}
              </h3>
            </div>

            {/* Volunteers count */}
            <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[110px]">
              <span className="text-[9px] font-black text-slate-450 uppercase">{t('volunteers')}</span>
              <Users className="h-5 w-5 text-[#014976] dark:text-[#FBAE42]" />
              <h3 className="text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">
                {loading ? '0' : <AnimatedCounter value={volunteersCount} />}
              </h3>
            </div>

            {/* Visits count */}
            <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[110px]">
              <span className="text-[9px] font-black text-slate-450 uppercase">{t('visits')}</span>
              <CalendarDays className="h-5 w-5 text-[#014976] dark:text-[#FBAE42]" />
              <h3 className="text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">
                {loading ? '0' : <AnimatedCounter value={totalVisits} />}
              </h3>
            </div>

            {/* Installed Count */}
            <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[110px]">
              <span className="text-[9px] font-black text-slate-455 uppercase">{t('boardsInstalled')}</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono mt-1">
                {loading ? '0' : <AnimatedCounter value={totalInstalled} />}
              </h3>
            </div>

            {/* Accepted store count */}
            <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between min-h-[110px] col-span-2 md:col-span-1">
              <span className="text-[9px] font-black text-slate-455 uppercase">{t('acceptedRestaurants')}</span>
              <Heart className="h-5 w-5 text-red-500" />
              <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono mt-1">
                {loading ? '0' : <AnimatedCounter value={totalAccepted} />}
              </h3>
            </div>
          </div>
        </section>

        {/* 4. Connected Operations Timeline */}
        <section className="space-y-8 text-start">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-850 dark:text-white">{isRtl ? 'دورة العمل الميداني للوحة التوعوية' : 'Placement Field Operations Lifecycle'}</h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold">المراحل الأربعة لنزولات المتطوعين وتثبيت اللوحات الخيرية</p>
          </div>

          <div className="relative border-r-2 md:border-r-0 md:border-b-2 border-slate-200 dark:border-slate-800 pr-5 md:pr-0 pb-4 md:pb-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative space-y-2">
              <span className="absolute right-[-25px] md:right-auto md:top-[-45px] md:left-4 h-5 w-5 rounded-full bg-[#014976] dark:bg-[#FBAE42] border-4 border-white dark:border-[#0f172a] flex items-center justify-center font-bold text-white text-[8px] font-mono">1</span>
              <h4 className="text-xs font-black text-slate-850 dark:text-white">{isRtl ? 'الاستلام الميداني' : 'Allocating Boards'}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">يقوم المتطوع باستلام اللوحات الخيرية والمواد المساعدة من الفرع المحلي التابع له (مركز بنها، طوخ، إلخ).</p>
            </div>
            {/* Step 2 */}
            <div className="relative space-y-2">
              <span className="absolute right-[-25px] md:right-auto md:top-[-45px] md:left-4 h-5 w-5 rounded-full bg-[#014976] dark:bg-[#FBAE42] border-4 border-white dark:border-[#0f172a] flex items-center justify-center font-bold text-white text-[8px] font-mono">2</span>
              <h4 className="text-xs font-black text-slate-850 dark:text-white">{isRtl ? 'زيارة المنشآت والتواصل' : 'Field Outreach'}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">استهداف المطاعم، المقاهي، الصيدليات والماركت لعرض رسالة اللوحات والاتفاق على التثبيت.</p>
            </div>
            {/* Step 3 */}
            <div className="relative space-y-2">
              <span className="absolute right-[-25px] md:right-auto md:top-[-45px] md:left-4 h-5 w-5 rounded-full bg-[#014976] dark:bg-[#FBAE42] border-4 border-white dark:border-[#0f172a] flex items-center justify-center font-bold text-white text-[8px] font-mono">3</span>
              <h4 className="text-xs font-black text-slate-850 dark:text-white">{isRtl ? 'التعليق والتثبيت الفعلي' : 'Board Placement'}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">تعليق اللوحة الخيرية في المكان المتفق عليه، والتأكد من وضوحها للزبائن والجمهور العام.</p>
            </div>
            {/* Step 4 */}
            <div className="relative space-y-2">
              <span className="absolute right-[-25px] md:right-auto md:top-[-45px] md:left-4 h-5 w-5 rounded-full bg-[#014976] dark:bg-[#FBAE42] border-4 border-white dark:border-[#0f172a] flex items-center justify-center font-bold text-white text-[8px] font-mono">4</span>
              <h4 className="text-xs font-black text-slate-850 dark:text-white">{isRtl ? 'التوثيق الرقمي الفوري' : 'Automated Logging'}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">تسجيل تفاصيل الجولة واللوحات على المنصة ليتم مزامنتها مع خوادم Supabase وملفات الإدارة.</p>
            </div>
          </div>
        </section>

        {/* 5. Leaderboard Preview Section */}
        <section className="space-y-4 text-start">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5.5 w-5.5 text-[#FBAE42]" />
              <div>
                <h3 className="text-base font-black text-slate-850 dark:text-white">{t('leaderboardTitle')}</h3>
                <p className="text-[10px] text-slate-450 dark:text-slate-400">{t('leaderboardSubtitle')}</p>
              </div>
            </div>
            <Link href="/login" className="text-xs font-black text-[#014976] dark:text-[#FBAE42] hover:underline flex items-center gap-1">
              <span>عرض لوحة الصدارة الكاملة</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="glass-card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-black">
                    <th className="p-4.5 text-center w-20">{t('rank')}</th>
                    <th className="p-4.5">{t('centers')}</th>
                    <th className="p-4.5 text-center">{t('score')}</th>
                    <th className="p-4.5 text-center">{t('volunteerCount')}</th>
                    <th className="p-4.5 text-center">{t('visits')}</th>
                    <th className="p-4.5 text-center">{t('boardsInstalled')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                  {loading ? (
                    [1, 2, 3].map(n => (
                      <tr key={n} className="animate-pulse">
                        <td colSpan={6} className="p-4.5 h-10 bg-slate-50/20 dark:bg-slate-900/10" />
                      </tr>
                    ))
                  ) : (
                    centers.slice(0, 5).map((c, index) => {
                      const isPodium = index < 3;
                      const medals = ['🥇', '🥈', '🥉'];
                      
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="p-4.5 text-center">
                            <span className={`inline-flex items-center justify-center font-bold h-6 w-6 rounded-full ${
                              isPodium 
                                ? 'bg-[#FBAE42]/10 text-[#014976] dark:text-[#FBAE42] border border-[#FBAE42]/20' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                              {isPodium ? medals[index] : index + 1}
                            </span>
                          </td>
                          <td className="p-4.5 font-bold text-slate-850 dark:text-slate-150">{c.name}</td>
                          <td className="p-4.5 text-center font-extrabold text-[#014976] dark:text-[#FBAE42]">{c.score || 0}</td>
                          <td className="p-4.5 text-center font-semibold">{c.volunteer_count || 0}</td>
                          <td className="p-4.5 text-center font-semibold">{c.visits_count || 0}</td>
                          <td className="p-4.5 text-center font-extrabold text-emerald-600 dark:text-emerald-450">{c.boards_installed_count || 0}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 6. Accordion Frequently Asked Questions (FAQ) */}
        <section className="space-y-6 text-start max-w-4xl mx-auto">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-850 dark:text-white flex items-center justify-center gap-1.5">
              <HelpCircle className="h-5.5 w-5.5 text-[#014976] dark:text-[#FBAE42]" />
              الأسئلة الشائعة
            </h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold">تعرف على أهم التفاصيل الفنية والتنظيمية لمبادرة صبورة المحروسة</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {faqs.map((faq, index) => {
              const active = activeFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-white dark:bg-[#172033] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(active ? null : index)}
                    className="w-full flex justify-between items-center px-5 py-4 font-bold text-xs text-slate-800 dark:text-white focus:outline-none text-start cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${active ? 'rotate-180' : ''}`} />
                  </button>
                  {active && (
                    <div className="px-5 pb-4.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold border-t border-slate-100 dark:border-slate-850 animate-in slide-in-from-top-1 duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. Call To Action (CTA) & Contact Section */}
        <section className="glass-card p-8 border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden space-y-6 max-w-4xl mx-auto">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-xl sm:text-2xl font-black text-[#014976] dark:text-white">هل أنت متطوع معنا وتبحث عن تسجيل بياناتك الميدانية؟</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              انضم إلينا الآن وساهم في بناء مجتمع متكافل ومترابط. يمكنك إنشاء حساب جديد وتحديد المركز والفرع التابع له لتبدأ التوثيق في دقائق معدودة.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/register"
                className="bg-[#FBAE42] hover:bg-[#eb9d30] text-[#014976] font-black text-xs px-6 py-3 rounded-xl shadow border-b-2 border-slate-900/20 transition-all active:scale-[0.98]"
              >
                إنشاء حساب متطوع جديد
              </Link>
            </div>
          </div>

          <hr className="border-slate-150 dark:border-slate-850" />

          {/* Contact Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-500 pt-2 font-bold">
            <div className="flex flex-col items-center gap-1">
              <MapPin className="h-5 w-5 text-[#014976] dark:text-[#FBAE42]" />
              <span className="mt-1 text-slate-800 dark:text-white">محافظة القليوبية، مصر</span>
              <span className="text-[10px] text-slate-400">المقر الإداري الرئيسي</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Phone className="h-5 w-5 text-[#014976] dark:text-[#FBAE42]" />
              <span className="mt-1 text-slate-800 dark:text-white font-mono" dir="ltr">+20 10 1234 5678</span>
              <span className="text-[10px] text-slate-400">فريق الدعم الميداني</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Mail className="h-5 w-5 text-[#014976] dark:text-[#FBAE42]" />
              <span className="mt-1 text-slate-800 dark:text-white font-mono">qalyubia@lifemakers.org</span>
              <span className="text-[10px] text-slate-400">البريد الإلكتروني الرسمي</span>
            </div>
          </div>

          {/* Background glows decorative */}
          <div className="absolute right-[-30px] bottom-[-30px] w-36 h-36 bg-[#FBAE42]/10 rounded-full filter blur-2xl pointer-events-none" />
          <div className="absolute left-[-30px] top-[-30px] w-36 h-36 bg-[#014976]/5 rounded-full filter blur-2xl pointer-events-none" />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-[#172033] bg-white/60 dark:bg-[#111827] py-8 px-6 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-start">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" className="h-8 w-8 object-contain bg-slate-800/10 p-0.5 rounded-lg" />
            <div>
              <span className="text-slate-800 dark:text-white font-black block">{t('appName')}</span>
              <span className="text-[10px] text-slate-500">نظام المتابعة والتأثير الميداني للوحات صناع الحياة</span>
            </div>
          </div>
          <div className="text-center sm:text-end space-y-1">
            <p>© {new Date().getFullYear()} {t('lifeMakers')}. جميع الحقوق محفوظة.</p>
            <p className="text-[10px] text-slate-500">مبادرة صبورة المحروسة - القليوبية</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function LandingPage() {
  return (
    <AppProvider>
      <LandingPageContent />
    </AppProvider>
  );
}
