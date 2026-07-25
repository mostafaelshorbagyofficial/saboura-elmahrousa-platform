'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Volunteer, UserRole } from '@/types';

interface AuthContextType {
  user: any; // Supabase auth user object or mock user
  profile: User | null; // Profile from public.users
  volunteerDetails: Volunteer | null; // Extra volunteer details (if role is Volunteer)
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, phone: string, email: string, password: string, centerId: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [volunteerDetails, setVolunteerDetails] = useState<Volunteer | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper to set login cookies for middleware checks
  const setLoginCookies = (isLoggedIn: boolean, userRole?: string) => {
    if (isLoggedIn && userRole) {
      document.cookie = `sb_logged_in=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      document.cookie = `sb_role=${userRole}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
      document.cookie = 'sb_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = 'sb_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
  };

  const fetchProfileAndVolunteer = async (uid: string): Promise<{ profile: User | null; volunteer: Volunteer | null }> => {
    try {
      // 1. Fetch from public.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (userError) throw userError;
      
      const prof = userData as User;
      let vol: Volunteer | null = null;

      // 2. If Volunteer, fetch details
      if (prof.role === 'Volunteer') {
        const { data: volData, error: volError } = await supabase
          .from('volunteers')
          .select('*, center:centers(*)')
          .eq('user_id', uid)
          .single();
        
        if (!volError && volData) {
          vol = volData as Volunteer;
        }
      }

      return { profile: prof, volunteer: vol };
    } catch (e) {
      console.warn('Could not fetch profile/volunteer from database:', e);
      return { profile: null, volunteer: null };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const { profile: prof, volunteer } = await fetchProfileAndVolunteer(user.id);
      if (prof) {
        setProfile(prof);
        setVolunteerDetails(volunteer);
        setRole(prof.role);
        setLoginCookies(true, prof.role);
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          const { profile: prof, volunteer } = await fetchProfileAndVolunteer(session.user.id);
          if (prof) {
            setProfile(prof);
            setVolunteerDetails(volunteer);
            setRole(prof.role);
            setLoginCookies(true, prof.role);
          } else {
            // If session exists but profile fetch fails, check fallback cookie
            const savedRole = getCookie('sb_role') as UserRole;
            setRole(savedRole || 'Volunteer');
          }
        } else {
          // 2. Check mock session in cookies for sandbox demo offline ease
          const isLoggedIn = getCookie('sb_logged_in') === 'true';
          const savedRole = getCookie('sb_role') as UserRole;
          
          if (isLoggedIn && savedRole) {
            const mockUser = {
              id: savedRole === 'Administrator' ? 'a1111111-1111-1111-1111-111111111111' : 'v2222222-2222-2222-2222-222222222222',
              email: savedRole === 'Administrator' ? 'admin@lifemakers.org' : 'volunteer@lifemakers.org',
            };
            setUser(mockUser);
            
            const mockProfile: User = {
              id: mockUser.id,
              name: savedRole === 'Administrator' ? 'المدير العام' : 'أحمد علي',
              email: mockUser.email,
              role: savedRole,
              status: 'active',
            };
            setProfile(mockProfile);
            setRole(savedRole);

            if (savedRole === 'Volunteer') {
              const mockVol: Volunteer = {
                id: 'f1111111-1111-1111-1111-111111111111',
                user_id: mockUser.id,
                name: 'أحمد علي',
                phone: '01012345678',
                center_id: 'b1111111-1111-1111-1111-111111111111',
                center: {
                  id: 'b1111111-1111-1111-1111-111111111111',
                  name: 'مركز بنها',
                  score: 120,
                }
              };
              setVolunteerDetails(mockVol);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { profile: prof, volunteer } = await fetchProfileAndVolunteer(session.user.id);
        if (prof) {
          setProfile(prof);
          setVolunteerDetails(volunteer);
          setRole(prof.role);
          setLoginCookies(true, prof.role);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setVolunteerDetails(null);
        setRole(null);
        setLoginCookies(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      // 1. Try real Supabase auth first
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (!error && data.user) {
          const { profile: prof, volunteer } = await fetchProfileAndVolunteer(data.user.id);
          if (prof) {
            if (prof.status === 'pending') {
              await supabase.auth.signOut();
              return { success: false, error: 'حسابك قيد الانتظار لموافقة الإدارة.' };
            }
            if (prof.status === 'disabled') {
              await supabase.auth.signOut();
              return { success: false, error: 'تم تعطيل هذا الحساب.' };
            }

            setUser(data.user);
            setProfile(prof);
            setVolunteerDetails(volunteer);
            setRole(prof.role);
            setLoginCookies(true, prof.role);
            return { success: true };
          }
        }
      } catch (authError) {
        console.warn('Supabase Auth failed or offline, checking local seeds:', authError);
      }
      
      // 2. Local fallback verification for demoability
      if (typeof window !== 'undefined') {
        const users = JSON.parse(localStorage.getItem('saboura_users') || '[]');
        const volunteers = JSON.parse(localStorage.getItem('saboura_volunteers') || '[]');
        const centers = JSON.parse(localStorage.getItem('saboura_centers') || '[]');

        // Check if there is a local user matching email and password
        const localUser = users.find((u: any) => 
          u.email === email && 
          (u.password === password || 
           (email === 'admin@lifemakers.org' && password === 'admin123@') || 
           (email === 'volunteer@lifemakers.org' && password === 'volunteer123@'))
        );

        if (localUser) {
          if (localUser.status === 'pending') {
            return { success: false, error: 'حسابك قيد الانتظار لموافقة الإدارة.' };
          }
          if (localUser.status === 'disabled') {
            return { success: false, error: 'تم تعطيل هذا الحساب.' };
          }

          setUser(localUser);
          setProfile(localUser);
          
          if (localUser.role === 'Volunteer') {
            const vol = volunteers.find((v: any) => v.user_id === localUser.id) || null;
            if (vol) {
              const centerObj = centers.find((c: any) => c.id === vol.center_id) || null;
              setVolunteerDetails({ ...vol, center: centerObj });
            } else {
              setVolunteerDetails(null);
            }
          } else {
            setVolunteerDetails(null);
          }

          setRole(localUser.role);
          setLoginCookies(true, localUser.role);
          return { success: true };
        }
      }

      return { success: false, error: 'بيانات الدخول غير صحيحة.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, phone: string, email: string, password: string, centerId: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      // 1. Try real Supabase auth signup first
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) throw error;

        if (data.user) {
          // Insert profile into users table with status 'pending'
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              name,
              email,
              role: 'Volunteer',
              status: 'pending'
            });

          if (userError) throw userError;

          // Insert volunteer details
          const { error: volError } = await supabase
            .from('volunteers')
            .insert({
              user_id: data.user.id,
              name,
              phone,
              center_id: centerId
            });

          if (volError) throw volError;

          return { success: true };
        }
   } catch (authError: any) {
  console.error("SUPABASE SIGNUP ERROR:", authError);

  return {
    success: false,
    error: authError?.message || JSON.stringify(authError),
  };
}

      // 2. Local fallback for testing/demo mode
      if (typeof window !== 'undefined') {
        const users = JSON.parse(localStorage.getItem('saboura_users') || '[]');
        const volunteers = JSON.parse(localStorage.getItem('saboura_volunteers') || '[]');

        // Check if email already exists
        if (users.some((u: any) => u.email === email)) {
          return { success: false, error: 'البريد الإلكتروني مسجل بالفعل.' };
        }

        const userId = crypto.randomUUID();
        const volId = crypto.randomUUID();

        const newUser = {
          id: userId,
          name,
          email,
          role: 'Volunteer' as const,
          status: 'pending' as const,
          password,
          created_at: new Date().toISOString()
        };

        const newVol = {
          id: volId,
          user_id: userId,
          name,
          phone,
          center_id: centerId,
          created_at: new Date().toISOString()
        };

        users.push(newUser);
        volunteers.push(newVol);

        localStorage.setItem('saboura_users', JSON.stringify(users));
        localStorage.setItem('saboura_volunteers', JSON.stringify(volunteers));

        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ أثناء التسجيل.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Signout failed from Supabase service, logging out locally:', e);
    }
    setUser(null);
    setProfile(null);
    setVolunteerDetails(null);
    setRole(null);
    setLoginCookies(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, profile, volunteerDetails, role, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Cookie Helper
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
