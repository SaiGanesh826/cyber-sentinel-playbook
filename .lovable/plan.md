## SOC Defender – Build Plan

A scoped, production-ready MVP of the platform. Given the size of the spec, I'll deliver a strong foundation in this first iteration and layer additional modules/screens in follow-ups.

### Phase 1 (this build)
1. **Backend (Lovable Cloud)**
   - Enable Cloud (Postgres + Auth + RLS).
   - Tables: `profiles`, `user_roles` (enum: super_admin, admin, manager, employee), `campaigns`, `registration_links`, `pending_registrations`, `training_modules`, `phishing_scenarios`, `game_sessions`, `session_actions`, `incident_reports`, `scores`, `audit_logs`.
   - RLS policies via `has_role()` security-definer function.
   - Trigger to auto-create profile on signup; status defaults to `pending`.
   - Seed: Phishing Awareness module + 1 sample scenario + 8 "coming soon" modules (via migration).

2. **Auth & RBAC**
   - Email/password sign-in (Lovable Cloud).
   - Login blocked for pending / rejected / suspended.
   - `/auth`, `/register/:linkToken` public routes.
   - `_authenticated` layout; role-based routing (admin vs employee shells).

3. **Employee experience**
   - SOC-styled dark dashboard listing modules (Phishing Awareness active, others "Coming Soon" locked).
   - Module intro → Launch.
   - Inbox UI with one realistic phishing email: sender, headers (expandable), body, links (hoverable to reveal real URL), attachments (clickable, sandboxed preview).
   - Hidden action logger captures every hover/click/inspection.
   - Incident Report form (classification, indicators checklist hidden as free choices, URL findings, recommended action, notes).
   - Submit → server-side scoring across the 6 hidden categories → results screen with correctly identified / incorrect / missed / report review / personalized summary.

4. **Admin dashboard**
   - Overview KPIs, Pending Registrations (approve/reject), Employee Mgmt, Admin Mgmt (super_admin only), Campaign + Registration Link Mgmt, Scenario Mgmt (CRUD + enable/disable + difficulty + preview), Module Mgmt (enable/disable), Reports + Leaderboard + Active Sessions, Export CSV.

5. **Design system**
   - Dark cyber theme: deep navy/black background, neon cyan + signal-green accents, JetBrains Mono for code/IDs, Inter for UI. Tokens in `src/styles.css` (oklch), shadcn variants for badges/cards/buttons. No purple.

### Phase 2 (follow-up turns)
- Additional scenarios authoring UI w/ rich red-flag tagging.
- Manager read-only dashboards & deeper analytics charts.
- Audit-log viewer UI, password reset flows, force-password-change on first login.
- More training modules (Password Security, etc.) when requested.

### Tech notes
- TanStack Start + Lovable Cloud (Supabase under the hood).
- Server functions (`createServerFn` + `requireSupabaseAuth`) for scoring, approvals, link generation.
- Scoring engine is server-side only; categories never sent to client during gameplay.

### Questions before I start
A couple of decisions will shape the first build:
