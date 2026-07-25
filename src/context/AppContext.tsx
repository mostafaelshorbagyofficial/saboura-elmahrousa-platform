'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';
type Theme = 'light' | 'dark';

interface AppContextType {
  lang: Language;
  theme: Theme;
  setLang: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Core translation dictionary
const translations: Record<Language, Record<string, string>> = {
  ar: {
    // General
    appName: 'صبورة المحروسة',
    appNameFull: 'صبورة المحروسة | صناع الحياة القليوبية',
    lifeMakers: 'صناع الحياة مصر - القليوبية',
    adminDashboard: 'لوحة تحكم الإدارة',
    volunteerDashboard: 'لوحة تحكم المتطوع',
    searchPlaceholder: 'بحث سريع...',
    languageName: 'English',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    loginTitle: 'تسجيل الدخول للنظام',
    loginSubtitle: 'مبادرة صبورة المحروسة - صناع الحياة القليوبية',
    profile: 'الملف الشخصي',
    notifications: 'الإشعارات',
    settings: 'الإعدادات',
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    actions: 'العمليات',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات متاحة',
    success: 'تمت العملية بنجاح',
    error: 'حدث خطأ ما',
    
    // Statistics Cards & Leaderboard
    volunteers: 'المتطوعين',
    centers: 'المراكز',
    visits: 'النزولات',
    boardsReceived: 'البوردات المستلمة',
    boardsInstalled: 'البوردات المثبتة',
    boardsReturned: 'البوردات المرتجعة',
    acceptedRestaurants: 'المطاعم المقبولة',
    rejectedRestaurants: 'المطاعم المرفوضة',
    acceptanceRate: 'معدل القبول',
    todaysVisits: 'نزولات اليوم',
    weeklyVisits: 'نزولات الأسبوع',
    monthlyVisits: 'نزولات الشهر',
    score: 'النقاط',
    rank: 'الترتيب',
    volunteerCount: 'عدد المتطوعين',
    lastActivity: 'آخر نشاط',

    // Form
    addVisit: 'إضافة نزولة',
    visitDetails: 'تفاصيل النزولة',
    date: 'التاريخ',
    time: 'الوقت',
    notes: 'ملاحظات',
    acceptedRepeater: 'المحلات المقبولة (تركيب البورد)',
    rejectedRepeater: 'المحلات المرفوضة (رفض أو عدم توافق)',
    restaurantName: 'اسم المحل / المطعم',
    category: 'التصنيف',
    address: 'العنوان',
    phone: 'رقم الهاتف',
    reason: 'سبب الرفض',
    notesOptional: 'ملاحظات (اختياري)',
    addItem: 'إضافة محل جديد +',
    submit: 'إرسال البيانات وحفظها',

    // Restaurant Categories
    Supermarket: 'سوبرماركت',
    Café: 'كافيه / مقهى',
    Restaurant: 'مطعم',
    Bakery: 'مخبز / فرن',
    Pharmacy: 'صيدلية',
    Store: 'محل تجاري',
    Other: 'أخرى',

    // Admin Features
    createVolunteer: 'إضافة متطوع جديد',
    editVolunteer: 'تعديل بيانات المتطوع',
    deleteVolunteer: 'حذف المتطوع',
    volunteerName: 'اسم المتطوع',
    assignCenter: 'تخصيص مركز',
    createCenter: 'إضافة مركز جديد',
    editCenter: 'تعديل اسم المركز',
    deleteCenter: 'حذف المركز',
    centerName: 'اسم المركز',
    resetPassword: 'إعادة تعيين كلمة المرور',
    status: 'حالة الحساب',
    active: 'نشط',
    disabled: 'معطل',
    settingsTitle: 'إعدادات التكامل والربط',
    zapierWebhookUrl: 'رابط Zapier Webhook',
    googleSheetUrl: 'رابط Google Sheet',

    // Leaderboard Medals
    leaderboardTitle: 'ترتيب المراكز (صدارة المحروسة)',
    leaderboardSubtitle: 'الترتيب التلقائي للمراكز حسب عدد البوردات المثبتة ونشاط المتطوعين',

    // Timeline & Details
    visitHistory: 'سجل الزيارات والنزولات',
    activityTimeline: 'سجل العمليات والأنشطة',
    viewProfile: 'عرض الملف الشخصي',
    viewCenterDetails: 'تفاصيل المركز',
    back: 'الرجوع',
    all: 'الكل'
  },
  en: {
    // General
    appName: 'Saboura El Mahrousa',
    appNameFull: 'Saboura El Mahrousa | Life Makers',
    lifeMakers: 'Life Makers Egypt - Qalyubia',
    adminDashboard: 'Admin Dashboard',
    volunteerDashboard: 'Volunteer Dashboard',
    searchPlaceholder: 'Quick search...',
    languageName: 'العربية',
    logout: 'Logout',
    login: 'Login',
    email: 'Email',
    password: 'Password',
    loginTitle: 'Sign In',
    loginSubtitle: 'Saboura El Mahrousa - Life Makers Qalyubia',
    profile: 'Profile',
    notifications: 'Notifications',
    settings: 'Settings',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    actions: 'Actions',
    loading: 'Loading...',
    noData: 'No data available',
    success: 'Operation completed successfully',
    error: 'An error occurred',
    
    // Statistics Cards & Leaderboard
    volunteers: 'Volunteers',
    centers: 'Centers',
    visits: 'Visits',
    boardsReceived: 'Boards Received',
    boardsInstalled: 'Boards Installed',
    boardsReturned: 'Boards Returned',
    acceptedRestaurants: 'Accepted Stores',
    rejectedRestaurants: 'Rejected Stores',
    acceptanceRate: 'Acceptance Rate',
    todaysVisits: "Today's Visits",
    weeklyVisits: 'Weekly Visits',
    monthlyVisits: 'Monthly Visits',
    score: 'Score',
    rank: 'Rank',
    volunteerCount: 'Volunteers',
    lastActivity: 'Last Activity',

    // Form
    addVisit: 'Add Visit',
    visitDetails: 'Visit Details',
    date: 'Date',
    time: 'Time',
    notes: 'Notes',
    acceptedRepeater: 'Accepted Restaurants (Installed)',
    rejectedRepeater: 'Rejected Restaurants (Declined)',
    restaurantName: 'Restaurant Name',
    category: 'Category',
    address: 'Address',
    phone: 'Phone Number',
    reason: 'Reason of Rejection',
    notesOptional: 'Notes (Optional)',
    addItem: 'Add Restaurant +',
    submit: 'Submit Visit',

    // Restaurant Categories
    Supermarket: 'Supermarket',
    Café: 'Café',
    Restaurant: 'Restaurant',
    Bakery: 'Bakery',
    Pharmacy: 'Pharmacy',
    Store: 'Store',
    Other: 'Other',

    // Admin Features
    createVolunteer: 'Create Volunteer',
    editVolunteer: 'Edit Volunteer',
    deleteVolunteer: 'Delete Volunteer',
    volunteerName: 'Volunteer Name',
    assignCenter: 'Assign Center',
    createCenter: 'Create Center',
    editCenter: 'Edit Center',
    deleteCenter: 'Delete Center',
    centerName: 'Center Name',
    resetPassword: 'Reset Password',
    status: 'Status',
    active: 'Active',
    disabled: 'Disabled',
    settingsTitle: 'Integration Settings',
    zapierWebhookUrl: 'Zapier Webhook URL',
    googleSheetUrl: 'Google Sheet URL',

    // Leaderboard Medals
    leaderboardTitle: 'Centers Leaderboard',
    leaderboardSubtitle: 'Real-time centers ranking based on boards installed and activity',

    // Timeline & Details
    visitHistory: 'Visits History',
    activityTimeline: 'Activity Timeline',
    viewProfile: 'View Profile',
    viewCenterDetails: 'Center Details',
    back: 'Back',
    all: 'All'
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('ar');
  const [theme, setThemeState] = useState<Theme>('light');

  // Load configuration from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('saboura_lang') as Language;
      const savedTheme = localStorage.getItem('saboura_theme') as Theme;

      if (savedLang) {
        setLangState(savedLang);
      }
      if (savedTheme) {
        setThemeState(savedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeState('dark');
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saboura_lang', newLang);
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saboura_theme', newTheme);
    }
  };

  // Sync translation attributes
  useEffect(() => {
    const html = document.documentElement;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    html.lang = lang;
  }, [lang]);

  // Sync theme classes
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
  }, [theme]);

  const t = (key: string): string => {
    return translations[lang][key] || translations['ar'][key] || key;
  };

  return (
    <AppContext.Provider value={{ lang, theme, setLang, setTheme, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
