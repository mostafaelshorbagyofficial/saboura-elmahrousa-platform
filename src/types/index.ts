export type UserRole = 'Administrator' | 'Volunteer';

export interface Center {
  id: string;
  name: string;
  score: number;
  created_at?: string;
  updated_at?: string;
  volunteer_count?: number;
  visits_count?: number;
  boards_installed_count?: number;
  accepted_count?: number;
  rejected_count?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'disabled' | 'pending';
  created_at?: string;
  updated_at?: string;
}

export interface Volunteer {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  center_id: string | null;
  created_at?: string;
  updated_at?: string;
  center?: Center | null;
  user?: User;
  
  // Computed statistics
  visits_count?: number;
  boards_received?: number;
  boards_installed?: number;
  boards_returned?: number;
  accepted_count?: number;
  rejected_count?: number;
  last_activity_date?: string;
}

export interface Visit {
  id: string;
  volunteer_id: string;
  visit_date: string;
  visit_time: string;
  boards_received: number;
  boards_installed: number;
  boards_returned: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  volunteer?: Volunteer;
  accepted_restaurants?: AcceptedRestaurant[];
  rejected_restaurants?: RejectedRestaurant[];
}

export interface AcceptedRestaurant {
  id: string;
  visit_id: string;
  name: string;
  category: string;
  address?: string;
  phone?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RejectedRestaurant {
  id: string;
  visit_id: string;
  name: string;
  category: string;
  reason: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action_type: string;
  description: string;
  created_at: string;
  updated_at?: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}
