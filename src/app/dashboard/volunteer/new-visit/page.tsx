'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/components/DashboardLayout';
import { addVisit } from '@/lib/db';
import { Plus, Trash2, Calendar, Clock, Clipboard, Store, AlertCircle, HelpCircle, Save } from 'lucide-react';

interface AcceptedRestaurantInput {
  name: string;
  category: string;
  address: string;
  phone: string;
  notes: string;
}

interface RejectedRestaurantInput {
  name: string;
  category: string;
  reason: string;
  notes: string;
}

export default function NewVisit() {
  const { volunteerDetails } = useAuth();
  const { lang, t } = useApp();
  const router = useRouter();

  // Visit details state
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitTime, setVisitTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5));
  const [boardsReceived, setBoardsReceived] = useState(0);
  const [boardsInstalled, setBoardsInstalled] = useState(0);
  const [boardsReturned, setBoardsReturned] = useState(0);
  const [notes, setNotes] = useState('');

  // Accepted & Rejected repeaters state
  const [accepted, setAccepted] = useState<AcceptedRestaurantInput[]>([]);
  const [rejected, setRejected] = useState<RejectedRestaurantInput[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isRtl = lang === 'ar';
  const categories = ['Supermarket', 'Café', 'Restaurant', 'Bakery', 'Pharmacy', 'Store', 'Other'];

  const addAcceptedItem = () => {
    setAccepted([...accepted, { name: '', category: 'Supermarket', address: '', phone: '', notes: '' }]);
  };

  const removeAcceptedItem = (index: number) => {
    setAccepted(accepted.filter((_, i) => i !== index));
  };

  const updateAcceptedItem = (index: number, field: keyof AcceptedRestaurantInput, value: string) => {
    const updated = [...accepted];
    updated[index][field] = value;
    setAccepted(updated);
  };

  const addRejectedItem = () => {
    setRejected([...rejected, { name: '', category: 'Supermarket', reason: '', notes: '' }]);
  };

  const removeRejectedItem = (index: number) => {
    setRejected(rejected.filter((_, i) => i !== index));
  };

  const updateRejectedItem = (index: number, field: keyof RejectedRestaurantInput, value: string) => {
    const updated = [...rejected];
    updated[index][field] = value;
    setRejected(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setToastMessage(null);

    // Simple math validation: Boards Installed + Returned should equal Boards Received
    if (boardsInstalled + boardsReturned !== boardsReceived) {
      setValidationError(
        lang === 'ar'
          ? 'تنبيه: يجب أن يساوي مجموع اللوحات المثبتة والمرتجهة عدد اللوحات المستلمة!'
          : 'Warning: Installed + Returned boards must equal Received boards!'
      );
      return;
    }

    // Verify volunteer is loaded
    if (!volunteerDetails) {
      setValidationError(lang === 'ar' ? 'فشل تحميل حساب المتطوع.' : 'Failed to load volunteer account.');
      return;
    }

    // Check restaurant names are filled
    for (let item of accepted) {
      if (!item.name.trim()) {
        setValidationError(lang === 'ar' ? 'يرجى ملء اسم المطعم المقبول.' : 'Please enter the name of all accepted restaurants.');
        return;
      }
    }
    for (let item of rejected) {
      if (!item.name.trim() || !item.reason.trim()) {
        setValidationError(lang === 'ar' ? 'يرجى ملء اسم وسبب الرفض للمطاعم المرفوضة.' : 'Please enter name and reason for all rejected restaurants.');
        return;
      }
    }

    try {
      setSubmitting(true);
      await addVisit({
        volunteer_id: volunteerDetails.id,
        visit_date: visitDate,
        visit_time: visitTime + ':00', // Append seconds
        boards_received: boardsReceived,
        boards_installed: boardsInstalled,
        boards_returned: boardsReturned,
        notes,
        accepted_restaurants: accepted,
        rejected_restaurants: rejected
      });

      // Show toast
      setToastMessage(lang === 'ar' ? 'تم تسجيل النزولة وإرسالها بنجاح!' : 'Visit submitted successfully!');
      
      // Delay redirect
      setTimeout(() => {
        router.push('/dashboard/volunteer');
      }, 1500);

    } catch (err: any) {
      setValidationError(err.message || 'حدث خطأ أثناء حفظ النزولة.');
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['Volunteer']}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 z-50 bg-[#014976] dark:bg-[#FBAE42] text-white dark:text-[#014976] font-bold text-xs px-6 py-3.5 rounded-xl shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header Info */}
      <div className="text-start space-y-1">
        <h2 className="text-xl font-black text-slate-800 dark:text-white">{t('addVisit')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {lang === 'ar' ? 'تسجيل جولة ميدانية وتثبيت اللوحات الخيرية للمحلات' : 'Record a field visit and log installed charity boards'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core fields card */}
        <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-5 text-start">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Clipboard className="h-4.5 w-4.5 text-[#014976] dark:text-[#FBAE42]" />
            {t('visitDetails')}
          </h3>

          {validationError && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {t('date')}
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#014976]"
                required
              />
            </div>
            
            {/* Time */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                {t('time')}
              </label>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#014976]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Received */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">{t('boardsReceived')}</label>
              <input
                type="number"
                min="0"
                value={boardsReceived}
                onChange={(e) => setBoardsReceived(parseInt(e.target.value) || 0)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none"
                required
              />
            </div>
            
            {/* Installed */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">{t('boardsInstalled')}</label>
              <input
                type="number"
                min="0"
                value={boardsInstalled}
                onChange={(e) => setBoardsInstalled(parseInt(e.target.value) || 0)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none"
                required
              />
            </div>

            {/* Returned */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">{t('boardsReturned')}</label>
              <input
                type="number"
                min="0"
                value={boardsReturned}
                onChange={(e) => setBoardsReturned(parseInt(e.target.value) || 0)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-350">{t('notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'ar' ? 'تفاصيل الجولة ومكان النزول...' : 'Details of the street, area...'}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none min-h-[80px]"
            />
          </div>
        </div>

        {/* Accepted Restaurants Repeater */}
        <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4 text-start">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Store className="h-4.5 w-4.5" />
              {t('acceptedRepeater')}
            </h3>
            <button
              type="button"
              onClick={addAcceptedItem}
              className="bg-[#014976]/10 text-[#014976] dark:bg-[#FBAE42]/10 dark:text-[#FBAE42] text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#014976]/20 transition-colors"
            >
              {lang === 'ar' ? '+ إضافة مطعم مقبول' : '+ Add Restaurant'}
            </button>
          </div>

          {accepted.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400 font-medium">
              {lang === 'ar' ? 'لا توجد محلات مقبولة مسجلة في هذه النزولة.' : 'No accepted stores registered yet.'}
            </p>
          ) : (
            <div className="space-y-5">
              {accepted.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl relative space-y-3">
                  
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeAcceptedItem(idx)}
                    className="absolute top-4 left-4 text-red-500 hover:text-red-700 transition-colors p-1"
                    title={t('delete')}
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>

                  <h4 className="text-[10px] font-bold text-slate-400">
                    {lang === 'ar' ? `المحل رقم (${idx + 1}):` : `Store #${idx + 1}:`}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('restaurantName')}</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateAcceptedItem(idx, 'name', e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('category')}</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateAcceptedItem(idx, 'category', e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{t(cat)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('phone')}</label>
                      <input
                        type="text"
                        value={item.phone}
                        onChange={(e) => updateAcceptedItem(idx, 'phone', e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('address')}</label>
                      <input
                        type="text"
                        value={item.address}
                        onChange={(e) => updateAcceptedItem(idx, 'address', e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('notesOptional')}</label>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateAcceptedItem(idx, 'notes', e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none"
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejected Restaurants Repeater */}
        <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4 text-start">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h3 className="text-xs font-black text-red-500 dark:text-red-400 flex items-center gap-2">
              <Store className="h-4.5 w-4.5 text-red-500" />
              {t('rejectedRepeater')}
            </h3>
            <button
              type="button"
              onClick={addRejectedItem}
              className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-100/50 transition-colors"
            >
              {lang === 'ar' ? '+ إضافة محل معتذر' : '+ Add Rejected'}
            </button>
          </div>

          {rejected.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400 font-medium">
              {lang === 'ar' ? 'لا توجد محلات معتذرة مسجلة في هذه النزولة.' : 'No rejected stores registered yet.'}
            </p>
          ) : (
            <div className="space-y-5">
              {rejected.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl relative space-y-3">
                  
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeRejectedItem(idx)}
                    className="absolute top-4 left-4 text-red-500 hover:text-red-700 transition-colors p-1"
                    title={t('delete')}
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>

                  <h4 className="text-[10px] font-bold text-slate-400">
                    {lang === 'ar' ? `المحل رقم (${idx + 1}):` : `Store #${idx + 1}:`}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('restaurantName')}</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateRejectedItem(idx, 'name', e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('category')}</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateRejectedItem(idx, 'category', e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{t(cat)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('reason')}</label>
                      <input
                        type="text"
                        value={item.reason}
                        onChange={(e) => updateRejectedItem(idx, 'reason', e.target.value)}
                        placeholder={lang === 'ar' ? 'سبب عدم التثبيت...' : 'Why rejected...'}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{t('notesOptional')}</label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateRejectedItem(idx, 'notes', e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none"
                    />
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.push('/dashboard/volunteer')}
            className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            {t('cancel')}
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 bg-[#014976] hover:bg-[#013556] disabled:bg-[#014976]/60 text-white font-black text-xs px-6 py-3 rounded-xl shadow-lg border-b-2 border-slate-900/30"
          >
            {submitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{t('submit')}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </DashboardLayout>
  );
}
