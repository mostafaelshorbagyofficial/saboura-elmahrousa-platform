'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp, AppProvider } from '@/context/AppContext';
import { getCenters } from '@/lib/db';
import { Center } from '@/types';
import { 
  User, Mail, Phone, Key, Building, Globe, Moon, Sun, 
  Sparkles, CheckCircle2, AlertCircle, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

function RegisterFormContent() {
  const { register } = useAuth();
  const { lang, theme, setLang, setTheme, t } = useApp();
  const router = useRouter();

  const [centers, setCenters] = useState<Center[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [centerId, setCenterId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isRtl = lang === 'ar';

  useEffect(() => {
    async function loadCenters() {
      try {
        setLoadingCenters(true);
        const data = await getCenters();
        setCenters(data);
        if (data.length > 0) setCenterId(data[0].id);
      } catch (err) {
        console.error('Failed to load centers:', err);
      } finally {
        setLoadingCenters(false);
      }
    }
    loadCenters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 1. Validation checks
    if (!name.trim() || !phone.trim() || !email.trim() || !password || !confirmPassword || !centerId) {
      setError(isRtl ? 'يرجى ملء جميع الحقول المطلوبة.' : 'Please fill all required fields.');
      return;
    }

    if (password.length < 6) {
      setError(isRtl ? 'يجب أن تتكون كلمة المرور من 6 خانات على الأقل.' : 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError(isRtl ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
      return;
    }

    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError(isRtl ? 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678).' : 'Please enter a valid Egyptian phone number (e.g. 01012345678).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(isRtl ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register(name.trim(), phone.trim(), email.trim(), password, centerId);
      if (res.success) {
        setSuccess(isRtl 
          ? 'تم تسجيل حسابك بنجاح! حسابك الآن قيد الانتظار لموافقة الإدارة لتفعيل الدخول.' 
          : 'Registration successful! Your account is now pending administrator approval.');
        
        // Clear form
        setName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Wait and redirect to login
        setTimeout(() => {
          router.push('/login');
        }, 4000);
      } else {
        setError(res.error || (isRtl ? 'فشلت عملية التسجيل.' : 'Registration failed.'));
      }
    } catch (err: any) {
      setError(err.message || (isRtl ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 p-8 space-y-6 rounded-3xl shadow-2xl relative z-10 text-start animate-in fade-in zoom-in duration-300">
      
      {/* Settings & Back link */}
      <div className="flex justify-between items-center">
        <Link
          href="/login"
          className="text-slate-500 hover:text-[#014976] dark:hover:text-[#FBAE42] flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
          <span>{isRtl ? 'العودة لتسجيل الدخول' : 'Back to Login'}</span>
        </Link>
        <div className="flex items-center gap-4">
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
      </div>

      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="relative inline-flex">
          <div className="h-12 w-12 bg-[#014976] border border-[#FBAE42] rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg relative z-10">
            ص
          </div>
          <div className="absolute inset-0 bg-[#014976]/20 rounded-xl filter blur-md animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
            {isRtl ? 'تسجيل حساب متطوع جديد' : 'New Volunteer Registration'}
            <Sparkles className="h-4.5 w-4.5 text-[#FBAE42]" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            {isRtl ? 'انضم لمبادرة صبورة المحروسة لتسجيل وتوثيق لوحاتك الخيرية' : 'Join Saboura El Mahrousa initiative to log your board placements'}
          </p>
        </div>
      </div>

      {/* Success banner / redirect */}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-500/20 text-emerald-650 dark:text-emerald-400 text-xs p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="h-5.5 w-5.5 shrink-0 text-emerald-550 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">{isRtl ? 'تم تقديم الطلب بنجاح' : 'Request Submitted Successfully'}</h4>
            <p>{success}</p>
            <span className="block text-[10px] text-slate-400 pt-2 animate-pulse">
              {isRtl ? 'سيتم تحويلك لصفحة الدخول خلال ثوانٍ...' : 'Redirecting to login shortly...'}
            </span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 animate-in shake duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                {isRtl ? 'الاسم بالكامل' : 'Full Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="محمد أحمد علي"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 focus:border-[#014976] dark:focus:border-[#FBAE42] focus:ring-1 focus:ring-[#014976] rounded-xl px-4 py-3 outline-none"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-slate-400" />
                {isRtl ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 focus:border-[#014976] dark:focus:border-[#FBAE42] focus:ring-1 focus:ring-[#014976] rounded-xl px-4 py-3 outline-none text-left"
                dir="ltr"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-slate-400" />
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="volunteer@lifemakers.org"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 focus:border-[#014976] dark:focus:border-[#FBAE42] focus:ring-1 focus:ring-[#014976] rounded-xl px-4 py-3 outline-none text-left"
                dir="ltr"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="h-4 w-4 text-slate-400" />
                {isRtl ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 focus:border-[#014976] dark:focus:border-[#FBAE42] focus:ring-1 focus:ring-[#014976] rounded-xl px-4 py-3 outline-none text-left"
                dir="ltr"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="h-4 w-4 text-slate-400" />
                {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 focus:border-[#014976] dark:focus:border-[#FBAE42] focus:ring-1 focus:ring-[#014976] rounded-xl px-4 py-3 outline-none text-left"
                dir="ltr"
                required
              />
            </div>

            {/* Center dropdown */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Building className="h-4 w-4 text-slate-400" />
                {isRtl ? 'المركز / الفرع التابع له' : 'Branch Center'}
              </label>
              <select
                value={centerId}
                onChange={(e) => setCenterId(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-[#014976] dark:focus:border-[#FBAE42] rounded-xl px-4 py-3 outline-none"
                disabled={loadingCenters}
                required
              >
                {loadingCenters ? (
                  <option>{isRtl ? 'جاري تحميل الفروع...' : 'Loading centers...'}</option>
                ) : (
                  centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
            </div>

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#014976] hover:bg-[#013556] disabled:bg-[#014976]/60 text-white font-black text-xs py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none mt-6 border-b-2 border-slate-900/30 active:scale-[0.98]"
          >
            {submitting ? (
              <div className="h-4.5 w-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{isRtl ? 'تسجيل الحساب وإرسال طلب التفعيل' : 'Register and Request Activation'}</span>
            )}
          </button>
        </form>
      )}

    </div>
  );
}

export default function Register() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090E1A] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#014976]/5 dark:bg-[#014976]/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#FBAE42]/5 dark:bg-[#FBAE42]/10 rounded-full filter blur-3xl pointer-events-none" />

        <Suspense fallback={
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 rounded-2xl shadow-xl">
            <div className="h-10 w-10 border-4 border-[#014976] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">جاري تحميل واجهة التسجيل...</p>
          </div>
        }>
          <RegisterFormContent />
        </Suspense>
      </div>
    </AppProvider>
  );
}
