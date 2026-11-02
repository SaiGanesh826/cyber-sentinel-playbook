CREATE TABLE public.password_mfa_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  completed_activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.password_mfa_results TO authenticated;
GRANT ALL ON public.password_mfa_results TO service_role;

ALTER TABLE public.password_mfa_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own password MFA results"
  ON public.password_mfa_results
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own password MFA results"
  ON public.password_mfa_results
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX password_mfa_results_user_idx ON public.password_mfa_results (user_id, created_at DESC);