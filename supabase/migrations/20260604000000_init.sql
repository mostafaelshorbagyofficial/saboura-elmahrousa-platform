-- Setup Supabase Migration for Saboura El Mahrousa Initiative
-- Life Makers Egypt - Qalyubia

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Create Table: centers
CREATE TABLE IF NOT EXISTS public.centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_centers_updated_at
BEFORE UPDATE ON public.centers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create Table: users (Public profile corresponding to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- Same UUID as auth.users
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('Administrator', 'Volunteer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create Table: volunteers
CREATE TABLE IF NOT EXISTS public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_volunteers_updated_at
BEFORE UPDATE ON public.volunteers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create Table: visits
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_time TIME NOT NULL DEFAULT CURRENT_TIME,
    boards_received INTEGER DEFAULT 0 CHECK (boards_received >= 0),
    boards_installed INTEGER DEFAULT 0 CHECK (boards_installed >= 0),
    boards_returned INTEGER DEFAULT 0 CHECK (boards_returned >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_visits_updated_at
BEFORE UPDATE ON public.visits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create Table: accepted_restaurants
CREATE TABLE IF NOT EXISTS public.accepted_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_accepted_restaurants_updated_at
BEFORE UPDATE ON public.accepted_restaurants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create Table: rejected_restaurants
CREATE TABLE IF NOT EXISTS public.rejected_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_rejected_restaurants_updated_at
BEFORE UPDATE ON public.rejected_restaurants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create Table: activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_activity_logs_updated_at
BEFORE UPDATE ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create Table: settings
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

----------------------------------------------------
-- Row Level Security (RLS) Policies
----------------------------------------------------

ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accepted_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rejected_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT SECURITY DEFINER AS $$
BEGIN
    RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql;

-- Helper function to get current user's volunteer record
CREATE OR REPLACE FUNCTION public.get_current_volunteer_id()
RETURNS UUID SECURITY DEFINER AS $$
BEGIN
    RETURN (SELECT id FROM public.volunteers WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql;

-- Centers Policies
CREATE POLICY "Centers readable by authenticated users" ON public.centers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Centers writeable by Administrators only" ON public.centers
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'Administrator');

-- Users Policies
CREATE POLICY "Users readable by authenticated users" ON public.users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users writeable by Administrators only" ON public.users
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'Administrator');

-- Volunteers Policies
CREATE POLICY "Volunteers readable by authenticated users" ON public.volunteers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Volunteers writeable by Administrators or own updates" ON public.volunteers
    FOR ALL TO authenticated USING (
        public.get_current_user_role() = 'Administrator' OR user_id = auth.uid()
    );

-- Visits Policies
CREATE POLICY "Visits readable by authenticated users" ON public.visits
    FOR SELECT TO authenticated USING (
        public.get_current_user_role() = 'Administrator' OR volunteer_id = public.get_current_volunteer_id()
    );

CREATE POLICY "Visits insertable by Volunteers or Administrators" ON public.visits
    FOR INSERT TO authenticated WITH CHECK (
        public.get_current_user_role() = 'Administrator' OR volunteer_id = public.get_current_volunteer_id()
    );

CREATE POLICY "Visits updateable/deleteable by Administrators only" ON public.visits
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'Administrator');

-- Accepted Restaurants Policies
CREATE POLICY "Accepted restaurants readable by authenticated users" ON public.accepted_restaurants
    FOR SELECT TO authenticated USING (
        public.get_current_user_role() = 'Administrator' OR 
        EXISTS (
            SELECT 1 FROM public.visits 
            WHERE visits.id = visit_id AND visits.volunteer_id = public.get_current_volunteer_id()
        )
    );

CREATE POLICY "Accepted restaurants insertable by Volunteers or Administrators" ON public.accepted_restaurants
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.visits 
            WHERE visits.id = visit_id AND (
                public.get_current_user_role() = 'Administrator' OR 
                visits.volunteer_id = public.get_current_volunteer_id()
            )
        )
    );

CREATE POLICY "Accepted restaurants updateable/deleteable by Administrators only" ON public.accepted_restaurants
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'Administrator');

-- Rejected Restaurants Policies
CREATE POLICY "Rejected restaurants readable by authenticated users" ON public.rejected_restaurants
    FOR SELECT TO authenticated USING (
        public.get_current_user_role() = 'Administrator' OR 
        EXISTS (
            SELECT 1 FROM public.visits 
            WHERE visits.id = visit_id AND visits.volunteer_id = public.get_current_volunteer_id()
        )
    );

CREATE POLICY "Rejected restaurants insertable by Volunteers or Administrators" ON public.rejected_restaurants
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.visits 
            WHERE visits.id = visit_id AND (
                public.get_current_user_role() = 'Administrator' OR 
                visits.volunteer_id = public.get_current_volunteer_id()
            )
        )
    );

CREATE POLICY "Rejected restaurants updateable/deleteable by Administrators only" ON public.rejected_restaurants
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'Administrator');

-- Activity Logs Policies
CREATE POLICY "Activity logs readable by Administrators only" ON public.activity_logs
    FOR SELECT TO authenticated USING (public.get_current_user_role() = 'Administrator');

CREATE POLICY "Activity logs insertable by anyone authenticated" ON public.activity_logs
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Notifications Policies
CREATE POLICY "Notifications readable by own user" ON public.notifications
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Notifications updateable by own user (marking read)" ON public.notifications
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND is_read = true);

CREATE POLICY "Notifications insertable by Administrators or system" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() = 'Administrator' OR auth.uid() = user_id);

-- Settings Policies
CREATE POLICY "Settings readable by authenticated" ON public.settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Settings writeable by Administrators only" ON public.settings
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'Administrator');

----------------------------------------------------
-- Score Calculation Triggers
----------------------------------------------------
-- Calculate center score based on formula: (Boards Installed * 10) + (Accepted Restaurants * 5) + (Visits * 2)
CREATE OR REPLACE FUNCTION public.recalculate_center_scores()
RETURNS TRIGGER AS $$
DECLARE
    curr_center_id UUID;
BEGIN
    -- Determine which center's score needs updating
    IF TG_OP = 'DELETE' THEN
        SELECT center_id INTO curr_center_id FROM public.volunteers WHERE id = OLD.volunteer_id;
    ELSIF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        SELECT center_id INTO curr_center_id FROM public.volunteers WHERE id = NEW.volunteer_id;
    END IF;

    IF curr_center_id IS NOT NULL THEN
        UPDATE public.centers
        SET score = (
            SELECT COALESCE(SUM(v.boards_installed), 0) * 10 +
                   (SELECT COUNT(*) FROM public.accepted_restaurants ar JOIN public.visits vis ON ar.visit_id = vis.id WHERE vis.volunteer_id IN (SELECT id FROM public.volunteers WHERE center_id = curr_center_id)) * 5 +
                   (SELECT COUNT(*) FROM public.visits vis WHERE vis.volunteer_id IN (SELECT id FROM public.volunteers WHERE center_id = curr_center_id)) * 2
            FROM public.visits v
            JOIN public.volunteers vol ON v.volunteer_id = vol.id
            WHERE vol.center_id = curr_center_id
        )
        WHERE id = curr_center_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_score_on_visit_change
AFTER INSERT OR UPDATE OR DELETE ON public.visits
FOR EACH ROW EXECUTE FUNCTION public.recalculate_center_scores();
