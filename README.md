# صبورة المحروسة | Saboura El Mahrousa

منصة رقمية متكاملة لإدارة ومتابعة مبادرة **"صبورة المحروسة"** التابعة لجمعية **صناع الحياة بمحافظة القليوبية**. تهدف المنصة لتمكين المتطوعين من تسجيل جولاتهم الميدانية لتعليق اللوحات الخيرية وتتبع الإحصائيات المركزية وجدول الصدارة بين المراكز.

A comprehensive digital management platform for the **"Saboura El Mahrousa"** charity board placement initiative by **Life Makers Egypt - Qalyubia**. This portal tracks volunteer street visits, board installation counts, center scoreboard rankings, and automates notifications.

---

## الميزات الرئيسية (Core Features)

1. **إدارة النزولات الميدانية (Field Visit Management)**:
   - تسجيل فوري لأعداد اللوحات المستلمة، المثبتة بالشارع، والمرتجة إلى المركز.
   - التحقق الحسابي الذكي لضمان تطابق الأعداد المعادلة: `المثبتة + المرتجعة = المستلمة`.
   - تسجيل قوائم المحلات المقبولة (المشاركة) والمحلات المعتذرة (مع تحديد سبب الرفض).

2. **نظام الصدارة والتصنيف (Dynamic Leaderboard)**:
   - احتساب نقاط التقييم للمراكز الفرعية بالقليوبية بناءً على معادلة الأثر:
     $$\text{Points} = (\text{Boards Installed} \times 10) + (\text{Accepted Stores} \times 5) + (\text{Visits} \times 2)$$
   - عرض فروع الصدارة مع أوسمة الميداليات الذهبية والفضية والبرونزية (🥇 🥈 🥉) ومؤشر نسبي للإنجاز.

3. **دورة تفعيل حسابات المتطوعين (Vetting & Registration Requests)**:
   - نموذج تسجيل حساب متطوع جديد يحدد المركز الفرعي التابع له.
   - مراجعة وتدقيق طلبات التسجيل من قبل الإدارة عبر لوحة تحكم مخصصة تدعم الموافقة الفورية أو الرفض والحذف.
   - حجب تسجيل الدخول للحسابات التي لا تزال في حالة "قيد الانتظار" (Pending).

4. **تكامل البيانات الخارجي (Integrations)**:
   - ربط فوري بنظام **Zapier Webhook** لإرسال بيانات النزولات فور تسجيلها.
   - ترحيل البيانات تلقائياً لنظام جداول بيانات جوجل (**Google Sheets API**) ومحاكاتها محلياً.

5. **الملف الشخصي المتكامل (Premium User Profile)**:
   - تحميل وتحديث صور الحساب الشخصي وتخزينها محلياً عبر تشفير base64.
   - تتبع سجل العمليات والأنشطة التاريخية للمستخدم بشكل تسلسلي.

6. **تصميم عصري متجاوب (Premium Design System)**:
   - تصميم ذو طابع كحلي داكن فاخر (#014976) ولمسات برتقالية (#FBAE42) يدعم الوضعين الداكن والفاتح.
   - دعم كامل للغتين العربية (RTL) والإنجليزية (LTR).
   - مؤشرات تحميل ذكية وتنبيهات فورية (Toast Notifications) للتحقق الفوري.

---

## هيكل المشروع (Project Directory Structure)

```text
saboura-el-mahrousa/
├── public/                       # الأصول الثابتة والصور والشعارات
│   ├── logo.png                  # الشعار الرسمي لصناع الحياة القليوبية
│   └── avatar-placeholder.png    # الصورة الرمزية الافتراضية للملف الشخصي
├── supabase/
│   ├── migrations/
│   │   ├── 20260604000000_init.sql          # إنشاء الجداول وسياسات الأمن RLS والربط الأساسي
│   │   └── 20260725000000_add_pending_status.sql # إضافة حالة الانتظار لقائمة حالات المستخدمين
│   └── seed.sql                  # تهيئة البيانات التأسيسية للمراكز والحسابات الافتراضية
├── src/
│   ├── app/
│   │   ├── layout.tsx            # تخطيط HTML وربط الخطوط والأيقونات
│   │   ├── globals.css           # ملف التنسيق وتحديد خط القاهرة Cairo ومتغيرات الألوان
│   │   ├── page.tsx              # صفحة الهبوط العامة وعرض الإحصائيات وجدول الصدارة
│   │   ├── login/
│   │   │   └── page.tsx          # واجهة الدخول بتصميم زجاجي فاخر
│   │   ├── register/
│   │   │   └── page.tsx          # صفحة تسجيل المتطوعين الجدد ورفع طلب التفعيل
│   │   ├── profile/
│   │   │   └── page.tsx          # تعديل البيانات الشخصية ورفع الصورة الرمزية والأنشطة التاريخية
│   │   └── dashboard/
│   │       ├── admin/
│   │       │   └── page.tsx      # لوحة تحكم المسؤول العام والتحليلات البيانية (Recharts)
│   │       ├── volunteer/
│   │       │   ├── page.tsx      # لوحة تحكم المتطوع الشخصية وسجل جولاته
│   │       │   └── new-visit/
│   │       │       └── page.tsx  # نموذج إضافة نزولة ميدانية جديدة مع المدخلات المتكررة
│   │       ├── requests/
│   │       │   └── page.tsx      # إدارة طلبات التسجيل المعلقة للمتطوعين (Admin)
│   │       ├── leaderboard/
│   │       │   └── page.tsx      # لوحة الصدارة وتفاصيل الفروع الميدانية بالرسوم البيانية
│   │       ├── centers/
│   │       │   └── page.tsx      # لوحة إضافة وتعديل الفروع والمراكز المعتمدة
│   │       ├── volunteers/
│   │       │   └── page.tsx      # إدارة وتعديل حسابات المتطوعين وإعادة تعيين كلمات المرور
│   │       └── visits/
│   │           └── page.tsx      # سجل النزولات العام وتصدير البيانات (PDF / Excel / CSV)
│   ├── components/               # عناصر الواجهات المشتركة (Sidebar, Navbar, AnimatedCounter)
│   ├── context/                  # إدارة جلسات الأمان واللغة (AuthContext, AppContext)
│   ├── lib/                      # طبقة الربط بقواعد البيانات وتصدير الملفات (db, supabase)
│   └── types/                    # واجهات كائنات البيانات المستخدمة في النظام
└── package.json                  # ملف الحزم البرمجية والمكتبات التابعة
```

---

## دليل التثبيت والتشغيل المحلي (Local Setup Guide)

### 1. المتطلبات الأساسية (Prerequisites)
- تثبيت بيئة عمل **Node.js** (الإصدار 18.0.0 أو أحدث).
- مدير حزم الحواسب **npm** أو **yarn**.

### 2. تثبيت الحزم (Installation)
افتح سطر الأوامر في مجلد المشروع ونفّذ التالي:
```bash
npm install
```

### 3. إعداد متغيرات البيئة (Environment Configuration)
قم بنسخ ملف `.env.example` وتسميته بـ `.env.local`:
```bash
cp .env.example .env.local
```
قم بملء البيانات الخاصة برابط مشروعك في Supabase ورابط خطاف Zapier:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxx/xxxx/
```

### 4. تشغيل خادم التطوير (Local Development)
شغل المشروع محلياً عبر الأمر التالي:
```bash
npm run dev
```
افتح الرابط [http://localhost:3000](http://localhost:3000) في المتصفح لاستعراض النظام.

---

## تهيئة قاعدة بيانات Supabase (Supabase Database Setup)

لتشغيل النظام مع خوادم Supabase السحابية ومزامنة البيانات فعلياً:

1. أنشئ مشروعاً جديداً في **Supabase Console**.
2. اذهب لتبويب **SQL Editor** من القائمة الجانبية.
3. افتح ملف [20260604000000_init.sql](file:///C:/Users/0000/.gemini/antigravity/scratch/saboura-el-mahrousa/supabase/migrations/20260604000000_init.sql) في المجلد، وانسخ الأكواد البرمجية بالكامل والصقها في محرر SQL ثم اضغط **Run**.
4. افتح ملف [20260725000000_add_pending_status.sql](file:///C:/Users/0000/.gemini/antigravity/scratch/saboura-el-mahrousa/supabase/migrations/20260725000000_add_pending_status.sql)، وانسخ كامل الأكواد البرمجية والصقها في محرر SQL ثم اضغط **Run**.
5. لتأسيس البيانات وتهيئة الحسابات التجريبية الافتراضية، افتح ملف [seed.sql](file:///C:/Users/0000/.gemini/antigravity/scratch/saboura-el-mahrousa/supabase/seed.sql) وقم بتنفيذه بالكامل داخل محرر SQL بالمنصة السحابية.

---

## حسابات الجلسة التجريبية الافتراضية (Default Demo Credentials)

يدعم النظام وضع محاكاة التخزين المحلي (LocalStorage Mode) بشكل تلقائي عند عدم تهيئة متغيرات بيئة Supabase، مما يسمح بتجربة واختبار كافة الميزات خارج الصندوق دون أي إعداد مسبق باستخدام الحسابات التالية:

* **حساب مسؤول النظام (Administrator)**:
  - البريد الإلكتروني: `admin@lifemakers.org`
  - كلمة المرور: `admin123@`

* **حساب المتطوع الميداني (Volunteer)**:
  - البريد الإلكتروني: `volunteer@lifemakers.org`
  - كلمة المرور: `volunteer123@`
