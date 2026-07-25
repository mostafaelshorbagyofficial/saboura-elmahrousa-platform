'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { LogIn, Key, Mail, AlertCircle, Globe, Moon, Sun, ShieldAlert, Sparkles } from 'lucide-react';
import Link from 'next/link';

function LoginFormContent() {
  const { login, loading } = useAuth();
  const { lang, theme, setLang, setTheme, t } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showForgotMsg, setShowForgotMsg] = useState(false);
  const router = useRouter();

  const isRtl = lang === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Dynamic validations
    if (!email.trim() || !password) {
      setError(isRtl ? 'يرجى ملء جميع الحقول المطلوبة.' : 'Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(isRtl ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      // Synchronously check the role from cookies to redirect immediately
      const match = document.cookie.match(/sb_role=([^;]+)/);
      const userRole = match ? match[1] : 'Volunteer';
      
      if (userRole === 'Administrator') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/volunteer');
      }
    } else {
      setError(res.error || (isRtl ? 'بيانات الدخول غير صحيحة أو الحساب بانتظار تفعيل الإدارة.' : 'Invalid credentials or account is pending administrator approval.'));
    }
  };

  return (
    <div className="w-full max-w-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 p-8 space-y-6 rounded-3xl shadow-2xl relative z-10 text-start animate-in fade-in zoom-in duration-300">
      
      {/* Settings bar */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="text-slate-500 hover:text-[#014976] dark:hover:text-[#FBAE42] flex items-center gap-1.5 text-xs font-bold focus:outline-none transition-colors cursor-pointer"
        >
          <Globe className="h-4 w-4" />
          <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
        </button>
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="text-slate-500 hover:text-[#014976] dark:hover:text-[#FBAE42] focus:outline-none transition-colors cursor-pointer"
        >
          {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Brand Header */}
      <div className="text-center space-y-3.5">
        <div className="relative inline-flex">
          <div className="h-14 w-14 bg-[#014976] border-2 border-[#FBAE42] rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-lg relative z-10">
            ص
          </div>
          <div className="absolute inset-0 bg-[#014976]/30 dark:bg-[#FBAE42]/20 rounded-2xl filter blur-md animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
            {t('loginTitle')}
            <Sparkles className="h-4.5 w-4.5 text-[#FBAE42] animate-bounce" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            {t('loginSubtitle')}
          </p>
        </div>
      </div>

      {/* Forgot Password modal message */}
      {showForgotMsg && (
        <div className="bg-[#014976]/5 dark:bg-[#FBAE42]/5 border border-[#014976]/10 dark:border-[#FBAE42]/20 p-4 rounded-2xl text-xs text-slate-700 dark:text-slate-350 space-y-2 text-start relative animate-in slide-in-from-top duration-300">
          <button 
            onClick={() => setShowForgotMsg(false)} 
            className="absolute top-2.5 left-2.5 text-slate-400 hover:text-slate-650 font-bold"
          >
            ✕
          </button>
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-[#014976] dark:text-[#FBAE42] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-[#014976] dark:text-[#FBAE42] mb-1">
                {isRtl ? 'إعادة تعيين كلمة المرور' : 'Password Reset Info'}
              </h4>
              <p className="leading-relaxed">
                {isRtl 
                  ? 'من أجل سلامة وأمان النظام، يرجى التواصل مع مسؤول المركز أو فرع المحافظة التابع له لإعادة تعيين كلمة المرور الخاصة بك.'
                  : 'For security reasons, please contact your local center coordinator or Qalyubia administrator to reset your password.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 animate-in shake duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-slate-400" />
            {t('email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@lifemakers.org"
            className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 focus:border-[#014976] dark:focus:border-[#FBAE42] focus:ring-1 focus:ring-[#014976] rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none transition-all text-left font-semibold"
            dir="ltr"
            required
          />
        </div>

        {/* Password input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
              <Key className="h-4 w-4 text-slate-400" />
              {t('password')}
            </label>
            <button
              type="button"
              onClick={() => setShowForgotMsg(true)}
              className="text-[10px] font-bold text-slate-400 hover:text-[#014976] dark:hover:text-[#FBAE42] hover:underline focus:outline-none cursor-pointer"
            >
              {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 focus:border-[#014976] dark:focus:border-[#FBAE42] focus:ring-1 focus:ring-[#014976] rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none transition-all text-left"
            dir="ltr"
            required
          />
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#014976] hover:bg-[#013556] disabled:bg-[#014976]/60 text-white font-black text-xs py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none mt-6 border-b-2 border-slate-900/30 active:scale-[0.98]"
        >
          {loading ? (
            <div className="h-4.5 w-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="h-4.5 w-4.5" />
              <span>{t('login')}</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="absolute bg-white dark:bg-[#0f172a] px-3.5 text-[10px] text-slate-400 font-bold uppercase">
            {isRtl ? 'أو' : 'OR'}
          </span>
        </div>

        {/* Register navigation action button */}
        <Link
          href="/register"
          className="w-full border border-slate-250 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-655 dark:text-slate-300 font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
        >
          <span>{isRtl ? 'إنشاء حساب متطوع جديد' : 'Create New Volunteer Account'}</span>
        </Link>

      </form>
    </div>
  );
}

export default function Login() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090E1A] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background radial highlights */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#014976]/5 dark:bg-[#014976]/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#FBAE42]/5 dark:bg-[#FBAE42]/10 rounded-full filter blur-3xl pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 rounded-2xl shadow-xl">
          <div className="h-10 w-10 border-4 border-[#014976] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">جاري تحميل واجهة الدخول...</p>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
