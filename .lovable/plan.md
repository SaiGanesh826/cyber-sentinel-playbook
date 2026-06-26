## Reality check

The spec touches data model, admin tooling, scenario engine, randomization, fake landing pages, registration flow, and many UI screens. That's genuinely 3–5 days of work. I'll execute it in this turn-by-turn order so each turn ships a working build instead of one giant unverifiable change.

## Phase 1 — Structural foundation (this turn)

**Database migration** (one migration, additive only):
- `scenarios` repository (rename concept from `phishing_scenarios` — keep table, extend columns): `department`, `category`, `sender_name`, `sender_email`, `subject`, `body_html`, `attachments JSONB`, `links JSONB`, `classification` (`legitimate`|`suspicious`), `correct_action`, `red_flags JSONB`, `explanation`, `is_mfa BOOLEAN`, `status` (`active`|`inactive`), `tags TEXT[]`.
- `session_scenarios` join table: `session_id`, `scenario_id`, `position`, `response JSONB` — the randomized assignment per attempt.
- `assessment_attempts` table: `user_id`, `module_id`, `attempt_number`, `started_at`, `submitted_at`, `score`, `seen_scenario_ids UUID[]`.
- `employee_invites` table: `token`, `email`, `full_name`, `employee_code`, `department`, `created_by`, `expires_at`, `status` (`pending`|`used`|`disabled`|`expired`), `used_at`.
- Add `is_disabled BOOLEAN` to `campaigns` for "Disable Link" semantics (separate from delete).
- Seed ~30 realistic scenarios across the departments listed (HR, CEO, Sales, Pre-Sales, Implementation, Finance, External, Common) plus ≥6 legit MFA + ≥6 suspicious MFA scenarios.
- Restore registration trigger so completed registrations land in `profiles` with `status='pending'` and surface in the existing Registrations page.

**UI restructure**:
- `Training` page (`dashboard.tsx`) → grid of module cards. Only "Phishing Awareness Training" is `Available`; others show `Coming Soon` with the listed names. Each card: name, description, duration, status, CTA.
- Click → new `training/phishing-awareness` overview page with Objective / Instructions / Rules / Time Limit / Email Count / What to Identify / Scoring + "Start Assessment" button.
- Start Assessment → existing briefing → existing inbox UI, but every "Training — Inbox Investigation" label replaced with "Phishing Awareness Assessment".

## Phase 2 — Randomized scenario engine (next turn)

- Rewrite `inbox.functions.ts` `startInboxTraining` to: pick 8–10 random `active` scenarios with balanced legit/suspicious ratio, guaranteed ≥1 MFA, deprioritise scenarios in user's `seen_scenario_ids`, insert into `session_scenarios`, return the redacted email payloads to client.
- `submitInboxTraining` scores per-scenario from `session_scenarios.response` + scenario `correct_action`/`classification`/`red_flags`, writes to `scores` and `assessment_attempts`.
- Retake flow: new attempt number, fresh randomization, prefers unseen scenarios.

## Phase 3 — Admin CRUD + Campaign/Employee actions (next turn)

- `admin.scenarios.tsx`: list, create, edit, delete, duplicate, enable/disable, preview. Rich-text editor (TipTap) for body_html, attachment list editor, link-with-behaviour editor (dropdown: internal-form / survey / meeting / fake-m365 / fake-hr / fake-vpn / fake-payment / fake-document).
- `admin.campaigns.tsx`: Generate Link, Copy Link, Disable Link, Delete Campaign buttons wired to existing/new server fns.
- `admin.employees.tsx`: Create Employee form + "Generate registration link" per employee → emits `employee_invites` row + shareable URL.
- Public `register.$token.tsx` accepts either `registration_links.token` (campaign) or `employee_invites.token` (individual). Single-use individual invites auto-disable on use.

## Phase 4 — Interactive fake portals + polish (last turn)

- New routes under `play.$sessionId.tsx` overlay: `<FakePortal kind="m365|hr|vpn|payment|document" />` rendered inline when a suspicious link with that behaviour is clicked. Captures fake submission, records action, shows awareness explanation, never persists credentials.
- "Legitimate" link behaviours: internal form / meeting RSVP / survey overlays.
- Final feedback screen revisions: Correct/Missing/Incorrect findings, Strengths/Weaknesses/Recommendations.

## Technical notes

- `phishing_scenarios` is the existing table and is what already has FKs from `game_sessions.scenario_id`. I'll keep that FK and just extend the table — a new `scenarios` table would orphan existing code. The unit of randomization becomes individual emails inside `session_scenarios`, while `game_sessions.scenario_id` stays as the "module run" anchor pointing at a synthetic "Phishing Awareness Run" parent scenario.
- Migration is additive — no destructive changes to existing tables.
- After Phase 1 the existing assessment still runs end-to-end on the legacy hardcoded inbox data; Phase 2 swaps the data source to the new repository.

## What this turn ships

Migration + module-cards + overview page + title renames + registration-trigger fix + ≥30 seeded scenarios (incl. MFA legit/suspicious). After you confirm Phase 1 looks right in the preview, I'll move to Phase 2.

Hit "Approve" to start Phase 1, or tell me to re-sequence.