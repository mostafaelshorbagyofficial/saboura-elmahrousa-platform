'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/context/AppContext';
import { 
  getVolunteers, getCenters, createVolunteer, 
  updateVolunteer, deleteVolunteer, resetVolunteerPassword 
} from '@/lib/db';
import { Volunteer, Center } from '@/types';
import { 
  Users, Plus, Edit2, Trash2, Key, ToggleLeft, ToggleRight, 
  Save, X, Phone, Building, Mail, CheckCircle2, XCircle, Search 
} from 'lucide-react';

export default function VolunteersManager() {
  const { lang, t } = useApp();
  
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [centerInput, setCenterInput] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCenter, setEditCenter] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'disabled' | 'pending'>('active');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenterFilter, setSelectedCenterFilter] = useState('');

  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [v, c] = await Promise.all([getVolunteers(), getCenters()]);
      setVolunteers(v);
      setCenters(c);
      if (c.length > 0) setCenterInput(c[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load volunteers data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !phoneInput.trim() || !emailInput.trim() || !centerInput) return;

    try {
      await createVolunteer(nameInput.trim(), phoneInput.trim(), emailInput.trim(), centerInput);
      setNameInput('');
      setPhoneInput('');
      setEmailInput('');
      setIsAdding(false);
      triggerToast(lang === 'ar' ? 'تم إنشاء حساب المتطوع بنجاح!' : 'Volunteer account created successfully!');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create volunteer');
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editName.trim() || !editPhone.trim() || !editCenter) return;

    try {
      await updateVolunteer(id, editName.trim(), editPhone.trim(), editCenter, editStatus);
      setIsEditing(null);
      triggerToast(lang === 'ar' ? 'تم تحديث بيانات المتطوع بنجاح!' : 'Volunteer details updated!');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update volunteer');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmMsg = lang === 'ar'
      ? `هل أنت متأكد من حذف المتطوع "${name}"؟ قد يؤدي هذا لحذف كل النزولات التابعة له!`
      : `Are you sure you want to delete "${name}"? This will delete all visits logged by them!`;
    
    if (confirm(confirmMsg)) {
      try {
        await deleteVolunteer(id);
        triggerToast(lang === 'ar' ? 'تم حذف حساب المتطوع بنجاح!' : 'Volunteer account deleted!');
        loadData();
      } catch (err: any) {
        setError(err.message || 'Failed to delete volunteer');
      }
    }
  };

  const handleResetPassword = async (id: string, name: string) => {
    try {
      await resetVolunteerPassword(id);
      triggerToast(lang === 'ar' ? `تم إعادة تعيين كلمة مرور لـ ${name}!` : `Password reset trigger for ${name}!`);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    }
  };

  // Filter volunteers list
  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.phone.includes(searchQuery) ||
                          (v.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCenter = selectedCenterFilter === '' || v.center_id === selectedCenterFilter;

    return matchesSearch && matchesCenter;
  });

  return (
    <DashboardLayout allowedRoles={['Administrator']}>
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 z-50 bg-[#014976] dark:bg-[#FBAE42] text-white dark:text-[#014976] font-bold text-xs px-6 py-3.5 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-start">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="h-5.5 w-5.5 text-[#014976] dark:text-[#FBAE42]" />
            إدارة حسابات المتطوعين
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'إنشاء حسابات المتطوعين، تخصيص الفروع، وإعادة تعيين كلمات المرور' : 'Create volunteer accounts, assign branch centers, and reset credentials'}
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 bg-[#014976] hover:bg-[#013556] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-colors border-b-2 border-slate-900/20"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>{t('createVolunteer')}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Add form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4 text-start max-w-3xl animate-in fade-in duration-200">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-850">
            {t('createVolunteer')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('volunteerName')}</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="مثال: محمد أحمد"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('phone')}</label>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none text-left"
                dir="ltr"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('email')}</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="example@lifemakers.org"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none text-left"
                dir="ltr"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('assignCenter')}</label>
              <select
                value={centerInput}
                onChange={(e) => setCenterInput(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none"
                required
              >
                {centers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-5 py-2.5 border border-slate-250 dark:border-slate-700 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#014976] hover:bg-[#013556] text-white text-xs font-bold rounded-xl shadow-md border-b-2 border-slate-900/20"
            >
              {t('save')}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Panel */}
      <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between text-start">
        <div className="flex items-center relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الهاتف، البريد..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
          />
          <Search className="h-4.5 w-4.5 absolute left-3 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] text-slate-400 font-bold shrink-0">{t('assignCenter')}</span>
          <select
            value={selectedCenterFilter}
            onChange={(e) => setSelectedCenterFilter(e.target.value)}
            className="w-full sm:w-48 text-xs bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
          >
            <option value="">{t('all')}</option>
            {centers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Volunteers Table/Cards */}
      <div className="glass-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/45 text-slate-500 text-[10px] font-black uppercase border-b border-slate-100 dark:border-slate-800/60">
                <th className="px-6 py-4.5 text-start font-bold">{t('volunteerName')}</th>
                <th className="px-6 py-4.5 text-start font-bold">{t('phone')}</th>
                <th className="px-6 py-4.5 text-start font-bold">{t('assignCenter')}</th>
                <th className="px-6 py-4.5 text-center font-bold">{t('visits')}</th>
                <th className="px-6 py-4.5 text-center font-bold">{t('boardsInstalled')}</th>
                <th className="px-6 py-4.5 text-center font-bold">{t('status')}</th>
                <th className="px-6 py-4.5 text-center font-bold">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
              {loading ? (
                [1, 2, 3].map(n => (
                  <tr key={n} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4.5 h-12 bg-slate-50/20 dark:bg-slate-900/10" />
                  </tr>
                ))
              ) : filteredVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 font-bold">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                filteredVolunteers.map((v) => {
                  const editingThis = isEditing === v.id;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {editingThis ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1 outline-none"
                          />
                        ) : (
                          <div>
                            <span>{v.name}</span>
                            <span className="block text-[9px] text-slate-400 font-medium font-mono">{v.user?.email}</span>
                          </div>
                        )}
                      </td>
                      
                      {/* Phone */}
                      <td className="px-6 py-4 font-semibold text-slate-650 dark:text-slate-350">
                        {editingThis ? (
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1 outline-none text-left"
                            dir="ltr"
                          />
                        ) : (
                          <span dir="ltr">{v.phone}</span>
                        )}
                      </td>

                      {/* Center */}
                      <td className="px-6 py-4">
                        {editingThis ? (
                          <select
                            value={editCenter}
                            onChange={(e) => setEditCenter(e.target.value)}
                            className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1 outline-none"
                          >
                            {centers.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                            <Building className="h-3 w-3" />
                            {v.center?.name || 'غير محدد'}
                          </span>
                        )}
                      </td>

                      {/* Visits */}
                      <td className="px-6 py-4 text-center font-bold">
                        {v.visits_count || 0}
                      </td>

                      {/* Boards Installed */}
                      <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {v.boards_installed || 0}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {editingThis ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as 'active' | 'disabled' | 'pending')}
                            className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 outline-none"
                          >
                            <option value="active">{t('active')}</option>
                            <option value="disabled">{t('disabled')}</option>
                          </select>
                        ) : v.user?.status === 'disabled' ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
                            <XCircle className="h-3 w-3" />
                            {t('disabled')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('active')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {editingThis ? (
                            <>
                              <button
                                onClick={() => handleEditSave(v.id)}
                                className="p-1.5 bg-[#014976]/10 text-[#014976] dark:bg-[#FBAE42]/10 dark:text-[#FBAE42] rounded-lg hover:scale-105"
                                title={t('save')}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditing(null);
                                }}
                                className="p-1.5 bg-slate-100 text-slate-550 dark:bg-slate-800 dark:text-slate-400 rounded-lg hover:scale-105"
                                title={t('cancel')}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setIsEditing(v.id);
                                  setEditName(v.name);
                                  setEditPhone(v.phone);
                                  setEditCenter(v.center_id || '');
                                  setEditStatus(v.user?.status || 'active');
                                }}
                                className="p-1.5 text-slate-500 hover:text-[#014976] dark:hover:text-[#FBAE42] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title={t('edit')}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleResetPassword(v.id, v.name)}
                                className="p-1.5 text-slate-500 hover:text-[#FBAE42] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title={t('resetPassword')}
                              >
                                <Key className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(v.id, v.name)}
                                className="p-1.5 text-slate-500 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title={t('delete')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </DashboardLayout>
  );
}
