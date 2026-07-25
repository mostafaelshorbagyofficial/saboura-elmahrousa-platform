'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/context/AppContext';
import { getCenters, createCenter, updateCenter, deleteCenter } from '@/lib/db';
import { Center } from '@/types';
import { Building2, Plus, Edit2, Trash2, Save, X, Trophy, Users, Calendar } from 'lucide-react';

export default function CentersManager() {
  const { lang, t } = useApp();
  
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');

  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCenters = async () => {
    try {
      setLoading(true);
      const data = await getCenters();
      setCenters(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load centers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCenters();
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameInput.trim()) return;

    try {
      await createCenter(newNameInput.trim());
      setNewNameInput('');
      setIsAdding(false);
      triggerToast(lang === 'ar' ? 'تمت إضافة المركز بنجاح!' : 'Center added successfully!');
      loadCenters();
    } catch (err: any) {
      setError(err.message || 'Failed to create center');
    }
  };

  const handleEditSave = async (id: string) => {
    if (!nameInput.trim()) return;

    try {
      await updateCenter(id, nameInput.trim());
      setIsEditing(null);
      setNameInput('');
      triggerToast(lang === 'ar' ? 'تمت تحديث بيانات المركز بنجاح!' : 'Center updated successfully!');
      loadCenters();
    } catch (err: any) {
      setError(err.message || 'Failed to update center');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmMsg = lang === 'ar' 
      ? `هل أنت متأكد من حذف مركز "${name}"؟ قد يؤدي هذا لإزالة المتطوعين والنزولات المرتبطة به!`
      : `Are you sure you want to delete "${name}"? This might delete associated volunteers and visits!`;
    
    if (confirm(confirmMsg)) {
      try {
        await deleteCenter(id);
        triggerToast(lang === 'ar' ? 'تم حذف المركز بنجاح!' : 'Center deleted successfully!');
        loadCenters();
      } catch (err: any) {
        setError(err.message || 'Failed to delete center');
      }
    }
  };

  return (
    <DashboardLayout allowedRoles={['Administrator']}>
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 z-50 bg-[#014976] dark:bg-[#FBAE42] text-white dark:text-[#014976] font-bold text-xs px-6 py-3.5 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-start">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Building2 className="h-5.5 w-5.5 text-[#014976] dark:text-[#FBAE42]" />
            إدارة المراكز والفروع
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'إضافة وتعديل وحذف مراكز جمعية صناع الحياة داخل محافظة القليوبية' : 'Manage Life Makers branch centers in Qalyubia governorate'}
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 bg-[#014976] hover:bg-[#013556] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-colors border-b-2 border-slate-900/20"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>{t('createCenter')}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Add Center Form Panel */}
      {isAdding && (
        <form onSubmit={handleAdd} className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-end gap-4 text-start max-w-xl animate-in fade-in duration-200">
          <div className="space-y-1.5 flex-1 w-full">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-400">{t('centerName')}</label>
            <input
              type="text"
              value={newNameInput}
              onChange={(e) => setNewNameInput(e.target.value)}
              placeholder="مثال: مركز طوخ"
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none"
              required
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-250 dark:border-slate-700 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#014976] hover:bg-[#013556] text-white text-xs font-bold rounded-xl shadow-md border-b-2 border-slate-900/20"
            >
              {t('save')}
            </button>
          </div>
        </form>
      )}

      {/* Centers Table */}
      <div className="glass-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/45 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <th className="px-6 py-4.5 text-start font-bold">{t('centerName')}</th>
                <th className="px-6 py-4.5 text-center font-bold">{t('score')}</th>
                <th className="px-6 py-4.5 text-center font-bold">{t('volunteerCount')}</th>
                <th className="px-6 py-4.5 text-center font-bold">{t('visits')}</th>
                <th className="px-6 py-4.5 text-center font-bold">{t('boardsInstalled')}</th>
                <th className="px-6 py-4.5 text-center font-bold">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
              {loading ? (
                [1, 2, 3].map(n => (
                  <tr key={n} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4.5 h-12 bg-slate-50/20 dark:bg-slate-900/10" />
                  </tr>
                ))
              ) : centers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 font-bold">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                centers.map((c) => {
                  const editingThis = isEditing === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {editingThis ? (
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#014976]"
                          />
                        ) : (
                          <span>{c.name}</span>
                        )}
                      </td>
                      
                      {/* Score */}
                      <td className="px-6 py-4 text-center font-extrabold text-[#014976] dark:text-[#FBAE42]">
                        <span className="inline-flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {c.score || 0}
                        </span>
                      </td>

                      {/* Volunteers count */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-650 dark:text-slate-300">
                          <Users className="h-3 w-3" />
                          {c.volunteer_count || 0}
                        </span>
                      </td>

                      {/* Visits count */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-650 dark:text-slate-300">
                          <Calendar className="h-3 w-3" />
                          {c.visits_count || 0}
                        </span>
                      </td>

                      {/* Installed count */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                          {c.boards_installed_count || 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {editingThis ? (
                            <>
                              <button
                                onClick={() => handleEditSave(c.id)}
                                className="p-1.5 bg-[#014976]/10 text-[#014976] dark:bg-[#FBAE42]/10 dark:text-[#FBAE42] rounded-lg hover:scale-105"
                                title={t('save')}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditing(null);
                                  setNameInput('');
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
                                  setIsEditing(c.id);
                                  setNameInput(c.name);
                                }}
                                className="p-1.5 text-slate-500 hover:text-[#014976] dark:hover:text-[#FBAE42] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title={t('edit')}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id, c.name)}
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
