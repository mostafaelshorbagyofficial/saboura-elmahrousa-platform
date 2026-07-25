-- Seed Data for Saboura El Mahrousa
-- Life Makers Egypt - Qalyubia

-- 1. Seed Centers
INSERT INTO public.centers (id, name, score) VALUES
('b1111111-1111-1111-1111-111111111111', 'مركز بنها', 0),
('b2222222-2222-2222-2222-222222222222', 'مركز طوخ', 0),
('b3333333-3333-3333-3333-333333333333', 'مركز شبين القناطر', 0),
('b4444444-4444-4444-4444-444444444444', 'مركز قليوب', 0),
('b5555555-5555-5555-5555-555555555555', 'مركز الخانكة', 0)
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;

-- 2. Seed Default Administrator and Volunteers in Auth and Public schemas
DO $$
DECLARE
  admin_uid UUID := 'a1111111-1111-1111-1111-111111111111';
  admin_email TEXT := 'admin@lifemakers.org';
  admin_pass_hash TEXT;

  vol_uid UUID := 'v2222222-2222-2222-2222-222222222222';
  vol_email TEXT := 'volunteer@lifemakers.org';
  vol_pass_hash TEXT;

  center_benha UUID := 'b1111111-1111-1111-1111-111111111111';
  center_toukh UUID := 'b2222222-2222-2222-2222-222222222222';
BEGIN
  -- Generate hashes using pgcrypto's crypt
  admin_pass_hash := crypt('admin123@', gen_salt('bf', 10));
  vol_pass_hash := crypt('volunteer123@', gen_salt('bf', 10));

  -- A. Create Administrator in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    ) VALUES (
      admin_uid, '00000000-0000-0000-0000-000000000000', admin_email, admin_pass_hash, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"المدير العام"}'::jsonb,
      'authenticated', 'authenticated', NOW(), NOW()
    );
  END IF;

  -- B. Create Volunteer in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = vol_email) THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    ) VALUES (
      vol_uid, '00000000-0000-0000-0000-000000000000', vol_email, vol_pass_hash, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"أحمد علي"}'::jsonb,
      'authenticated', 'authenticated', NOW(), NOW()
    );
  END IF;

  -- C. Create Profiles in public.users
  INSERT INTO public.users (id, name, email, role, status) VALUES
  (admin_uid, 'المدير العام', admin_email, 'Administrator', 'active'),
  (vol_uid, 'أحمد علي', vol_email, 'Volunteer', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- D. Create Volunteer specific details
  INSERT INTO public.volunteers (id, user_id, name, phone, center_id) VALUES
  ('f1111111-1111-1111-1111-111111111111', vol_uid, 'أحمد علي', '01012345678', center_benha)
  ON CONFLICT (id) DO NOTHING;

END $$;

-- 3. Seed Visits & Restaurant logs (Mock Data)
DO $$
DECLARE
  vol_id UUID := 'f1111111-1111-1111-1111-111111111111';
  visit_1 UUID := '55555555-1111-1111-1111-111111111111';
  visit_2 UUID := '55555555-2222-2222-2222-222222222222';
  visit_3 UUID := '55555555-3333-3333-3333-333333333333';
  admin_uid UUID := 'a1111111-1111-1111-1111-111111111111';
BEGIN
  -- Visit 1: Completed yesterday
  INSERT INTO public.visits (id, volunteer_id, visit_date, visit_time, boards_received, boards_installed, boards_returned, notes)
  VALUES (visit_1, vol_id, CURRENT_DATE - 1, '14:30:00', 10, 8, 2, 'جولة في شارع المحطة ببنها')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.accepted_restaurants (visit_id, name, category, address, phone, notes) VALUES
  (visit_1, 'مطعم البركة', 'Supermarket', 'بنها - شارع المحطة', '0133245566', 'تم تركيب البورد بجانب الكاشير'),
  (visit_1, 'كافيه السرايا', 'Café', 'بنها - أمام محطة القطار', '01099887766', 'المسؤول متعاون جداً')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.rejected_restaurants (visit_id, name, category, reason, notes) VALUES
  (visit_1, 'صيدلية الشفاء', 'Pharmacy', 'غير مهتم بالمبادرة', 'المالك يفضل التبرعات المباشرة للمستشفيات')
  ON CONFLICT DO NOTHING;

  -- Visit 2: Completed 3 days ago
  INSERT INTO public.visits (id, volunteer_id, visit_date, visit_time, boards_received, boards_installed, boards_returned, notes)
  VALUES (visit_2, vol_id, CURRENT_DATE - 3, '11:00:00', 8, 6, 2, 'منطقة الفلل ببنها')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.accepted_restaurants (visit_id, name, category, address, phone, notes) VALUES
  (visit_2, 'سوبرماركت المدينة', 'Supermarket', 'بنها - منطقة الفلل', '0133445566', 'المدير وافق فوراً'),
  (visit_2, 'مخبز الأمانة', 'Bakery', 'بنها - الفلل بجوار المسجد', '01066778899', 'وضعنا بورد صغير')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.rejected_restaurants (visit_id, name, category, reason, notes) VALUES
  (visit_2, 'محل الهدايا', 'Store', 'المكان ضيق جداً لا يسمح بتركيب بورد', 'لا يوجد مساحة على الجدران')
  ON CONFLICT DO NOTHING;

  -- Visit 3: Completed 5 days ago
  INSERT INTO public.visits (id, volunteer_id, visit_date, visit_time, boards_received, boards_installed, boards_returned, notes)
  VALUES (visit_3, vol_id, CURRENT_DATE - 5, '17:00:00', 12, 10, 2, 'وسط البلد بنها')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.accepted_restaurants (visit_id, name, category, address, phone, notes) VALUES
  (visit_3, 'مطعم كوكو', 'Restaurant', 'بنها - وسط البلد', '01011223344', 'وضعنا البورد الرئيسي في الواجهة'),
  (visit_3, 'كافيه لافا', 'Café', 'بنها - الممشى', '01122334455', 'صاحب المحل رحّب بالفكرة')
  ON CONFLICT DO NOTHING;

  -- 4. Activity Logs
  INSERT INTO public.activity_logs (user_id, action_type, description) VALUES
  (admin_uid, 'system_init', 'تهيئة النظام وإنشاء حساب المسؤول الافتراضي'),
  (vol_id, 'visit_submit', 'تم تسجيل جولة جديدة رقم (1) وتثبيت 8 لوحات'),
  (vol_id, 'visit_submit', 'تم تسجيل جولة جديدة رقم (2) وتثبيت 6 لوحات'),
  (vol_id, 'visit_submit', 'تم تسجيل جولة جديدة رقم (3) وتثبيت 10 لوحات')
  ON CONFLICT DO NOTHING;

  -- 5. Notifications
  INSERT INTO public.notifications (user_id, title, message) VALUES
  (admin_uid, 'نزولة جديدة', 'قام المتطوع أحمد علي بتسجيل نزولة جديدة بنجاح في مركز بنها'),
  (vol_id, 'أهلاً بك في صبورة المحروسة', 'تم تفعيل حسابك بنجاح. يمكنك الآن تسجيل نزولاتك ومتابعة ترتيب مركزك!')
  ON CONFLICT DO NOTHING;

  -- 6. Settings
  INSERT INTO public.settings (key, value) VALUES
  ('zapier_webhook_url', 'https://hooks.zapier.com/hooks/catch/123456/abcde/'),
  ('google_sheet_url', 'https://docs.google.com/spreadsheets/d/1234567890abcdef/edit'),
  ('app_name_ar', 'صبورة المحروسة'),
  ('app_name_en', 'Saboura El Mahrousa')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

END $$;
