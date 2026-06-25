
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','manager','employee');
CREATE TYPE public.account_status AS ENUM ('pending','active','rejected','suspended','disabled');
CREATE TYPE public.scenario_difficulty AS ENUM ('easy','medium','hard','expert');

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  employee_code TEXT,
  department TEXT,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  status public.account_status NOT NULL DEFAULT 'pending',
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  campaign_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- USER_ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin','manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin')
  )
$$;

-- =========================================================
-- updated_at trigger helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- Auto-create profile on user signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, employee_code, department, username, status, campaign_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.raw_user_meta_data->>'employee_code',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'username',
    'pending',
    NULLIF(NEW.raw_user_meta_data->>'campaign_id','')::uuid
  );
  -- Default employee role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile RLS
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Staff manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- user_roles RLS
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- CAMPAIGNS + REGISTRATION LINKS
-- =========================================================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  game_start TIMESTAMPTZ,
  game_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
GRANT SELECT ON public.campaigns TO anon;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read campaigns" ON public.campaigns FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Public read active campaigns by token" ON public.campaigns FOR SELECT TO anon
  USING (status = 'active');
CREATE POLICY "Admins manage campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.registration_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_links TO authenticated;
GRANT SELECT ON public.registration_links TO anon;
GRANT ALL ON public.registration_links TO service_role;
ALTER TABLE public.registration_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can resolve active link" ON public.registration_links FOR SELECT TO anon
  USING (is_active = true);
CREATE POLICY "Authed read active link" ON public.registration_links FOR SELECT TO authenticated
  USING (is_active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Admins manage links" ON public.registration_links FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- TRAINING MODULES & PHISHING SCENARIOS
-- =========================================================
CREATE TABLE public.training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_modules TO authenticated;
GRANT ALL ON public.training_modules TO service_role;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed reads modules" ON public.training_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage modules" ON public.training_modules FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_modules_updated BEFORE UPDATE ON public.training_modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.phishing_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  difficulty public.scenario_difficulty NOT NULL DEFAULT 'medium',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  -- The full scenario payload: email content, indicators, expected answers, scoring rubric
  payload JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phishing_scenarios TO authenticated;
GRANT ALL ON public.phishing_scenarios TO service_role;
ALTER TABLE public.phishing_scenarios ENABLE ROW LEVEL SECURITY;
-- Employees never read the full payload through Data API; server fn redacts.
-- We still allow staff and the scoring service (service role) full read.
CREATE POLICY "Staff read scenarios" ON public.phishing_scenarios FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins manage scenarios" ON public.phishing_scenarios FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_scenarios_updated BEFORE UPDATE ON public.phishing_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- GAME SESSIONS, ACTIONS, REPORTS, SCORES
-- =========================================================
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES public.phishing_scenarios(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner read sessions" ON public.game_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Owner insert session" ON public.game_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update own session" ON public.game_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.session_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.session_actions TO authenticated;
GRANT ALL ON public.session_actions TO service_role;
ALTER TABLE public.session_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner read actions" ON public.session_actions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND (s.user_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE POLICY "Owner insert actions" ON public.session_actions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

CREATE TABLE public.incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  classification TEXT,
  red_flags TEXT[],
  suspicious_urls TEXT[],
  recommended_action TEXT,
  summary TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.incident_reports TO authenticated;
GRANT ALL ON public.incident_reports TO service_role;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner read report" ON public.incident_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND (s.user_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE POLICY "Owner write report" ON public.incident_reports FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total INT NOT NULL,
  accuracy NUMERIC(5,2) NOT NULL,
  time_taken_seconds INT NOT NULL,
  breakdown JSONB NOT NULL,
  feedback JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scores TO authenticated;
GRANT ALL ON public.scores TO service_role;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner read score" ON public.scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- =========================================================
-- SEED: modules + one phishing scenario
-- =========================================================
INSERT INTO public.training_modules (slug,title,description,icon,is_enabled,is_available,sort_order) VALUES
  ('phishing-awareness','Phishing Awareness','Investigate a suspicious email like a real SOC analyst.','mail-warning',true,true,1),
  ('password-security','Password Security','Coming soon — practice strong credential hygiene.','key-round',false,false,2),
  ('malware-awareness','Malware Awareness','Coming soon — identify malicious files and behaviors.','bug',false,false,3),
  ('network-security','Network Security','Coming soon — spot abnormal network activity.','network',false,false,4),
  ('incident-response','Incident Response','Coming soon — triage and contain incidents.','shield-alert',false,false,5),
  ('social-engineering','Social Engineering','Coming soon — defend against human-targeted attacks.','users',false,false,6),
  ('data-protection','Data Protection','Coming soon — classify and protect sensitive data.','database-lock',false,false,7),
  ('usb-security','USB Security','Coming soon — handle removable media safely.','usb',false,false,8),
  ('insider-threat','Insider Threat Awareness','Coming soon — recognize insider risk indicators.','user-x',false,false,9);

INSERT INTO public.phishing_scenarios (module_id, title, difficulty, is_enabled, payload)
SELECT id, 'Urgent Payroll Update Required', 'medium', true, jsonb_build_object(
  'email', jsonb_build_object(
    'sender_name','HR Payroll Services',
    'sender_email','hr-payroll@micros0ft-support.com',
    'reply_to','noreply@micros0ft-support.com',
    'to','you@yourcompany.com',
    'subject','URGENT: Action required — Verify your payroll details by today 5PM',
    'received_at','Today, 10:42 AM',
    'body_html','<p>Dear Employee,</p><p>Our records indicate your direct-deposit information is <b>out of date</b>. To avoid a payroll disruption this cycle, please <a href="http://payroll-verify.micros0ft-support.com/login">verify your account here</a> within the next 4 hours.</p><p>Failure to comply will result in a hold on your <i>upcoming salary deposit</i>.</p><p>Regards,<br/>HR Payroll Services<br/>Internal Support Team</p>',
    'attachments', jsonb_build_array(
      jsonb_build_object('name','Payroll_Update_Form.html','size','42 KB','suspicious',true)
    ),
    'links', jsonb_build_array(
      jsonb_build_object('text','verify your account here','href','http://payroll-verify.micros0ft-support.com/login','suspicious',true)
    )
  ),
  'correct_classification','phishing',
  'expected_red_flags', jsonb_build_array(
    jsonb_build_object('id','sender_domain','label','Look-alike sender domain (micros0ft-support.com)','explanation','The domain uses a zero instead of an O to impersonate Microsoft. Legitimate HR mail comes from your own corporate domain.','best_practice','Always inspect the full sender domain, not the display name.'),
    jsonb_build_object('id','urgency','label','Artificial urgency / threats','explanation','"Action required in 4 hours" and "salary hold" pressure the recipient to act before thinking.','best_practice','Treat time pressure as a phishing indicator.'),
    jsonb_build_object('id','generic_greeting','label','Generic greeting ("Dear Employee")','explanation','Internal HR mail typically uses your name.','best_practice','Verify personalized details.'),
    jsonb_build_object('id','suspicious_link','label','Mismatched / suspicious link','explanation','The visible text says "verify your account" but the URL points to a look-alike external domain over plain HTTP.','best_practice','Hover before clicking. Confirm domain ownership.'),
    jsonb_build_object('id','suspicious_attachment','label','Unexpected HTML attachment','explanation','HTML attachments are commonly used to host credential-harvesting forms locally.','best_practice','Do not open unsolicited HTML attachments.')
  ),
  'expected_urls', jsonb_build_array('http://payroll-verify.micros0ft-support.com/login'),
  'expected_action','report_to_soc',
  'distractors', jsonb_build_array(
    jsonb_build_object('id','company_logo','label','Use of a company logo','explanation','A logo by itself is not a red flag; attackers copy them easily and legitimate emails use them too.'),
    jsonb_build_object('id','signature_block','label','Signature block at the bottom','explanation','Signatures alone are not indicative; check sender and links instead.')
  )
)
FROM public.training_modules WHERE slug = 'phishing-awareness';
