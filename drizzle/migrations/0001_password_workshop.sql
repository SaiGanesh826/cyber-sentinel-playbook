ALTER TABLE public.training_modules ADD COLUMN IF NOT EXISTS access_start timestamptz, ADD COLUMN IF NOT EXISTS access_end timestamptz;

CREATE TABLE public.pw_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  module_slug text NOT NULL DEFAULT 'password-security',
  departments text[],
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 1800,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pw_campaigns TO authenticated;
GRANT ALL ON public.pw_campaigns TO service_role;
ALTER TABLE public.pw_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read pw campaigns" ON public.pw_campaigns FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.pw_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.pw_campaigns(id),
  attempt_number integer NOT NULL,
  set_hash text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  submitted_at timestamptz,
  content jsonb NOT NULL,
  answer_key jsonb NOT NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb,
  score numeric,
  max_score numeric,
  percentage numeric,
  performance_level text,
  time_taken_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, set_hash),
  UNIQUE (user_id, campaign_id, attempt_number)
);
CREATE UNIQUE INDEX pw_attempts_one_open ON public.pw_attempts(user_id, campaign_id) WHERE status = 'in_progress';
GRANT SELECT ON public.pw_attempts TO authenticated;
GRANT ALL ON public.pw_attempts TO service_role;
ALTER TABLE public.pw_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read pw attempts" ON public.pw_attempts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.pw_retake_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.pw_campaigns(id),
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid,
  used_attempt_id uuid,
  used_at timestamptz
);
GRANT SELECT ON public.pw_retake_grants TO authenticated;
GRANT ALL ON public.pw_retake_grants TO service_role;
ALTER TABLE public.pw_retake_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read pw grants" ON public.pw_retake_grants FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

COMMENT ON TABLE public.password_mfa_results IS 'DEPRECATED: replaced by pw_attempts';

INSERT INTO public.pw_campaigns (name) SELECT 'Password Security & MFA Awareness – November 2026';