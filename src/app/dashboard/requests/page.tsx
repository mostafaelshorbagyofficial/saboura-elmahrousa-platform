'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/context/AppContext';
import { getPendingUsers, approveUser, rejectUser } from '@/lib/db';
import { User, Volunteer } from '@/types';
import { 
  ShieldAlert, Check, X, Eye, Phone, Mail, Building, 
  Calendar, UserCheck, UserX, Clock, XCircle 
} from 'lucide-react';

interface PendingAccount extends User {
  volunteer?: Volunteer | null;
}

export default function RegistrationRequests() {
  const { lang, t } = useApp();
  
  const [requests, setRequests] = useState<PendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PendingAccount | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isRtl = lang === 'ar';

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getPendingUsers();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleApprove = async (id: string, name: string) => {
    setError(null);
    setActionLoading(id);
    try {
      await approveUser(id);
      triggerToast(isRtl ? `تم تفعيل حساب ${name} بنجاح!` : `Activated ${name} successfully!`);
      setSelectedRequest(null);
      loadRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to approve account');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string, name: string) => {
    const confirmMsg = isRtl
      ? `هل أنت متأكد من رفض وحذف طلب تسجيل "${name}"؟`
      : `Are you sure you want to reject and delete registration request for "${name}"?`;
    
    if (confirm(confirmMsg)) {
      setError(null);
      setActionLoading(id);
      try {
        await rejectUser(id);
        triggerToast(isRtl ? `تم رفض طلب ${name}.` : `Rejected registration request for ${name}.`);
        setSelectedRequest(null);
        loadRequests();
      } catch (err: any) {
        setError(err.message || 'Failed to reject account');
      } finally {
        setActionLoading(null);
      }
    }
  };

  return (
    <DashboardLayout allowedRoles={['Administrator']}>
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 z-50 bg-[#014976] dark:bg-[#FBAE42] text-white dark:text-[#014976] font-bold text-xs px-6 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-left duration-250">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="text-start space-y-1">
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <ShieldAlert className="h-5.5 w-5.5 text-[#014976] dark:text-[#FBAE42]" />
          {isRtl ? 'طلبات التسجيل المعلقة' : 'Registration Requests'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isRtl ? 'مراجعة وتفعيل حسابات المتطوعين الجدد للانضمام للمبادرة' : 'Approve or reject new volunteer account requests'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 text-xs px-4 py-3 rounded-xl text-start">
          {error}
        </div>
      )}

      {/* Requests table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/45 text-slate-500 text-[10px] font-black uppercase border-b border-slate-100 dark:border-slate-800/60">
                    <th className="px-6 py-4.5 font-bold">{isRtl ? 'المتطوع' : 'Volunteer'}</th>
                    <th className="px-6 py-4.5 font-bold">{isRtl ? 'المركز التابع له' : 'Center'}</th>
                    <th className="px-6 py-4.5 text-center font-bold">{isRtl ? 'تاريخ الطلب' : 'Requested Date'}</th>
                    <th className="px-6 py-4.5 text-center font-bold">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
                  {loading ? (
                    [1, 2, 3].map(n => (
                      <tr key={n} className="animate-pulse">
                        <td colSpan={4} className="px-6 py-4.5 h-12 bg-slate-50/20 dark:bg-slate-900/10" />
                      </tr>
                    ))
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                        <UserCheck className="h-10 w-10 mx-auto opacity-30 mb-2" />
                        <span>{isRtl ? 'لا توجد طلبات تسجيل معلقة حالياً.' : 'No pending registration requests.'}</span>
                      </td>
                    </tr>
                  ) : (
                    requests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                        {/* Name/Email */}
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                          <div>
                            <span>{req.name}</span>
                            <span className="block text-[9px] text-slate-400 font-mono font-medium">{req.email}</span>
                          </div>
                        </td>

                        {/* Center */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 bg-slate-105 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                            <Building className="h-3.5 w-3.5" />
                            {req.volunteer?.center?.name || 'بدون مركز'}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="px-6 py-4 text-center font-semibold text-slate-500">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{new Date(req.created_at || '').toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="p-1.5 text-slate-500 hover:text-[#014976] dark:hover:text-[#FBAE42] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                              title={isRtl ? 'عرض التفاصيل' : 'View Details'}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleApprove(req.id, req.name)}
                              disabled={actionLoading !== null}
                              className="p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                              title={isRtl ? 'موافقة وتفعيل' : 'Approve & Activate'}
                            >
                              {actionLoading === req.id ? (
                                <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(req.id, req.name)}
                              disabled={actionLoading !== null}
                              className="p-1.5 bg-red-50 text-red-650 dark:bg-red-955/20 dark:text-red-400 rounded-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                              title={isRtl ? 'رفض وحذف' : 'Reject & Delete'}
                            >
                              {actionLoading === req.id ? (
                                <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Request details drawer pane */}
        <div className="lg:col-span-1">
          {selectedRequest ? (
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in slide-in-from-right duration-250">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
                <h3 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="h-4.5 w-4.5 text-[#014976] dark:text-[#FBAE42]" />
                  {isRtl ? 'تفاصيل الطلب' : 'Request Details'}
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs font-medium">
                {/* Avatar and name */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-[#014976]/10 border border-[#014976]/20 text-[#014976] dark:text-[#FBAE42] rounded-xl flex items-center justify-center font-black text-lg">
                    {selectedRequest.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{selectedRequest.name}</h4>
                    <span className="text-[10px] text-slate-450 dark:text-slate-400">طالب تفعيل حساب متطوع</span>
                  </div>
                </div>

                <hr className="border-slate-150 dark:border-slate-850" />

                {/* Email */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">{t('email')}</span>
                  <div className="flex items-center gap-1.5 text-slate-750 dark:text-slate-250">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono">{selectedRequest.email}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">{isRtl ? 'رقم الهاتف' : 'Phone'}</span>
                  <div className="flex items-center gap-1.5 text-slate-750 dark:text-slate-250">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span dir="ltr">{selectedRequest.volunteer?.phone || 'غير متوفر'}</span>
                  </div>
                </div>

                {/* Center */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">{isRtl ? 'المركز المطلوب الانضمام إليه' : 'Target Center'}</span>
                  <div className="flex items-center gap-1.5 text-slate-750 dark:text-slate-250">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedRequest.volunteer?.center?.name || 'غير محدد'}</span>
                  </div>
                </div>

                {/* Request Date */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">{isRtl ? 'تاريخ تقديم الطلب' : 'Requested At'}</span>
                  <div className="flex items-center gap-1.5 text-slate-750 dark:text-slate-250">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{new Date(selectedRequest.created_at || '').toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  onClick={() => handleReject(selectedRequest.id, selectedRequest.name)}
                  disabled={actionLoading !== null}
                  className="flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-955/20 text-red-600 dark:text-red-400 font-bold text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  <UserX className="h-4 w-4" />
                  <span>{isRtl ? 'رفض' : 'Reject'}</span>
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest.id, selectedRequest.name)}
                  disabled={actionLoading !== null}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer disabled:opacity-50 border-b-2 border-slate-900/20"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>{isRtl ? 'موافقة' : 'Approve'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-250 dark:border-slate-800 p-8 rounded-3xl text-center text-slate-400 dark:text-slate-500 font-bold h-48 flex flex-col justify-center items-center gap-2">
              <Eye className="h-8 w-8 opacity-40" />
              <p className="text-xs">{isRtl ? 'حدد طلباً لعرض تفاصيله الكاملة هنا' : 'Select a request to inspect details here'}</p>
            </div>
          )}
        </div>
      </div>

    </DashboardLayout>
  );
}
