import { supabase } from './supabase';
import { Center, User, Volunteer, Visit, AcceptedRestaurant, RejectedRestaurant, ActivityLog, Notification, Setting } from '@/types';

// Webhook / Integration trigger helpers
async function triggerIntegrations(visitPayload: any) {
  try {
    // 1. Fetch settings for webhook URLs
    const zapierUrl = await getSetting('zapier_webhook_url');
    const sheetUrl = await getSetting('google_sheet_url');

    const payload = {
      timestamp: new Date().toISOString(),
      volunteer: visitPayload.volunteer_name,
      phone: visitPayload.volunteer_phone,
      center: visitPayload.center_name,
      date: visitPayload.visit_date,
      time: visitPayload.visit_time,
      boards_received: visitPayload.boards_received,
      boards_installed: visitPayload.boards_installed,
      boards_returned: visitPayload.boards_returned,
      accepted_restaurants_count: visitPayload.accepted_count,
      rejected_restaurants_count: visitPayload.rejected_count,
      accepted_restaurant_names: visitPayload.accepted_names,
      rejected_restaurant_names: visitPayload.rejected_names,
      notes: visitPayload.notes || '',
    };

    console.log('Triggering integrations with payload:', payload);

    // Hit Zapier Webhook if set
    if (zapierUrl) {
      fetch(zapierUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(e => console.error('Zapier webhook failed:', e));
    } else {
      // Trigger default test webhook simulator
      fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'zapier', payload }),
      }).catch(() => {});
    }

    // Append to Google Sheets via simulator API route (which also logs or calls Sheets API)
    fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'google_sheets', payload, sheetUrl }),
    }).catch(() => {});

  } catch (err) {
    console.error('Error in triggerIntegrations:', err);
  }
}

// Check if we should use LocalStorage mock (fallback if no connection or dummy credentials)
const isLocalStorageMode = () => {
  if (typeof window === 'undefined') return true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes('dummy-project') || url.includes('your-supabase');
};

// Initial Seed Data for LocalStorage Fallback
const SEEDS = {
  centers: [
    { id: 'b1111111-1111-1111-1111-111111111111', name: 'مركز بنها', score: 104, created_at: new Date().toISOString() },
    { id: 'b2222222-2222-2222-2222-222222222222', name: 'مركز طوخ', score: 0, created_at: new Date().toISOString() },
    { id: 'b3333333-3333-3333-3333-333333333333', name: 'مركز شبين القناطر', score: 0, created_at: new Date().toISOString() },
    { id: 'b4444444-4444-4444-4444-444444444444', name: 'مركز قليوب', score: 0, created_at: new Date().toISOString() },
    { id: 'b5555555-5555-5555-5555-555555555555', name: 'مركز الخانكة', score: 0, created_at: new Date().toISOString() }
  ] as Center[],

  users: [
    { id: 'a1111111-1111-1111-1111-111111111111', name: 'المدير العام', email: 'admin@lifemakers.org', role: 'Administrator', status: 'active', created_at: new Date().toISOString() },
    { id: 'v2222222-2222-2222-2222-222222222222', name: 'أحمد علي', email: 'volunteer@lifemakers.org', role: 'Volunteer', status: 'active', created_at: new Date().toISOString() }
  ] as User[],

  volunteers: [
    { id: 'f1111111-1111-1111-1111-111111111111', user_id: 'v2222222-2222-2222-2222-222222222222', name: 'أحمد علي', phone: '01012345678', center_id: 'b1111111-1111-1111-1111-111111111111', created_at: new Date().toISOString() }
  ] as Volunteer[],

  visits: [
    { id: '55555555-1111-1111-1111-111111111111', volunteer_id: 'f1111111-1111-1111-1111-111111111111', visit_date: '2026-07-24', visit_time: '14:30:00', boards_received: 10, boards_installed: 8, boards_returned: 2, notes: 'جولة في شارع المحطة ببنها', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '55555555-2222-2222-2222-222222222222', volunteer_id: 'f1111111-1111-1111-1111-111111111111', visit_date: '2026-07-22', visit_time: '11:00:00', boards_received: 8, boards_installed: 6, boards_returned: 2, notes: 'منطقة الفلل ببنها', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: '55555555-3333-3333-3333-333333333333', volunteer_id: 'f1111111-1111-1111-1111-111111111111', visit_date: '2026-07-20', visit_time: '17:00:00', boards_received: 12, boards_installed: 10, boards_returned: 2, notes: 'وسط البلد بنها', created_at: new Date(Date.now() - 86400000 * 5).toISOString() }
  ] as Visit[],

  accepted: [
    { id: 'ac1', visit_id: '55555555-1111-1111-1111-111111111111', name: 'مطعم البركة', category: 'Supermarket', address: 'بنها - شارع المحطة', phone: '0133245566', notes: 'تم تركيب البورد بجانب الكاشير', created_at: new Date().toISOString() },
    { id: 'ac2', visit_id: '55555555-1111-1111-1111-111111111111', name: 'كافيه السرايا', category: 'Café', address: 'بنها - أمام محطة القطار', phone: '01099887766', notes: 'المسؤول متعاون جداً', created_at: new Date().toISOString() },
    { id: 'ac3', visit_id: '55555555-2222-2222-2222-222222222222', name: 'سوبرماركت المدينة', category: 'Supermarket', address: 'بنها - منطقة الفلل', phone: '0133445566', notes: 'المدير وافق فوراً', created_at: new Date().toISOString() },
    { id: 'ac4', visit_id: '55555555-2222-2222-2222-222222222222', name: 'مخبز الأمانة', category: 'Bakery', address: 'بنها - الفلل بجوار المسجد', phone: '01066778899', notes: 'وضعنا بورد صغير', created_at: new Date().toISOString() },
    { id: 'ac5', visit_id: '55555555-3333-3333-3333-333333333333', name: 'مطعم كوكو', category: 'Restaurant', address: 'بنها - وسط البلد', phone: '01011223344', notes: 'وضعنا البورد الرئيسي في الواجهة', created_at: new Date().toISOString() },
    { id: 'ac6', visit_id: '55555555-3333-3333-3333-333333333333', name: 'كافيه لافا', category: 'Café', address: 'بنها - الممشى', phone: '01122334455', notes: 'صاحب المحل رحّب بالفكرة', created_at: new Date().toISOString() }
  ] as AcceptedRestaurant[],

  rejected: [
    { id: 'rj1', visit_id: '55555555-1111-1111-1111-111111111111', name: 'صيدلية الشفاء', category: 'Pharmacy', reason: 'غير مهتم بالمبادرة', notes: 'المالك يفضل التبرعات المباشرة للمستشفيات', created_at: new Date().toISOString() },
    { id: 'rj2', visit_id: '55555555-2222-2222-2222-222222222222', name: 'محل الهدايا', category: 'Store', reason: 'المكان ضيق جداً لا يسمح بتركيب بورد', notes: 'لا يوجد مساحة على الجدران', created_at: new Date().toISOString() }
  ] as RejectedRestaurant[],

  logs: [
    { id: 'log1', user_id: 'a1111111-1111-1111-1111-111111111111', action_type: 'system_init', description: 'تهيئة النظام وإنشاء حساب المسؤول الافتراضي', created_at: new Date().toISOString() },
    { id: 'log2', user_id: 'v2222222-2222-2222-2222-222222222222', action_type: 'visit_submit', description: 'تم تسجيل جولة جديدة رقم (1) وتثبيت 8 لوحات', created_at: new Date().toISOString() }
  ] as ActivityLog[],

  notifications: [
    { id: 'nt1', user_id: 'a1111111-1111-1111-1111-111111111111', title: 'نزولة جديدة', message: 'قام المتطوع أحمد علي بتسجيل نزولة جديدة بنجاح في مركز بنها', is_read: false, created_at: new Date().toISOString() },
    { id: 'nt2', user_id: 'v2222222-2222-2222-2222-222222222222', title: 'أهلاً بك في صبورة المحروسة', message: 'تم تفعيل حسابك بنجاح. يمكنك الآن تسجيل نزولاتك ومتابعة ترتيب مركزك!', is_read: false, created_at: new Date().toISOString() }
  ] as Notification[],

  settings: [
    { id: 'st1', key: 'zapier_webhook_url', value: '' },
    { id: 'st2', key: 'google_sheet_url', value: '' }
  ] as Setting[]
};

// LocalStorage Helpers
function getStore<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  const stored = localStorage.getItem(`saboura_${key}`);
  if (!stored) {
    localStorage.setItem(`saboura_${key}`, JSON.stringify(defaultVal));
    return defaultVal;
  }
  return JSON.parse(stored);
}

function setStore<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`saboura_${key}`, JSON.stringify(data));
}

// Recalculate local scores for centers
function syncLocalScores() {
  const centers = getStore<Center[]>('centers', SEEDS.centers);
  const volunteers = getStore<Volunteer[]>('volunteers', SEEDS.volunteers);
  const visits = getStore<Visit[]>('visits', SEEDS.visits);
  const accepted = getStore<AcceptedRestaurant[]>('accepted', SEEDS.accepted);

  const updatedCenters = centers.map(center => {
    // Find volunteers for this center
    const centerVols = volunteers.filter(v => v.center_id === center.id);
    const centerVolIds = centerVols.map(v => v.id);

    // Find visits for these volunteers
    const centerVisits = visits.filter(v => centerVolIds.includes(v.volunteer_id));
    const visitIds = centerVisits.map(v => v.id);

    const boardsInstalled = centerVisits.reduce((sum, v) => sum + (v.boards_installed || 0), 0);
    const acceptedCount = accepted.filter(a => visitIds.includes(a.visit_id)).length;
    const visitsCount = centerVisits.length;

    // Formula: (Boards Installed * 10) + (Accepted * 5) + (Visits * 2)
    const score = (boardsInstalled * 10) + (acceptedCount * 5) + (visitsCount * 2);

    return {
      ...center,
      score
    };
  });

  setStore('centers', updatedCenters);
}

// Initialize LocalStore
if (typeof window !== 'undefined') {
  getStore('centers', SEEDS.centers);
  getStore('users', SEEDS.users);
  getStore('volunteers', SEEDS.volunteers);
  getStore('visits', SEEDS.visits);
  getStore('accepted', SEEDS.accepted);
  getStore('rejected', SEEDS.rejected);
  getStore('logs', SEEDS.logs);
  getStore('notifications', SEEDS.notifications);
  getStore('settings', SEEDS.settings);
  syncLocalScores();
}


/* ============================================================
   EXPORTED DATABASE APIS
   ============================================================ */

// --- CENTERS API ---

export async function getCenters(): Promise<Center[]> {
  if (isLocalStorageMode()) {
    syncLocalScores();
    const centers = getStore<Center[]>('centers', SEEDS.centers);
    const volunteers = getStore<Volunteer[]>('volunteers', SEEDS.volunteers);
    const visits = getStore<Visit[]>('visits', SEEDS.visits);
    const accepted = getStore<AcceptedRestaurant[]>('accepted', SEEDS.accepted);
    const rejected = getStore<RejectedRestaurant[]>('rejected', SEEDS.rejected);

    return centers.map(c => {
      const cVols = volunteers.filter(v => v.center_id === c.id);
      const cVolIds = cVols.map(v => v.id);
      const cVisits = visits.filter(v => cVolIds.includes(v.volunteer_id));
      const cVisitIds = cVisits.map(v => v.id);

      return {
        ...c,
        volunteer_count: cVols.length,
        visits_count: cVisits.length,
        boards_installed_count: cVisits.reduce((sum, v) => sum + v.boards_installed, 0),
        accepted_count: accepted.filter(a => cVisitIds.includes(a.visit_id)).length,
        rejected_count: rejected.filter(r => cVisitIds.includes(r.visit_id)).length
      };
    });
  }

  // Supabase implementation
  const { data, error } = await supabase
    .from('centers')
    .select(`
      *,
      volunteers (
        id,
        visits (
          id,
          boards_installed,
          accepted_restaurants (id),
          rejected_restaurants (id)
        )
      )
    `);
  
  if (error) throw error;
  
  return data.map((c: any) => {
    let volCount = c.volunteers?.length || 0;
    let visitsCount = 0;
    let boardsInstalled = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;

    c.volunteers?.forEach((vol: any) => {
      visitsCount += vol.visits?.length || 0;
      vol.visits?.forEach((v: any) => {
        boardsInstalled += v.boards_installed || 0;
        acceptedCount += v.accepted_restaurants?.length || 0;
        rejectedCount += v.rejected_restaurants?.length || 0;
      });
    });

    return {
      id: c.id,
      name: c.name,
      score: c.score,
      created_at: c.created_at,
      updated_at: c.updated_at,
      volunteer_count: volCount,
      visits_count: visitsCount,
      boards_installed_count: boardsInstalled,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount
    };
  });
}

export async function createCenter(name: string): Promise<Center> {
  if (isLocalStorageMode()) {
    const centers = getStore<Center[]>('centers', SEEDS.centers);
    const newCenter: Center = {
      id: crypto.randomUUID(),
      name,
      score: 0,
      created_at: new Date().toISOString()
    };
    centers.push(newCenter);
    setStore('centers', centers);
    return newCenter;
  }

  const { data, error } = await supabase.from('centers').insert({ name }).select().single();
  if (error) throw error;
  return data as Center;
}

export async function updateCenter(id: string, name: string): Promise<Center> {
  if (isLocalStorageMode()) {
    const centers = getStore<Center[]>('centers', SEEDS.centers);
    const idx = centers.findIndex(c => c.id === id);
    if (idx !== -1) {
      centers[idx].name = name;
      setStore('centers', centers);
      return centers[idx];
    }
    throw new Error('Center not found');
  }

  const { data, error } = await supabase.from('centers').update({ name }).eq('id', id).select().single();
  if (error) throw error;
  return data as Center;
}

export async function deleteCenter(id: string): Promise<void> {
  if (isLocalStorageMode()) {
    const centers = getStore<Center[]>('centers', SEEDS.centers);
    const filtered = centers.filter(c => c.id !== id);
    setStore('centers', filtered);
    return;
  }

  const { error } = await supabase.from('centers').delete().eq('id', id);
  if (error) throw error;
}

// --- VOLUNTEERS API ---

export async function getVolunteers(): Promise<Volunteer[]> {
  if (isLocalStorageMode()) {
    const volunteers = getStore<Volunteer[]>('volunteers', SEEDS.volunteers);
    const centers = getStore<Center[]>('centers', SEEDS.centers);
    const users = getStore<User[]>('users', SEEDS.users);
    const visits = getStore<Visit[]>('visits', SEEDS.visits);
    const accepted = getStore<AcceptedRestaurant[]>('accepted', SEEDS.accepted);
    const rejected = getStore<RejectedRestaurant[]>('rejected', SEEDS.rejected);

    return volunteers.map(vol => {
      const user = users.find(u => u.id === vol.user_id) || { id: vol.user_id, name: vol.name, email: '', role: 'Volunteer' as const, status: 'active' as const };
      const center = centers.find(c => c.id === vol.center_id) || null;
      const volVisits = visits.filter(v => v.volunteer_id === vol.id);
      const visitIds = volVisits.map(v => v.id);

      // Sort visits to find the last activity date
      const sortedVisits = [...volVisits].sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
      const lastActivity = sortedVisits[0]?.visit_date || vol.created_at || '';

      return {
        ...vol,
        user,
        center,
        visits_count: volVisits.length,
        boards_received: volVisits.reduce((sum, v) => sum + v.boards_received, 0),
        boards_installed: volVisits.reduce((sum, v) => sum + v.boards_installed, 0),
        boards_returned: volVisits.reduce((sum, v) => sum + v.boards_returned, 0),
        accepted_count: accepted.filter(a => visitIds.includes(a.visit_id)).length,
        rejected_count: rejected.filter(r => visitIds.includes(r.visit_id)).length,
        last_activity_date: lastActivity
      };
    });
  }

  // Supabase implementation
  const { data, error } = await supabase
    .from('volunteers')
    .select(`
      *,
      user:users(*),
      center:centers(*),
      visits (
        *,
        accepted_restaurants (id),
        rejected_restaurants (id)
      )
    `);

  if (error) throw error;

  return data.map((vol: any) => {
    const volVisits = vol.visits || [];
    const sortedVisits = [...volVisits].sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
    const lastActivity = sortedVisits[0]?.visit_date || vol.created_at || '';

    let received = 0;
    let installed = 0;
    let returned = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;

    volVisits.forEach((v: any) => {
      received += v.boards_received || 0;
      installed += v.boards_installed || 0;
      returned += v.boards_returned || 0;
      acceptedCount += v.accepted_restaurants?.length || 0;
      rejectedCount += v.rejected_restaurants?.length || 0;
    });

    return {
      id: vol.id,
      user_id: vol.user_id,
      name: vol.name,
      phone: vol.phone,
      center_id: vol.center_id,
      created_at: vol.created_at,
      updated_at: vol.updated_at,
      user: vol.user,
      center: vol.center,
      visits_count: volVisits.length,
      boards_received: received,
      boards_installed: installed,
      boards_returned: returned,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      last_activity_date: lastActivity
    };
  });
}

export async function createVolunteer(name: string, phone: string, email: string, centerId: string): Promise<Volunteer> {
  if (isLocalStorageMode()) {
    const users = getStore<User[]>('users', SEEDS.users);
    const volunteers = getStore<Volunteer[]>('volunteers', SEEDS.volunteers);
    
    const userId = crypto.randomUUID();
    const volId = crypto.randomUUID();

    const newUser: User = {
      id: userId,
      name,
      email,
      role: 'Volunteer',
      status: 'active',
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    setStore('users', users);

    const newVol: Volunteer = {
      id: volId,
      user_id: userId,
      name,
      phone,
      center_id: centerId,
      created_at: new Date().toISOString()
    };
    volunteers.push(newVol);
    setStore('volunteers', volunteers);

    // Log Activity
    await logActivity(null, 'create_volunteer', `تم إنشاء متطوع جديد: ${name} وتعيينه لمركز بنها`);

    return newVol;
  }

  // Supabase create user & volunteer - admin only
  // We first invoke the signup which registers in auth.users and via trigger or API insert profiles
  // To avoid auth problems in standard user creations, we insert directly in public users and volunteers
  // The system admin would trigger real Supabase signup
  const tempUserId = crypto.randomUUID();
  const { data: userData, error: userError } = await supabase.from('users').insert({
    id: tempUserId,
    name,
    email,
    role: 'Volunteer',
    status: 'active'
  }).select().single();

  if (userError) throw userError;

  const { data: volData, error: volError } = await supabase.from('volunteers').insert({
    user_id: tempUserId,
    name,
    phone,
    center_id: centerId
  }).select().single();

  if (volError) throw volError;
  return volData as Volunteer;
}

export async function updateVolunteer(id: string, name: string, phone: string, centerId: string, status: 'active' | 'disabled' | 'pending'): Promise<Volunteer> {
  if (isLocalStorageMode()) {
    const volunteers = getStore<Volunteer[]>('volunteers', SEEDS.volunteers);
    const users = getStore<User[]>('users', SEEDS.users);

    const volIdx = volunteers.findIndex(v => v.id === id);
    if (volIdx === -1) throw new Error('Volunteer not found');

    volunteers[volIdx].name = name;
    volunteers[volIdx].phone = phone;
    volunteers[volIdx].center_id = centerId;
    setStore('volunteers', volunteers);

    const userIdx = users.findIndex(u => u.id === volunteers[volIdx].user_id);
    if (userIdx !== -1) {
      users[userIdx].name = name;
      users[userIdx].status = status;
      setStore('users', users);
    }

    return volunteers[volIdx];
  }

  const { data: volData, error: volError } = await supabase
    .from('volunteers')
    .update({ name, phone, center_id: centerId })
    .eq('id', id)
    .select()
    .single();

  if (volError) throw volError;

  const { error: userError } = await supabase
    .from('users')
    .update({ name, status })
    .eq('id', volData.user_id);

  if (userError) throw userError;
  return volData as Volunteer;
}

export async function deleteVolunteer(id: string): Promise<void> {
  if (isLocalStorageMode()) {
    const volunteers = getStore<Volunteer[]>('volunteers', SEEDS.volunteers);
    const users = getStore<User[]>('users', SEEDS.users);
    
    const vol = volunteers.find(v => v.id === id);
    if (vol) {
      setStore('volunteers', volunteers.filter(v => v.id !== id));
      setStore('users', users.filter(u => u.id !== vol.user_id));
    }
    return;
  }

  const { data: vol } = await supabase.from('volunteers').select('user_id').eq('id', id).single();
  if (vol) {
    await supabase.from('users').delete().eq('id', vol.user_id);
  }
}

export async function resetVolunteerPassword(id: string): Promise<void> {
  // Simulator only
  await logActivity(null, 'reset_password', `تمت إعادة تعيين كلمة المرور للمتطوع ذو المعرف: ${id}`);
}

// --- VISITS API ---

export async function getVisits(): Promise<Visit[]> {
  if (isLocalStorageMode()) {
    const visits = getStore<Visit[]>('visits', SEEDS.visits);
    const volunteers = getStore<Volunteer[]>('volunteers', SEEDS.volunteers);
    const accepted = getStore<AcceptedRestaurant[]>('accepted', SEEDS.accepted);
    const rejected = getStore<RejectedRestaurant[]>('rejected', SEEDS.rejected);
    const centers = getStore<Center[]>('centers', SEEDS.centers);

    return visits.map(v => {
      const vol = volunteers.find(vol => vol.id === v.volunteer_id);
      const center = vol ? (centers.find(c => c.id === vol.center_id) || null) : null;
      const completeVol = vol ? { ...vol, center } : undefined;

      return {
        ...v,
        volunteer: completeVol,
        accepted_restaurants: accepted.filter(a => a.visit_id === v.id),
        rejected_restaurants: rejected.filter(r => r.visit_id === v.id)
      };
    });
  }

  const { data, error } = await supabase
    .from('visits')
    .select(`
      *,
      volunteer:volunteers(
        *,
        center:centers(*)
      ),
      accepted_restaurants(*),
      rejected_restaurants(*)
    `);

  if (error) throw error;
  return data as Visit[];
}

export interface VisitInput {
  volunteer_id: string;
  visit_date: string;
  visit_time: string;
  boards_received: number;
  boards_installed: number;
  boards_returned: number;
  notes?: string;
  accepted_restaurants: Omit<AcceptedRestaurant, 'id' | 'visit_id'>[];
  rejected_restaurants: Omit<RejectedRestaurant, 'id' | 'visit_id'>[];
}

export async function addVisit(input: VisitInput): Promise<Visit> {
  const visitId = crypto.randomUUID();

  if (isLocalStorageMode()) {
    const visits = getStore<Visit[]>('visits', SEEDS.visits);
    const accepted = getStore<AcceptedRestaurant[]>('accepted', SEEDS.accepted);
    const rejected = getStore<RejectedRestaurant[]>('rejected', SEEDS.rejected);
    const volunteers = getStore<Volunteer[]>('volunteers', SEEDS.volunteers);
    const centers = getStore<Center[]>('centers', SEEDS.centers);

    const newVisit: Visit = {
      id: visitId,
      volunteer_id: input.volunteer_id,
      visit_date: input.visit_date,
      visit_time: input.visit_time,
      boards_received: input.boards_received,
      boards_installed: input.boards_installed,
      boards_returned: input.boards_returned,
      notes: input.notes,
      created_at: new Date().toISOString()
    };
    visits.push(newVisit);
    setStore('visits', visits);

    const newAccepted = input.accepted_restaurants.map(ar => ({
      ...ar,
      id: crypto.randomUUID(),
      visit_id: visitId,
      created_at: new Date().toISOString()
    }));
    accepted.push(...newAccepted);
    setStore('accepted', accepted);

    const newRejected = input.rejected_restaurants.map(rr => ({
      ...rr,
      id: crypto.randomUUID(),
      visit_id: visitId,
      created_at: new Date().toISOString()
    }));
    rejected.push(...newRejected);
    setStore('rejected', rejected);

    syncLocalScores();

    // Log Activity
    const volunteer = volunteers.find(v => v.id === input.volunteer_id);
    const center = volunteer ? centers.find(c => c.id === volunteer.center_id) : null;
    const volunteerName = volunteer?.name || 'متطوع';
    const volunteerPhone = volunteer?.phone || '';
    const centerName = center?.name || 'بدون مركز';

    await logActivity(volunteer?.user_id || null, 'visit_submit', `سجل المتطوع ${volunteerName} نزولة جديدة وقام بتركيب ${input.boards_installed} لوحات.`);
    
    // Create notification
    await createNotification('a1111111-1111-1111-1111-111111111111', 'نزولة جديدة', `قام المتطوع ${volunteerName} بتسجيل نزولة جديدة في ${centerName}.`);

    // Trigger Zapier & Google Sheets Integrations
    triggerIntegrations({
      volunteer_name: volunteerName,
      volunteer_phone: volunteerPhone,
      center_name: centerName,
      visit_date: input.visit_date,
      visit_time: input.visit_time,
      boards_received: input.boards_received,
      boards_installed: input.boards_installed,
      boards_returned: input.boards_returned,
      accepted_count: newAccepted.length,
      rejected_count: newRejected.length,
      accepted_names: newAccepted.map(a => a.name).join(', '),
      rejected_names: newRejected.map(r => r.name).join(', '),
      notes: input.notes
    });

    return {
      ...newVisit,
      accepted_restaurants: newAccepted,
      rejected_restaurants: newRejected
    };
  }

  // Supabase Implementation
  const { data: visitData, error: visitError } = await supabase
    .from('visits')
    .insert({
      id: visitId,
      volunteer_id: input.volunteer_id,
      visit_date: input.visit_date,
      visit_time: input.visit_time,
      boards_received: input.boards_received,
      boards_installed: input.boards_installed,
      boards_returned: input.boards_returned,
      notes: input.notes
    })
    .select()
    .single();

  if (visitError) throw visitError;

  if (input.accepted_restaurants.length > 0) {
    const accToInsert = input.accepted_restaurants.map(ar => ({ ...ar, visit_id: visitId }));
    const { error: accErr } = await supabase.from('accepted_restaurants').insert(accToInsert);
    if (accErr) throw accErr;
  }

  if (input.rejected_restaurants.length > 0) {
    const rejToInsert = input.rejected_restaurants.map(rr => ({ ...rr, visit_id: visitId }));
    const { error: rejErr } = await supabase.from('rejected_restaurants').insert(rejToInsert);
    if (rejErr) throw rejErr;
  }

  // Retrieve volunteer & center information for integrations
  const { data: volInfo } = await supabase
    .from('volunteers')
    .select('*, center:centers(*)')
    .eq('id', input.volunteer_id)
    .single();

  const volName = volInfo?.name || 'متطوع';
  const volPhone = volInfo?.phone || '';
  const centName = volInfo?.center?.name || 'بدون مركز';

  // Log activity and integrations
  await logActivity(volInfo?.user_id || null, 'visit_submit', `سجل المتطوع ${volName} نزولة جديدة وقام بتركيب ${input.boards_installed} لوحات.`);
  
  triggerIntegrations({
    volunteer_name: volName,
    volunteer_phone: volPhone,
    center_name: centName,
    visit_date: input.visit_date,
    visit_time: input.visit_time,
    boards_received: input.boards_received,
    boards_installed: input.boards_installed,
    boards_returned: input.boards_returned,
    accepted_count: input.accepted_restaurants.length,
    rejected_count: input.rejected_restaurants.length,
    accepted_names: input.accepted_restaurants.map(a => a.name).join(', '),
    rejected_names: input.rejected_restaurants.map(r => r.name).join(', '),
    notes: input.notes
  });

  return visitData as Visit;
}

// --- ACTIVITY LOGS API ---

export async function getActivityLogs(): Promise<ActivityLog[]> {
  if (isLocalStorageMode()) {
    const logs = getStore<ActivityLog[]>('logs', SEEDS.logs);
    const users = getStore<User[]>('users', SEEDS.users);

    return [...logs]
      .map(log => ({
        ...log,
        user: users.find(u => u.id === log.user_id) || undefined
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, user:users(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ActivityLog[];
}

export async function logActivity(userId: string | null, actionType: string, description: string): Promise<ActivityLog> {
  const newLog = {
    id: crypto.randomUUID(),
    user_id: userId,
    action_type: actionType,
    description,
    created_at: new Date().toISOString()
  };

  if (isLocalStorageMode()) {
    const logs = getStore<ActivityLog[]>('logs', SEEDS.logs);
    logs.push(newLog);
    setStore('logs', logs);
    return newLog;
  }

  const { data, error } = await supabase.from('activity_logs').insert(newLog).select().single();
  if (error) throw error;
  return data as ActivityLog;
}

// --- NOTIFICATIONS API ---

export async function getNotifications(userId: string): Promise<Notification[]> {
  if (isLocalStorageMode()) {
    const notifications = getStore<Notification[]>('notifications', SEEDS.notifications);
    return notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Notification[];
}

export async function createNotification(userId: string, title: string, message: string): Promise<Notification> {
  const newNotification = {
    id: crypto.randomUUID(),
    user_id: userId,
    title,
    message,
    is_read: false,
    created_at: new Date().toISOString()
  };

  if (isLocalStorageMode()) {
    const notifications = getStore<Notification[]>('notifications', SEEDS.notifications);
    notifications.push(newNotification);
    setStore('notifications', notifications);
    return newNotification;
  }

  const { data, error } = await supabase.from('notifications').insert(newNotification).select().single();
  if (error) throw error;
  return data as Notification;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  if (isLocalStorageMode()) {
    const notifications = getStore<Notification[]>('notifications', SEEDS.notifications);
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifications[idx].is_read = true;
      setStore('notifications', notifications);
    }
    return;
  }

  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

// --- SETTINGS API ---

export async function getSetting(key: string): Promise<string> {
  if (isLocalStorageMode()) {
    const settings = getStore<Setting[]>('settings', SEEDS.settings);
    const s = settings.find(st => st.key === key);
    return s ? s.value : '';
  }

  const { data, error } = await supabase.from('settings').select('value').eq('key', key).single();
  if (error) return '';
  return data.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (isLocalStorageMode()) {
    const settings = getStore<Setting[]>('settings', SEEDS.settings);
    const idx = settings.findIndex(st => st.key === key);
    if (idx !== -1) {
      settings[idx].value = value;
    } else {
      settings.push({ id: crypto.randomUUID(), key, value });
    }
    setStore('settings', settings);
    return;
  }

  const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

// --- PENDING REGISTRATIONS API ---

export async function getPendingUsers(): Promise<any[]> {
  if (isLocalStorageMode()) {
    syncLocalScores();
    const users = getStore<User[]>('users', SEEDS.users);
    const volunteers = getStore<Volunteer[]>('volunteers', SEEDS.volunteers);
    const centers = getStore<Center[]>('centers', SEEDS.centers);

    const pending = users.filter(u => u.status === 'pending');

    return pending.map(u => {
      const vol = volunteers.find(v => v.user_id === u.id);
      const center = vol ? (centers.find(c => c.id === vol.center_id) || null) : null;
      return {
        ...u,
        volunteer: vol ? { ...vol, center } : null
      };
    });
  }

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      volunteer:volunteers(
        *,
        center:centers(*)
      )
    `)
    .eq('status', 'pending');

  if (error) throw error;
  return data || [];
}

export async function approveUser(userId: string): Promise<void> {
  if (isLocalStorageMode()) {
    const users = getStore<User[]>('users', SEEDS.users);
    const volunteers = getStore<Volunteer[]>('volunteers', SEEDS.volunteers);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].status = 'active';
      setStore('users', users);

      const vol = volunteers.find(v => v.user_id === userId);
      const volName = vol?.name || users[idx].name;

      await logActivity(null, 'approve_volunteer', `تمت الموافقة على تفعيل حساب المتطوع: ${volName}`);
      await createNotification(userId, 'تم تفعيل حسابك', 'مرحباً بك في مبادرة صبورة المحروسة! تمت الموافقة على تفعيل حسابك ويمكنك البدء بتسجيل النزولات.');
    }
    return;
  }

  const { error } = await supabase
    .from('users')
    .update({ status: 'active' })
    .eq('id', userId);

  if (error) throw error;

  const { data: vol } = await supabase
    .from('volunteers')
    .select('name')
    .eq('user_id', userId)
    .single();

  const volName = vol?.name || 'متطوع';

  await logActivity(null, 'approve_volunteer', `تمت الموافقة على تفعيل حساب المتطوع: ${volName}`);
  await createNotification(userId, 'تم تفعيل حسابك', 'مرحباً بك في مبادرة صبورة المحروسة! تمت الموافقة على تفعيل حسابك ويمكنك البدء بتسجيل النزولات.');
}

export async function rejectUser(userId: string): Promise<void> {
  if (isLocalStorageMode()) {
    const users = getStore<User[]>('users', SEEDS.users);
    const volunteers = getStore<Volunteer[]>('volunteers', SEEDS.volunteers);
    
    const vol = volunteers.find(v => v.user_id === userId);
    const volName = vol?.name || 'متطوع';

    setStore('users', users.filter(u => u.id !== userId));
    setStore('volunteers', volunteers.filter(v => v.user_id !== userId));

    await logActivity(null, 'reject_volunteer', `تم رفض طلب تفعيل المتطوع: ${volName}`);
    return;
  }

  const { data: vol } = await supabase
    .from('volunteers')
    .select('name')
    .eq('user_id', userId)
    .single();
  const volName = vol?.name || 'متطوع';

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;

  await logActivity(null, 'reject_volunteer', `تم رفض طلب تفعيل المتطوع: ${volName}`);
}

