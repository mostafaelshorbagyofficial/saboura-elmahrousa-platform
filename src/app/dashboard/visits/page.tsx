'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getVisits, getCenters, getVolunteers } from '@/lib/db';
import { Visit, Center, Volunteer } from '@/types';
import { 
  Calendar, Search, Filter, FileSpreadsheet, Download, FileText, 
  Trash2, Eye, MapPin, Building, Phone, Clipboard, ArrowUpDown 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function VisitsHistory() {
  const { lang, t } = useApp();
  const { profile } = useAuth();
  
  const [visits, setVisits] = useState<Visit[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  const [volunteerFilter, setVolunteerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [acceptanceFilter, setAcceptanceFilter] = useState('all'); // all, accepted, rejected, both

  const isRtl = lang === 'ar';
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [vt, c, v] = await Promise.all([
          getVisits(),
          getCenters(),
          getVolunteers()
        ]);
        setVisits(vt);
        setCenters(c);
        setVolunteers(v);
      } catch (err) {
        console.error('Failed to load visits:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter logic
  const filteredVisits = visits.filter(v => {
    // 1. Search Query (Volunteer, Center, Restaurant, Phone, Date)
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (v.volunteer?.name || '').toLowerCase().includes(q) ||
      (v.volunteer?.center?.name || '').toLowerCase().includes(q) ||
      (v.volunteer?.phone || '').includes(q) ||
      v.visit_date.includes(q) ||
      (v.notes || '').toLowerCase().includes(q) ||
      v.accepted_restaurants?.some(r => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)) ||
      v.rejected_restaurants?.some(r => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q))
    );

    // 2. Center Filter
    const matchesCenter = !centerFilter || v.volunteer?.center_id === centerFilter;

    // 3. Volunteer Filter
    const matchesVolunteer = !volunteerFilter || v.volunteer_id === volunteerFilter;

    // 4. Date Filter
    const matchesDate = !dateFilter || v.visit_date === dateFilter;

    // 5. Acceptance Status Filter
    let matchesAcceptance = true;
    if (acceptanceFilter === 'accepted') {
      matchesAcceptance = (v.accepted_restaurants?.length || 0) > 0;
    } else if (acceptanceFilter === 'rejected') {
      matchesAcceptance = (v.rejected_restaurants?.length || 0) > 0;
    }

    return matchesSearch && matchesCenter && matchesVolunteer && matchesDate && matchesAcceptance;
  });

  // EXPORT 1: CSV
  const handleExportCSV = () => {
    const headers = [
      isRtl ? 'المتطوع' : 'Volunteer',
      isRtl ? 'المركز' : 'Center',
      isRtl ? 'الهاتف' : 'Phone',
      isRtl ? 'التاريخ' : 'Date',
      isRtl ? 'الوقت' : 'Time',
      isRtl ? 'اللوحات المستلمة' : 'Boards Received',
      isRtl ? 'اللوحات المثبتة' : 'Boards Installed',
      isRtl ? 'اللوحات المرتجعة' : 'Boards Returned',
      isRtl ? 'المطاعم المقبولة' : 'Accepted Stores',
      isRtl ? 'المطاعم المرفوضة' : 'Rejected Stores',
      isRtl ? 'ملاحظات' : 'Notes'
    ];

    const rows = filteredVisits.map(v => [
      v.volunteer?.name || '',
      v.volunteer?.center?.name || '',
      v.volunteer?.phone || '',
      v.visit_date,
      v.visit_time,
      v.boards_received,
      v.boards_installed,
      v.boards_returned,
      v.accepted_restaurants?.map(r => `${r.name} (${t(r.category)})`).join('; ') || '',
      v.rejected_restaurants?.map(r => `${r.name} (${t(r.category)})`).join('; ') || '',
      v.notes || ''
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `visits_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT 2: Excel
  const handleExportExcel = () => {
    const data = filteredVisits.map(v => ({
      [isRtl ? 'المتطوع' : 'Volunteer']: v.volunteer?.name || '',
      [isRtl ? 'المركز' : 'Center']: v.volunteer?.center?.name || '',
      [isRtl ? 'الهاتف' : 'Phone']: v.volunteer?.phone || '',
      [isRtl ? 'التاريخ' : 'Date']: v.visit_date,
      [isRtl ? 'الوقت' : 'Time']: v.visit_time,
      [isRtl ? 'اللوحات المستلمة' : 'Boards Received']: v.boards_received,
      [isRtl ? 'اللوحات المثبتة' : 'Boards Installed']: v.boards_installed,
      [isRtl ? 'اللوحات المرتجعة' : 'Boards Returned']: v.boards_returned,
      [isRtl ? 'المطاعم المقبولة' : 'Accepted Stores']: v.accepted_restaurants?.map(r => r.name).join(', ') || '',
      [isRtl ? 'المطاعم المرفوضة' : 'Rejected Stores']: v.rejected_restaurants?.map(r => r.name).join(', ') || '',
      [isRtl ? 'ملاحظات' : 'Notes']: v.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visits');
    XLSX.writeFile(wb, `visits_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // EXPORT 3: PDF (using DOM Snapshot)
  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    try {
      const canvas = await html2canvas(tableRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.setFont('Tajawal', 'normal');
      pdf.text(isRtl ? 'تقرير نزولات صبورة المحروسة' : 'Saboura El Mahrousa Visit Report', 10, 10);
      pdf.addImage(imgData, 'PNG', 10, position + 5, imgWidth, imgHeight);
      
      pdf.save(`visits_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
  };

  return (
    <DashboardLayout allowedRoles={['Administrator', 'Volunteer']}>
      
      {/* Header and exports */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-start">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Clipboard className="h-5.5 w-5.5 text-[#014976] dark:text-[#FBAE42]" />
            سجل النزولات والزيارات الميدانية
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'عرض، فلترة، وتصدير كافة النزولات والزيارات المسجلة للمحلات والمطاعم' : 'Search, filter, and export visits logs of installed and rejected boards'}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>CSV</span>
          </button>
          
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#014976] hover:bg-[#013556] text-white font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 space-y-4 text-start">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <Filter className="h-4 w-4 text-[#014976] dark:text-[#FBAE42]" />
          أدوات البحث والتصفية المتقدمة
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Global Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">{lang === 'ar' ? 'بحث سريع' : 'Quick Search'}</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اسم المتطوع، مطعم..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl outline-none"
              />
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Center selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">{t('assignCenter')}</label>
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
            >
              <option value="">{t('all')}</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Volunteer selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">{t('volunteerName')}</label>
            <select
              value={volunteerFilter}
              onChange={(e) => setVolunteerFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
            >
              <option value="">{t('all')}</option>
              {volunteers.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">{t('date')}</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
            />
          </div>

          {/* Acceptance Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">{t('status')}</label>
            <select
              value={acceptanceFilter}
              onChange={(e) => setAcceptanceFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
            >
              <option value="all">{t('all')}</option>
              <option value="accepted">{t('acceptedRestaurants')}</option>
              <option value="rejected">{t('rejectedRestaurants')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visits Table */}
      <div className="glass-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/45 text-slate-500 text-[10px] font-black uppercase border-b border-slate-100 dark:border-slate-800/60">
                <th className="px-6 py-4 text-start font-bold">{t('volunteerName')}</th>
                <th className="px-6 py-4 text-start font-bold">{t('assignCenter')}</th>
                <th className="px-6 py-4 text-center font-bold">{t('date')}</th>
                <th className="px-6 py-4 text-center font-bold">{t('boardsReceived')}</th>
                <th className="px-6 py-4 text-center font-bold">{t('boardsInstalled')}</th>
                <th className="px-6 py-4 text-center font-bold">{t('boardsReturned')}</th>
                <th className="px-6 py-4 text-start font-bold">{t('acceptedRestaurants')}</th>
                <th className="px-6 py-4 text-start font-bold">{t('rejectedRestaurants')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-350 text-xs">
              {loading ? (
                [1, 2, 3].map(n => (
                  <tr key={n} className="animate-pulse">
                    <td colSpan={8} className="px-6 py-4.5 h-12 bg-slate-50/20 dark:bg-slate-900/10" />
                  </tr>
                ))
              ) : filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 font-bold">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                filteredVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                    {/* Volunteer */}
                    <td className="px-6 py-3.5 font-bold text-slate-850 dark:text-slate-200 text-start">
                      <div>
                        <span>{v.volunteer?.name}</span>
                        <span className="block text-[9px] text-slate-400 font-mono font-medium">{v.volunteer?.phone}</span>
                      </div>
                    </td>

                    {/* Center */}
                    <td className="px-6 py-3.5 text-start font-semibold">
                      <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                        <Building className="h-3 w-3" />
                        {v.volunteer?.center?.name || 'بدون مركز'}
                      </span>
                    </td>

                    {/* Date/Time */}
                    <td className="px-6 py-3.5 text-center font-semibold">
                      <div>
                        <span>{v.visit_date}</span>
                        <span className="block text-[9px] text-slate-400 font-mono">{v.visit_time}</span>
                      </div>
                    </td>

                    {/* Received */}
                    <td className="px-6 py-3.5 text-center font-bold">
                      {v.boards_received}
                    </td>

                    {/* Installed */}
                    <td className="px-6 py-3.5 text-center font-extrabold text-emerald-600 dark:text-emerald-400">
                      {v.boards_installed}
                    </td>

                    {/* Returned */}
                    <td className="px-6 py-3.5 text-center font-bold text-red-500">
                      {v.boards_returned}
                    </td>

                    {/* Accepted breakdown */}
                    <td className="px-6 py-3.5 text-start">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {v.accepted_restaurants?.length === 0 ? (
                          <span className="text-[10px] text-slate-400">-</span>
                        ) : (
                          v.accepted_restaurants?.map((ar, i) => (
                            <span key={i} className="text-[9px] font-bold bg-[#014976]/5 text-[#014976] dark:bg-[#FBAE42]/10 dark:text-[#FBAE42] border border-[#014976]/10 dark:border-transparent px-2 py-0.5 rounded-full" title={ar.address}>
                              {ar.name} ({t(ar.category)})
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Rejected breakdown */}
                    <td className="px-6 py-3.5 text-start">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {v.rejected_restaurants?.length === 0 ? (
                          <span className="text-[10px] text-slate-400">-</span>
                        ) : (
                          v.rejected_restaurants?.map((rr, i) => (
                            <span key={i} className="text-[9px] font-bold bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-transparent px-2 py-0.5 rounded-full" title={rr.reason}>
                              {rr.name} (معتذر)
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </DashboardLayout>
  );
}
