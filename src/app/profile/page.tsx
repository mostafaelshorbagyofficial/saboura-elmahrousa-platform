'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { getActivityLogs } from '@/lib/db';
import { ActivityLog } from '@/types';
import StatCard from '@/components/StatCard';
import { 
  User as UserIcon, Phone, Mail, Award, Key, ShieldCheck, 
  CheckCircle2, AlertCircle, Camera, Calendar, Clock, Trophy, 
  CalendarDays, ClipboardList, XCircle, Heart, ShieldAlert 
} from 'lucide-react';

export default function ProfilePage() {
  const { profile, volunteerDetails, user, refreshProfile } = useAuth();
  const { lang, t } = useApp();
  
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(volunteerDetails?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [avatarUrl, setAvatarUrl] = useState('/avatar-placeholder.png');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPwd, setSubmittingPwd] = useState(false);

  const isRtl = lang === 'ar';

  useEffect(() => {
    if (profile) setName(profile.name);
    if (volunteerDetails) setPhone(volunteerDetails.phone);
  }, [profile, volunteerDetails]);

  // Load avatar and activity logs
  useEffect(() => {
    if (user?.id) {
      const savedAvatar = localStorage.getItem(`saboura_avatar_${user.id}`);
      if (savedAvatar) setAvatarUrl(savedAvatar);

      // Load user activity logs
      getActivityLogs()
        .then(data => {
          const userLogs = data.filter(l => l.user_id === user.id);
          setLogs(userLogs);
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const base64 = uploadEvent.target.result as string;
          setAvatarUrl(base64);
          localStorage.setItem(`saboura_avatar_${user.id}`, base64);
          
          // Trigger custom event to notify navbar/other places
          window.dispatchEvent(new Event('avatarChanged'));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setSubmittingProfile(true);

    if (!name.trim()) {
      setProfileError(isRtl ? 'الاسم مطلوب.' : 'Name is required.');
      setSubmittingProfile(false);
      return;
    }

    try {
      const isMock = user?.id === 'a1111111-1111-1111-1111-111111111111' || user?.id === 'v2222222-2222-2222-2222-222222222222';
      if (isMock) {
        // Update mock localStorage
        const localUsers = JSON.parse(localStorage.getItem('saboura_users') || '[]');
        const uIdx = localUsers.findIndex((u: any) => u.id === user.id);
        if (uIdx !== -1) {
          localUsers[uIdx].name = name.trim();
          localStorage.setItem('saboura_users', JSON.stringify(localUsers));
        }

        if (profile?.role === 'Volunteer') {
          const localVols = JSON.parse(localStorage.getItem('saboura_volunteers') || '[]');
          const vIdx = localVols.findIndex((v: any) => v.user_id === user.id);
          if (vIdx !== -1) {
            localVols[vIdx].name = name.trim();
            localVols[vIdx].phone = phone.trim();
            localStorage.setItem('saboura_volunteers', JSON.stringify(localVols));
          }
        }

        setProfileSuccess(isRtl ? 'تم تحديث الملف الشخصي بنجاح (وضع الحساب التجريبي).' : 'Profile updated successfully (Demo Mode).');
        setSubmittingProfile(false);
        refreshProfile();
        return;
      }

      // Update in Supabase users
      const { error: userError } = await supabase
        .from('users')
        .update({ name: name.trim() })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update in Supabase volunteers if user is a volunteer
      if (profile?.role === 'Volunteer' && volunteerDetails) {
        const { error: volError } = await supabase
          .from('volunteers')
          .update({ name: name.trim(), phone: phone.trim() })
          .eq('user_id', user.id);

        if (volError) throw volError;
      }

      await refreshProfile();
      setProfileSuccess(isRtl ? 'تم تحديث الملف الشخصي بنجاح.' : 'Profile updated successfully.');
    } catch (err: any) {
      setProfileError(err.message || (isRtl ? 'فشل تحديث البيانات.' : 'Failed to update profile.'));
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);
    setSubmittingPwd(true);

    if (!newPassword || newPassword.length < 6) {
      setPwdError(isRtl ? 'يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل.' : 'Password must be at least 6 characters.');
      setSubmittingPwd(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError(isRtl ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
      setSubmittingPwd(false);
      return;
    }

    try {
      const isMock = user?.id === 'a1111111-1111-1111-1111-111111111111' || user?.id === 'v2222222-2222-2222-2222-222222222222';
      if (isMock) {
        const localUsers = JSON.parse(localStorage.getItem('saboura_users') || '[]');
        const uIdx = localUsers.findIndex((u: any) => u.id === user.id);
        if (uIdx !== -1) {
          localUsers[uIdx].password = newPassword;
          localStorage.setItem('saboura_users', JSON.stringify(localUsers));
        }

        setPwdSuccess(isRtl ? 'تم تحديث كلمة المرور بنجاح (وضع الحساب التجريبي).' : 'Password updated successfully (Demo Mode).');
        setNewPassword('');
        setConfirmPassword('');
        setSubmittingPwd(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPwdSuccess(isRtl ? 'تم تحديث كلمة المرور بنجاح.' : 'Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.message || (isRtl ? 'فشل تحديث كلمة المرور.' : 'Failed to update password.'));
    } finally {
      setSubmittingPwd(false);
    }
  };

  // Stats calculation
  const score = profile?.role === 'Volunteer' && volunteerDetails
    ? ((volunteerDetails.boards_installed || 0) * 10) + ((volunteerDetails.accepted_count || 0) * 5) + ((volunteerDetails.visits_count || 0) * 2)
    : 0;

  return (
    <DashboardLayout>
      <div className="text-start space-y-1">
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <UserIcon className="h-5.5 w-5.5 text-[#014976] dark:text-[#FBAE42]" />
          الملف الشخصي
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">إدارة معلومات الحساب وتتبع الأداء الشخصي وسجل العمليات</p>
      </div>

      {/* Main Profile Header Banner */}
      <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden text-start">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-start">
            {/* Avatar block with camera uploader */}
            <div className="relative group">
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="h-24 w-24 rounded-2xl object-cover border-2 border-[#014976]/20 dark:border-slate-700 shadow-md bg-white" 
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 group-hover:opacity-100 rounded-2xl cursor-pointer transition-opacity">
                <Camera className="h-5 w-5" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </label>
            </div>

            <div className="space-y-2">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center justify-center md:justify-start gap-1.5">
                  {profile?.name}
                  {profile?.role === 'Volunteer' && (
                    <span className="text-[10px] bg-[#FBAE42]/10 text-[#014976] dark:text-[#FBAE42] border border-[#FBAE42]/20 font-black px-2 py-0.5 rounded-full">
                      🥇 {isRtl ? 'متطوع ميداني' : 'Volunteer'}
                    </span>
                  )}
                  {profile?.role === 'Administrator' && (
                    <span className="text-[10px] bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-transparent font-black px-2 py-0.5 rounded-full">
                      🛡️ {isRtl ? 'مسؤول النظام' : 'Administrator'}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono font-medium">{profile?.email}</p>
              </div>

              {/* Badges metadata details */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Award className="h-4 w-4 text-[#014976] dark:text-[#FBAE42]" />
                  <span>المركز: {profile?.role === 'Administrator' ? 'الإدارة العامة' : (volunteerDetails?.center?.name || 'بدون مركز')}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-[#014976] dark:text-[#FBAE42]" />
                  <span>انضم: {new Date(profile?.created_at || '').toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick status box */}
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-[10px] text-slate-500 font-bold space-y-1 w-full md:w-auto shrink-0">
            <p className="flex justify-between md:justify-start gap-4">حالة الحساب: 
              <span className="text-emerald-600 dark:text-emerald-450 font-black">نشط ومفعل</span>
            </p>
            <p className="flex justify-between md:justify-start gap-4">المعرف الفرعي: 
              <span className="font-mono text-slate-800 dark:text-slate-200">{profile?.id.substring(0, 8)}</span>
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-20 -bottom-20 w-44 h-44 bg-[#FBAE42]/10 rounded-full filter blur-3xl" />
        <div className="absolute -left-20 -top-20 w-44 h-44 bg-[#014976]/5 rounded-full filter blur-3xl" />
      </div>

      {/* Numerical Stats Counters (Volunteers only) */}
      {profile?.role === 'Volunteer' && volunteerDetails && (
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            title="مؤشر الجودة"
            value={score}
            icon={Trophy}
            color="accent"
            subtext="إجمالي النقاط"
          />
          <StatCard
            title="النزولات الميدانية"
            value={volunteerDetails.visits_count || 0}
            icon={CalendarDays}
            color="primary"
          />
          <StatCard
            title="البوردات المستلمة"
            value={volunteerDetails.boards_received || 0}
            icon={ClipboardList}
            color="info"
          />
          <StatCard
            title="البوردات المثبتة"
            value={volunteerDetails.boards_installed || 0}
            icon={CheckCircle2}
            color="success"
          />
          <StatCard
            title="المطاعم المقبولة"
            value={volunteerDetails.accepted_count || 0}
            icon={Heart}
            color="success"
          />
          <StatCard
            title="البوردات المرتجعة"
            value={volunteerDetails.boards_returned || 0}
            icon={XCircle}
            color="danger"
          />
        </section>
      )}

      {/* Panels Row: Info edit, Password, and Timeline logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-start">
        
        {/* Info & Password editor Card panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Edit Profile Form */}
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-850 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
              <UserIcon className="h-4.5 w-4.5 text-[#014976] dark:text-[#FBAE42]" />
              البيانات الشخصية والاتصال
            </h3>

            {profileSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-250 dark:border-red-500/20 text-red-650 dark:text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-650 dark:text-slate-355">الاسم بالكامل</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#014976]"
                  required
                />
              </div>

              {profile?.role === 'Volunteer' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-650 dark:text-slate-355">رقم الهاتف</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full text-xs bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none text-left"
                    dir="ltr"
                  />
                </div>
              )}

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="bg-[#014976] hover:bg-[#013556] disabled:bg-[#014976]/60 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow cursor-pointer transition-all border-b-2 border-slate-900/20 active:scale-[0.98]"
                >
                  {submittingProfile ? 'جاري الحفظ...' : 'حفظ التغيرات'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-850 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
              <Key className="h-4.5 w-4.5 text-[#014976] dark:text-[#FBAE42]" />
              تغيير كلمة المرور
            </h3>

            {pwdSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{pwdSuccess}</span>
              </div>
            )}
            {pwdError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-250 dark:border-red-500/20 text-red-650 dark:text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-655 dark:text-slate-355">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full text-xs bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 outline-none text-left"
                  dir="ltr"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-655 dark:text-slate-355">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full text-xs bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 outline-none text-left"
                  dir="ltr"
                  required
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingPwd}
                  className="bg-[#014976] hover:bg-[#013556] disabled:bg-[#014976]/60 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow cursor-pointer transition-all border-b-2 border-slate-900/20 active:scale-[0.98]"
                >
                  {submittingPwd ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Activity Logs Timeline Column */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4 h-full flex flex-col justify-start">
            <h3 className="text-xs font-black text-slate-850 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-1.5 shrink-0">
              <Clock className="h-4.5 w-4.5 text-[#014976] dark:text-[#FBAE42]" />
              سجل أنشطتي الميدانية
            </h3>
            
            <div className="space-y-4 overflow-y-auto max-h-[450px] pr-1 flex-1">
              {logs.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-400 font-bold">لا توجد عمليات مسجلة حالياً.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="text-xs border-r-2 border-[#014976]/30 dark:border-slate-800 pr-3.5 py-1 relative text-start">
                    <span className="absolute right-[-4px] top-2.5 h-1.5 w-1.5 rounded-full bg-[#014976] dark:bg-[#FBAE42]" />
                    <p className="font-bold text-slate-750 dark:text-slate-200 leading-snug">{log.description}</p>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1 font-mono">
                      {new Date(log.created_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </DashboardLayout>
  );
}
