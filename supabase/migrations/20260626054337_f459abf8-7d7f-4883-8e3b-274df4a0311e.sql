
-- =========================================================
-- PHASE 1 — Extend scenarios, add attempts/assignments/invites
-- =========================================================

-- 1. Extend phishing_scenarios into a full repository
ALTER TABLE public.phishing_scenarios
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS sender_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_email TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS body_html TEXT,
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS links JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS classification TEXT NOT NULL DEFAULT 'suspicious',
  ADD COLUMN IF NOT EXISTS correct_action TEXT,
  ADD COLUMN IF NOT EXISTS red_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS explanation TEXT,
  ADD COLUMN IF NOT EXISTS is_mfa BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- 2. Per-attempt randomized assignment
CREATE TABLE IF NOT EXISTS public.session_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES public.phishing_scenarios(id) ON DELETE CASCADE,
  position INT NOT NULL,
  response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, scenario_id),
  UNIQUE (session_id, position)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_scenarios TO authenticated;
GRANT ALL ON public.session_scenarios TO service_role;
ALTER TABLE public.session_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner read session scenarios" ON public.session_scenarios FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND (s.user_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE POLICY "Owner write session scenarios" ON public.session_scenarios FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE POLICY "Owner update session scenarios" ON public.session_scenarios FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

-- 3. Attempt ledger (retakes, seen scenarios)
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  attempt_number INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score INT,
  time_taken_seconds INT,
  scenario_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.assessment_attempts TO authenticated;
GRANT ALL ON public.assessment_attempts TO service_role;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner read attempts" ON public.assessment_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Owner write attempts" ON public.assessment_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update attempts" ON public.assessment_attempts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Per-employee invite tokens
CREATE TABLE IF NOT EXISTS public.employee_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  employee_code TEXT,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_invites TO authenticated;
GRANT SELECT, UPDATE ON public.employee_invites TO anon;
GRANT ALL ON public.employee_invites TO service_role;
ALTER TABLE public.employee_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public resolve pending invite" ON public.employee_invites FOR SELECT TO anon
  USING (status = 'pending');
CREATE POLICY "Public mark invite used" ON public.employee_invites FOR UPDATE TO anon
  USING (status = 'pending') WITH CHECK (status IN ('pending','used'));
CREATE POLICY "Staff read invites" ON public.employee_invites FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins manage invites" ON public.employee_invites FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_invites_updated BEFORE UPDATE ON public.employee_invites
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Allow campaigns to be disabled (kept but link invalidated)
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN NOT NULL DEFAULT FALSE;

-- 6. Allow employees to read enabled scenarios during their own assessment
-- (assignment is mediated by session_scenarios, so this exposes only metadata
-- needed to render emails the user is actively assigned).
CREATE POLICY "Authed read enabled scenarios"
  ON public.phishing_scenarios FOR SELECT TO authenticated
  USING (is_enabled = TRUE AND status = 'active');

-- 7. Seed realistic scenario repository
-- Helper: insert against the phishing-awareness module
DO $$
DECLARE
  m UUID;
BEGIN
  SELECT id INTO m FROM public.training_modules WHERE slug = 'phishing-awareness';
  IF m IS NULL THEN RETURN; END IF;

  -- Mark legacy seed as inactive so the new repository drives assessments going forward
  UPDATE public.phishing_scenarios SET status = 'inactive' WHERE module_id = m AND status = 'active' AND classification = 'suspicious' AND department IS NULL;

  INSERT INTO public.phishing_scenarios
    (module_id, title, difficulty, is_enabled, status, department, category, classification, is_mfa,
     sender_name, sender_email, subject, body_html, attachments, links, correct_action, red_flags, explanation, tags, payload)
  VALUES
  -- ============ MFA: LEGITIMATE (6) ============
  (m, 'IT Security — Enable MFA on your account', 'medium', TRUE, 'active', 'Common', 'mfa', 'legitimate', TRUE,
   'IT Security', 'it-security@nipun.com',
   'Action required: enrol in Multi-Factor Authentication by Friday',
   '<p>Hello,</p><p>As part of our security baseline, all staff must enrol in Multi-Factor Authentication (MFA) by <b>Friday, 5:00 PM</b>. Please visit the company self-service portal to set up your authenticator app.</p><p>Thanks,<br/>IT Security<br/>Nipun</p>',
   '[]'::jsonb,
   '[{"text":"Set up MFA","href":"https://portal.nipun.com/security/mfa","behaviour":"internal_form","suspicious":false}]'::jsonb,
   'open', '[]'::jsonb,
   'Legitimate IT request from the internal domain to the official self-service portal. Open and complete the MFA enrolment.',
   ARRAY['mfa','it'], '{}'::jsonb),

  (m, 'MFA enabled successfully', 'easy', TRUE, 'active', 'Common', 'mfa', 'legitimate', TRUE,
   'Microsoft account team', 'account-security-noreply@accountprotection.microsoft.com',
   'Multi-Factor Authentication is now enabled',
   '<p>Hi,</p><p>Multi-Factor Authentication has just been turned on for your work account. If this was you, no action is required. If you did not enable MFA, contact IT Security immediately.</p>',
   '[]'::jsonb, '[]'::jsonb,
   'open', '[]'::jsonb,
   'Notification only — informational confirmation from Microsoft after MFA enrolment.',
   ARRAY['mfa','informational'], '{}'::jsonb),

  (m, 'New device verification', 'medium', TRUE, 'active', 'Common', 'mfa', 'legitimate', TRUE,
   'Microsoft account team', 'account-security-noreply@accountprotection.microsoft.com',
   'A new device signed in to your work account',
   '<p>A new sign-in was detected from <b>Chrome on Windows</b> in Bengaluru, India. If this was you, no action is required. If not, change your password and contact IT.</p>',
   '[]'::jsonb, '[]'::jsonb,
   'verify', '[]'::jsonb,
   'Verify activity with IT if it was not you. Do not click any link in the email; go to portal.office.com directly.',
   ARRAY['mfa','signin'], '{}'::jsonb),

  (m, 'Approve sign-in request', 'easy', TRUE, 'active', 'Common', 'mfa', 'legitimate', TRUE,
   'Microsoft Authenticator', 'authenticator-noreply@microsoft.com',
   'Approve your sign-in',
   '<p>You have a pending sign-in request. Open the Microsoft Authenticator app on your phone to approve or deny.</p>',
   '[]'::jsonb, '[]'::jsonb,
   'verify', '[]'::jsonb,
   'Only approve if you just initiated a sign-in. Never approve unexpected push notifications.',
   ARRAY['mfa','push'], '{}'::jsonb),

  (m, 'MFA reset confirmation', 'easy', TRUE, 'active', 'Common', 'mfa', 'legitimate', TRUE,
   'IT Service Desk', 'servicedesk@nipun.com',
   'Your MFA was reset at your request',
   '<p>As per ticket #INC-48211, your MFA methods have been reset. Re-enrol from the self-service portal within 24 hours.</p>',
   '[]'::jsonb,
   '[{"text":"Re-enrol now","href":"https://portal.nipun.com/security/mfa","behaviour":"internal_form","suspicious":false}]'::jsonb,
   'open', '[]'::jsonb,
   'Legitimate confirmation tied to an actual ticket. Re-enrol using the official portal.',
   ARRAY['mfa','servicedesk'], '{}'::jsonb),

  (m, 'Quarterly security verification', 'medium', TRUE, 'active', 'Common', 'mfa', 'legitimate', TRUE,
   'IT Security', 'it-security@nipun.com',
   'Quarterly account security verification',
   '<p>Please review your registered MFA methods and back-up codes from the self-service portal. No password is required.</p>',
   '[]'::jsonb,
   '[{"text":"Review my MFA methods","href":"https://portal.nipun.com/security/methods","behaviour":"internal_form","suspicious":false}]'::jsonb,
   'open', '[]'::jsonb,
   'Routine security hygiene from internal IT.',
   ARRAY['mfa','quarterly'], '{}'::jsonb),

  -- ============ MFA: SUSPICIOUS (6) ============
  (m, 'Urgent: enrol in MFA or your account will be disabled', 'medium', TRUE, 'active', 'Common', 'mfa', 'suspicious', TRUE,
   'IT-Security', 'it-security@nipun-corp.com',
   'FINAL NOTICE — MFA enrolment expiring in 2 hours',
   '<p>Your account does not have MFA enabled. Failure to enrol in the next <b>2 hours</b> will result in your account being permanently disabled. <a href="http://nipun-corp.com/mfa-setup">Enrol now</a>.</p>',
   '[]'::jsonb,
   '[{"text":"Enrol now","href":"http://nipun-corp.com/mfa-setup","behaviour":"fake_m365","suspicious":true}]'::jsonb,
   'report', '[{"id":"lookalike_domain","label":"Look-alike sender domain (nipun-corp.com)","explanation":"Real internal IT uses nipun.com, not nipun-corp.com."},{"id":"urgency","label":"Artificial 2-hour deadline","explanation":"Pressure to act before checking."},{"id":"http_link","label":"Plain HTTP enrolment link","explanation":"Credential harvesting page."}]'::jsonb,
   'Classic credential-harvesting MFA lure using urgency and a look-alike domain.',
   ARRAY['mfa','phishing','urgency'], '{}'::jsonb),

  (m, 'Microsoft Security Verification Required', 'hard', TRUE, 'active', 'Common', 'mfa', 'suspicious', TRUE,
   'Microsoft Account Team', 'no-reply@microsft-security.com',
   'Verify your account to continue using Microsoft 365',
   '<p>We detected unusual activity on your Microsoft account. To keep your access, please <a href="https://microsft-security.com/verify">verify your identity now</a>. This link expires in 30 minutes.</p>',
   '[]'::jsonb,
   '[{"text":"Verify identity","href":"https://microsft-security.com/verify","behaviour":"fake_m365","suspicious":true}]'::jsonb,
   'report', '[{"id":"lookalike_domain","label":"microsft-security.com (missing o)","explanation":"Typo-squat of microsoft.com."},{"id":"urgency","label":"30-minute deadline"},{"id":"unsolicited_verify","label":"Unsolicited verification request"}]'::jsonb,
   'Look-alike of microsoft.com (missing the second o). Real Microsoft alerts come from accountprotection.microsoft.com and never demand a 30-minute response.',
   ARRAY['mfa','phishing','typosquat'], '{}'::jsonb),

  (m, 'VPN access verification', 'medium', TRUE, 'active', 'Common', 'mfa', 'suspicious', TRUE,
   'Network Operations', 'netops@nipun-it.net',
   'Re-verify your VPN credentials',
   '<p>Our VPN concentrator has been upgraded. To keep working from home, please <a href="http://nipun-it.net/vpn-login">re-verify your credentials</a> before tomorrow morning.</p>',
   '[]'::jsonb,
   '[{"text":"Re-verify VPN","href":"http://nipun-it.net/vpn-login","behaviour":"fake_vpn","suspicious":true}]'::jsonb,
   'report', '[{"id":"external_domain","label":"External nipun-it.net domain","explanation":"Internal NetOps uses nipun.com."},{"id":"credential_request","label":"Asks for credentials"},{"id":"http","label":"Plain HTTP login page"}]'::jsonb,
   'NetOps would never email a link to a VPN portal asking for credentials. Always launch the VPN client locally.',
   ARRAY['mfa','vpn','phishing'], '{}'::jsonb),

  (m, 'Your MFA was reset — confirm new device', 'medium', TRUE, 'active', 'Common', 'mfa', 'suspicious', TRUE,
   'Microsoft Security', 'security-alert@ms-securityteam.com',
   'MFA reset — confirm device or revoke',
   '<p>Your MFA was reset moments ago. If this was not you, <a href="http://ms-securityteam.com/revoke?u=you">revoke immediately</a> and re-secure your account.</p>',
   '[]'::jsonb,
   '[{"text":"Revoke immediately","href":"http://ms-securityteam.com/revoke?u=you","behaviour":"fake_m365","suspicious":true}]'::jsonb,
   'report', '[{"id":"sender","label":"ms-securityteam.com is not Microsoft"},{"id":"panic","label":"Panic-and-click bait"}]'::jsonb,
   'Genuine Microsoft mail comes from accountprotection.microsoft.com and links into account.microsoft.com.',
   ARRAY['mfa','phishing'], '{}'::jsonb),

  (m, 'Your account will be disabled in 24 hours', 'easy', TRUE, 'active', 'Common', 'mfa', 'suspicious', TRUE,
   'HR & IT Joint Notice', 'hr-it@nipunsupport.co',
   'Account disable scheduled — confirm to keep access',
   '<p>Per company-wide policy, your account is scheduled to be disabled in 24 hours due to incomplete MFA registration. Click <a href="http://nipunsupport.co/keep-account">here</a> to confirm and keep access.</p>',
   '[]'::jsonb,
   '[{"text":"Keep my access","href":"http://nipunsupport.co/keep-account","behaviour":"fake_m365","suspicious":true}]'::jsonb,
   'report', '[{"id":"external_domain","label":"nipunsupport.co — not the company domain"},{"id":"fake_authority","label":"Pretends to be HR + IT joint notice"}]'::jsonb,
   'Combining HR and IT authority is a social-engineering technique. Real notices come from nipun.com and reference the IT self-service portal.',
   ARRAY['mfa','phishing'], '{}'::jsonb),

  (m, 'Authentication approval requested', 'hard', TRUE, 'active', 'Common', 'mfa', 'suspicious', TRUE,
   'Microsoft Authenticator', 'authenticator@msft-push.com',
   'Approve sign-in request',
   '<p>You have a pending sign-in request from <b>Lagos, Nigeria</b>. Tap <a href="http://msft-push.com/approve">Approve</a> to continue, or ignore this email.</p>',
   '[]'::jsonb,
   '[{"text":"Approve","href":"http://msft-push.com/approve","behaviour":"fake_m365","suspicious":true}]'::jsonb,
   'report', '[{"id":"unexpected_location","label":"Unexpected geographic location"},{"id":"external_sender","label":"msft-push.com is not Microsoft"},{"id":"approve_by_email","label":"Real push approvals happen in the Authenticator app, never via email link"}]'::jsonb,
   'MFA fatigue attack via email. Always approve from the authenticator app, only when you triggered the sign-in.',
   ARRAY['mfa','phishing','mfa-fatigue'], '{}'::jsonb),

  -- ============ HR LEGITIMATE ============
  (m, 'Annual performance appraisal — submit self-review', 'easy', TRUE, 'active', 'HR', 'appraisal', 'legitimate', FALSE,
   'People Operations', 'people-ops@nipun.com',
   'Performance appraisal: submit self-review by 30 June',
   '<p>Hi,</p><p>It is appraisal season. Please complete your self-review on the HRMS by <b>30 June</b>. Your manager has been notified.</p><p>— People Ops, Nipun</p>',
   '[]'::jsonb,
   '[{"text":"Open HRMS","href":"https://hrms.nipun.com/appraisals","behaviour":"internal_form","suspicious":false}]'::jsonb,
   'open', '[]'::jsonb,
   'Routine internal HR communication from the official domain.',
   ARRAY['hr','appraisal'], '{}'::jsonb),

  (m, 'Updated leave policy — effective next quarter', 'easy', TRUE, 'active', 'HR', 'policy', 'legitimate', FALSE,
   'People Operations', 'people-ops@nipun.com',
   'Updated leave policy — effective 1 July',
   '<p>Team,</p><p>The leave policy has been refreshed. Please find the new policy attached. Talk to your manager or HRBP for questions.</p>',
   '[{"name":"Leave_Policy_v3.pdf","size":"212 KB","suspicious":false}]'::jsonb,
   '[]'::jsonb,
   'open', '[]'::jsonb,
   'Internal HR PDF announcement — open and read.',
   ARRAY['hr','policy'], '{}'::jsonb),

  -- ============ HR SUSPICIOUS ============
  (m, 'Salary revision letter — open immediately', 'medium', TRUE, 'active', 'HR', 'compensation', 'suspicious', FALSE,
   'HR Department', 'hr-letter@nipunhr.online',
   'Confidential: Your salary revision letter (FY25)',
   '<p>Dear Employee,</p><p>Please find your <b>confidential salary revision letter</b> attached. Open immediately to view the increment.</p>',
   '[{"name":"Salary_Revision_FY25.html","size":"38 KB","suspicious":true}]'::jsonb,
   '[]'::jsonb,
   'report', '[{"id":"external_domain","label":"nipunhr.online — not the official HR domain"},{"id":"html_attachment","label":"HTML attachment masquerading as a letter"},{"id":"generic_greeting","label":"Dear Employee"}]'::jsonb,
   'Real salary letters come through the HRMS, never as an HTML attachment from a look-alike domain.',
   ARRAY['hr','phishing','salary'], '{}'::jsonb),

  -- ============ CEO / MANAGEMENT SUSPICIOUS (whaling) ============
  (m, 'Urgent — quick task from the CEO', 'hard', TRUE, 'active', 'CEO', 'business-email-compromise', 'suspicious', FALSE,
   'Rajesh Kumar (CEO)', 'rajesh.kumar.ceo@gmail.com',
   'Are you at your desk?',
   '<p>I''m in a meeting and can''t talk. I need you to handle a quick confidential task for me. Reply with your mobile number.</p><p>Sent from my iPhone</p>',
   '[]'::jsonb, '[]'::jsonb,
   'report', '[{"id":"personal_email","label":"CEO writing from a personal gmail.com"},{"id":"urgent_secrecy","label":"Urgent + confidential framing"},{"id":"ask_mobile","label":"Asks for your mobile number — pretext for next stage"}]'::jsonb,
   'Classic CEO-impersonation gift-card / wire-transfer scam. Verify with the CEO''s assistant by phone.',
   ARRAY['ceo','bec','phishing'], '{}'::jsonb),

  (m, 'Board update — review attached deck', 'medium', TRUE, 'active', 'CEO', 'announcement', 'legitimate', FALSE,
   'Rajesh Kumar', 'rajesh.kumar@nipun.com',
   'Board update — Q1 review attached',
   '<p>Team,</p><p>Find attached the Q1 board update. Please review before tomorrow''s town hall.</p><p>Rajesh</p>',
   '[{"name":"Q1_Board_Update.pdf","size":"1.4 MB","suspicious":false}]'::jsonb,
   '[]'::jsonb,
   'open', '[]'::jsonb,
   'From the CEO''s real corporate address. Standard internal communication.',
   ARRAY['ceo','announcement'], '{}'::jsonb),

  -- ============ FINANCE SUSPICIOUS ============
  (m, 'Vendor bank account change — process today', 'expert', TRUE, 'active', 'Finance', 'vendor-payment', 'suspicious', FALSE,
   'Anita Sharma — Finance Director', 'anita.sharma@nipun-finance.co',
   'Urgent — vendor bank account update for today''s payment run',
   '<p>Hi,</p><p>We are switching banks for vendor <b>Acme Logistics</b>. Please update the account in the ERP to the details below before the 4 PM run.</p><ul><li>Beneficiary: Acme Logistics LLP</li><li>Account: 4400 8821 0023</li><li>IFSC: HDFC0009921</li></ul><p>Approved by me, please process.<br/>Anita</p>',
   '[]'::jsonb, '[]'::jsonb,
   'report', '[{"id":"lookalike_domain","label":"nipun-finance.co — not the company domain"},{"id":"urgency","label":"4 PM deadline before approvals can be verified"},{"id":"no_change_request","label":"No formal vendor change request attached"}]'::jsonb,
   'Vendor bank-change fraud. Confirm with Anita on her real number and require dual approval in the ERP workflow.',
   ARRAY['finance','bec','vendor'], '{}'::jsonb),

  (m, 'Invoice approval — Acme Logistics May', 'easy', TRUE, 'active', 'Finance', 'invoice', 'legitimate', FALSE,
   'Finance Ops', 'finance-ops@nipun.com',
   'Invoice ready for your approval — Acme Logistics May',
   '<p>Hi,</p><p>The May invoice from Acme Logistics is pending your approval in the ERP. No action required if already approved.</p>',
   '[]'::jsonb,
   '[{"text":"Open in ERP","href":"https://erp.nipun.com/invoices/INV-49281","behaviour":"internal_form","suspicious":false}]'::jsonb,
   'open', '[]'::jsonb,
   'Standard internal Finance notification.',
   ARRAY['finance','invoice'], '{}'::jsonb),

  -- ============ SALES / PRESALES / IMPLEMENTATION / EXTERNAL ============
  (m, 'New tender — Karnataka State Roads', 'easy', TRUE, 'active', 'Sales', 'tender', 'legitimate', FALSE,
   'Vijay Menon — Sales Lead', 'vijay.menon@nipun.com',
   'New tender — Karnataka State Roads (closes 12 July)',
   '<p>Team,</p><p>Sharing a new tender opportunity. RFQ document attached. Please review and confirm bid intent by Monday.</p>',
   '[{"name":"RFQ_KSR_2026.pdf","size":"780 KB","suspicious":false}]'::jsonb,
   '[]'::jsonb,
   'open', '[]'::jsonb,
   'Internal sales communication with a legitimate PDF attachment.',
   ARRAY['sales','tender'], '{}'::jsonb),

  (m, 'Partnership enquiry — Globex Industries', 'medium', TRUE, 'active', 'External', 'partnership', 'legitimate', FALSE,
   'Sarah Lim', 'sarah.lim@globexindustries.com',
   'Exploring a partnership',
   '<p>Hello,</p><p>We came across your work in industrial automation and would like to explore a partnership. Could we set up a 30-minute call next week?</p><p>Best,<br/>Sarah Lim<br/>BD Manager, Globex Industries</p>',
   '[]'::jsonb,
   '[{"text":"Book a meeting","href":"https://meet.nipun.com/book/sarah-lim","behaviour":"meeting_invitation","suspicious":false}]'::jsonb,
   'open', '[]'::jsonb,
   'Plausible external business email. Verify the company and respond through normal channels.',
   ARRAY['external','partnership'], '{}'::jsonb),

  (m, 'Quotation request — bulk order', 'medium', TRUE, 'active', 'Sales', 'quotation', 'suspicious', FALSE,
   'Ahmed Rashid', 'ahmed@bulk-buyers-global.shop',
   'Quotation needed — bulk order, urgent',
   '<p>Hi,</p><p>We need a quotation for 5,000 units of your flagship product, shipping to Dubai by end of next week. Please reply with your best rates and bank details for advance.</p>',
   '[]'::jsonb,
   '[{"text":"Open RFQ","href":"http://bulk-buyers-global.shop/rfq","behaviour":"fake_document","suspicious":true}]'::jsonb,
   'report', '[{"id":"shop_tld","label":".shop TLD for a corporate buyer"},{"id":"advance_bank_details","label":"Asks for bank details for advance"},{"id":"urgency","label":"Unrealistic delivery timeline"}]'::jsonb,
   'Advance-fee / lead-scrape phishing. Genuine buyers go through procurement portals, not personal-looking domains.',
   ARRAY['sales','phishing','quotation'], '{}'::jsonb),

  (m, 'Site meeting confirmation — Pune project', 'easy', TRUE, 'active', 'Implementation', 'site-meeting', 'legitimate', FALSE,
   'Pranay Joshi', 'pranay.joshi@nipun.com',
   'Confirmed: site meeting Pune — 28 June, 10 AM',
   '<p>Confirming the site meeting at the Pune facility on 28 June at 10 AM. Please bring the updated implementation checklist.</p>',
   '[]'::jsonb, '[]'::jsonb,
   'open', '[]'::jsonb,
   'Internal implementation team confirmation.',
   ARRAY['implementation','meeting'], '{}'::jsonb),

  (m, 'Shared document — Project Phoenix proposal', 'medium', TRUE, 'active', 'Pre-Sales', 'proposal', 'suspicious', FALSE,
   'OneDrive — Anita Sharma', 'no-reply@onedrive-share.live',
   'Anita Sharma shared "Project Phoenix proposal" with you',
   '<p>Anita has shared a document with you on OneDrive. <a href="http://onedrive-share.live/view?id=abc123">View document</a>.</p>',
   '[]'::jsonb,
   '[{"text":"View document","href":"http://onedrive-share.live/view?id=abc123","behaviour":"fake_document","suspicious":true}]'::jsonb,
   'report', '[{"id":"external_domain","label":"onedrive-share.live is not Microsoft OneDrive"},{"id":"http","label":"Plain HTTP link"}]'::jsonb,
   'Genuine OneDrive shares come from no-reply@sharepointonline.com and link to onedrive.live.com or your tenant.',
   ARRAY['presales','phishing','shared-doc'], '{}'::jsonb),

  -- ============ COMMON: password expiry, escalations, internal announcements ============
  (m, 'Password expiry reminder', 'easy', TRUE, 'active', 'Common', 'password', 'legitimate', FALSE,
   'IT Service Desk', 'servicedesk@nipun.com',
   'Your password will expire in 7 days',
   '<p>Hi,</p><p>Your Nipun account password will expire in 7 days. Change it from the self-service portal or by pressing Ctrl+Alt+Del on your work laptop.</p>',
   '[]'::jsonb,
   '[{"text":"Open self-service portal","href":"https://portal.nipun.com/password","behaviour":"internal_form","suspicious":false}]'::jsonb,
   'open', '[]'::jsonb,
   'Routine notification — change via the portal or your laptop.',
   ARRAY['common','password'], '{}'::jsonb),

  (m, 'Password expired — reset within 1 hour', 'medium', TRUE, 'active', 'Common', 'password', 'suspicious', FALSE,
   'IT Helpdesk', 'helpdesk@nipun-it-support.com',
   'Your password has expired — reset now',
   '<p>Your password has expired. <a href="http://nipun-it-support.com/reset?u=you">Reset within 1 hour</a> to avoid being locked out.</p>',
   '[]'::jsonb,
   '[{"text":"Reset password","href":"http://nipun-it-support.com/reset?u=you","behaviour":"fake_m365","suspicious":true}]'::jsonb,
   'report', '[{"id":"external_domain","label":"nipun-it-support.com is not the company domain"},{"id":"urgency","label":"1-hour deadline"}]'::jsonb,
   'Phishing for credentials by impersonating the IT helpdesk.',
   ARRAY['common','phishing','password'], '{}'::jsonb),

  (m, 'Escalation — production outage in Mumbai DC', 'medium', TRUE, 'active', 'Common', 'escalation', 'legitimate', FALSE,
   'NOC Bridge', 'noc-bridge@nipun.com',
   '[P1] Mumbai DC outage — join bridge',
   '<p>P1 incident in progress. Bridge: <a href="https://meet.nipun.com/noc">https://meet.nipun.com/noc</a>. SOC lead on call.</p>',
   '[]'::jsonb,
   '[{"text":"Join bridge","href":"https://meet.nipun.com/noc","behaviour":"meeting_invitation","suspicious":false}]'::jsonb,
   'open', '[]'::jsonb,
   'Internal NOC bridge invitation — join.',
   ARRAY['common','escalation'], '{}'::jsonb),

  (m, 'Town hall — Friday 4 PM', 'easy', TRUE, 'active', 'Common', 'announcement', 'legitimate', FALSE,
   'Internal Communications', 'comms@nipun.com',
   'All-hands town hall this Friday at 4 PM',
   '<p>Join us for the company town hall this Friday at 4 PM. Agenda attached.</p>',
   '[{"name":"Townhall_Agenda.pdf","size":"96 KB","suspicious":false}]'::jsonb,
   '[]'::jsonb,
   'open', '[]'::jsonb,
   'Standard internal announcement.',
   ARRAY['common','announcement'], '{}'::jsonb);

END $$;
