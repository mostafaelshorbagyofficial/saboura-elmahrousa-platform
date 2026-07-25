'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/context/AppContext';
import { getSetting, setSetting } from '@/lib/db';
import { Settings, FileSpreadsheet, Webhook, Save, HelpCircle } from 'lucide-react';

export default function SettingsPage() {
  const { lang, t } = useApp();
  
  const [zapierUrl, setZapierUrl] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const [z, s] = await Promise.all([
          getSetting('zapier_webhook_url'),
          getSetting('google_sheet_url')
        ]);
        setZapierUrl(z);
        setSheetUrl(s);
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await Promise.all([
        setSetting('zapier_webhook_url', zapierUrl.trim()),
        setSetting('google_sheet_url', sheetUrl.trim())
      ]);
      triggerToast(lang === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
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

      {/* Header */}
      <div className="text-start space-y-1">
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Settings className="h-5.5 w-5.5 text-[#014976] dark:text-[#FBAE42]" />
          {t('settingsTitle')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {lang === 'ar' ? 'تهيئة روابط التكامل والربط مع المنصات الخارجية' : 'Configure integration webhooks and third-party dashboard links'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs px-4 py-3 text-start rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-[#014976] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 text-start max-w-3xl">
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-5">
            
            {/* Zapier Webhook Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Webhook className="h-4.5 w-4.5 text-orange-500" />
                {t('zapierWebhookUrl')}
              </label>
              <input
                type="url"
                value={zapierUrl}
                onChange={(e) => setZapierUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/XXXXXX/YYYYYY/"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none text-left"
                dir="ltr"
              />
              <p className="text-[10px] text-slate-400 leading-normal flex items-start gap-1">
                <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  {lang === 'ar' 
                    ? 'سيتم إرسال إشعار فوري (Webhook Event) يحتوي على كافة تفاصيل النزولة إلى هذا الرابط فور إرسال النموذج.' 
                    : 'A POST request containing the visit details will be dispatched to this webhook upon form submission.'}
                </span>
              </p>
            </div>

            <hr className="border-slate-150 dark:border-slate-800" />

            {/* Google Sheets URL Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
                {t('googleSheetUrl')}
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1234567890abcdef/edit"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none text-left"
                dir="ltr"
              />
              <p className="text-[10px] text-slate-400 leading-normal flex items-start gap-1">
                <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  {lang === 'ar' 
                    ? 'رابط جدول البيانات الخاص بالنزولات. يتم تسجيل النزولات تلقائياً في السجل المحلي والمحاكي للملف.'
                    : 'The Google Spreadsheet link where volunteer rows are logged in real-time.'}
                </span>
              </p>
            </div>

          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-[#014976] hover:bg-[#013556] disabled:bg-[#014976]/60 text-white font-black text-xs px-6 py-3 rounded-xl shadow-lg border-b-2 border-slate-900/30"
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </DashboardLayout>
  );
}
